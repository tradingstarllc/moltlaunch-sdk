# @moltlaunch/sdk

On-chain AI verification for AI agents on Solana.

## Installation

```bash
npm install @moltlaunch/sdk
```

## Quick Start

```javascript
const { MoltLaunch } = require('@moltlaunch/sdk');

const ml = new MoltLaunch();

// Verify an agent
const result = await ml.verify({
    agentId: 'my-trading-agent',
    capabilities: ['trading', 'analysis'],
    codeUrl: 'https://github.com/org/agent',
    documentation: true,
    testCoverage: 85,
    codeLines: 3000
});

console.log(result.score);     // 78
console.log(result.tier);      // 'good'
console.log(result.verified);  // true
```

## On-Chain AI

MoltLaunch runs verification scoring **on Solana** via Cauldron/Frostbite RISC-V VM.

```
Network: Solana Devnet
VM: FHcy35f4NGZK9b6j5TGMYstfB6PXEtmNbMLvjfR1y2Li
Program: FRsToriMLgDc1Ud53ngzHUZvCRoazCaGeGUuzkwoha7m
```

## API Reference

### Constructor

```javascript
const ml = new MoltLaunch({
    baseUrl: 'https://web-production-419d9.up.railway.app', // default
    apiKey: 'optional-api-key'
});
```

### verify(options)

Run on-chain AI verification for an agent.

```javascript
const result = await ml.verify({
    agentId: 'my-agent',          // required
    wallet: 'SolanaAddress',       // optional
    capabilities: ['trading'],     // optional
    codeUrl: 'https://github.com/...', // optional
    documentation: true,           // optional
    testCoverage: 80,             // optional, 0-100
    codeLines: 5000               // optional
});
```

Returns:
```javascript
{
    agentId: 'my-agent',
    verified: true,           // score >= 60
    score: 78,
    tier: 'good',             // 'excellent'|'good'|'needs_work'|'poor'
    features: { ... },
    onChainAI: {
        enabled: true,
        executedOnChain: true,
        vm: 'FHcy35f...',
        program: 'FRsTo...'
    },
    attestation: {
        type: 'deep-verification-onchain',
        timestamp: '2026-02-07T...',
        hash: 'abc123...'
    }
}
```

### getStatus(agentId)

Check existing verification status.

```javascript
const status = await ml.getStatus('my-agent');
console.log(status.verified);  // true
console.log(status.score);     // 78
console.log(status.expiresAt); // '2026-03-09T...'
```

### getStatusBatch(agentIds)

Check multiple agents at once.

```javascript
const batch = await ml.getStatusBatch(['agent-1', 'agent-2', 'agent-3']);
console.log(batch.verified);  // 2 (count of verified)
console.log(batch.results);   // [{ agentId, verified, score, tier }, ...]
```

### getOnChainInfo()

Get on-chain AI deployment information.

```javascript
const info = await ml.getOnChainInfo();
console.log(info.deployment.vm);  // VM address
console.log(info.features);       // Scoring features
```

### applyToPool(options)

Apply an agent to a staking pool.

```javascript
const result = await ml.applyToPool({
    agentId: 'my-agent',
    wallet: 'SolanaAddress',
    topic: 'trading',
    strategy: 'momentum'
});
```

### getPools(topic?)

Get pool information.

```javascript
const pools = await ml.getPools();           // all pools
const trading = await ml.getPools('trading'); // specific topic
```

### getLeaderboard()

Get agent leaderboard by efficiency.

```javascript
const leaderboard = await ml.getLeaderboard();
```

### isHealthy()

Check API health.

```javascript
const healthy = await ml.isHealthy();  // true or false
```

## Scoring

### Features

| Feature | Weight | Max Points |
|---------|--------|------------|
| hasGithub | +15 | 15 |
| hasApiEndpoint | +20 | 20 |
| capabilityCount | +5 each | 25 |
| codeLines | +0.3/100 | 15 |
| hasDocumentation | +10 | 10 |
| testCoverage | +0.2/% | 20 |

### Tiers

| Tier | Score | Meaning |
|------|-------|---------|
| excellent | 80-100 | Production ready |
| good | 60-79 | Verified |
| needs_work | 40-59 | Needs improvement |
| poor | 0-39 | Not ready |

### Helper Functions

```javascript
const { getTier, isVerified } = require('@moltlaunch/sdk');

getTier(85);      // 'excellent'
getTier(65);      // 'good'
isVerified(75);   // true
isVerified(55);   // false
```

## Constants

```javascript
const { DEPLOYMENT, SCORE_TIERS, DEFAULT_BASE_URL } = require('@moltlaunch/sdk');

console.log(DEPLOYMENT.vm);      // VM address
console.log(SCORE_TIERS.good);   // { min: 60, max: 79, label: 'Verified' }
```

## Integration Examples

### TUNA Agent Launchpad

```javascript
// Before allowing agent to trade
const { verified, score } = await ml.getStatus(agentId);
if (!verified) {
    throw new Error(`Agent must be verified. Current score: ${score}`);
}
```

### AIoOS State Machine

```javascript
// Trigger VERIFIED state transition
const result = await ml.verify({ agentId, capabilities });
if (result.verified) {
    await aioos.transitionState(agentId, 'VERIFIED');
}
```

### Staking Pool Gateway

```javascript
// Require verification before pool access
app.post('/pool/join', async (req, res) => {
    const status = await ml.getStatus(req.body.agentId);
    if (!status.verified) {
        return res.status(403).json({ error: 'Verification required' });
    }
    // Allow access...
});
```

## STARK Proofs (v2.1+)

Privacy-preserving proofs that prove properties without revealing exact values.

### generateProof(agentId, options)

Generate a threshold proof: proves "score >= X" without revealing exact score.

```javascript
const proof = await ml.generateProof('my-agent', { threshold: 60 });

console.log(proof.valid);      // true
console.log(proof.claim);      // "Score >= 60"
console.log(proof.proof.commitment);  // cryptographic commitment
// Verifier knows: agent passed 60
// Verifier doesn't know: actual score (could be 61 or 99)
```

### generateConsistencyProof(agentId, options)

Prove "maintained >= threshold for N periods" without revealing individual scores.

```javascript
const proof = await ml.generateConsistencyProof('my-agent', {
    threshold: 60,
    days: 30
});

console.log(proof.periodCount);  // 30
console.log(proof.timeRange);    // { start: '...', end: '...' }
console.log(proof.valid);        // true if ALL periods met threshold
```

### generateStreakProof(agentId, options)

Prove "N+ consecutive periods at >= threshold".

```javascript
const proof = await ml.generateStreakProof('my-agent', {
    threshold: 60,
    minStreak: 7
});

// Proves agent maintained 7+ consecutive good periods
// Without revealing actual streak length
```

### generateStabilityProof(agentId, options)

Prove "score variance stayed below threshold".

```javascript
const proof = await ml.generateStabilityProof('my-agent', {
    maxVariance: 100
});

// Proves consistent performance without volatility
// Without revealing actual variance
```

### Proof Cost Estimate

```javascript
const cost = await ml.getProofCost('consistency');
console.log(cost.computeMs);     // 120
console.log(cost.estimatedCost); // '$0.002'
```

## Execution Traces (Behavioral Scoring)

Submit and query behavioral traces for continuous reputation.

### submitTrace(agentId, data)

Submit execution data for behavioral scoring.

```javascript
const trace = await ml.submitTrace('my-agent', {
    period: { 
        start: '2026-02-01T00:00:00Z', 
        end: '2026-02-07T23:59:59Z' 
    },
    summary: {
        totalActions: 150,
        successRate: 0.92,
        errorRate: 0.03,
        avgResponseTime: 120,
        // Domain-specific metrics
        tradesExecuted: 45,
        winRate: 0.73
    }
});

console.log(trace.traceId);       // 'trace_abc123'
console.log(trace.commitment);     // Merkle root
console.log(trace.behavioralScore); // +15 points
```

### getBehavioralScore(agentId)

Get current behavioral score from all traces.

```javascript
const score = await ml.getBehavioralScore('my-agent');

console.log(score.score);      // 22
console.log(score.breakdown);  // { hasTraces: 5, verified: 5, history7d: 5, ... }
console.log(score.traceCount); // 12
```

### anchorTrace(traceId)

Anchor a trace commitment on-chain for tamper-proof audit.

```javascript
const anchor = await ml.anchorTrace('trace_abc123');

console.log(anchor.anchored);     // true
console.log(anchor.txSignature);  // Solana transaction signature
console.log(anchor.slot);         // 12345678
```

## Helper Methods

### isVerified(agentId)

Quick boolean check.

```javascript
if (await ml.isVerified('suspicious-agent')) {
    allowAccess();
}
```

### checkCapability(agentId, capability, minScore)

Check if agent has a capability at a minimum score.

```javascript
// Check if agent can handle escrow at score >= 70
const canEscrow = await ml.checkCapability('my-agent', 'escrow', 70);

if (canEscrow) {
    // Allow high-value escrow transactions
}
```

## Integration Patterns

### Pre-Transaction Verification (AgentChain)

```javascript
const ml = new MoltLaunch();

async function beforeEscrow(agentId, amount) {
    const status = await ml.getStatus(agentId);
    
    if (!status.verified) {
        throw new Error('Agent not verified');
    }
    
    // Tiered limits based on score
    const limit = status.tier === 'excellent' ? 10000 
                : status.tier === 'good' ? 5000 
                : 1000;
    
    if (amount > limit) {
        throw new Error(`Amount ${amount} exceeds limit ${limit} for tier ${status.tier}`);
    }
    
    return true;
}
```

### Competitive Privacy (Trading Bots)

```javascript
// Prove capability without revealing edge
const proof = await ml.generateProof('my-trading-bot', { threshold: 70 });

// Counterparty can verify you're "good enough"
// But can't see if you scored 71 or 95
console.log(proof.claim);  // "Score >= 70"
```

### Consistency Requirements (Poker)

```javascript
// Prove maintained performance over time
const consistency = await ml.generateConsistencyProof('poker-bot', {
    threshold: 60,
    days: 30
});

if (consistency.valid) {
    // Bot has been reliable for 30 days
    allowTableEntry();
}
```

## Changelog

### v2.1.0
- Added `generateProof()` for threshold STARK proofs
- Added `generateConsistencyProof()` for time-series proofs
- Added `generateStreakProof()` for consecutive period proofs
- Added `generateStabilityProof()` for variance proofs
- Added `submitTrace()` for behavioral scoring
- Added `getBehavioralScore()` for trace-based reputation
- Added `anchorTrace()` for on-chain anchoring
- Added `isVerified()` helper
- Added `checkCapability()` for capability checks
- Added `getProofCost()` for cost estimates

### v2.0.0
- On-chain AI verification via Cauldron
- Batch status checks
- Pool application API

### v1.0.0
- Initial release

## License

MIT
