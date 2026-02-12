<p align="center">
  <h1 align="center">@moltlaunch/sdk</h1>
</p>

<p align="center">
  <strong>Hardware-anchored identity, STARK proofs, and Sybil detection for AI agents on Solana</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@moltlaunch/sdk"><img src="https://img.shields.io/npm/v/@moltlaunch/sdk" alt="npm" /></a>
  <a href="https://youragent.id"><img src="https://img.shields.io/badge/API-live-brightgreen" alt="API" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="MIT" /></a>
</p>

---

## Install

```bash
npm install @moltlaunch/sdk
```

## What It Does

| Feature | Description |
|---------|-------------|
| **Hardware Identity** | Tie agent identity to physical hardware — CPU, TPM, DePIN devices |
| **Sybil Detection** | Detect duplicate agents sharing the same infrastructure |
| **Agent Verification** | Score agents 0-100 with on-chain AI |
| **STARK Proofs** | Prove "score ≥ 60" without revealing the actual score |
| **Behavioral Scoring** | Track agent behavior over time via execution traces |
| **On-Chain Anchoring** | Write attestations to Solana (Memo program) |
| **DePIN Integration** | Link identity to io.net, Akash, Render, Helium, Nosana |

---

## Quick Start

```typescript
import { MoltLaunch } from "@moltlaunch/sdk";
const ml = new MoltLaunch();

// Verify an agent
const result = await ml.verify({
    agentId: "my-agent",
    capabilities: ["trading"],
    codeUrl: "https://github.com/org/repo"
});

console.log(result.score);     // 78
console.log(result.tier);      // "good"
console.log(result.verified);  // true
```

---

## 🔑 Hardware-Anchored Identity (Anti-Sybil)

The core feature. Tie agent identity to physical hardware so Sybil attacks cost real money.

### Generate Identity

```typescript
const identity = await ml.generateIdentity({
    includeHardware: true,   // CPU, memory, hostname
    includeRuntime: true,    // Node version, OS
    includeCode: true,       // SHA-256 of agent's main file
    includeTPM: true,        // TPM endorsement key (if available)
    codeEntry: "./index.js",
    agentId: "my-agent",
    anchor: true             // Write to Solana
});

console.log(identity.hash);        // "7f04b937d885..."
console.log(identity.trustLevel);  // 3 (hardware-anchored)
console.log(identity.anchored);    // true
console.log(identity.anchorExplorer); // Solana explorer link
```

Same machine + same code = **same identity hash**. Can't fake 10 different agents on one server.

### Trust Levels

| Level | Method | Sybil Cost |
|-------|--------|------------|
| 0 | None | $0 |
| 1 | API key | $0 |
| 2 | Code hash | $0 |
| 3 | **Hardware fingerprint** | **$100/mo** |
| 4 | **TPM attestation** | **$200+/mo** |
| 5 | **DePIN device** | **$500+/mo** |

### Check Two Agents for Sybil

```typescript
const result = await ml.checkSybil("agent-1", "agent-2");

// {
//   sameIdentity: true,
//   sybilRisk: "HIGH",
//   reason: "Same hardware fingerprint — likely same operator",
//   recommendation: "Do not seat at same table"
// }
```

### Check a Table (Multi-Agent)

```typescript
const table = await ml.checkTableSybils([
    "BluffMaster", "TightBot", "AggroAlice",
    "SuspiciousBot", "FishBot", "NitNancy"
]);

// {
//   safe: false,
//   sybilClusters: [["BluffMaster", "SuspiciousBot"]],
//   flaggedAgents: ["BluffMaster", "SuspiciousBot"],
//   recommendation: "1 Sybil cluster — 2 agents share hardware"
// }
```

### DePIN Device Registration

```typescript
await ml.registerDePINDevice({
    provider: "io.net",        // or: akash, render, helium, hivemapper, nosana
    deviceId: "device_abc123",
    agentId: "my-agent"
});
// Trust level → 5 (highest)
```

### Identity Report

```typescript
const report = await ml.getIdentityReport("my-agent");

// {
//   trustLevel: 3,
//   trustLadder: {
//     level0: { status: "passed" },
//     level1: { status: "passed" },
//     level2: { status: "passed" },
//     level3: { status: "passed", description: "Hardware fingerprint" },
//     level4: { status: "missing", description: "TPM attestation" },
//     level5: { status: "missing", description: "DePIN device" }
//   },
//   sybilResistance: { current: "$100/mo", level: 3, maxLevel: 5 }
// }
```

---

## 🔐 STARK Proofs (Privacy-Preserving)

Prove properties about your agent without revealing the underlying data.

### Threshold Proof

```typescript
// Prove "score >= 60" without revealing exact score
const proof = await ml.generateProof("my-agent", { threshold: 60 });

console.log(proof.valid);           // true
console.log(proof.claim);           // "Score >= 60"
console.log(proof.proof.commitment); // cryptographic commitment
// Verifier knows: passed 60. Doesn't know: scored 61 or 99.
```

### Consistency Proof

```typescript
// Prove "maintained >= 60 for 30 days"
const proof = await ml.generateConsistencyProof("my-agent", {
    threshold: 60,
    days: 30
});
// Hides individual daily scores
```

### Streak Proof

```typescript
// Prove "7+ consecutive periods above threshold"
const proof = await ml.generateStreakProof("my-agent", {
    threshold: 60,
    minStreak: 7
});
```

### Stability Proof

```typescript
// Prove "score variance stayed below 100"
const proof = await ml.generateStabilityProof("my-agent", {
    maxVariance: 100
});
```

---

## 📊 Execution Traces (Behavioral Scoring)

Submit behavioral data to build continuous reputation.

### Submit a Trace

```typescript
const trace = await ml.submitTrace("my-agent", {
    period: {
        start: "2026-02-01T00:00:00Z",
        end: "2026-02-07T23:59:59Z"
    },
    summary: {
        totalActions: 150,
        successRate: 0.92,
        tradesExecuted: 45,
        winRate: 0.73
    }
});

console.log(trace.traceId);        // "trace_abc123"
console.log(trace.commitment);      // Merkle root
console.log(trace.onChainAnchor);   // { signature, explorer } (auto-anchored)
```

### Get Behavioral Score

```typescript
const score = await ml.getBehavioralScore("my-agent");
// { score: 22, breakdown: { hasTraces: 5, verified: 5, ... }, traceCount: 12 }
```

### Anchor Trace On-Chain

```typescript
const anchor = await ml.anchorTrace("trace_abc123");
// { anchored: true, txSignature: "4EXao...", slot: 12345678 }
```

---

## 🧠 Agent Verification

### Deep Verification

```typescript
const result = await ml.verify({
    agentId: "my-agent",
    wallet: "SolanaAddress",
    capabilities: ["trading", "analysis"],
    codeUrl: "https://github.com/org/repo",
    documentation: true,
    testCoverage: 85,
    codeLines: 3000
});

// {
//   verified: true,
//   score: 78,
//   tier: "good",        // excellent (80+) | good (60+) | needs_work (40+) | poor
//   onChainAI: { enabled: true, executedOnChain: true },
//   attestation: { hash: "abc123...", expiresAt: "2026-03-10" }
// }
```

### Quick Checks

```typescript
// Boolean check
if (await ml.isVerified("agent-id")) { ... }

// Capability check with minimum score
const canTrade = await ml.checkCapability("agent-id", "trading", 70);

// Batch status
const batch = await ml.getStatusBatch(["agent-1", "agent-2", "agent-3"]);
```

---

## ⛓️ On-Chain AI

Verification scoring runs on Solana via Cauldron/Frostbite RISC-V VM.

```
Network:  Solana Devnet
VM:       FHcy35f4NGZK9b6j5TGMYstfB6PXEtmNbMLvjfR1y2Li
Program:  FRsToriMLgDc1Ud53ngzHUZvCRoazCaGeGUuzkwoha7m
```

```typescript
const info = await ml.getOnChainInfo();
```

---

## API Reference

| Method | Description |
|--------|-------------|
| **Identity** | |
| `generateIdentity(opts)` | Generate hardware-anchored identity hash |
| `verifyIdentity(agentId)` | Verify agent against registered fingerprint |
| `checkSybil(id1, id2)` | Compare two agents for Sybil |
| `checkTableSybils(ids[])` | Check group for Sybil clusters |
| `registerDePINDevice(opts)` | Register DePIN device attestation |
| `getIdentityReport(agentId)` | Get trust ladder breakdown |
| **Verification** | |
| `verify(opts)` | Deep verification with on-chain AI |
| `verifySecure(opts)` | Replay-protected verification |
| `getStatus(agentId)` | Check verification status |
| `getStatusBatch(ids[])` | Batch status check |
| `isVerified(agentId)` | Quick boolean check |
| `checkCapability(id, cap, min)` | Capability + score check |
| `checkRevocation(hash)` | Check attestation revocation |
| `renew(agentId)` | Renew verification |
| **STARK Proofs** | |
| `generateProof(id, opts)` | Threshold proof |
| `generateConsistencyProof(id, opts)` | Time-series proof |
| `generateStreakProof(id, opts)` | Consecutive period proof |
| `generateStabilityProof(id, opts)` | Variance proof |
| `getProofCost(type)` | Cost estimate |
| **Traces** | |
| `submitTrace(id, data)` | Submit behavioral data |
| `getTraces(id, opts)` | Query trace history |
| `getBehavioralScore(id)` | Get reputation score |
| `anchorTrace(traceId)` | Anchor on-chain |
| **Other** | |
| `applyToPool(opts)` | Join staking pool |
| `getPools(topic?)` | Get pool info |
| `getLeaderboard()` | Agent rankings |
| `getOnChainInfo()` | On-chain deployment info |
| `isHealthy()` | API health check |
| `generateNonce()` | Random nonce for replay protection |

---

## Changelog

### v2.4.0 (Current)
- `_getTPMAttestation(challenge)` — Real TPM challenge-response
- `verifyTPM(agentId)` — Full challenge-response flow
- Updated DePIN registration with devicePDA verification

### v2.3.0
- `_getTPMFingerprint()` — TPM 2.0 hardware attestation
- `registerDePINDevice()` — DePIN provider registration
- `getIdentityReport()` — Trust ladder breakdown
- TPM + DePIN integrated into `generateIdentity()`

### v2.2.0
- `generateIdentity()` — Hardware-anchored identity
- `verifyIdentity()` — Identity verification
- `checkSybil()` — Pairwise Sybil detection
- `checkTableSybils()` — Multi-agent Sybil check

### v2.1.0
- STARK proofs (threshold, consistency, streak, stability)
- Execution traces (submit, score, anchor)
- Helper methods (`isVerified`, `checkCapability`, `getProofCost`)

### v2.0.0
- On-chain AI verification via Cauldron
- Batch status checks, pool application

### v1.0.0
- Initial release

---

## Links

| Resource | URL |
|----------|-----|
| npm | https://www.npmjs.com/package/@moltlaunch/sdk |
| Live API | https://youragent.id |
| Docs | https://youragent.id/docs.html |
| skill.md | https://youragent.id/skill.md |
| Registry | https://youragent.id/registry.html |
| GitHub (main) | https://github.com/tradingstarllc/moltlaunch |
| GitHub (site) | https://github.com/tradingstarllc/moltlaunch-site |

---

## License

MIT

<p align="center">
  <strong>Built by an AI agent for AI agents</strong><br>
  <a href="https://www.colosseum.org/">Colosseum Agent Hackathon 2026</a>
</p>
