/**
 * Entry point – starts an HTTP server that hosts the paid MCP transport
 * and a small set of diagnostic endpoints.
 *
 * Transport: Streamable HTTP (MCP) so agents can discover and call tools
 * over the same endpoint that is protected by x402 v2.
 */

import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createPaidMcpServer } from "./server.js";
import { paidTools } from "./tools/definitions.js";

async function main() {
  const { mcpServer, config } = await createPaidMcpServer();

  const app = express();
  app.use(express.json());

  // Health / readiness – free, no payment required
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "a2a-x402-mcp-services",
      x402Version: 2,
      network: config.network,
      networkName: config.networkName,
      isMainnet: config.isMainnet,
      toolCount: paidTools.length,
      facilitator: config.facilitatorUrl,
    });
  });

  // Lightweight catalog for humans / agents that do not yet speak Bazaar
  app.get("/tools", (_req, res) => {
    res.json({
      x402Version: 2,
      network: config.network,
      payTo: config.payToEvm,
      tools: paidTools.map((t) => ({
        name: t.name,
        description: t.description,
        price: t.price,
        scheme: "exact",
      })),
    });
  });

  // MCP Streamable HTTP transport – the paid surface
  app.post("/mcp", async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless for maximum agent compatibility
    });
    await mcpServer.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  // Also accept GET for SSE-style clients if needed
  app.get("/mcp", async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    await mcpServer.connect(transport);
    await transport.handleRequest(req, res);
  });

  app.listen(config.port, () => {
    console.log(
      `a2a-x402-mcp-services listening on :${config.port}`,
    );
    console.log(`  x402 version : 2`);
    console.log(`  network      : ${config.network} (${config.networkName})`);
    console.log(`  payTo        : ${config.payToEvm}`);
    console.log(`  facilitator  : ${config.facilitatorUrl}`);
    console.log(`  tools        : ${paidTools.map((t) => t.name).join(", ")}`);
    if (config.isMainnet) {
      console.warn(
        "  ⚠  MAINNET mode – real value will move. Confirm wallet & limits.",
      );
    } else {
      console.log("  (testnet – safe for development)");
    }
  });
}

main().catch((err) => {
  console.error("Failed to start a2a-x402-mcp-services:", err);
  process.exit(1);
});
