import express from 'express';
import emailService from '../services/emailService.js';
import schedulerService from '../services/schedulerService.js';

const router = express.Router();

// Fetch contests from Codeforces API and generate contest data
const fetchUpcomingContests = async () => {
  try {
    // Helper function to get next occurrence of a specific day
    const getNextDayOfWeek = (dayOfWeek, hour, minute) => {
      const now = new Date();
      const resultDate = new Date();
      const currentDay = now.getDay();
      let daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;

      if (daysUntilTarget === 0) {
        const targetTime = new Date();
        targetTime.setHours(hour, minute, 0, 0);
        if (now >= targetTime) {
          daysUntilTarget = 7;
        }
      }

      resultDate.setDate(now.getDate() + daysUntilTarget);
      resultDate.setHours(hour, minute, 0, 0);
      return resultDate;
    };

    // Generate placeholder contests
    const now = new Date();
    const leetcodeDate = getNextDayOfWeek(0, 8, 0); // Sunday 8 AM
    const atcoderDate = getNextDayOfWeek(6, 17, 30); // Saturday 5:30 PM
    const codechefDate = getNextDayOfWeek(3, 20, 0); // Wednesday 8 PM

    let contests = [
      {
        name: "LeetCode Weekly Contest",
        platform: "LeetCode",
        date: new Intl.DateTimeFormat('en-GB').format(leetcodeDate),
        time: new Intl.DateTimeFormat('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }).format(leetcodeDate),
        duration: "1h 30m",
        url: "https://leetcode.com/contest/",
        startTime: leetcodeDate.getTime()
      },
      {
        name: "AtCoder Beginner Contest",
        platform: "AtCoder",
        date: new Intl.DateTimeFormat('en-GB').format(atcoderDate),
        time: new Intl.DateTimeFormat('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }).format(atcoderDate),
        duration: "1h 40m",
        url: "https://atcoder.jp/contests/",
        startTime: atcoderDate.getTime()
      },
      {
        name: "CodeChef Starters",
        platform: "CodeChef",
        date: new Intl.DateTimeFormat('en-GB').format(codechefDate),
        time: new Intl.DateTimeFormat('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }).format(codechefDate),
        duration: "3h 0m",
        url: "https://www.codechef.com/contests",
        startTime: codechefDate.getTime()
      }
    ];

    // Try to fetch real Codeforces contests
    try {
      console.log('Fetching Codeforces contests...');
      const fetch = (await import('node-fetch')).default;
      const response = await fetch('https://codeforces.com/api/contest.list');
      
      console.log('Codeforces API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Codeforces API data status:', data.status);
        
        if (data.status === 'OK') {
          console.log('Total contests from API:', data.result.length);
          
          const upcomingContests = data.result.filter(contest => 
            contest.phase === 'BEFORE' && 
            contest.startTimeSeconds * 1000 > now.getTime()
          );
          
          console.log('Upcoming contests found:', upcomingContests.length);
          console.log('Upcoming contests:', upcomingContests.map(c => ({ name: c.name, startTime: new Date(c.startTimeSeconds * 1000) })));
          
          const cfContests = upcomingContests
            .slice(0, 3)
            .map(contest => {
              const startTime = new Date(contest.startTimeSeconds * 1000);
              return {
                name: contest.name,
                platform: "Codeforces",
                date: new Intl.DateTimeFormat('en-GB').format(startTime),
                time: new Intl.DateTimeFormat('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                }).format(startTime),
                duration: `${Math.floor(contest.durationSeconds / 3600)}h ${Math.floor((contest.durationSeconds % 3600) / 60)}m`,
                url: `https://codeforces.com/contest/${contest.id}`,
                startTime: contest.startTimeSeconds * 1000
              };
            });

          console.log('Processed Codeforces contests:', cfContests.length);
          
          if (cfContests.length > 0) {
            contests = [...cfContests, ...contests.filter(c => c.platform !== 'Codeforces')];
            console.log('Added Codeforces contests to list. Total contests now:', contests.length);
          } else {
            console.log('No Codeforces contests to add');
          }
        } else {
          console.log('Codeforces API returned non-OK status:', data.status, data.comment);
        }
      } else {
        console.log('Codeforces API request failed with status:', response.status);
      }
    } catch (apiError) {
      console.error('Codeforces API error:', apiError.message);
      console.error('Full error:', apiError);
    }

    // Sort by start time and return top 6
    contests.sort((a, b) => a.startTime - b.startTime);
    return contests.slice(0, 6);

  } catch (error) {
    console.error('Error fetching contests:', error);
    throw error;
  }
};

// Send contest notifications
router.post('/send-contest-notifications', async (req, res) => {
  try {
    const contests = await fetchUpcomingContests();
    
    if (contests.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No upcoming contests found'
      });
    }

    const result = await emailService.sendContestNotifications(contests);
    
    res.json(result);
  } catch (error) {
    console.error('Error sending contest notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notifications',
      error: error.message
    });
  }
});

// Get upcoming contests (for preview)
router.get('/upcoming-contests', async (req, res) => {
  try {
    const contests = await fetchUpcomingContests();
    res.json({
      success: true,
      contests
    });
  } catch (error) {
    console.error('Error fetching contests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contests',
      error: error.message
    });
  }
});

// Get weekly contests (for scheduler)
router.get('/weekly-contests', async (req, res) => {
  try {
    const contests = await schedulerService.getWeeklyContests();
    res.json({
      success: true,
      contests,
      count: contests.length
    });
  } catch (error) {
    console.error('Error fetching weekly contests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weekly contests',
      error: error.message
    });
  }
});

// Get scheduler status
router.get('/scheduler/status', (req, res) => {
  try {
    const status = schedulerService.getStatus();
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get scheduler status',
      error: error.message
    });
  }
});

// Start scheduler
router.post('/scheduler/start', (req, res) => {
  try {
    schedulerService.startScheduler();
    res.json({
      success: true,
      message: 'Weekly email scheduler started',
      status: schedulerService.getStatus()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start scheduler',
      error: error.message
    });
  }
});

// Stop scheduler
router.post('/scheduler/stop', (req, res) => {
  try {
    schedulerService.stopScheduler();
    res.json({
      success: true,
      message: 'Weekly email scheduler stopped',
      status: schedulerService.getStatus()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to stop scheduler',
      error: error.message
    });
  }
});

// Manual trigger for testing
router.post('/scheduler/trigger', async (req, res) => {
  try {
    const result = await schedulerService.triggerManualEmail();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to trigger manual email',
      error: error.message
    });
  }
});

export default router;