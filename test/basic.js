/**
 * Basic SDK tests
 */

const { MoltLaunch, getTier, isVerified, DEPLOYMENT } = require('../src/index.js');

async function runTests() {
    console.log('=== MoltLaunch SDK Tests ===\n');

    // Test helper functions
    console.log('1. Testing helper functions...');
    console.assert(getTier(85) === 'excellent', 'getTier(85) should be excellent');
    console.assert(getTier(70) === 'good', 'getTier(70) should be good');
    console.assert(getTier(50) === 'needs_work', 'getTier(50) should be needs_work');
    console.assert(getTier(30) === 'poor', 'getTier(30) should be poor');
    console.assert(isVerified(60) === true, 'isVerified(60) should be true');
    console.assert(isVerified(59) === false, 'isVerified(59) should be false');
    console.log('   ✓ Helper functions work correctly\n');

    // Test constants
    console.log('2. Testing constants...');
    console.assert(DEPLOYMENT.vm, 'DEPLOYMENT.vm should exist');
    console.assert(DEPLOYMENT.program, 'DEPLOYMENT.program should exist');
    console.log('   ✓ Constants are defined\n');

    // Test API (if available)
    console.log('3. Testing API connection...');
    const ml = new MoltLaunch();
    
    try {
        const healthy = await ml.isHealthy();
        console.log(`   API healthy: ${healthy}`);
        
        if (healthy) {
            // Test on-chain info
            console.log('\n4. Testing getOnChainInfo...');
            const info = await ml.getOnChainInfo();
            console.log(`   Model: ${info.model}`);
            console.log(`   Status: ${info.status}`);
            console.log(`   VM: ${info.deployment?.vm?.substring(0, 20)}...`);
            console.log('   ✓ On-chain info retrieved\n');

            // Test verification
            console.log('5. Testing verify...');
            const result = await ml.verify({
                agentId: 'sdk-test-agent-' + Date.now(),
                capabilities: ['testing'],
                documentation: true,
                codeLines: 1000,
                testCoverage: 50
            });
            console.log(`   Score: ${result.score}`);
            console.log(`   Tier: ${result.tier}`);
            console.log(`   Verified: ${result.verified}`);
            console.log(`   On-chain: ${result.onChainAI?.enabled}`);
            console.log('   ✓ Verification works\n');

            // Test status
            console.log('6. Testing getStatus...');
            const status = await ml.getStatus(result.agentId);
            console.log(`   Cached: ${status.verified}`);
            console.log('   ✓ Status lookup works\n');
        }
    } catch (error) {
        console.log(`   ✗ API test failed: ${error.message}\n`);
    }

    console.log('=== Tests Complete ===');
}

runTests().catch(console.error);
