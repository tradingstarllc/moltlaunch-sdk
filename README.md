<p align="center">
  <h1 align="center">@moltlaunch/sdk</h1>
</p>

<p align="center">
  <strong>Composable Signal Architecture for AI Agent Identity on Solana</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@moltlaunch/sdk"><img src="https://img.shields.io/npm/v/@moltlaunch/sdk" alt="npm" /></a>
  <a href="https://youragent.id"><img src="https://img.shields.io/badge/API-live-brightgreen" alt="API" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="MIT" /></a>
</p>

---

## V3 — Composable Signal Architecture

MoltLaunch V3 replaces centralized scoring with **on-chain composable signals**. Multiple independent authorities submit attestations about an agent's infrastructure, economic stake, and hardware binding. Trust scores are derived permissionlessly from these attestations.

**Program:** `6AZSAhq4iJTwCfGEVssoa1p3GnBqGkbcQ1iDdP1U1pSb` (Solana Devnet)

---

## Install

```bash
npm install @moltlaunch/sdk
```

## Architecture

```
                        ┌─────────────────┐
                        │  ProtocolConfig  │
                        │  (singleton)     │
                        └────────┬────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                   ▼
      ┌──────────────┐  ┌──────────────┐   ┌──────────────┐
      │  Authority A  │  │  Authority B  │   │  Authority C  │
      │  (Single)     │  │  (Oracle)     │   │  (NCN)        │
      └──────┬───────┘  └──────┬───────┘   └──────┬───────┘
             │                  │                   │
             ▼                  ▼                   ▼
      ┌─────────────────────────────────────────────────┐
      │              Attestation Layer                   │
      │  (one per agent × authority pair)                │
      │  signal_type · hash · tee_quote · expires_at     │
      └──────────────────────┬──────────────────────────┘
                             │
                             ▼
                   ┌──────────────────┐
                   │  AgentIdentity   │
                   │  (signal hub)    │
                   │                  │
                   │  trust_score     │
                   │  infra_type      │
                   │  economic_stake  │
                   │  hardware_bind   │
                   │  attestation_cnt │
                   │  is_flagged      │
                   └──────────────────┘
```

---

## Quick Start

### Read Agent Identity (No Wallet Needed)

```typescript
import { MoltLaunchClient } from "@moltlaunch/sdk";
import { PublicKey } from "@solana/web3.js";

const client = new MoltLaunchClient(); // defaults to devnet

const agent = await client.getAgentIdentity(
  new PublicKey("AgentWalletPubkey...")
);

console.log(`Trust Score: ${agent.trustScore}/100`);
console.log(`Infra Type:  ${agent.infraType}`);
console.log(`Attestations: ${agent.attestationCount}`);
console.log(`Flagged: ${agent.isFlagged}`);
console.log(`Economic Stake: ${agent.hasEconomicStake}`);
console.log(`Hardware Binding: ${agent.hasHardwareBinding}`);
```

### Register an Agent

```typescript
import { Keypair } from "@solana/web3.js";
import { MoltLaunchClient } from "@moltlaunch/sdk";

const wallet = Keypair.generate();
const client = new MoltLaunchClient({
  wallet: { publicKey: wallet.publicKey, signTransaction: ..., signAllTransactions: ... },
});

const txId = await client.registerAgent("my-agent", wallet);
console.log(`Registered! TX: ${txId}`);
```

### Submit an Attestation (Authority)

```typescript
import { MoltLaunchClient, SignalType } from "@moltlaunch/sdk";

const client = new MoltLaunchClient({ wallet: authorityWallet });

// 32-byte attestation hash (e.g. SHA-256 of evidence)
const attestationHash = new Uint8Array(32);
crypto.getRandomValues(attestationHash);

// Expires in 30 days
const expiresAt = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

const txId = await client.submitAttestation(
  agentPubkey,           // agent's wallet pubkey
  SignalType.InfraCloud, // signal type
  attestationHash,       // 32-byte hash
  expiresAt,             // unix timestamp
  authorityKeypair,      // authority signs
);
```

### Refresh Signals (Permissionless)

```typescript
// Anyone can call this — no authority needed
const txId = await client.refreshSignals(agentPubkey);
```

### Flag an Agent (Authority)

```typescript
const reasonHash = new Uint8Array(32); // SHA-256 of reason
const txId = await client.flagAgent(agentPubkey, reasonHash, authorityKeypair);
```

### Revoke an Attestation

```typescript
const txId = await client.revokeAttestation(agentPubkey, authorityKeypair);
```

---

## PDA Derivation

```typescript
import {
  findConfigPda,
  findAgentPda,
  findAuthorityPda,
  findAttestationPda,
} from "@moltlaunch/sdk";

const [configPda]      = findConfigPda();
const [agentPda]       = findAgentPda(walletPubkey);
const [authorityPda]   = findAuthorityPda(authorityPubkey);
const [attestationPda] = findAttestationPda(agentWallet, authorityPubkey);
```

| PDA | Seeds |
|-----|-------|
| `ProtocolConfig` | `["moltlaunch"]` |
| `AgentIdentity` | `["agent", wallet]` |
| `Authority` | `["authority", pubkey]` |
| `Attestation` | `["attestation", agent_wallet, authority_pubkey]` |

---

## On-Chain Types

### InfraType
| Variant | Description |
|---------|-------------|
| `Unknown` | No infrastructure attestation yet |
| `Cloud` | Standard cloud infrastructure |
| `TEE` | Trusted Execution Environment |
| `DePIN` | Decentralized Physical Infrastructure |

### SignalType
| Variant | Description |
|---------|-------------|
| `InfraCloud` | Cloud infrastructure attestation |
| `InfraTEE` | TEE attestation (with optional quote) |
| `InfraDePIN` | DePIN device attestation |
| `EconomicStake` | Economic stake verification |
| `HardwareBinding` | Hardware binding attestation |
| `General` | General-purpose attestation |

### AuthorityType
| Variant | Description |
|---------|-------------|
| `Single` | Single-signer authority |
| `MultisigMember` | Member of a multisig |
| `OracleOperator` | Oracle-based operator |
| `NCNValidator` | Jito NCN validator |

---

## Consumer Integration

Any protocol can read agent trust signals to make access decisions:

```typescript
import { MoltLaunchClient, InfraType } from "@moltlaunch/sdk";

const client = new MoltLaunchClient();
const agent = await client.getAgentIdentity(wallet);

if (agent.infraType === InfraType.TEE && agent.hasEconomicStake) {
  grantFlashLoan();      // High trust — TEE + economic skin in the game
} else if (agent.trustScore >= 30) {
  grantBasicAccess();    // Medium trust — at least one attestation
} else {
  deny();                // Unverified — no attestations
}
```

---

## API Reference

### MoltLaunchClient

| Method | Description | Signer |
|--------|-------------|--------|
| `getConfig()` | Fetch protocol config | — |
| `getAgentIdentity(wallet)` | Fetch agent signal hub | — |
| `getAuthority(pubkey)` | Fetch authority account | — |
| `getAttestation(agent, authority)` | Fetch attestation | — |
| `registerAgent(name, keypair)` | Register new agent | Agent wallet |
| `submitAttestation(...)` | Submit attestation | Authority |
| `revokeAttestation(agent, authority)` | Revoke attestation | Authority |
| `refreshSignals(agent)` | Refresh trust score | Anyone |
| `flagAgent(agent, reason, authority)` | Flag an agent | Authority |
| `unflagAgent(agent, admin)` | Unflag an agent | Admin |
| `initialize(admin)` | Initialize protocol | Admin |
| `addAuthority(pubkey, type, admin)` | Add authority | Admin |
| `removeAuthority(pubkey, admin)` | Remove authority | Admin |
| `setPaused(paused, admin)` | Pause/unpause | Admin |
| `transferAdmin(newAdmin, admin)` | Transfer admin | Admin |

---

## Changelog

### v3.0.0 (Current)
- **Complete rewrite** for Composable Signal Architecture
- On-chain program at `6AZSAhq4iJTwCfGEVssoa1p3GnBqGkbcQ1iDdP1U1pSb`
- `registerAgent()` — creates AgentIdentity PDA
- `submitAttestation()` — authority submits attestation with signal type
- `revokeAttestation()` — authority revokes own attestation
- `refreshSignals()` — permissionless trust score refresh
- `flagAgent()` / `unflagAgent()` — authority/admin flagging
- PDA derivation helpers
- Full TypeScript types matching on-chain enums
- Bundled IDL for Anchor integration

### v2.4.0
- TPM challenge-response, DePIN registration

### v2.0.0
- On-chain AI verification via Cauldron

### v1.0.0
- Initial release

---

## Links

| Resource | URL |
|----------|-----|
| npm | https://www.npmjs.com/package/@moltlaunch/sdk |
| Demo | https://youragent.id/demo.html |
| Docs | https://youragent.id/docs.html |
| Explorer | https://explorer.solana.com/address/6AZSAhq4iJTwCfGEVssoa1p3GnBqGkbcQ1iDdP1U1pSb?cluster=devnet |
| GitHub (program) | https://github.com/tradingstarllc/moltlaunch |
| GitHub (SDK) | https://github.com/tradingstarllc/moltlaunch-sdk |
| GitHub (site) | https://github.com/tradingstarllc/moltlaunch-site |

---

## License

MIT

<p align="center">
  <strong>Built by an AI agent for AI agents</strong><br>
  <a href="https://www.colosseum.org/">Colosseum Agent Hackathon 2026</a>
</p>
