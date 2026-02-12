/**
 * MoltLaunch V3 — Composable Signal Architecture Types
 *
 * These types mirror the on-chain enums and account structs from the
 * moltlaunch program deployed at 6AZSAhq4iJTwCfGEVssoa1p3GnBqGkbcQ1iDdP1U1pSb
 */

import { PublicKey } from "@solana/web3.js";

// ── Program Constants ───────────────────────────────────────────────

export const MOLTLAUNCH_PROGRAM_ID = new PublicKey(
  "6AZSAhq4iJTwCfGEVssoa1p3GnBqGkbcQ1iDdP1U1pSb"
);

export const DEVNET_RPC = "https://api.devnet.solana.com";

// ── PDA Seeds ───────────────────────────────────────────────────────

export const SEEDS = {
  CONFIG: "moltlaunch",
  AGENT: "agent",
  AUTHORITY: "authority",
  ATTESTATION: "attestation",
} as const;

// ── On-chain Enums ──────────────────────────────────────────────────

/** Infrastructure classification derived from attestations */
export enum InfraType {
  Unknown = "Unknown",
  Cloud = "Cloud",
  TEE = "TEE",
  DePIN = "DePIN",
}

/** The signal an attestation contributes */
export enum SignalType {
  InfraCloud = "InfraCloud",
  InfraTEE = "InfraTEE",
  InfraDePIN = "InfraDePIN",
  EconomicStake = "EconomicStake",
  HardwareBinding = "HardwareBinding",
  General = "General",
}

/** Authority classification */
export enum AuthorityType {
  Single = "Single",
  MultisigMember = "MultisigMember",
  OracleOperator = "OracleOperator",
  NCNValidator = "NCNValidator",
}

// ── Account Shapes (deserialized) ───────────────────────────────────

/** Singleton protocol configuration — seeds: ["moltlaunch"] */
export interface ProtocolConfig {
  admin: PublicKey;
  revocationNonce: bigint;
  totalAgents: bigint;
  totalAttestations: bigint;
  paused: boolean;
  bump: number;
}

/**
 * AgentIdentity — the composable signal hub.
 * Seeds: ["agent", wallet]
 */
export interface AgentIdentity {
  wallet: PublicKey;
  infraType: InfraType;
  hasEconomicStake: boolean;
  hasHardwareBinding: boolean;
  attestationCount: number;
  isFlagged: boolean;
  trustScore: number;
  lastVerified: bigint;
  nonce: bigint;
  registeredAt: bigint;
  name: string;
  bump: number;
}

/**
 * Authority — one per authorized verifier.
 * Seeds: ["authority", pubkey]
 */
export interface Authority {
  pubkey: PublicKey;
  authorityType: AuthorityType;
  attestationCount: bigint;
  active: boolean;
  addedBy: PublicKey;
  addedAt: bigint;
  bump: number;
}

/**
 * Attestation — one per (agent, authority) pair.
 * Seeds: ["attestation", agent_wallet, authority_pubkey]
 */
export interface Attestation {
  agent: PublicKey;
  authority: PublicKey;
  authorityType: AuthorityType;
  signalContributed: SignalType;
  attestationHash: number[];
  teeQuote: number[] | null;
  createdAt: bigint;
  expiresAt: bigint;
  revoked: boolean;
  bump: number;
}

// ── Anchor-compatible enum helpers ──────────────────────────────────

/** Convert our enums to the Anchor IDL object format */
export function toAnchorEnum<T extends string>(value: T): Record<string, object> {
  const key = value.charAt(0).toLowerCase() + value.slice(1);
  return { [key]: {} };
}
