import express from 'express';
import emailService from '../services/emailService.js';

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
      const fetch = (await import('node-fetch')).default;
      const response = await fetch('https://codeforces.com/api/contest.list');
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK') {
          const cfContests = data.result
            .filter(contest => 
              contest.phase === 'BEFORE' && 
              contest.startTimeSeconds * 1000 > now.getTime()
            )
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

          if (cfContests.length > 0) {
            contests = [...cfContests, ...contests.filter(c => c.platform !== 'Codeforces')];
          }
        }
      }
    } catch (apiError) {
      console.log('Could not fetch Codeforces contests, using placeholders');
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

export default router;