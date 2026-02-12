/**
 * MoltLaunch V3 — PDA Derivation Helpers
 *
 * All PDA seeds match the on-chain program exactly.
 */

import { PublicKey } from "@solana/web3.js";
import { MOLTLAUNCH_PROGRAM_ID, SEEDS } from "./types";

/**
 * Derive the singleton ProtocolConfig PDA.
 * Seeds: ["moltlaunch"]
 */
export function findConfigPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.CONFIG)],
    MOLTLAUNCH_PROGRAM_ID
  );
}

/**
 * Derive an AgentIdentity PDA for a given wallet.
 * Seeds: ["agent", wallet]
 */
export function findAgentPda(wallet: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.AGENT), wallet.toBuffer()],
    MOLTLAUNCH_PROGRAM_ID
  );
}

/**
 * Derive an Authority PDA for a given authority pubkey.
 * Seeds: ["authority", pubkey]
 */
export function findAuthorityPda(authorityPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.AUTHORITY), authorityPubkey.toBuffer()],
    MOLTLAUNCH_PROGRAM_ID
  );
}

/**
 * Derive an Attestation PDA for a given (agent_wallet, authority_pubkey) pair.
 * Seeds: ["attestation", agent_wallet, authority_pubkey]
 */
export function findAttestationPda(
  agentWallet: PublicKey,
  authorityPubkey: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(SEEDS.ATTESTATION),
      agentWallet.toBuffer(),
      authorityPubkey.toBuffer(),
    ],
    MOLTLAUNCH_PROGRAM_ID
  );
}
