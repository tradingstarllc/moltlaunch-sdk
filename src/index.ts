/**
 * MoltLaunch V3 SDK — Composable Signal Architecture
 *
 * On-chain AI agent identity with multi-authority attestations,
 * trust scores, and permissionless signal refresh.
 *
 * Program: 6AZSAhq4iJTwCfGEVssoa1p3GnBqGkbcQ1iDdP1U1pSb (Solana Devnet)
 *
 * @example
 * ```typescript
 * import { MoltLaunchClient, SignalType } from "@moltlaunch/sdk";
 *
 * const client = new MoltLaunchClient();
 *
 * // Read any agent's trust signals (no wallet needed)
 * const agent = await client.getAgentIdentity(agentPubkey);
 * console.log(agent.trustScore, agent.infraType, agent.isFlagged);
 *
 * // Register a new agent (signer = the agent wallet)
 * const txId = await client.registerAgent("my-agent", walletKeypair);
 *
 * // Submit an attestation (signer = authority)
 * await client.submitAttestation(
 *   agentPubkey,
 *   SignalType.InfraCloud,
 *   attestationHash,
 *   expiresAt,
 *   authorityKeypair,
 * );
 *
 * // Refresh signals (permissionless — anyone can call)
 * await client.refreshSignals(agentPubkey);
 * ```
 *
 * @packageDocumentation
 */

// Re-export everything
export {
  // Enums
  InfraType,
  SignalType,
  AuthorityType,
  // Account interfaces
  ProtocolConfig,
  AgentIdentity,
  Authority,
  Attestation,
  // Constants
  MOLTLAUNCH_PROGRAM_ID,
  DEVNET_RPC,
  SEEDS,
  // Helpers
  toAnchorEnum,
} from "./types";

export {
  findConfigPda,
  findAgentPda,
  findAuthorityPda,
  findAttestationPda,
} from "./pda";

export { MoltLaunchClient } from "./client";
export type { MoltLaunchClientOptions } from "./client";

// Default export for convenience
export { MoltLaunchClient as default } from "./client";

// Version
export const VERSION = "3.0.0";
