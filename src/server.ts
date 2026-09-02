/**
 * x402 v2 compliant MCP server.
 *
 * Uses the official @x402/mcp payment wrapper so that every tool call
 * is protected by the real HTTP 402 + PAYMENT-SIGNATURE flow.
 * Settlement goes through a facilitator (testnet or mainnet).
 *
 * Pattern follows the official x402 MCP seller quickstart:
 *   resourceServer.buildPaymentRequirements(...) +
 *   createPaymentWrapper(resourceServer, { accepts })
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createPaymentWrapper, x402ResourceServer } from "@x402/mcp";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { loadConfig } from "./config.js";
import { paidTools } from "./tools/definitions.js";

export async function createPaidMcpServer() {
  const config = loadConfig();

  const mcpServer = new McpServer({
    name: "a2a-x402-mcp-services",
    version: "0.1.0",
  });

  // Official x402 v2 resource server + facilitator client
  const facilitatorClient = new HTTPFacilitatorClient({
    url: config.facilitatorUrl,
  });

  const resourceServer = new x402ResourceServer(facilitatorClient);
  // Register the exact scheme for the configured CAIP-2 network
  resourceServer.register(config.network, new ExactEvmScheme());
  await resourceServer.initialize();

  // Register every paid tool with its own payment requirements
  for (const tool of paidTools) {
    const accepts = await resourceServer.buildPaymentRequirements({
      scheme: "exact",
      network: config.network,
      payTo: config.payToEvm,
      price: tool.price,
    });

    const paid = createPaymentWrapper(resourceServer, {
      accepts,
    });

    mcpServer.tool(
      tool.name,
      tool.description,
      tool.inputSchema.shape,
      paid(async (args: Record<string, unknown>) => {
        const result = await tool.execute(args);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }),
    );
  }

  return {
    mcpServer,
    resourceServer,
    config,
  };
}
