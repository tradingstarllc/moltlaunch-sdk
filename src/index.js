/**
 * MoltLaunch SDK
 * On-chain AI verification for AI agents
 * 
 * @example
 * const { MoltLaunch } = require('@moltlaunch/sdk');
 * const ml = new MoltLaunch();
 * const result = await ml.verify({ agentId: 'my-agent', capabilities: ['trading'] });
 */

const DEFAULT_BASE_URL = 'https://web-production-419d9.up.railway.app';

class MoltLaunch {
    /**
     * Create a MoltLaunch client
     * @param {Object} options - Configuration options
     * @param {string} [options.baseUrl] - API base URL (default: production)
     * @param {string} [options.apiKey] - Optional API key for premium features
     */
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || DEFAULT_BASE_URL;
        this.apiKey = options.apiKey || null;
    }

    /**
     * Get on-chain AI deployment info
     * @returns {Promise<OnChainInfo>}
     */
    async getOnChainInfo() {
        const res = await fetch(`${this.baseUrl}/api/onchain-ai`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
    }

    /**
     * Verify an agent using on-chain AI
     * @param {VerifyOptions} options - Verification options
     * @returns {Promise<VerificationResult>}
     */
    /**
     * Generate a random nonce for replay protection
     * @returns {string}
     */
    generateNonce() {
        const bytes = new Uint8Array(16);
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            crypto.getRandomValues(bytes);
        } else {
            // Node.js fallback
            const nodeCrypto = require('crypto');
            const buf = nodeCrypto.randomBytes(16);
            bytes.set(buf);
        }
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Verify an agent using on-chain AI (v3.0 with security features)
     * @param {VerifyOptions} options - Verification options
     * @returns {Promise<VerificationResult>}
     */
    async verify(options) {
        const {
            agentId,
            wallet,
            capabilities = [],
            codeUrl,
            documentation = false,
            testCoverage = 0,
            codeLines = 0,
            apiEndpoint,
            // v3.0 security options
            secureMode = false,
            nonce,
            timestamp,
            signature,
            validityDays = 30
        } = options;

        if (!agentId) throw new Error('agentId is required');

        // Build request body
        const body = {
            agentId,
            wallet,
            capabilities,
            codeUrl,
            documentation,
            testCoverage,
            codeLines,
            apiEndpoint
        };

        // Add v3.0 security fields if secure mode
        if (secureMode) {
            body.nonce = nonce || this.generateNonce();
            body.timestamp = timestamp || Math.floor(Date.now() / 1000);
            body.validityDays = validityDays;
            if (signature) body.signature = signature;
        }

        const res = await fetch(`${this.baseUrl}/api/verify/deep`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(error.error || `API error: ${res.status}`);
        }

        const data = await res.json();
        
        return {
            agentId: data.agentId,
            verified: data.score >= 60,
            passed: data.passed,
            score: data.score,
            tier: data.scoreTier,
            features: data.features,
            onChainAI: data.onChainAI,
            attestation: data.attestation,
            security: data.security,
            raw: data
        };
    }

    /**
     * Verify with secure mode enabled (replay-protected)
     * @param {VerifyOptions} options - Verification options
     * @returns {Promise<VerificationResult>}
     */
    async verifySecure(options) {
        return this.verify({ ...options, secureMode: true });
    }

    /**
     * Check if an attestation is revoked
     * @param {string} attestationHash - Attestation hash
     * @returns {Promise<{revoked: boolean, checkedAt: string}>}
     */
    async checkRevocation(attestationHash) {
        const res = await fetch(`${this.baseUrl}/api/verify/revoked/${attestationHash}`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
    }

    /**
     * Renew verification before expiry
     * @param {string} agentId - Agent ID
     * @param {object} options - Additional options
     * @returns {Promise<VerificationResult>}
     */
    async renew(agentId, options = {}) {
        const res = await fetch(`${this.baseUrl}/api/verify/renew/${agentId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(options)
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(error.error || `API error: ${res.status}`);
        }
        return res.json();
    }

    /**
     * Get verification status for an agent
     * @param {string} agentId - Agent ID
     * @returns {Promise<StatusResult>}
     */
    async getStatus(agentId) {
        const res = await fetch(`${this.baseUrl}/api/verify/status/${encodeURIComponent(agentId)}`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
    }

    /**
     * Get verification status for multiple agents
     * @param {string[]} agentIds - Array of agent IDs
     * @returns {Promise<BatchStatusResult>}
     */
    async getStatusBatch(agentIds) {
        const res = await fetch(`${this.baseUrl}/api/verify/status/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentIds })
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
    }

    /**
     * Apply agent to a staking pool
     * @param {PoolApplyOptions} options - Pool application options
     * @returns {Promise<PoolApplyResult>}
     */
    async applyToPool(options) {
        const { agentId, wallet, topic, strategy } = options;
        
        const res = await fetch(`${this.baseUrl}/api/pool/apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId, wallet, topic, strategy })
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(error.error || `API error: ${res.status}`);
        }

        return res.json();
    }

    /**
     * Get pool information
     * @param {string} [topic] - Optional topic filter
     * @returns {Promise<PoolInfo>}
     */
    async getPools(topic) {
        const url = topic 
            ? `${this.baseUrl}/api/pools/${encodeURIComponent(topic)}`
            : `${this.baseUrl}/api/pools`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
    }

    /**
     * Get leaderboard
     * @returns {Promise<LeaderboardResult>}
     */
    async getLeaderboard() {
        const res = await fetch(`${this.baseUrl}/api/pools/leaderboard`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
    }

    /**
     * Check API health
     * @returns {Promise<boolean>}
     */
    async isHealthy() {
        try {
            const res = await fetch(`${this.baseUrl}/api/health`);
            return res.ok;
        } catch {
            return false;
        }
    }

    // ==========================================
    // STARK PROOFS (v3.3 - Privacy-Preserving)
    // ==========================================

    /**
     * Generate a STARK threshold proof
     * Proves "score >= threshold" without revealing exact score
     * @param {string} agentId - Agent ID
     * @param {object} options - Proof options
     * @param {number} [options.threshold=60] - Minimum score to prove
     * @returns {Promise<STARKProof>}
     */
    async generateProof(agentId, options = {}) {
        const { threshold = 60 } = options;
        
        const res = await fetch(`${this.baseUrl}/api/stark/generate/${encodeURIComponent(agentId)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ threshold })
        });
        
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(error.error || `API error: ${res.status}`);
        }
        
        return res.json();
    }

    /**
     * Generate a consistency proof
     * Proves "maintained >= threshold for N periods" without revealing individual scores
     * @param {string} agentId - Agent ID
     * @param {object} options - Proof options
     * @param {number} [options.threshold=60] - Minimum score threshold
     * @param {number} [options.days=30] - Number of days to prove
     * @returns {Promise<ConsistencyProof>}
     */
    async generateConsistencyProof(agentId, options = {}) {
        const { threshold = 60, days = 30 } = options;
        
        const res = await fetch(`${this.baseUrl}/api/stark/consistency/${encodeURIComponent(agentId)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ threshold, days })
        });
        
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(error.error || `API error: ${res.status}`);
        }
        
        return res.json();
    }

    /**
     * Generate a streak proof
     * Proves "N+ consecutive periods at >= threshold"
     * @param {string} agentId - Agent ID
     * @param {object} options - Proof options
     * @param {number} [options.threshold=60] - Minimum score threshold
     * @param {number} [options.minStreak=7] - Minimum consecutive periods
     * @returns {Promise<StreakProof>}
     */
    async generateStreakProof(agentId, options = {}) {
        const { threshold = 60, minStreak = 7 } = options;
        
        const res = await fetch(`${this.baseUrl}/api/stark/streak/${encodeURIComponent(agentId)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ threshold, minStreak })
        });
        
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(error.error || `API error: ${res.status}`);
        }
        
        return res.json();
    }

    /**
     * Generate a stability proof
     * Proves "score variance <= threshold" without revealing actual variance
     * @param {string} agentId - Agent ID
     * @param {object} options - Proof options
     * @param {number} [options.maxVariance=100] - Maximum allowed variance
     * @returns {Promise<StabilityProof>}
     */
    async generateStabilityProof(agentId, options = {}) {
        const { maxVariance = 100 } = options;
        
        const res = await fetch(`${this.baseUrl}/api/stark/stability/${encodeURIComponent(agentId)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ maxVariance })
        });
        
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(error.error || `API error: ${res.status}`);
        }
        
        return res.json();
    }

    // ==========================================
    // EXECUTION TRACES (Behavioral Scoring)
    // ==========================================

    /**
     * Submit an execution trace for behavioral scoring
     * @param {string} agentId - Agent ID
     * @param {TraceData} data - Trace data
     * @returns {Promise<TraceResult>}
     */
    async submitTrace(agentId, data) {
        const res = await fetch(`${this.baseUrl}/api/traces`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
            },
            body: JSON.stringify({ agentId, ...data })
        });
        
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(error.error || `API error: ${res.status}`);
        }
        
        return res.json();
    }

    /**
     * Get traces for an agent
     * @param {string} agentId - Agent ID
     * @param {object} [options] - Query options
     * @returns {Promise<TraceList>}
     */
    async getTraces(agentId, options = {}) {
        const { limit = 20 } = options;
        const res = await fetch(`${this.baseUrl}/api/traces/${encodeURIComponent(agentId)}?limit=${limit}`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
    }

    /**
     * Get behavioral score from traces
     * @param {string} agentId - Agent ID
     * @returns {Promise<BehavioralScore>}
     */
    async getBehavioralScore(agentId) {
        const res = await fetch(`${this.baseUrl}/api/traces/${encodeURIComponent(agentId)}/score`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
    }

    /**
     * Anchor a trace on-chain (requires SlotScribe integration)
     * @param {string} traceId - Trace ID
     * @returns {Promise<AnchorResult>}
     */
    async anchorTrace(traceId) {
        const res = await fetch(`${this.baseUrl}/api/traces/${encodeURIComponent(traceId)}/anchor`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
            }
        });
        
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(error.error || `API error: ${res.status}`);
        }
        
        return res.json();
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    /**
     * Quick check if an agent is verified
     * @param {string} agentId - Agent ID
     * @returns {Promise<boolean>}
     */
    async isVerified(agentId) {
        try {
            const status = await this.getStatus(agentId);
            return status.verified === true && status.score >= 60;
        } catch {
            return false;
        }
    }

    /**
     * Check if an agent has a specific capability at a minimum score
     * @param {string} agentId - Agent ID
     * @param {string} capability - Capability to check (e.g., "trading", "escrow")
     * @param {number} [minScore=60] - Minimum score required
     * @returns {Promise<boolean>}
     */
    async checkCapability(agentId, capability, minScore = 60) {
        try {
            const status = await this.getStatus(agentId);
            if (!status.verified || status.score < minScore) return false;
            if (!status.capabilities) return status.score >= minScore;
            return status.capabilities.includes(capability) && status.score >= minScore;
        } catch {
            return false;
        }
    }

    /**
     * Get proof generation cost estimate
     * @param {string} proofType - Type of proof (threshold, consistency, streak, stability)
     * @returns {Promise<CostEstimate>}
     */
    async getProofCost(proofType = 'threshold') {
        // Costs are near-zero for these lightweight proofs
        const costs = {
            threshold: { computeMs: 50, estimatedCost: '$0.001' },
            consistency: { computeMs: 120, estimatedCost: '$0.002' },
            streak: { computeMs: 100, estimatedCost: '$0.002' },
            stability: { computeMs: 80, estimatedCost: '$0.001' }
        };
        return costs[proofType] || costs.threshold;
    }
}

// Scoring helpers
const SCORE_TIERS = {
    excellent: { min: 80, max: 100, label: 'Production Ready' },
    good: { min: 60, max: 79, label: 'Verified' },
    needs_work: { min: 40, max: 59, label: 'Needs Improvement' },
    poor: { min: 0, max: 39, label: 'Not Ready' }
};

const getTier = (score) => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'needs_work';
    return 'poor';
};

const isVerified = (score) => score >= 60;

// On-chain AI deployment info
const DEPLOYMENT = {
    network: 'solana-devnet',
    vm: 'FHcy35f4NGZK9b6j5TGMYstfB6PXEtmNbMLvjfR1y2Li',
    weights: 'GnSxMWbZEa538vJ9Pf3veDrKP1LkzPiaaVmC4mRnM91N',
    program: 'FRsToriMLgDc1Ud53ngzHUZvCRoazCaGeGUuzkwoha7m'
};

module.exports = {
    MoltLaunch,
    SCORE_TIERS,
    DEPLOYMENT,
    getTier,
    isVerified,
    DEFAULT_BASE_URL
};
