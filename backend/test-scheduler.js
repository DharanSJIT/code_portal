// Test script to verify scheduler functionality
import schedulerService from './services/schedulerService.js';

console.log('🧪 Testing Weekly Contest Scheduler...\n');

// Test 1: Get weekly contests
console.log('1️⃣ Testing weekly contests fetch...');
try {
  const contests = await schedulerService.getWeeklyContests();
  console.log(`✅ Found ${contests.length} contests for this week:`);
  contests.forEach((contest, i) => {
    console.log(`   ${i + 1}. ${contest.name} (${contest.platform}) - ${contest.date} ${contest.time}`);
  });
} catch (error) {
  console.error('❌ Error fetching contests:', error.message);
}

console.log('\n2️⃣ Testing scheduler status...');
const status = schedulerService.getStatus();
console.log(`✅ Scheduler status:`, status);

console.log('\n3️⃣ Testing manual email trigger...');
console.log('📧 Sending test email...');
try {
  const result = await schedulerService.triggerManualEmail();
  if (result.success) {
    console.log(`✅ ${result.message}`);
    console.log(`📊 Results: ${result.results.successful} sent, ${result.results.failed} failed`);
  } else {
    console.log(`❌ ${result.message}`);
  }
} catch (error) {
  console.error('❌ Error sending test email:', error.message);
}

console.log('\n🎉 Test completed! Check your email inbox.');
process.exit(0);