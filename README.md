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

## License

MIT
