import analyzerService from './src/services/analyzer.service.js';

// Test with a real public PR
const testPRUrl = 'https://github.com/facebook/react/pull/28000';

console.log('Testing PR analysis with:', testPRUrl);
console.log('This will take 10-20 seconds...\n');

try {
  const result = await analyzerService.analyzePR(testPRUrl);
  console.log('\n✅ Analysis successful!');
  console.log('Quality Score:', result.qualityScore);
  console.log('Security Findings:', result.securityFindings.length);
  console.log('Performance Findings:', result.performanceFindings.length);
  console.log('\nFull result:');
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error('\n❌ Analysis failed:', error.message);
  process.exit(1);
}

// Made with Bob
