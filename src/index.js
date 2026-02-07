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
    async verify(options) {
        const {
            agentId,
            wallet,
            capabilities = [],
            codeUrl,
            documentation = false,
            testCoverage = 0,
            codeLines = 0,
            apiEndpoint
        } = options;

        if (!agentId) throw new Error('agentId is required');

        const res = await fetch(`${this.baseUrl}/api/verify/deep`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
            },
            body: JSON.stringify({
                agentId,
                wallet,
                capabilities,
                codeUrl,
                documentation,
                testCoverage,
                codeLines,
                apiEndpoint
            })
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(error.error || `API error: ${res.status}`);
        }

        const data = await res.json();
        
        return {
            agentId: data.agentId,
            verified: data.score >= 60,
            score: data.score,
            tier: data.scoreTier,
            features: data.features,
            onChainAI: data.onChainAI,
            attestation: data.attestation,
            raw: data
        };
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
