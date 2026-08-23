/**
 * Runtime configuration for a2a-x402-mcp-services.
 * All values that affect settlement must come from environment variables
 * so operators never hard-code production wallets or keys.
 */

export interface AppConfig {
  /** Port the HTTP + MCP transport listens on */
  port: number;
  /** EVM address that receives x402 payments (CAIP-10 style payTo) */
  payToEvm: string;
  /** Facilitator base URL (testnet default = x402.org public facilitator) */
  facilitatorUrl: string;
  /** CAIP-2 network identifier used for the exact scheme */
  network: string;
  /** Human-readable network name for logs */
  networkName: string;
  /** Whether we are on a production mainnet route */
  isMainnet: boolean;
}

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        `See README.md for setup instructions.`,
    );
  }
  return value;
}

export function loadConfig(): AppConfig {
  const network =
    process.env.X402_NETWORK ?? "eip155:84532"; // Base Sepolia by default

  const isMainnet =
    network === "eip155:8453" ||
    network === "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";

  return {
    port: Number(process.env.PORT ?? 4022),
    payToEvm: requireEnv("X402_PAY_TO_EVM"),
    facilitatorUrl:
      process.env.X402_FACILITATOR_URL ??
      (isMainnet
        ? "https://api.cdp.coinbase.com/platform/v2/x402"
        : "https://x402.org/facilitator"),
    network,
    networkName:
      network === "eip155:8453"
        ? "Base Mainnet"
        : network === "eip155:84532"
          ? "Base Sepolia"
          : network,
    isMainnet,
  };
}
