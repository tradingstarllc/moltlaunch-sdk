// MoltLaunch Types

export interface AgentProfile {
  name: string;
  symbol: string;
  description: string;
  capabilities: string[];
  apiEndpoint: string;
  githubRepo?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  logo?: string; // URL or file path
}

export interface LaunchConfig {
  // Token Economics
  totalSupply: number;
  targetRaise: number; // in SOL
  quoteMint?: string; // default SOL
  
  // Bonding Curve
  curveType: 'linear' | 'exponential' | 'marketcap' | 'custom';
  initialMarketCap?: number;
  migrationMarketCap?: number;
  
  // Migration
  migrationTarget: 'damm-v1' | 'damm-v2';
  migrationFeeOption: 0 | 1 | 2 | 3 | 4 | 5; // 0.25% to 6%
  
  // LP Distribution (must total 100%)
  creatorLpPercentage: number;
  platformLpPercentage: number;
  creatorLockedLpPercentage: number;
  platformLockedLpPercentage: number;
  
  // Fees
  tradingFeeBps: number; // basis points
  creatorFeeShare: number; // 0-100, percentage of trading fees to creator
  
  // Anti-rug features
  vestingEnabled: boolean;
  vestingDurationDays?: number;
  cliffDays?: number;
}

export interface VerificationResult {
  passed: boolean;
  score: number; // 0-100
  checks: {
    apiLiveness: boolean;
    apiResponsive: boolean;
    githubExists: boolean;
    capabilitiesVerified: boolean;
    uniqueIdentity: boolean;
  };
  attestation?: string; // On-chain proof
  timestamp: string;
}

export interface LaunchApplication {
  id: string;
  agent: AgentProfile;
  config: LaunchConfig;
  verification: VerificationResult | null;
  status: 'pending' | 'verifying' | 'verified' | 'rejected' | 'live' | 'graduated';
  createdAt: string;
  updatedAt: string;
  launchAddress?: string;
  tokenMint?: string;
}

export interface LaunchResult {
  success: boolean;
  transactionId?: string;
  poolAddress?: string;
  tokenMint?: string;
  configKey?: string;
  error?: string;
}

export interface SwapParams {
  tokenMint: string;
  amountIn: number;
  isBuy: boolean; // true = buy tokens, false = sell tokens
  slippageBps: number;
}

export interface SwapResult {
  success: boolean;
  transactionId?: string;
  amountIn: number;
  amountOut: number;
  priceImpact: number;
  newPrice: number;
  error?: string;
}

// Meteora DBC Program ID
export const DBC_PROGRAM_ID = 'dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN';

// MoltLaunch Platform Config
export const MOLTLAUNCH_CONFIG = {
  platformWallet: '82rh4CG9bMfVLFcpWwUXAscVkAgtDqCXgcQ4k2bjuoEx',
  platformFeePercentage: 20, // 20% of trading fees
  minVerificationScore: 60, // minimum score to launch
  defaultLaunchConfig: {
    totalSupply: 1_000_000_000,
    curveType: 'linear' as const,
    migrationTarget: 'damm-v2' as const,
    migrationFeeOption: 2 as const, // 1%
    creatorLpPercentage: 40,
    platformLpPercentage: 50,
    creatorLockedLpPercentage: 5,
    platformLockedLpPercentage: 5,
    tradingFeeBps: 100, // 1%
    creatorFeeShare: 80, // 80/20 split
    vestingEnabled: true,
    vestingDurationDays: 30,
    cliffDays: 7,
  }
};
