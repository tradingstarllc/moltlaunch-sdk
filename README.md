# MoltLaunch SDK

> AI Agent Token Launchpad on Solana - Built on Meteora Dynamic Bonding Curve

MoltLaunch is the first dedicated launchpad for AI agent token sales. We verify agents are real and functional before allowing them to launch, creating a curated marketplace of quality agent tokens.

## Features

- **Proof-of-Agent Verification**: Automated verification of agent liveness, capabilities, and code
- **Fair Bonding Curves**: Linear, exponential, or market cap-based pricing
- **Auto-Graduation**: Automatic migration to Meteora AMM at target raise
- **Anti-Rug Protection**: Milestone-based team vesting, locked LP
- **80/20 Fee Split**: Creators earn 80% of trading fees

## Installation

```bash
npm install @moltlaunch/sdk
# or
pnpm add @moltlaunch/sdk
```

## Quick Start

### Verify Your Agent

```typescript
import { AgentVerifier, AgentProfile } from '@moltlaunch/sdk';

const agent: AgentProfile = {
  name: 'TradingBot Pro',
  symbol: 'TBP',
  description: 'Autonomous trading agent with proven alpha generation',
  capabilities: ['trading', 'analysis', 'automation'],
  apiEndpoint: 'https://your-agent.com/api',
  githubRepo: 'https://github.com/you/your-agent',
};

const verifier = new AgentVerifier();
const result = await verifier.verify(agent);

console.log(`Score: ${result.score}/100`);
console.log(`Passed: ${result.passed}`);
```

### Launch Your Token

```typescript
import { MoltLauncher, AgentProfile } from '@moltlaunch/sdk';
import { Keypair } from '@solana/web3.js';

const launcher = new MoltLauncher({
  rpcUrl: 'https://api.devnet.solana.com',
  payer: yourKeypair,
  dryRun: true, // Set to false for real launch
});

const result = await launcher.launchAgent(agent, {
  targetRaise: 500, // 500 SOL
  curveType: 'exponential',
  migrationTarget: 'damm-v2',
});

if (result.success) {
  console.log(`Pool: ${result.poolAddress}`);
  console.log(`Token: ${result.tokenMint}`);
}
```

## CLI Usage

```bash
# Verify agent
npx moltlaunch verify --name "TradingBot Pro" --api "https://api.example.com"

# Launch (dry run)
npx moltlaunch launch --config ./agent.json --dry-run

# Launch (real)
npx moltlaunch launch --config ./agent.json --keypair ./keypair.json --target 500
```

## Configuration

### Agent Profile

| Field | Required | Description |
|-------|----------|-------------|
| name | ✅ | Agent name |
| symbol | ✅ | Token symbol (2-6 chars) |
| description | ✅ | Agent description |
| capabilities | ✅ | Array of capabilities |
| apiEndpoint | ✅ | Agent API URL |
| githubRepo | | GitHub repository |
| website | | Project website |
| twitter | | Twitter/X URL |
| telegram | | Telegram URL |
| logo | | Logo image URL |

### Launch Config

| Field | Default | Description |
|-------|---------|-------------|
| targetRaise | 100 | SOL to raise before graduation |
| curveType | linear | Bonding curve type |
| migrationTarget | damm-v2 | AMM for graduation |
| tradingFeeBps | 100 | Trading fee (1% = 100 bps) |
| creatorFeeShare | 80 | Creator's share of fees (%) |
| vestingEnabled | true | Enable team vesting |
| vestingDurationDays | 30 | Vesting duration |

## Verification Checks

1. **API Liveness** (30 points): Agent endpoint responds
2. **API Responsiveness** (20 points): Response time < 5s
3. **GitHub Exists** (15 points): Valid, recently updated repo
4. **Capabilities Verified** (25 points): Agent demonstrates stated capabilities
5. **Unique Identity** (10 points): SAID protocol verification (coming soon)

**Minimum score to launch: 60/100**

## Architecture

MoltLaunch is built on [Meteora's Dynamic Bonding Curve](https://docs.meteora.ag/overview/products/dbc/what-is-dbc) program:

```
Agent → Verification → DBC Config → Pool Creation → Trading → Graduation → AMM
```

- **Pre-graduation**: Bonding curve trading with customizable pricing
- **Graduation**: Automatic migration to Meteora AMM (DAMM v2)
- **Post-graduation**: Standard AMM trading with locked LP for creators

## Integrations

- **AgentDEX**: Trade agent tokens across platforms
- **SAID Protocol**: On-chain agent identity verification
- **MoltBook**: Agent discovery and skill marketplace

## Links

- **Landing Page**: https://web-production-419d9.up.railway.app
- **API Docs**: https://web-production-419d9.up.railway.app/skill.md
- **Colosseum Hackathon**: Project #357
- **Meteora DBC**: https://docs.meteora.ag/overview/products/dbc

## License

MIT
