import { Contest, ContestType, Platform } from '../types';
import { PLATFORMS } from '../constants';
import { BROWSER_FETCH_HEADERS, showErrorToast } from './common';
import axios from 'axios';
import { toast } from "@/components/ui/use-toast";

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

//  Testing :  mock LeetCode contests when API fails
function generateMockLeetcodeContests(): Contest[] {
  const mockContests: Contest[] = [];
  
  // Find the most recent Sunday for weekly contests
  const today = new Date();
  const currentDay = today.getDay(); // 0 is Sunday
  const daysToLastSunday = currentDay === 0 ? 7 : currentDay;
  const lastSunday = new Date(today);
  lastSunday.setDate(today.getDate() - daysToLastSunday);
  
  // Set time to 8:00 AM IST (UTC+5:30)
  // Converting 8:00 AM IST to UTC: 8:00 - 5:30 = 2:30 AM UTC
  lastSunday.setUTCHours(2, 30, 0, 0); // 8AM IST = 2:30AM UTC
  
  // Set up biweekly contest dates - Biweekly 151 was on March 1st
  // Biweekly 151 was on March 1st at 8 PM IST
  const biweekly151Date = new Date(2024, 2, 1); // Month is 0-indexed, so 2 = March
  biweekly151Date.setUTCHours(14, 30, 0, 0); // 8 PM IST
  
  // Past weekly contests (10 contests, one per week going backwards)
  for (let i = 0; i < 10; i++) {
    const weekNum = 440 - i; // Starting from recent contest numbers
    const contestDate = new Date(lastSunday);
    contestDate.setDate(lastSunday.getDate() - (i * 7)); // i weeks ago Sunday
    const durationSeconds = 1.5 * 3600;
    const endTime = new Date(contestDate.getTime() + durationSeconds * 1000);
    
    mockContests.push({
      id: `leetcode-weekly-contest-${weekNum}`,
      name: `Weekly Contest ${weekNum}`,
      platform: 'leetcode',
      url: `https://leetcode.com/contest/weekly-contest-${weekNum}`,
      startTime: contestDate.toISOString(),
      endTime: endTime.toISOString(),
      duration: durationSeconds,
      status: 'past',
      contestType: 'weekly'
    });
  }
  
  // Past biweekly contests
  const biweeklyContestNumbers = [151, 150, 149, 148, 147];
  
  for (let i = 0; i < biweeklyContestNumbers.length; i++) {
    const biweeklyNum = biweeklyContestNumbers[i];
    let contestDate;
    
    if (i === 0) {
      // For Biweekly 151, use March 1st date
      contestDate = new Date(biweekly151Date);
    } else {
      // For others, subtract 2 weeks from the previous contest
      contestDate = new Date(biweekly151Date);
      contestDate.setDate(biweekly151Date.getDate() - (i * 14));
    }
    
    const durationSeconds = 1.5 * 3600;
    const endTime = new Date(contestDate.getTime() + durationSeconds * 1000);
    
    mockContests.push({
      id: `leetcode-biweekly-contest-${biweeklyNum}`,
      name: `Biweekly Contest ${biweeklyNum}`,
      platform: 'leetcode',
      url: `https://leetcode.com/contest/biweekly-contest-${biweeklyNum}`,
      startTime: contestDate.toISOString(),
      endTime: endTime.toISOString(),
      duration: durationSeconds,
      status: 'past',
      contestType: 'biweekly'
    });
  }
  
  // Sort past contests by time (ascending order)
  mockContests.sort((a, b) => {
    const timeA = new Date(a.startTime).getTime();
    const timeB = new Date(b.startTime).getTime();
    return timeA - timeB;
  });
  
  return mockContests;
}

// Process LeetCode contest data from HTML
function processLeetcodeJsonData(jsonData: any): Contest[] {
  const contests: Contest[] = [];
  const now = Date.now();
  
  // Extract past contests data from the queries section
  if (jsonData.props?.pageProps?.dehydratedState?.queries) {
    const queries = jsonData.props.pageProps.dehydratedState.queries;
    
    // Find the query containing pastContests data
    for (const query of queries) {
      if (query.state?.data?.pastContests) {
        const pastContests = query.state.data.pastContests.data || [];
        console.log(`Found ${pastContests.length} LeetCode past contests`);
        
        // Process past contests
        pastContests.forEach((contest: any) => {
          // Extract start time and duration
          const startTimeMs = contest.startTime * 1000;
          const durationSeconds = contest.duration || 5400; // Default to 1.5 hours
          const endTimeMs = startTimeMs + durationSeconds * 1000;
          
          // Determine contest type based on title
          let contestType: ContestType = 'weekly';
          if (contest.title.toLowerCase().includes('biweekly')) {
            contestType = 'biweekly';
          }
          
          // Create contest object
          contests.push({
            id: `leetcode-${contest.titleSlug}`,
            name: contest.title,
            platform: 'leetcode',
            url: `${PLATFORMS.leetcode.baseUrl}/contest/${contest.titleSlug}`,
            startTime: new Date(startTimeMs).toISOString(),
            endTime: new Date(endTimeMs).toISOString(),
            duration: durationSeconds,
            status: 'past',
            contestType,
            additionalInfo: {
              cardImg: contest.cardImg
            }
          });
        });
      }
    }
    
    // Find upcoming contests data
    for (const query of queries) {
      if (query.state?.data?.topTwoContests) {
        const upcomingContests = query.state.data.topTwoContests || [];
        console.log(`Found ${upcomingContests.length} LeetCode upcoming contests`);
        
        // Process upcoming contests
        upcomingContests.forEach((contest: any) => {
          // Extract start time and duration
          const startTimeMs = contest.startTime * 1000;
          const durationSeconds = contest.duration || 5400; // Default to 1.5 hours
          const endTimeMs = startTimeMs + durationSeconds * 1000;
          
          // Determine contest status
          let status: 'upcoming' | 'ongoing' = 'upcoming';
          if (now >= startTimeMs && now < endTimeMs) {
            status = 'ongoing';
          }
          
          // Determine contest type based on title
          let contestType: ContestType = 'weekly';
          if (contest.titleSlug.toLowerCase().includes('biweekly')) {
            contestType = 'biweekly';
          }
          
          // Create contest object
          contests.push({
            id: `leetcode-${contest.titleSlug}`,
            name: contest.title,
            platform: 'leetcode',
            url: `${PLATFORMS.leetcode.baseUrl}/contest/${contest.titleSlug}`,
            startTime: new Date(startTimeMs).toISOString(),
            endTime: new Date(endTimeMs).toISOString(),
            duration: durationSeconds,
            status,
            contestType,
            additionalInfo: {
              cardImg: contest.cardImg
            }
          });
        });
      }
    }
    
    // Find featured contests data for additional past contests
    for (const query of queries) {
      if (query.state?.data?.featuredContests) {
        const featuredContests = query.state.data.featuredContests || [];
        console.log(`Found ${featuredContests.length} LeetCode featured contests`);
        
        // Process featured contests (likely past contests)
        featuredContests.forEach((contest: any) => {
          // Skip contests that we've already processed
          if (contests.some(c => c.id === `leetcode-${contest.titleSlug}`)) {
            return;
          }
          
          // Extract start time and duration
          const startTimeMs = contest.startTime * 1000;
          const durationSeconds = contest.duration || 5400; // Default to 1.5 hours
          const endTimeMs = startTimeMs + durationSeconds * 1000;
          
          // Determine contest type based on title
          let contestType: ContestType = 'weekly';
          if (contest.titleSlug.toLowerCase().includes('biweekly')) {
            contestType = 'biweekly';
          }
          
          // Create contest object
          contests.push({
            id: `leetcode-${contest.titleSlug}`,
            name: contest.title,
            platform: 'leetcode',
            url: `${PLATFORMS.leetcode.baseUrl}/contest/${contest.titleSlug}`,
            startTime: new Date(startTimeMs).toISOString(),
            endTime: new Date(endTimeMs).toISOString(),
            duration: durationSeconds,
            status: 'past', // Featured contests are typically past contests
            contestType,
            additionalInfo: {
              cardImg: contest.cardImg
            }
          });
        });
      }
    }
  }

  // Sort all contests by time (ascending order)
  contests.sort((a, b) => {
    const timeA = new Date(a.startTime).getTime();
    const timeB = new Date(b.startTime).getTime();
    return timeA - timeB;
  });

  return contests;
}

// Fetch LeetCode contests
export async function fetchLeetcodeContests(): Promise<Contest[]> {
  try {
    // Use LeetCode's GraphQL API to get upcoming contests via CORS proxy
    const leetcodeGraphQLUrl = 'https://leetcode.com/graphql?operationName=upcomingContests&query=query upcomingContests { upcomingContests{ title titleSlug startTime duration __typename }}';
    const proxyGraphQLUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(leetcodeGraphQLUrl)}`;
    
    console.log(`Fetching LeetCode contests from GraphQL API via proxy: ${proxyGraphQLUrl}`);
    const response = await fetch(proxyGraphQLUrl, { headers: BROWSER_FETCH_HEADERS });
    const data = await response.json();
    
    // Log the response for debugging
    console.log('LeetCode GraphQL API response:', data);
    
    // Process upcoming contests from GraphQL
    let upcomingContests: Contest[] = [];
    
    // If we have valid data from the GraphQL API
    if (data.data?.upcomingContests && Array.isArray(data.data.upcomingContests)) {
      const graphqlContests = data.data.upcomingContests;
      console.log(`Found ${graphqlContests.length} upcoming LeetCode contests via GraphQL`);
      
      const now = Date.now();
      
      // Process upcoming contests from GraphQL
      graphqlContests.forEach((contest: any) => {
        // Extract start time and duration
        const startTimeMs = contest.startTime * 1000;
        const durationSeconds = contest.duration || 5400; // Default to 1.5 hours
        const endTimeMs = startTimeMs + durationSeconds * 1000;
        
        // Determine contest status
        let status: 'upcoming' | 'ongoing' = 'upcoming';
        if (now >= startTimeMs && now < endTimeMs) {
          status = 'ongoing';
        }
        
        // Determine contest type based on title
        let contestType: ContestType = 'weekly';
        if (contest.title.toLowerCase().includes('biweekly')) {
          contestType = 'biweekly';
        }
        
        // Create contest object
        upcomingContests.push({
          id: `leetcode-${contest.titleSlug}`,
          name: contest.title,
          platform: 'leetcode',
          url: `${PLATFORMS.leetcode.baseUrl}/contest/${contest.titleSlug}`,
          startTime: new Date(startTimeMs).toISOString(),
          endTime: new Date(endTimeMs).toISOString(),
          duration: durationSeconds,
          status,
          contestType,
        });
      });
    }
    
    // Get mock data for past contests since GraphQL API is not working
    const pastContests = generateMockLeetcodeContests();
    console.log(`Generated ${pastContests.length} mock past contests`);
    
    // Combine upcoming and past contests
    const allContests = [...pastContests, ...upcomingContests];
    
    // Sort all contests by time
    allContests.sort((a, b) => {
      const timeA = new Date(a.startTime).getTime();
      const timeB = new Date(b.startTime).getTime();
      return timeA - timeB;
    });
    
    console.log(`Total LeetCode contests: ${allContests.length}`);
    return allContests;
  } catch (error) {
    console.error('Error fetching LeetCode contests:', error);
    showErrorToast('Failed to fetch LeetCode contests. Please try again later.');
    
    // Return only past mock contests if GraphQL fails
    return generateMockLeetcodeContests();
  }
}

/**
 * Fetches a user's LeetCode submissions
 * @param username LeetCode username
 * @returns Array of submission data or empty array on error
 */
export async function fetchLeetcodeSubmissions(username: string) {
  // Get username from localStorage if not provided
  const storedUsername = username || localStorage.getItem('leetcode-username');
  
  if (!storedUsername) {
    toast({
      title: "LeetCode Username Not Found",
      description: "Please set your LeetCode username in Settings.",
      variant: "destructive"
    });
    return [];
  }
  
  // Check cache first
  const cacheKey = `leetcode-submissions-${storedUsername}`;
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (Date.now() - timestamp < CACHE_TTL) {
      return data;
    }
  }
  
  try {
    // Direct GraphQL query with encoded parameters
    const query = encodeURIComponent(`
      query userProfileCalendar($username: String!) {
        matchedUser(username: $username) {
          userCalendar {
            activeYears
            submissionCalendar
          }
        }
      }
    `);
    const variables = encodeURIComponent(JSON.stringify({ username: storedUsername }));
    const leetcodeUrl = `https://leetcode.com/graphql?query=${query}&variables=${variables}`;
    
    // Use CORS proxy
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const finalUrl = `${proxyUrl}${encodeURIComponent(leetcodeUrl)}`;
    
    const response = await axios.get(finalUrl);
    
    if (!response.data?.data?.matchedUser?.userCalendar?.submissionCalendar) {
      throw new Error("No submission data found");
    }
    
    const calendar = JSON.parse(response.data.data.matchedUser.userCalendar.submissionCalendar);
    const submissionData = Object.entries(calendar).map(([timestamp, count]) => {
      const date = new Date(parseInt(timestamp) * 1000);
      return {
        date: date.toISOString().split('T')[0],
        count: Number(count)
      };
    });
    
    // Cache the result
    cache.set(cacheKey, {
      data: submissionData,
      timestamp: Date.now()
    });
    
    return submissionData;
  } catch (error) {
    console.error('Failed to fetch LeetCode submissions:', error);
    toast({
      title: "LeetCode Data Error",
      description: "Unable to fetch submission data",
      variant: "destructive"
    });
    return [];
  }
}

/**
 * Fetches the LeetCode Problem of the Day
 * @returns Problem of the day data or null on error
 */
export async function fetchProblemOfTheDay() {
  // Check cache first
  const cacheKey = 'leetcode-potd';
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (Date.now() - timestamp < CACHE_TTL) {
      return data;
    }
  }
  
  try {
    // Using the direct URL with query parameters already embedded
    const leetcodeUrl = "https://leetcode.com/graphql?query=%23graphql%0A%20%20query%20getDailyProblem%20%7B%0A%20%20%20%20activeDailyCodingChallengeQuestion%20%7B%0A%20%20%20%20%20%20date%0A%20%20%20%20%20%20link%0A%20%20%20%20%20%20question%20%7B%0A%20%20%20%20%20%20%20%20questionId%0A%20%20%20%20%20%20%20%20questionFrontendId%0A%20%20%20%20%20%20%20%20title%0A%20%20%20%20%20%20%20%20difficulty%0A%20%20%20%20%20%20%20%20likes%0A%20%20%20%20%20%20%20%20dislikes%0A%20%20%20%20%20%20%20%20topicTags%20%7B%0A%20%20%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20stats%0A%20%20%20%20%20%20%20%20challengeQuestion%20%7B%0A%20%20%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%20%20%20%20date%0A%20%20%20%20%20%20%20%20%20%20incompleteChallengeCount%0A%20%20%20%20%20%20%20%20%20%20streakCount%0A%20%20%20%20%20%20%20%20%20%20type%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20note%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%7D";
    
    // Use CORS proxy
    const proxyUrl = "https://api.allorigins.win/raw?url=";
    const finalUrl = `${proxyUrl}${encodeURIComponent(leetcodeUrl)}`;
    
    const response = await axios.get(finalUrl);
    
    if (!response.data?.data?.activeDailyCodingChallengeQuestion) {
      throw new Error("No problem of the day data found");
    }
    
    const data = response.data;
    const potd = data.data.activeDailyCodingChallengeQuestion;
    const question = potd.question;
    
    // Parse the stats JSON string if it exists
    let stats: { acRate?: string } = {};
    if (question.stats) {
      try {
        stats = JSON.parse(question.stats);
      } catch (e) {
        console.error('Error parsing question stats:', e);
      }
    }
    
    const problemData = {
      title: question.title,
      difficulty: question.difficulty,
      description: `Problem #${question.questionFrontendId} - Today's LeetCode Challenge`,
      link: `https://leetcode.com${potd.link}`,
      acceptanceRate: stats.acRate ? `${parseFloat(stats.acRate).toFixed(1)}%` : 'N/A',
      tags: question.topicTags.map((tag: { name: string }) => tag.name),
    };
    
    // Cache the result
    cache.set(cacheKey, {
      data: problemData,
      timestamp: Date.now()
    });
    
    return problemData;
  } catch (error) {
    console.error('Failed to fetch Problem of the Day:', error);
    toast({
      title: "LeetCode Error",
      description: "Unable to fetch today's problem",
      variant: "destructive"
    });
    return null;
  }
}

/**
 * Fetches a user's recent LeetCode submissions
 * @param username LeetCode username
 * @param limit Number of submissions to fetch (default: 10)
 * @returns Array of recent submissions or empty array on error
 */
export async function fetchRecentSubmissions(username?: string, limit: number = 0) {
  // Get username from localStorage if not provided
  const storedUsername = username || localStorage.getItem('leetcode-username');
  
  if (!storedUsername) {
    toast({
      title: "LeetCode Username Not Found",
      description: "Please set your LeetCode username in Settings.",
      variant: "destructive"
    });
    return [];
  }
  
  // Check cache first
  const cacheKey = `leetcode-recent-submissions-${storedUsername}-${limit}`;
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (Date.now() - timestamp < CACHE_TTL) {
      return data;
    }
  }
  
  try {
    // Build the query URL with the encoded username and limit
    const variables = encodeURIComponent(JSON.stringify({ 
      username: storedUsername, 
      limit: limit 
    }));
    
    const query = encodeURIComponent(`
      query getRecentSubmissions($username: String!, $limit: Int) {
        recentSubmissionList(username: $username, limit: $limit) {
          title
          titleSlug
          timestamp
          statusDisplay
          lang
        }
      }
    `);
    
    const leetcodeUrl = `https://leetcode.com/graphql?query=${query}&variables=${variables}`;
    
    // Use CORS proxy
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const finalUrl = `${proxyUrl}${encodeURIComponent(leetcodeUrl)}`;
    
    const response = await axios.get(finalUrl);
    
    if (!response.data?.data?.recentSubmissionList) {
      throw new Error("No submission data found");
    }
    
    const submissions = response.data.data.recentSubmissionList.map(submission => ({
      title: submission.title,
      slug: submission.titleSlug,
      timestamp: parseInt(submission.timestamp) * 1000, // Convert to milliseconds
      status: submission.statusDisplay,
      language: submission.lang,
      url: `https://leetcode.com/problems/${submission.titleSlug}/`
    }));
    
    // Cache the result
    cache.set(cacheKey, {
      data: submissions,
      timestamp: Date.now()
    });
    
    return submissions;
  } catch (error) {
    console.error('Failed to fetch recent LeetCode submissions:', error);
    toast({
      title: "LeetCode Data Error",
      description: "Unable to fetch recent submissions",
      variant: "destructive"
    });
    return [];
  }
}

/**
 * Fetches a user's LeetCode statistics including problem counts and submission history
 * @param username LeetCode username
 * @returns User statistics or null on error
 */
export async function fetchLeetcodeUserStats(username?: string) {
  // Get username from localStorage if not provided
  const storedUsername = username || localStorage.getItem('leetcode-username');
  
  if (!storedUsername) {
    toast({
      title: "LeetCode Username Not Found",
      description: "Please set your LeetCode username in Settings.",
      variant: "destructive"
    });
    return null;
  }
  
  // Check cache first
  const cacheKey = `leetcode-user-stats-${storedUsername}`;
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (Date.now() - timestamp < CACHE_TTL) {
      return data;
    }
  }
  
  try {
    // Build the query URL with the encoded variables
    const variables = encodeURIComponent(JSON.stringify({ 
      username: storedUsername, 
      limit: 20 // Limit for recent submissions
    }));
    
    const query = encodeURIComponent(`
      query getUserProfile($username: String!, $limit: Int!) {
        allQuestionsCount {
          difficulty
          count
        }
        matchedUser(username: $username) {
          contributions {
            points
          }
          profile {
            reputation
            ranking
          }
        }
        recentSubmissionList(username: $username, limit: $limit) {
          title
          titleSlug
          timestamp
          statusDisplay
          lang
        }
        matchedUserStats: matchedUser(username: $username) {
          submitStats: submitStatsGlobal {
            totalSubmissionNum {
              difficulty
              count
              submissions
            }
          }
        }
      }
    `);
    
    const leetcodeUrl = `https://leetcode.com/graphql?query=${query}&variables=${variables}`;
    
    // Use CORS proxy
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const finalUrl = `${proxyUrl}${encodeURIComponent(leetcodeUrl)}`;
    
    const response = await axios.get(finalUrl);
    const data = response.data;
    
    if (!data || !data.data) {
      throw new Error("No user data found");
    }
    
    // Process and format the data
    const responseData = data.data;
    
    // Format problem counts by difficulty
    const problemCounts = {
      total: 0,
      easy: 0,
      medium: 0,
      hard: 0
    };
    
    if (responseData.allQuestionsCount) {
      responseData.allQuestionsCount.forEach((item: { difficulty: string; count: number }) => {
        if (item.difficulty === 'All') {
          problemCounts.total = item.count;
        } else if (item.difficulty === 'Easy') {
          problemCounts.easy = item.count;
        } else if (item.difficulty === 'Medium') {
          problemCounts.medium = item.count;
        } else if (item.difficulty === 'Hard') {
          problemCounts.hard = item.count;
        }
      });
    }
    
    // Format solved problems by difficulty
    const solvedCounts = {
      total: 0,
      easy: 0,
      medium: 0,
      hard: 0
    };
    
    if (responseData.matchedUserStats?.submitStats?.totalSubmissionNum) {
      responseData.matchedUserStats.submitStats.totalSubmissionNum.forEach(
        (item: { difficulty: string; count: number }) => {
          if (item.difficulty === 'All') {
            solvedCounts.total = item.count;
          } else if (item.difficulty === 'Easy') {
            solvedCounts.easy = item.count;
          } else if (item.difficulty === 'Medium') {
            solvedCounts.medium = item.count;
          } else if (item.difficulty === 'Hard') {
            solvedCounts.hard = item.count;
          }
        }
      );
    }
    
    // Format recent submissions
    const recentSubmissions = responseData.recentSubmissionList?.map(
      (submission: any) => ({
        title: submission.title,
        slug: submission.titleSlug,
        timestamp: parseInt(submission.timestamp) * 1000, // Convert to milliseconds
        status: submission.statusDisplay,
        language: submission.lang,
        url: `https://leetcode.com/problems/${submission.titleSlug}/`
      })
    ) || [];
    
    // Format user profile data
    const userProfile = {
      contributions: responseData.matchedUser?.contributions?.points || 0,
      reputation: responseData.matchedUser?.profile?.reputation || 0,
      ranking: responseData.matchedUser?.profile?.ranking || 0
    };
    
    const userStats = {
      username: storedUsername,
      problemCounts,
      solvedCounts,
      recentSubmissions,
      userProfile
    };
    
    // Cache the result
    cache.set(cacheKey, {
      data: userStats,
      timestamp: Date.now()
    });
    
    return userStats;
  } catch (error) {
    console.error('Failed to fetch LeetCode user stats:', error);
    toast({
      title: "LeetCode Data Error",
      description: "Unable to fetch user statistics",
      variant: "destructive"
    });
    return null;
  }
}

/**
 * Shared data store for LeetCode user data to prevent duplicate API calls
 */
const leetcodeDataStore = {
  data: null,
  timestamp: 0,
  loading: false,
  callbacks: []
};

/**
 * Gets LeetCode user data with a single API call and shares it between components
 * @param username LeetCode username
 * @returns User statistics or null on error
 */
export async function getLeetcodeData(username?: string) {
  // Get username from localStorage if not provided
  const storedUsername = username || localStorage.getItem('leetcode-username');
  
  if (!storedUsername) {
    toast({
      title: "LeetCode Username Not Found",
      description: "Please set your LeetCode username in Settings.",
      variant: "destructive"
    });
    return null;
  }
  
  // Check if we have fresh data in the store
  if (leetcodeDataStore.data && Date.now() - leetcodeDataStore.timestamp < CACHE_TTL) {
    return leetcodeDataStore.data;
  }
  
  // If a request is already in progress, wait for it to complete
  if (leetcodeDataStore.loading) {
    return new Promise((resolve) => {
      leetcodeDataStore.callbacks.push(resolve);
    });
  }
  
  // Mark as loading
  leetcodeDataStore.loading = true;
  leetcodeDataStore.callbacks = [];
  
  try {
    // Fetch the data
    const data = await fetchLeetcodeUserStats(storedUsername);
    
    // Store the result
    leetcodeDataStore.data = data;
    leetcodeDataStore.timestamp = Date.now();
    
    // Resolve any pending callbacks
    leetcodeDataStore.callbacks.forEach(callback => callback(data));
    
    return data;
  } catch (error) {
    console.error('Failed to fetch LeetCode data:', error);
    
    // Resolve callbacks with null on error
    leetcodeDataStore.callbacks.forEach(callback => callback(null));
    
    return null;
  } finally {
    leetcodeDataStore.loading = false;
  }
} 