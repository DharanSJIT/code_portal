import fetch from 'node-fetch';

async function testCodeforces() {
  try {
    console.log('Testing Codeforces API...');
    const now = new Date();
    console.log('Current time:', now);
    console.log('Current timestamp:', now.getTime());
    
    const response = await fetch('https://codeforces.com/api/contest.list');
    const data = await response.json();
    
    if (data.status === 'OK') {
      console.log('Total contests:', data.result.length);
      
      const upcomingContests = data.result.filter(contest => 
        contest.phase === 'BEFORE' && 
        contest.startTimeSeconds * 1000 > now.getTime()
      );
      
      console.log('Upcoming contests found:', upcomingContests.length);
      
      upcomingContests.slice(0, 5).forEach(contest => {
        const startTime = new Date(contest.startTimeSeconds * 1000);
        console.log(`- ${contest.name}`);
        console.log(`  Start: ${startTime}`);
        console.log(`  Timestamp: ${contest.startTimeSeconds * 1000}`);
        console.log(`  Future: ${contest.startTimeSeconds * 1000 > now.getTime()}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testCodeforces();