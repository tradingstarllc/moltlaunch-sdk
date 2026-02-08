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

// STARK Proof Types
export interface STARKProof {
    agentId: string;
    proofType: string;
    claim: string;
    valid: boolean;
    proof: {
        commitment: string;
        proofHash: string;
        generatedAt: string;
    };
    privacyNote: string;
}

export interface ConsistencyProof extends STARKProof {
    periodCount: number;
    timeRange: {
        start: string;
        end: string;
    };
}

export interface StreakProof extends STARKProof {
    minStreak: number;
}

export interface StabilityProof extends STARKProof {
    periodCount: number;
}

// Trace Types
export interface TraceData {
    period?: {
        start: string;
        end: string;
    };
    actions?: Array<{
        type: string;
        timestamp: string;
        success: boolean;
        metadata?: Record<string, any>;
    }>;
    summary?: Record<string, any>;
}

export interface TraceResult {
    traceId: string;
    agentId: string;
    commitment: string;
    behavioralScore?: number;
    createdAt: string;
}

export interface BehavioralScore {
    agentId: string;
    score: number;
    breakdown: Record<string, number>;
    traceCount: number;
    calculatedAt: string;
}

export interface AnchorResult {
    traceId: string;
    anchored: boolean;
    txSignature?: string;
    slot?: number;
}

export interface CostEstimate {
    computeMs: number;
    estimatedCost: string;
}

export interface ProofOptions {
    threshold?: number;
}

export interface ConsistencyProofOptions extends ProofOptions {
    days?: number;
}

export interface StreakProofOptions extends ProofOptions {
    minStreak?: number;
}

export interface StabilityProofOptions {
    maxVariance?: number;
}

export declare class MoltLaunch {
    constructor(options?: MoltLaunchOptions);
    
    // Core verification
    getOnChainInfo(): Promise<OnChainInfo>;
    verify(options: VerifyOptions): Promise<VerificationResult>;
    verifySecure(options: VerifyOptions): Promise<VerificationResult>;
    getStatus(agentId: string): Promise<StatusResult>;
    getStatusBatch(agentIds: string[]): Promise<BatchStatusResult>;
    checkRevocation(attestationHash: string): Promise<{ revoked: boolean; checkedAt: string }>;
    renew(agentId: string, options?: object): Promise<VerificationResult>;
    
    // STARK proofs (privacy-preserving)
    generateProof(agentId: string, options?: ProofOptions): Promise<STARKProof>;
    generateConsistencyProof(agentId: string, options?: ConsistencyProofOptions): Promise<ConsistencyProof>;
    generateStreakProof(agentId: string, options?: StreakProofOptions): Promise<StreakProof>;
    generateStabilityProof(agentId: string, options?: StabilityProofOptions): Promise<StabilityProof>;
    
    // Execution traces
    submitTrace(agentId: string, data: TraceData): Promise<TraceResult>;
    getTraces(agentId: string, options?: { limit?: number }): Promise<{ traces: TraceResult[]; count: number }>;
    getBehavioralScore(agentId: string): Promise<BehavioralScore>;
    anchorTrace(traceId: string): Promise<AnchorResult>;
    
    // Staking pools
    applyToPool(options: PoolApplyOptions): Promise<PoolApplyResult>;
    getPools(topic?: string): Promise<any>;
    getLeaderboard(): Promise<any>;
    
    // Helpers
    isHealthy(): Promise<boolean>;
    isVerified(agentId: string): Promise<boolean>;
    checkCapability(agentId: string, capability: string, minScore?: number): Promise<boolean>;
    getProofCost(proofType?: string): Promise<CostEstimate>;
    generateNonce(): string;
}
