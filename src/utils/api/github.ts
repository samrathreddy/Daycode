import axios from 'axios';
import { toast } from "@/components/ui/use-toast";

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

/**
 * Fetches a user's GitHub contributions
 * @param username GitHub username
 * @returns Array of contribution data or empty array on error
 */
export async function fetchGithubContributions(username: string) {
  // Get username from localStorage if not provided
  const storedUsername = username || localStorage.getItem('github-username');
  
  if (!storedUsername) {
    toast({
      title: "GitHub Username Not Found",
      description: "Please set your GitHub username in Settings.",
      variant: "destructive"
    });
    return [];
  }
  
  // Check cache first
  const cacheKey = `github-contributions-${storedUsername}`;
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (Date.now() - timestamp < CACHE_TTL) {
      return data;
    }
  }
  
  try {
    // Use CORS proxy for GitHub API
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const apiUrl = `https://github-contributions-api.jogruber.de/v4/${storedUsername}`;
    const finalUrl = `${proxyUrl}${encodeURIComponent(apiUrl)}`;
    
    const response = await axios.get(finalUrl);
    
    // Check if we have the expected data structure
    if (!response.data || !response.data.contributions) {
      throw new Error("Invalid response format");
    }
    // Filter out future dates (if any) and map to expected format
    const now = new Date();
    // Add 6 hours to midnight (6 * 60 * 60 * 1000 = 21,600,000 milliseconds)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() + (6 * 60 * 60 * 1000);
    const contributionData = response.data.contributions
      .filter(item => {
        const itemDate = new Date(item.date).getTime();
        return itemDate <= today; // Filter out future dates
      })
      .map(item => ({
        date: item.date, // Keep as string "YYYY-MM-DD"
        count: item.count
      }));
    
    console.log("GitHub contribution data:", contributionData); // Debug
    
    // Cache the result
    cache.set(cacheKey, {
      data: contributionData,
      timestamp: Date.now()
    });
    
    return contributionData;
  } catch (error) {
    console.error('Failed to fetch GitHub contributions:', error);
    toast({
      title: "GitHub Data Error",
      description: "Unable to fetch contribution data",
      variant: "destructive"
    });
    return [];
  }
}

/**
 * Fetches a user's recent GitHub activity events
 * @param username GitHub username
 * @param limit Number of events to fetch (default: 20)
 * @returns Array of GitHub activity events or empty array on error
 */
export async function fetchGithubActivity(username?: string, limit: number = 20) {
  // Get username from localStorage if not provided
  const storedUsername = username || localStorage.getItem('github-username');
  
  if (!storedUsername) {
    toast({
      title: "GitHub Username Not Found",
      description: "Please set your GitHub username in Settings.",
      variant: "destructive"
    });
    return [];
  }
  
  // Check cache first
  const cacheKey = `github-activity-${storedUsername}-${limit}`;
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (Date.now() - timestamp < CACHE_TTL) {
      return data;
    }
  }
  
  try {
    // Use GitHub's public events API with a CORS proxy
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const apiUrl = `https://api.github.com/users/${storedUsername}/events?per_page=${limit}`;
    const finalUrl = `${proxyUrl}${encodeURIComponent(apiUrl)}`;
    
    const response = await axios.get(finalUrl);
    
    if (!Array.isArray(response.data)) {
      throw new Error("Invalid response format from GitHub API");
    }
    
    // Map GitHub events to a more usable format
    const activityData = response.data.map(event => {
      const eventDetails = {
        id: event.id,
        type: event.type,
        repo: event.repo.name,
        timestamp: new Date(event.created_at).getTime(),
        url: `https://github.com/${event.repo.name}`,
        title: '',
        description: ''
      };
      
      // Format different event types appropriately
      switch (event.type) {
        case 'PushEvent':
          const commits = event.payload.commits || [];
          const commitCount = commits.length;
          eventDetails.title = `Pushed ${commitCount} commit${commitCount !== 1 ? 's' : ''}`;
          if (commits.length > 0) {
            eventDetails.description = commits[0].message;
          }
          break;
          
        case 'PullRequestEvent':
          const action = event.payload.action;
          eventDetails.title = `${action === 'opened' ? 'Opened' : 'Updated'} pull request`;
          eventDetails.description = event.payload.pull_request?.title || '';
          eventDetails.url = event.payload.pull_request?.html_url || eventDetails.url;
          break;
          
        case 'IssuesEvent':
          eventDetails.title = `${event.payload.action} issue`;
          eventDetails.description = event.payload.issue?.title || '';
          eventDetails.url = event.payload.issue?.html_url || eventDetails.url;
          break;
          
        case 'CreateEvent':
          eventDetails.title = `Created ${event.payload.ref_type}`;
          eventDetails.description = event.payload.ref || '';
          break;
          
        case 'WatchEvent':
          eventDetails.title = 'Starred a repository';
          break;
          
        case 'ForkEvent':
          eventDetails.title = 'Forked a repository';
          break;
          
        case 'IssueCommentEvent':
          eventDetails.title = 'Commented on an issue';
          eventDetails.description = event.payload.comment?.body?.substring(0, 60) || '';
          if (event.payload.comment?.body?.length > 60) {
            eventDetails.description += '...';
          }
          eventDetails.url = event.payload.comment?.html_url || eventDetails.url;
          break;
          
        default:
          eventDetails.title = event.type.replace('Event', ' Event');
      }
      
      return {
        ...eventDetails,
        // Add consistent type property for filtering in the activity history component
        type: 'github'
      };
    });
    
    console.log("GitHub activity data:", activityData); // Debug
    
    // Cache the result
    cache.set(cacheKey, {
      data: activityData,
      timestamp: Date.now()
    });
    
    return activityData;
  } catch (error) {
    console.error('Failed to fetch GitHub activity:', error);
    toast({
      title: "GitHub Activity Error",
      description: "Unable to fetch activity data",
      variant: "destructive"
    });
    return [];
  }
} 