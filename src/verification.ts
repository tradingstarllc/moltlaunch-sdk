// Agent Verification Service
import axios from 'axios';
import { AgentProfile, VerificationResult } from './types';

export class AgentVerifier {
  private timeout: number;

  constructor(timeout: number = 10000) {
    this.timeout = timeout;
  }

  /**
   * Verify an agent's liveness and capabilities
   */
  async verify(agent: AgentProfile): Promise<VerificationResult> {
    const checks = {
      apiLiveness: false,
      apiResponsive: false,
      githubExists: false,
      capabilitiesVerified: false,
      uniqueIdentity: false,
    };

    // 1. API Liveness Check
    try {
      const livenessResult = await this.checkApiLiveness(agent.apiEndpoint);
      checks.apiLiveness = livenessResult.alive;
      checks.apiResponsive = livenessResult.responseTime < 5000;
    } catch (error) {
      console.log('API liveness check failed:', error);
    }

    // 2. GitHub Check
    if (agent.githubRepo) {
      try {
        checks.githubExists = await this.checkGithubRepo(agent.githubRepo);
      } catch (error) {
        console.log('GitHub check failed:', error);
      }
    }

    // 3. Capabilities Verification (via API prompt)
    if (checks.apiLiveness) {
      try {
        checks.capabilitiesVerified = await this.verifyCapabilities(
          agent.apiEndpoint,
          agent.capabilities
        );
      } catch (error) {
        console.log('Capability verification failed:', error);
      }
    }

    // 4. Unique Identity Check (placeholder for SAID/on-chain identity)
    checks.uniqueIdentity = true; // TODO: Integrate with SAID protocol

    // Calculate score
    const score = this.calculateScore(checks);
    const passed = score >= 60;

    return {
      passed,
      score,
      checks,
      attestation: passed ? this.generateAttestation(agent, score) : undefined,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if agent API is alive and responsive
   */
  private async checkApiLiveness(
    endpoint: string
  ): Promise<{ alive: boolean; responseTime: number }> {
    const start = Date.now();
    
    try {
      // Try common health endpoints
      const healthEndpoints = [
        endpoint,
        `${endpoint}/health`,
        `${endpoint}/api/health`,
        `${endpoint}/ping`,
      ];

      for (const url of healthEndpoints) {
        try {
          const response = await axios.get(url, { timeout: this.timeout });
          if (response.status === 200) {
            return { alive: true, responseTime: Date.now() - start };
          }
        } catch {
          continue;
        }
      }

      // Try POST with verification prompt
      const response = await axios.post(
        endpoint,
        {
          message: 'MoltLaunch verification ping. Please respond with your agent name.',
        },
        { timeout: this.timeout }
      );

      return {
        alive: response.status === 200,
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return { alive: false, responseTime: Date.now() - start };
    }
  }

  /**
   * Check if GitHub repository exists and has recent activity
   */
  private async checkGithubRepo(repoUrl: string): Promise<boolean> {
    try {
      // Extract owner/repo from URL
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) return false;

      const [, owner, repo] = match;
      const apiUrl = `https://api.github.com/repos/${owner}/${repo.replace('.git', '')}`;

      const response = await axios.get(apiUrl, {
        timeout: this.timeout,
        headers: { Accept: 'application/vnd.github.v3+json' },
      });

      // Check for recent activity (updated in last 30 days)
      const updatedAt = new Date(response.data.updated_at);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      return response.status === 200 && updatedAt > thirtyDaysAgo;
    } catch {
      return false;
    }
  }

  /**
   * Verify agent capabilities through API interaction
   */
  private async verifyCapabilities(
    endpoint: string,
    capabilities: string[]
  ): Promise<boolean> {
    const verificationPrompts: Record<string, string> = {
      trading: 'What trading pairs do you support? Respond with a list.',
      analysis: 'Provide a brief market analysis for SOL.',
      automation: 'Describe one automation task you can perform.',
      defi: 'What DeFi protocols do you integrate with?',
      social: 'What social platforms do you monitor?',
      nft: 'What NFT marketplaces do you support?',
    };

    let verifiedCount = 0;

    for (const capability of capabilities) {
      const prompt = verificationPrompts[capability.toLowerCase()];
      if (!prompt) continue;

      try {
        const response = await axios.post(
          endpoint,
          { message: prompt },
          { timeout: this.timeout }
        );

        // Basic check: response should be non-empty and relevant
        if (
          response.status === 200 &&
          response.data &&
          (typeof response.data === 'string' ? response.data.length > 20 : true)
        ) {
          verifiedCount++;
        }
      } catch {
        continue;
      }
    }

    // At least 50% of capabilities should be verified
    return capabilities.length > 0 && verifiedCount / capabilities.length >= 0.5;
  }

  /**
   * Calculate verification score (0-100)
   */
  private calculateScore(checks: VerificationResult['checks']): number {
    const weights = {
      apiLiveness: 30,
      apiResponsive: 20,
      githubExists: 15,
      capabilitiesVerified: 25,
      uniqueIdentity: 10,
    };

    let score = 0;
    for (const [key, passed] of Object.entries(checks)) {
      if (passed) {
        score += weights[key as keyof typeof weights] || 0;
      }
    }

    return score;
  }

  /**
   * Generate verification attestation (placeholder for on-chain)
   */
  private generateAttestation(agent: AgentProfile, score: number): string {
    const data = {
      agentName: agent.name,
      symbol: agent.symbol,
      score,
      verifiedAt: new Date().toISOString(),
      verifier: 'MoltLaunch',
    };

    // TODO: Create actual on-chain attestation
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }
}

export const verifier = new AgentVerifier();
