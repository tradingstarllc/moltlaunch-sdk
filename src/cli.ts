#!/usr/bin/env node
// MoltLaunch CLI - Launch agent tokens from command line

import { Command } from 'commander';
import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import { config as dotenvConfig } from 'dotenv';
import { MoltLauncher } from './launcher';
import { AgentVerifier } from './verification';
import { AgentProfile, LaunchConfig } from './types';

dotenvConfig();

const program = new Command();

program
  .name('moltlaunch')
  .description('MoltLaunch CLI - AI Agent Token Launchpad on Solana')
  .version('1.0.0');

// Verify command
program
  .command('verify')
  .description('Verify an agent before launching')
  .requiredOption('-n, --name <name>', 'Agent name')
  .requiredOption('-a, --api <endpoint>', 'Agent API endpoint')
  .option('-c, --capabilities <caps>', 'Comma-separated capabilities', 'trading,analysis')
  .option('-g, --github <repo>', 'GitHub repository URL')
  .action(async (options) => {
    console.log('\n🔍 MoltLaunch Agent Verification\n');
    console.log(`Agent: ${options.name}`);
    console.log(`API: ${options.api}`);
    console.log(`Capabilities: ${options.capabilities}\n`);

    const agent: AgentProfile = {
      name: options.name,
      symbol: 'TEST',
      description: 'Verification test',
      capabilities: options.capabilities.split(','),
      apiEndpoint: options.api,
      githubRepo: options.github,
    };

    const verifier = new AgentVerifier();
    const result = await verifier.verify(agent);

    console.log('Verification Results:');
    console.log('─'.repeat(40));
    console.log(`API Liveness:     ${result.checks.apiLiveness ? '✅' : '❌'}`);
    console.log(`API Responsive:   ${result.checks.apiResponsive ? '✅' : '❌'}`);
    console.log(`GitHub Exists:    ${result.checks.githubExists ? '✅' : '❌'}`);
    console.log(`Capabilities:     ${result.checks.capabilitiesVerified ? '✅' : '❌'}`);
    console.log(`Unique Identity:  ${result.checks.uniqueIdentity ? '✅' : '❌'}`);
    console.log('─'.repeat(40));
    console.log(`Final Score:      ${result.score}/100`);
    console.log(`Status:           ${result.passed ? '✅ PASSED' : '❌ FAILED'}\n`);

    if (!result.passed) {
      console.log('❗ Minimum score of 60 required to launch');
      process.exit(1);
    }
  });

// Launch command
program
  .command('launch')
  .description('Launch an agent token on Meteora DBC')
  .requiredOption('-c, --config <file>', 'Agent config file (JSON)')
  .option('-r, --rpc <url>', 'Solana RPC URL', process.env.RPC_URL || 'https://api.devnet.solana.com')
  .option('-k, --keypair <file>', 'Keypair file path', './keypair.json')
  .option('--target <sol>', 'Target raise in SOL', '100')
  .option('--curve <type>', 'Curve type (linear|exponential|marketcap)', 'linear')
  .option('--dry-run', 'Simulate without sending transactions', false)
  .action(async (options) => {
    console.log('\n🚀 MoltLaunch - AI Agent Token Launch\n');

    // Load agent config
    if (!fs.existsSync(options.config)) {
      console.error(`❌ Config file not found: ${options.config}`);
      process.exit(1);
    }

    const agentConfig = JSON.parse(fs.readFileSync(options.config, 'utf-8'));
    const agent: AgentProfile = {
      name: agentConfig.name,
      symbol: agentConfig.symbol,
      description: agentConfig.description,
      capabilities: agentConfig.capabilities || [],
      apiEndpoint: agentConfig.apiEndpoint,
      githubRepo: agentConfig.githubRepo,
      website: agentConfig.website,
      twitter: agentConfig.twitter,
      telegram: agentConfig.telegram,
      logo: agentConfig.logo,
    };

    // Load keypair
    if (!fs.existsSync(options.keypair)) {
      console.error(`❌ Keypair file not found: ${options.keypair}`);
      console.log('Generate one with: pnpm studio generate-keypair');
      process.exit(1);
    }

    const keypairData = JSON.parse(fs.readFileSync(options.keypair, 'utf-8'));
    const payer = Keypair.fromSecretKey(new Uint8Array(keypairData));

    console.log(`Agent: ${agent.name} ($${agent.symbol})`);
    console.log(`Wallet: ${payer.publicKey.toBase58()}`);
    console.log(`RPC: ${options.rpc}`);
    console.log(`Target: ${options.target} SOL`);
    console.log(`Curve: ${options.curve}`);
    console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}\n`);

    const launcher = new MoltLauncher({
      rpcUrl: options.rpc,
      payer,
      dryRun: options.dryRun,
    });

    const launchConfig: Partial<LaunchConfig> = {
      targetRaise: parseFloat(options.target),
      curveType: options.curve as 'linear' | 'exponential' | 'marketcap',
    };

    try {
      const result = await launcher.launchAgent(agent, launchConfig);

      if (result.success) {
        console.log('🎉 Launch successful!\n');
        console.log(`Transaction: ${result.transactionId}`);
        console.log(`Pool Address: ${result.poolAddress}`);
        console.log(`Token Mint: ${result.tokenMint}`);
        console.log(`Config Key: ${result.configKey}`);
      } else {
        console.error(`❌ Launch failed: ${result.error}`);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Check launch status')
  .requiredOption('-m, --mint <address>', 'Token mint address')
  .option('-r, --rpc <url>', 'Solana RPC URL', process.env.RPC_URL || 'https://api.devnet.solana.com')
  .action(async (options) => {
    console.log('\n📊 Launch Status\n');
    console.log(`Token: ${options.mint}`);
    console.log('\n⚠️ Status check not yet implemented\n');
    // TODO: Implement status check via DBC program
  });

program.parse();
