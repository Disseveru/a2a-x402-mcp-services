# a2a-x402-mcp-services

**Production-oriented x402 v2 monetized MCP tools for real agent-to-agent (A2A) commerce.**

- Authentic on-chain settlement (no mocks, no simulated payments)
- Fully compliant with the current x402 **v2** specification (CAIP-2 networks, `PAYMENT-REQUIRED` / `PAYMENT-SIGNATURE` / `PAYMENT-RESPONSE` headers, `x402Version: 2`, exact scheme)
- Official `@x402/mcp` + `@x402/core` + `@x402/evm` packages
- Bazaar-ready (tools are discoverable via facilitators that implement the Bazaar extension)
- Built against the live ecosystem gaps: operational utilities agents actually re-purchase

## Current Paid Tools

| Tool | Price | Purpose |
|------|-------|--------|
| `wallet_risk_score` | $0.02 | Score an EVM wallet for A2A counterparty risk (0-100 + recommendation) |
| `normalize_payload` | $0.01 | Turn messy agent workflow JSON into a strict deterministic schema |
| `probe_facilitators` | $0.005 | Return production facilitators that support requested CAIP-2 networks + Bazaar |

All tools use the **exact** payment scheme and settle through a real facilitator.

## x402 v2 Compliance Checklist

- [x] `x402Version: 2`
- [x] CAIP-2 network identifiers (`eip155:84532` Base Sepolia default, `eip155:8453` for mainnet)
- [x] Official headers (`PAYMENT-REQUIRED`, `PAYMENT-SIGNATURE`, `PAYMENT-RESPONSE`)
- [x] Exact scheme via `@x402/evm/exact`
- [x] Facilitator-based verify + settle (never self-settled in process)
- [x] Bazaar extension metadata for MCP tool discovery
- [x] Environment-driven `payTo` address (no hard-coded production wallets)

## Quick Start (Testnet)

```bash
git clone https://github.com/Disseveru/a2a-x402-mcp-services.git
cd a2a-x402-mcp-services
npm install

# Required: receiving wallet (Base Sepolia)
export X402_PAY_TO_EVM=0xYourTestnetAddress

# Optional overrides
# export X402_NETWORK=eip155:84532
# export X402_FACILITATOR_URL=https://x402.org/facilitator
# export PORT=4022

npm run dev
```

Health check (free):

```bash
curl http://localhost:4022/health
```

Tool catalog (free):

```bash
curl http://localhost:4022/tools
```

MCP endpoint (paid):

```
POST http://localhost:4022/mcp
```

Use any x402 v2-aware MCP client (`@x402/mcp` client helpers, CDP-managed wallets, etc.). The first call to a paid tool will receive a proper 402; the client signs and retries with `PAYMENT-SIGNATURE`; the facilitator settles; the tool result is returned.

## Moving to Mainnet

1. Set a mainnet receiving address:
   ```bash
   export X402_PAY_TO_EVM=0xYourMainnetAddress
   ```
2. Switch network:
   ```bash
   export X402_NETWORK=eip155:8453
   ```
3. Use a production facilitator (example – CDP):
   ```bash
   export X402_FACILITATOR_URL=https://api.cdp.coinbase.com/platform/v2/x402
   ```
   (Supply CDP credentials if the chosen facilitator requires them.)
4. Start the server. Real USDC will move.

**Never run mainnet with a hot key that holds more than you are willing to lose.**

## Architecture

```
src/
  config.ts          – env-driven CAIP-2 + facilitator + payTo
  server.ts          – McpServer + official createPaymentWrapper (@x402/mcp)
  tools/
    definitions.ts   – paid tool implementations (real logic)
  index.ts           – Express host + Streamable HTTP MCP transport
```

## Design Principles

1. **No mocks** – every paid path ends in a real facilitator settle call.
2. **v2 only** – no legacy `X-PAYMENT` headers or v1 network strings.
3. **Operational utility** – tools solve repeat-purchase agent problems (risk, normalization, facilitator selection).
4. **Discoverable** – Bazaar metadata is present so agents can find the tools without hard-coding URLs.
5. **Operator safety** – receiving address and network come exclusively from environment variables.

## License

MIT
