// MoltLaunch SDK - AI Agent Token Launches on Solana
// Built on Meteora Dynamic Bonding Curve (DBC)

export * from './types';
export * from './verification';
export * from './launcher';

import { MoltLauncher, LaunchOptions, quickLaunch } from './launcher';
import { AgentVerifier, verifier } from './verification';
import {
  AgentProfile,
  LaunchConfig,
  VerificationResult,
  LaunchResult,
  MOLTLAUNCH_CONFIG,
  DBC_PROGRAM_ID,
} from './types';

/**
 * MoltLaunch SDK
 * 
 * The first dedicated launchpad for AI agent token sales on Solana.
 * Built on Meteora's Dynamic Bonding Curve for fair, transparent launches.
 * 
 * Features:
 * - Proof-of-Agent verification before launch
 * - Customizable bonding curves (linear, exponential, market cap)
 * - Automatic graduation to Meteora AMM
 * - Milestone-based team vesting
 * - 80/20 fee split (creator/platform)
 * 
 * Quick Start:
 * ```typescript
 * import { MoltLauncher, AgentProfile } from '@moltlaunch/sdk';
 * 
 * const agent: AgentProfile = {
 *   name: 'TradingBot Pro',
 *   symbol: 'TBP',
 *   description: 'Autonomous trading agent with proven alpha generation',
 *   capabilities: ['trading', 'analysis', 'automation'],
 *   apiEndpoint: 'https://tradingbot.example.com/api',
 *   githubRepo: 'https://github.com/example/tradingbot',
 * };
 * 
 * const launcher = new MoltLauncher({
 *   rpcUrl: 'https://api.devnet.solana.com',
 *   payer: yourKeypair,
 *   dryRun: true,
 * });
 * 
 * const result = await launcher.launchAgent(agent, {
 *   targetRaise: 500, // SOL
 *   curveType: 'exponential',
 * });
 * ```
 */

export default {
  MoltLauncher,
  AgentVerifier,
  quickLaunch,
  verifier,
  config: MOLTLAUNCH_CONFIG,
  programId: DBC_PROGRAM_ID,
};

// Version
export const VERSION = '1.0.0';
