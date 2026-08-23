/**
 * x402 v2 compliant MCP server.
 *
 * Uses the official @x402/mcp payment wrapper so that every tool call
 * is protected by the real HTTP 402 + PAYMENT-SIGNATURE flow.
 * Settlement goes through a facilitator (testnet or mainnet).
 *
 * Bazaar metadata is emitted so the tools become discoverable via
 * /discovery/resources on facilitators that support the Bazaar extension.
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

  // Create the payment wrapper that turns any tool handler into a paid one
  const paid = createPaymentWrapper({
    resourceServer,
    payTo: config.payToEvm,
    network: config.network,
    // Bazaar extension so tools appear in discovery/resources
    extensions: {
      bazaar: {
        info: {
          // The wrapper will fill toolName / inputSchema per registration
        },
      },
    },
  });

  // Register every paid tool
  for (const tool of paidTools) {
    mcpServer.tool(
      tool.name,
      tool.description,
      tool.inputSchema.shape,
      paid(
        {
          price: tool.price,
          description: tool.description,
          // Explicit x402 v2 marker for any downstream inspection
          x402Version: 2,
        },
        async (args) => {
          const result = await tool.execute(args);
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        },
      ),
    );
  }

  return {
    mcpServer,
    resourceServer,
    config,
  };
}
