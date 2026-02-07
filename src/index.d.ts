/**
 * MoltLaunch SDK Type Definitions
 */

export interface MoltLaunchOptions {
    /** API base URL (default: production) */
    baseUrl?: string;
    /** Optional API key for premium features */
    apiKey?: string;
}

export interface VerifyOptions {
    /** Unique agent identifier */
    agentId: string;
    /** Solana wallet address */
    wallet?: string;
    /** Agent capabilities */
    capabilities?: string[];
    /** GitHub repository URL */
    codeUrl?: string;
    /** Has documentation */
    documentation?: boolean;
    /** Test coverage percentage (0-100) */
    testCoverage?: number;
    /** Lines of code */
    codeLines?: number;
    /** API endpoint URL */
    apiEndpoint?: string;
}

export interface VerificationResult {
    agentId: string;
    verified: boolean;
    score: number;
    tier: 'excellent' | 'good' | 'needs_work' | 'poor';
    features: Record<string, { value: any; points: number }>;
    onChainAI: {
        enabled: boolean;
        executedOnChain: boolean;
        vm: string;
        program: string;
    };
    attestation: {
        type: string;
        timestamp: string;
        hash: string;
    };
    raw: any;
}

export interface StatusResult {
    agentId: string;
    verified: boolean;
    score: number | null;
    tier: string | null;
    level: 'excellent' | 'verified' | 'unverified';
    verifiedAt: string | null;
    onChainAI?: {
        enabled: boolean;
        vm: string;
        program: string;
    };
    expiresAt?: string;
    message?: string;
}

export interface BatchStatusResult {
    results: Array<{
        agentId: string;
        verified: boolean;
        score: number | null;
        tier: string | null;
    }>;
    count: number;
    verified: number;
}

export interface PoolApplyOptions {
    agentId: string;
    wallet: string;
    topic: string;
    strategy?: string;
}

export interface PoolApplyResult {
    success: boolean;
    agentId: string;
    topic: string;
    status: string;
    message?: string;
}

export interface OnChainInfo {
    enabled: boolean;
    model: string;
    deployment: {
        vm: string;
        weights: string;
        program: string;
    };
    status: string;
    features: Array<{
        name: string;
        weight: string | number;
        description: string;
    }>;
}

export interface ScoreTier {
    min: number;
    max: number;
    label: string;
}

export declare const SCORE_TIERS: {
    excellent: ScoreTier;
    good: ScoreTier;
    needs_work: ScoreTier;
    poor: ScoreTier;
};

export declare const DEPLOYMENT: {
    network: string;
    vm: string;
    weights: string;
    program: string;
};

export declare const DEFAULT_BASE_URL: string;

export declare function getTier(score: number): 'excellent' | 'good' | 'needs_work' | 'poor';
export declare function isVerified(score: number): boolean;

export declare class MoltLaunch {
    constructor(options?: MoltLaunchOptions);
    
    getOnChainInfo(): Promise<OnChainInfo>;
    verify(options: VerifyOptions): Promise<VerificationResult>;
    getStatus(agentId: string): Promise<StatusResult>;
    getStatusBatch(agentIds: string[]): Promise<BatchStatusResult>;
    applyToPool(options: PoolApplyOptions): Promise<PoolApplyResult>;
    getPools(topic?: string): Promise<any>;
    getLeaderboard(): Promise<any>;
    isHealthy(): Promise<boolean>;
}
