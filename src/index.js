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

    // ==========================================
    // HARDWARE-ANCHORED IDENTITY (Anti-Sybil)
    // DePIN-Rooted Device Identity
    // ==========================================

    /**
     * Collect environment fingerprint for hardware-anchored identity
     * @returns {object} Raw fingerprint data
     * @private
     */
    _collectFingerprint() {
        const crypto = require('crypto');
        const os = require('os');
        
        const hardware = {
            platform: os.platform(),
            arch: os.arch(),
            cpus: os.cpus().length,
            cpuModel: os.cpus()[0]?.model || 'unknown',
            totalMemory: os.totalmem(),
            hostname: os.hostname(),
        };

        const runtime = {
            nodeVersion: process.version,
            pid: process.pid,
            execPath: process.execPath,
            cwd: process.cwd(),
            env: {
                USER: process.env.USER || process.env.USERNAME || 'unknown',
                HOME: process.env.HOME || process.env.USERPROFILE || 'unknown',
                SHELL: process.env.SHELL || 'unknown',
            }
        };

        // Try to get network interfaces for fingerprinting
        const nets = os.networkInterfaces();
        const networkFingerprint = Object.keys(nets).sort().map(name => {
            const iface = nets[name].find(n => !n.internal && n.family === 'IPv4');
            return iface ? `${name}:${iface.mac}` : null;
        }).filter(Boolean).join('|');

        return { hardware, runtime, networkFingerprint };
    }

    /**
     * Try to read TPM endorsement key hash for hardware-rooted identity
     * @returns {string|null} SHA-256 hash of TPM data, or null if unavailable
     * @private
     */
    _getTPMFingerprint() {
        const crypto = require('crypto');
        const fs = require('fs');
        const os = require('os');
        
        // TPM 2.0 paths (Linux)
        const tpmPaths = [
            '/sys/class/tpm/tpm0/device/description',
            '/sys/class/tpm/tpm0/tpm_version_major',
            '/sys/class/dmi/id/board_serial',
            '/sys/class/dmi/id/product_uuid',
            '/sys/class/dmi/id/chassis_serial',
        ];
        
        const tpmData = [];
        for (const p of tpmPaths) {
            try {
                const data = fs.readFileSync(p, 'utf-8').trim();
                if (data && data !== 'None' && data !== '') {
                    tpmData.push(data);
                }
            } catch {}
        }
        
        // macOS: use IOPlatformUUID
        if (os.platform() === 'darwin') {
            try {
                const { execSync } = require('child_process');
                const uuid = execSync('ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID', { encoding: 'utf-8' });
                const match = uuid.match(/"([A-F0-9-]+)"/);
                if (match) tpmData.push(match[1]);
            } catch {}
        }
        
        if (tpmData.length === 0) return null;
        
        return crypto.createHash('sha256')
            .update(tpmData.join('|'))
            .digest('hex');
    }

    /**
     * Register a DePIN device attestation for hardware-rooted identity
     * Links agent identity to a physically verified DePIN device
     * 
     * @param {object} options - DePIN registration options
     * @param {string} options.provider - DePIN provider name (e.g., 'io.net', 'akash', 'render')
     * @param {string} options.deviceId - Device ID from the DePIN provider
     * @param {string} [options.attestation] - Optional attestation data from the provider
     * @param {string} options.agentId - Agent ID to bind DePIN identity to
     * @returns {Promise<DePINRegistrationResult>}
     */
    async registerDePINDevice(options = {}) {
        const { provider, deviceId, attestation, agentId } = options;
        
        const supported = ['io.net', 'akash', 'render', 'helium', 'hivemapper', 'nosana'];
        
        if (!supported.includes(provider)) {
            throw new Error(`Unsupported DePIN provider. Supported: ${supported.join(', ')}`);
        }
        
        const res = await fetch(`${this.baseUrl}/api/identity/depin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                agentId,
                depinProvider: provider,
                deviceId,
                attestation,
                timestamp: Date.now()
            })
        });
        
        if (!res.ok) throw new Error(`DePIN registration failed: ${res.status}`);
        return res.json();
    }

    /**
     * Get identity trust report for an agent
     * Shows trust ladder breakdown including DePIN and TPM attestation levels
     * 
     * @param {string} agentId - Agent ID to get report for
     * @returns {Promise<IdentityReport>}
     */
    async getIdentityReport(agentId) {
        const res = await fetch(`${this.baseUrl}/api/identity/${encodeURIComponent(agentId)}/report`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
    }

    /**
     * Generate a hardware-anchored identity hash
     * Combines hardware, runtime, code, and network fingerprints into a deterministic identity
     * 
     * @param {object} options - Identity options
     * @param {boolean} [options.includeHardware=true] - Include hardware fingerprint (CPU, memory)
     * @param {boolean} [options.includeRuntime=true] - Include runtime fingerprint (Node version, OS)
     * @param {boolean} [options.includeCode=false] - Include code hash (hash of main module)
     * @param {string} [options.codeEntry] - Path to agent's main module for code hashing
     * @param {string} [options.agentId] - Agent ID to bind identity to
     * @param {boolean} [options.anchor=false] - Anchor identity on Solana
     * @returns {Promise<IdentityResult>}
     */
    async generateIdentity(options = {}) {
        const crypto = require('crypto');
        const {
            includeHardware = true,
            includeRuntime = true,
            includeCode = false,
            includeTPM = false,
            depinProvider,
            depinDeviceId,
            codeEntry,
            agentId,
            anchor = false
        } = options;

        const fingerprint = this._collectFingerprint();
        const components = [];

        if (includeHardware) {
            const hwHash = crypto.createHash('sha256')
                .update(JSON.stringify(fingerprint.hardware))
                .digest('hex');
            components.push(`hw:${hwHash}`);
        }

        if (includeRuntime) {
            const rtHash = crypto.createHash('sha256')
                .update(JSON.stringify(fingerprint.runtime))
                .digest('hex');
            components.push(`rt:${rtHash}`);
        }

        if (includeCode && codeEntry) {
            try {
                const fs = require('fs');
                const codeContent = fs.readFileSync(codeEntry, 'utf-8');
                const codeHash = crypto.createHash('sha256')
                    .update(codeContent)
                    .digest('hex');
                components.push(`code:${codeHash}`);
            } catch (e) {
                components.push(`code:unavailable`);
            }
        }

        if (fingerprint.networkFingerprint) {
            const netHash = crypto.createHash('sha256')
                .update(fingerprint.networkFingerprint)
                .digest('hex');
            components.push(`net:${netHash}`);
        }

        // TPM attestation (hardware-rooted identity - trust level 4)
        let tpmHash = null;
        if (includeTPM) {
            tpmHash = this._getTPMFingerprint();
            if (tpmHash) {
                components.push(`tpm:${tpmHash}`);
            }
        }

        // DePIN device attestation (highest trust level 5)
        if (depinProvider && depinDeviceId) {
            const depinHash = crypto.createHash('sha256')
                .update(`depin:${depinProvider}:${depinDeviceId}`)
                .digest('hex');
            components.push(`depin:${depinHash}`);
        }

        // Generate deterministic identity hash
        const identityHash = crypto.createHash('sha256')
            .update(components.join('|'))
            .digest('hex');

        const identity = {
            hash: identityHash,
            components: components.length,
            includesHardware: includeHardware,
            includesRuntime: includeRuntime,
            includesCode: includeCode && !!codeEntry,
            includesNetwork: !!fingerprint.networkFingerprint,
            includesTPM: includeTPM && !!tpmHash,
            tpmHash: tpmHash || null,
            depinProvider: depinProvider || null,
            depinDeviceId: depinDeviceId || null,
            generatedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            agentId: agentId || null
        };

        // Register with MoltLaunch API
        if (agentId) {
            try {
                const res = await fetch(`${this.baseUrl}/api/identity/register`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
                    },
                    body: JSON.stringify({
                        agentId,
                        identityHash,
                        components: components.length,
                        includesHardware: includeHardware,
                        includesCode: includeCode
                    })
                });
                
                if (res.ok) {
                    const registration = await res.json();
                    identity.registered = true;
                    identity.registrationId = registration.registrationId;
                } else {
                    identity.registered = false;
                    identity.registrationError = `API ${res.status}`;
                }
            } catch (e) {
                identity.registered = false;
                identity.registrationError = e.message;
            }
        }

        // Anchor on Solana if requested
        if (anchor && agentId) {
            try {
                const res = await fetch(`${this.baseUrl}/api/anchor/verification`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        agentId,
                        attestationHash: identityHash
                    })
                });
                
                if (res.ok) {
                    const anchorResult = await res.json();
                    identity.anchored = true;
                    identity.anchorSignature = anchorResult.signature;
                    identity.anchorExplorer = anchorResult.explorer;
                } else {
                    identity.anchored = false;
                }
            } catch (e) {
                identity.anchored = false;
                identity.anchorError = e.message;
            }
        }

        return identity;
    }

    /**
     * Verify an agent's identity against their registered fingerprint
     * @param {string} agentId - Agent ID to verify
     * @returns {Promise<IdentityVerification>}
     */
    async verifyIdentity(agentId) {
        // Generate current fingerprint
        const currentIdentity = await this.generateIdentity({ agentId });

        // Check against registered identity
        try {
            const res = await fetch(`${this.baseUrl}/api/identity/${encodeURIComponent(agentId)}`);
            if (!res.ok) {
                return {
                    valid: false,
                    agentId,
                    reason: 'No registered identity found',
                    currentHash: currentIdentity.hash
                };
            }

            const registered = await res.json();
            const matches = registered.identityHash === currentIdentity.hash;

            return {
                valid: matches,
                agentId,
                currentHash: currentIdentity.hash,
                registeredHash: registered.identityHash,
                match: matches,
                registeredAt: registered.registeredAt,
                reason: matches ? 'Identity confirmed' : 'Identity mismatch — different hardware or code'
            };
        } catch (e) {
            return {
                valid: false,
                agentId,
                reason: e.message,
                currentHash: currentIdentity.hash
            };
        }
    }

    /**
     * Check if two agents have the same hardware fingerprint (Sybil detection)
     * @param {string} agentId1 - First agent
     * @param {string} agentId2 - Second agent
     * @returns {Promise<SybilCheck>}
     */
    async checkSybil(agentId1, agentId2) {
        try {
            const [id1, id2] = await Promise.all([
                fetch(`${this.baseUrl}/api/identity/${encodeURIComponent(agentId1)}`).then(r => r.json()),
                fetch(`${this.baseUrl}/api/identity/${encodeURIComponent(agentId2)}`).then(r => r.json())
            ]);

            const sameIdentity = id1.identityHash === id2.identityHash;

            return {
                agentId1,
                agentId2,
                sameIdentity,
                sybilRisk: sameIdentity ? 'HIGH' : 'LOW',
                reason: sameIdentity 
                    ? 'Same hardware fingerprint — likely same operator' 
                    : 'Different hardware fingerprints — likely different operators',
                recommendation: sameIdentity 
                    ? 'Do not seat at same table' 
                    : 'Safe to interact'
            };
        } catch (e) {
            return {
                agentId1,
                agentId2,
                sameIdentity: null,
                sybilRisk: 'UNKNOWN',
                reason: `Could not compare: ${e.message}`
            };
        }
    }

    /**
     * Check a list of agents for Sybil clusters (table seating check)
     * @param {string[]} agentIds - List of agent IDs to check
     * @returns {Promise<SybilTableCheck>}
     */
    async checkTableSybils(agentIds) {
        // Fetch all identities
        const identities = {};
        for (const id of agentIds) {
            try {
                const res = await fetch(`${this.baseUrl}/api/identity/${encodeURIComponent(id)}`);
                if (res.ok) {
                    const data = await res.json();
                    identities[id] = data.identityHash;
                }
            } catch {
                // Skip agents without identity
            }
        }

        // Find clusters (same identity hash)
        const hashToAgents = {};
        for (const [agentId, hash] of Object.entries(identities)) {
            if (!hashToAgents[hash]) hashToAgents[hash] = [];
            hashToAgents[hash].push(agentId);
        }

        const clusters = Object.values(hashToAgents).filter(group => group.length > 1);
        const flagged = clusters.flat();

        return {
            totalAgents: agentIds.length,
            identifiedAgents: Object.keys(identities).length,
            unidentifiedAgents: agentIds.filter(id => !identities[id]),
            sybilClusters: clusters,
            flaggedAgents: flagged,
            safe: clusters.length === 0,
            recommendation: clusters.length === 0 
                ? 'No Sybil clusters detected — safe to proceed'
                : `${clusters.length} Sybil cluster(s) detected — ${flagged.length} agents share hardware`
        };
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
