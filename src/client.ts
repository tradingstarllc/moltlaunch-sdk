/**
 * MoltLaunch V3 — SDK Client
 *
 * High-level API for interacting with the on-chain Composable Signal Architecture.
 * Program: 6AZSAhq4iJTwCfGEVssoa1p3GnBqGkbcQ1iDdP1U1pSb (devnet)
 */

import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Wallet, BN } from "@coral-xyz/anchor";

import {
  MOLTLAUNCH_PROGRAM_ID,
  DEVNET_RPC,
  AgentIdentity,
  Attestation,
  Authority,
  ProtocolConfig,
  InfraType,
  SignalType,
  AuthorityType,
  toAnchorEnum,
} from "./types";
import {
  findConfigPda,
  findAgentPda,
  findAuthorityPda,
  findAttestationPda,
} from "./pda";

import IDL from "./idl/moltlaunch.json";

// ── Types ───────────────────────────────────────────────────────────

export interface MoltLaunchClientOptions {
  /** Solana RPC URL (defaults to devnet) */
  rpcUrl?: string;
  /** Commitment level */
  commitment?: anchor.web3.Commitment;
  /** Wallet / signer (required for write operations) */
  wallet?: Wallet;
}

// ── Helpers ─────────────────────────────────────────────────────────

function mapInfraType(raw: Record<string, any>): InfraType {
  if ("cloud" in raw) return InfraType.Cloud;
  if ("tee" in raw || "TEE" in raw) return InfraType.TEE;
  if ("dePIN" in raw || "dePin" in raw || "depin" in raw) return InfraType.DePIN;
  return InfraType.Unknown;
}

function mapSignalType(raw: Record<string, any>): SignalType {
  if ("infraCloud" in raw) return SignalType.InfraCloud;
  if ("infraTEE" in raw || "infraTee" in raw) return SignalType.InfraTEE;
  if ("infraDePIN" in raw || "infraDePin" in raw || "infraDepin" in raw) return SignalType.InfraDePIN;
  if ("economicStake" in raw) return SignalType.EconomicStake;
  if ("hardwareBinding" in raw) return SignalType.HardwareBinding;
  return SignalType.General;
}

function mapAuthorityType(raw: Record<string, any>): AuthorityType {
  if ("multisigMember" in raw) return AuthorityType.MultisigMember;
  if ("oracleOperator" in raw) return AuthorityType.OracleOperator;
  if ("ncnValidator" in raw || "NCNValidator" in raw) return AuthorityType.NCNValidator;
  return AuthorityType.Single;
}

// ── Client ──────────────────────────────────────────────────────────

export class MoltLaunchClient {
  readonly connection: Connection;
  readonly programId: PublicKey;
  private program: Program;
  private provider: AnchorProvider;

  constructor(opts: MoltLaunchClientOptions = {}) {
    const rpcUrl = opts.rpcUrl ?? DEVNET_RPC;
    const commitment = opts.commitment ?? "confirmed";

    this.connection = new Connection(rpcUrl, commitment);
    this.programId = MOLTLAUNCH_PROGRAM_ID;

    // Build provider — read-only if no wallet supplied
    const wallet = opts.wallet ?? {
      publicKey: PublicKey.default,
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any) => txs,
    } as unknown as Wallet;

    this.provider = new AnchorProvider(this.connection, wallet, {
      commitment,
    });

    this.program = new Program(IDL as any, this.provider);
  }

  // ── Read Operations ─────────────────────────────────────────────

  /** Fetch the singleton ProtocolConfig account */
  async getConfig(): Promise<ProtocolConfig> {
    const [pda] = findConfigPda();
    const raw = await (this.program.account as any).protocolConfig.fetch(pda);
    return {
      admin: raw.admin,
      revocationNonce: BigInt(raw.revocationNonce.toString()),
      totalAgents: BigInt(raw.totalAgents.toString()),
      totalAttestations: BigInt(raw.totalAttestations.toString()),
      paused: raw.paused,
      bump: raw.bump,
    };
  }

  /** Fetch an AgentIdentity by wallet public key */
  async getAgentIdentity(wallet: PublicKey): Promise<AgentIdentity> {
    const [pda] = findAgentPda(wallet);
    const raw = await (this.program.account as any).agentIdentity.fetch(pda);
    return {
      wallet: raw.wallet,
      infraType: mapInfraType(raw.infraType),
      hasEconomicStake: raw.hasEconomicStake,
      hasHardwareBinding: raw.hasHardwareBinding,
      attestationCount: raw.attestationCount,
      isFlagged: raw.isFlagged,
      trustScore: raw.trustScore,
      lastVerified: BigInt(raw.lastVerified.toString()),
      nonce: BigInt(raw.nonce.toString()),
      registeredAt: BigInt(raw.registeredAt.toString()),
      name: raw.name,
      bump: raw.bump,
    };
  }

  /** Fetch an Authority account */
  async getAuthority(pubkey: PublicKey): Promise<Authority> {
    const [pda] = findAuthorityPda(pubkey);
    const raw = await (this.program.account as any).authority.fetch(pda);
    return {
      pubkey: raw.pubkey,
      authorityType: mapAuthorityType(raw.authorityType),
      attestationCount: BigInt(raw.attestationCount.toString()),
      active: raw.active,
      addedBy: raw.addedBy,
      addedAt: BigInt(raw.addedAt.toString()),
      bump: raw.bump,
    };
  }

  /** Fetch an Attestation account */
  async getAttestation(
    agentWallet: PublicKey,
    authorityPubkey: PublicKey
  ): Promise<Attestation> {
    const [pda] = findAttestationPda(agentWallet, authorityPubkey);
    const raw = await (this.program.account as any).attestation.fetch(pda);
    return {
      agent: raw.agent,
      authority: raw.authority,
      authorityType: mapAuthorityType(raw.authorityType),
      signalContributed: mapSignalType(raw.signalContributed),
      attestationHash: Array.from(raw.attestationHash),
      teeQuote: raw.teeQuote ? Array.from(raw.teeQuote) : null,
      createdAt: BigInt(raw.createdAt.toString()),
      expiresAt: BigInt(raw.expiresAt.toString()),
      revoked: raw.revoked,
      bump: raw.bump,
    };
  }

  // ── Write Operations ────────────────────────────────────────────

  /**
   * Register a new agent identity on-chain.
   * Signer = the agent's wallet keypair.
   */
  async registerAgent(
    name: string,
    walletKeypair: Keypair
  ): Promise<string> {
    const [configPda] = findConfigPda();
    const [agentPda] = findAgentPda(walletKeypair.publicKey);

    const tx = await (this.program.methods as any)
      .registerAgent(name)
      .accounts({
        config: configPda,
        agent: agentPda,
        wallet: walletKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([walletKeypair])
      .rpc();

    return tx;
  }

  /**
   * Submit an attestation for an agent.
   * Signer = the authority's keypair.
   */
  async submitAttestation(
    agentWallet: PublicKey,
    signalType: SignalType,
    attestationHash: number[] | Uint8Array,
    expiresAt: number | bigint,
    authorityKeypair: Keypair,
    teeQuote?: number[] | Uint8Array | null
  ): Promise<string> {
    const [configPda] = findConfigPda();
    const [authorityPda] = findAuthorityPda(authorityKeypair.publicKey);
    const [agentPda] = findAgentPda(agentWallet);
    const [attestationPda] = findAttestationPda(
      agentWallet,
      authorityKeypair.publicKey
    );

    const hashArr = Array.from(attestationHash);
    const teeArr = teeQuote ? Array.from(teeQuote) : null;

    const tx = await (this.program.methods as any)
      .submitAttestation(
        toAnchorEnum(signalType),
        hashArr,
        teeArr,
        new BN(expiresAt.toString())
      )
      .accounts({
        config: configPda,
        authority: authorityPda,
        agent: agentPda,
        attestation: attestationPda,
        authoritySigner: authorityKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([authorityKeypair])
      .rpc();

    return tx;
  }

  /**
   * Revoke an attestation (only the original authority can revoke).
   */
  async revokeAttestation(
    agentWallet: PublicKey,
    authorityKeypair: Keypair
  ): Promise<string> {
    const [configPda] = findConfigPda();
    const [attestationPda] = findAttestationPda(
      agentWallet,
      authorityKeypair.publicKey
    );

    const tx = await (this.program.methods as any)
      .revokeAttestation()
      .accounts({
        config: configPda,
        attestation: attestationPda,
        authoritySigner: authorityKeypair.publicKey,
      })
      .signers([authorityKeypair])
      .rpc();

    return tx;
  }

  /**
   * Refresh an agent's trust signals (permissionless — anyone can call).
   */
  async refreshSignals(
    agentWallet: PublicKey,
    signerKeypair?: Keypair
  ): Promise<string> {
    const [configPda] = findConfigPda();
    const [agentPda] = findAgentPda(agentWallet);

    const builder = (this.program.methods as any)
      .refreshIdentitySignals()
      .accounts({
        config: configPda,
        agent: agentPda,
      });

    if (signerKeypair) {
      builder.signers([signerKeypair]);
    }

    return builder.rpc();
  }

  /**
   * Flag an agent (authority-only).
   */
  async flagAgent(
    agentWallet: PublicKey,
    reasonHash: number[] | Uint8Array,
    authorityKeypair: Keypair
  ): Promise<string> {
    const [configPda] = findConfigPda();
    const [authorityPda] = findAuthorityPda(authorityKeypair.publicKey);
    const [agentPda] = findAgentPda(agentWallet);

    const tx = await (this.program.methods as any)
      .flagAgent(Array.from(reasonHash))
      .accounts({
        config: configPda,
        authority: authorityPda,
        agent: agentPda,
        authoritySigner: authorityKeypair.publicKey,
      })
      .signers([authorityKeypair])
      .rpc();

    return tx;
  }

  /**
   * Unflag an agent (admin-only).
   */
  async unflagAgent(
    agentWallet: PublicKey,
    adminKeypair: Keypair
  ): Promise<string> {
    const [configPda] = findConfigPda();
    const [agentPda] = findAgentPda(agentWallet);

    const tx = await (this.program.methods as any)
      .unflagAgent()
      .accounts({
        config: configPda,
        agent: agentPda,
        admin: adminKeypair.publicKey,
      })
      .signers([adminKeypair])
      .rpc();

    return tx;
  }

  // ── Admin Operations ────────────────────────────────────────────

  /** Initialize the protocol (admin, one-time) */
  async initialize(adminKeypair: Keypair): Promise<string> {
    const [configPda] = findConfigPda();

    const tx = await (this.program.methods as any)
      .initialize()
      .accounts({
        config: configPda,
        admin: adminKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([adminKeypair])
      .rpc();

    return tx;
  }

  /** Add an authority (admin-only) */
  async addAuthority(
    authorityPubkey: PublicKey,
    authorityType: AuthorityType,
    adminKeypair: Keypair
  ): Promise<string> {
    const [configPda] = findConfigPda();
    const [authorityPda] = findAuthorityPda(authorityPubkey);

    const tx = await (this.program.methods as any)
      .addAuthority(toAnchorEnum(authorityType))
      .accounts({
        config: configPda,
        authority: authorityPda,
        authorityPubkey: authorityPubkey,
        admin: adminKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([adminKeypair])
      .rpc();

    return tx;
  }

  /** Remove an authority (admin-only) */
  async removeAuthority(
    authorityPubkey: PublicKey,
    adminKeypair: Keypair
  ): Promise<string> {
    const [configPda] = findConfigPda();
    const [authorityPda] = findAuthorityPda(authorityPubkey);

    const tx = await (this.program.methods as any)
      .removeAuthority()
      .accounts({
        config: configPda,
        authority: authorityPda,
        admin: adminKeypair.publicKey,
      })
      .signers([adminKeypair])
      .rpc();

    return tx;
  }

  /** Pause / unpause protocol (admin-only) */
  async setPaused(paused: boolean, adminKeypair: Keypair): Promise<string> {
    const [configPda] = findConfigPda();

    const tx = await (this.program.methods as any)
      .setPaused(paused)
      .accounts({
        config: configPda,
        admin: adminKeypair.publicKey,
      })
      .signers([adminKeypair])
      .rpc();

    return tx;
  }

  /** Transfer admin to a new pubkey (admin-only) */
  async transferAdmin(
    newAdmin: PublicKey,
    adminKeypair: Keypair
  ): Promise<string> {
    const [configPda] = findConfigPda();

    const tx = await (this.program.methods as any)
      .transferAdmin(newAdmin)
      .accounts({
        config: configPda,
        admin: adminKeypair.publicKey,
      })
      .signers([adminKeypair])
      .rpc();

    return tx;
  }
}
