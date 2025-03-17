import axios from 'axios';
import { toast } from '@/components/ui/use-toast';
import { showErrorToast } from './common';

// Define safe browser headers without User-Agent
const SAFE_HEADERS = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
};

// Define the hackathon data types
export interface Hackathon {
  id: number;
  title: string;
  url: string;
  thumbnail_url: string;
  organization_name: string;
  submission_period_dates: string;
  open_state: string;  // upcoming, open, closed
  location_type: string; // online, in-person, hybrid
  prize_amount: number;
  themes: { id: number, name: string }[]; // Update theme type to match Devpost API
  featured: boolean;
  submission_count: number;
  registrations_count: number;
  winners_announced: boolean;
}

export interface HackathonResponse {
  hackathons: Hackathon[];
  total_count: number;
}

// Cache for hackathon data
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
// Use multiple cache entries for different filter combinations
const cacheStore: Record<string, {data: HackathonResponse, timestamp: number}> = {};

/**
 * Fetches hackathons from Devpost API
 * @param page Page number (starts at 1)
 * @param challengeTypes Array of challenge types: 'online', 'in-person', or both for hybrid
 * @param orderBy Optional sorting parameter: 'prize-amount', 'recently-added', or 'deadline'
 * @returns Promise with hackathon data
 */
export async function fetchHackathons(
  page: number = 1,
  challengeTypes: ('online' | 'in-person')[] = ['online', 'in-person'],
  orderBy?: 'prize-amount' | 'recently-added' | 'deadline'
): Promise<HackathonResponse> {
  try {
    console.log("=== FETCH HACKATHONS START ===");
    console.log("Page:", page);
    console.log("Challenge Types:", challengeTypes);
    console.log("Order By:", orderBy || 'relevance (default)');
    
    // Generate a cache key based on filters and sorting
    const cacheKey = `hackathons-${challengeTypes.sort().join('-')}-${orderBy || 'relevance'}-page-${page}`;
    console.log("Cache Key:", cacheKey);
    
    // Check cache for this specific filter combination
    if (cacheStore[cacheKey] && Date.now() - cacheStore[cacheKey].timestamp < CACHE_TTL) {
      console.log(`Using cached hackathon data for ${cacheKey}`);
      console.log("=== FETCH HACKATHONS END (FROM CACHE) ===");
      return cacheStore[cacheKey].data;
    }

    // Build the URL with challenge types, sorting and pagination
    let devpostUrl = 'https://devpost.com/api/hackathons?';
    
    // Add challenge type filters
    if (challengeTypes && challengeTypes.length > 0) {
      challengeTypes.forEach(type => {
        devpostUrl += `challenge_type[]=${type}&`;
      });
    }
    
    // Add sorting parameter if provided
    if (orderBy) {
      devpostUrl += `order_by=${orderBy}&`;
    }
    
    // Add page parameter (always last)
    devpostUrl += `page=${page}`;
    
    console.log(`Fetching hackathons from: ${devpostUrl}`);
    
    // Use the proxy to avoid CORS issues
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const finalUrl = `${proxyUrl}${encodeURIComponent(devpostUrl)}`;
    
    console.log(`Making request to: ${finalUrl}`);
    
    const response = await axios.get(finalUrl, { 
      headers: SAFE_HEADERS,
      timeout: 15000 // 15 second timeout
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (!response.data) {
      console.error('Empty response data');
      throw new Error('Empty response received from API');
    }
    
    // Log the response structure
    console.log('Response data structure:', 
      typeof response.data === 'string' 
        ? 'String data - needs parsing'
        : Object.keys(response.data).join(', ')
    );
    
    // Process the response to ensure proper formatting
    const processedResponse: HackathonResponse = {
      hackathons: [],
      total_count: 0
    };
    
    // Parse the response if it's a string
    const data = typeof response.data === 'string' 
      ? JSON.parse(response.data) 
      : response.data;
    
    if (data && data.hackathons && Array.isArray(data.hackathons)) {
      console.log(`Found ${data.hackathons.length} hackathons in response`);
      // Extract hackathons
      processedResponse.hackathons = data.hackathons.map((hackathon: any) => {
        // Process the hackathon
        return {
          id: hackathon.id || 0,
          title: hackathon.title || 'Unnamed Hackathon',
          url: hackathon.url || '#',
          thumbnail_url: hackathon.thumbnail_url || '',
          organization_name: hackathon.organization_name || 'Unknown Organizer',
          submission_period_dates: hackathon.submission_period_dates || 'Dates not specified',
          open_state: hackathon.open_state || 'unknown',
          location_type: hackathon.displayed_location?.icon === 'map-marker-alt' ? 'in-person' : 
                        hackathon.displayed_location?.icon === 'globe' ? 'online' : 
                        hackathon.displayed_location?.location?.toLowerCase().includes('hybrid') ? 'hybrid' : 'online',
          prize_amount: typeof hackathon.prize_amount === 'number' 
            ? hackathon.prize_amount 
            : (hackathon.prize_amount ? parseInt(hackathon.prize_amount.replace(/[^0-9]/g, '')) || 0 : 0),
          themes: Array.isArray(hackathon.themes) 
            ? hackathon.themes.map((theme: any) => {
                if (typeof theme === 'object' && theme !== null) {
                  return { id: theme.id || 0, name: theme.name || 'Unknown' };
                } else if (typeof theme === 'string') {
                  return { id: 0, name: theme };
                }
                return { id: 0, name: 'Unknown' };
              })
            : [],
          featured: !!hackathon.featured,
          submission_count: hackathon.submission_count || 0,
          registrations_count: hackathon.registrations_count || 0,
          winners_announced: !!hackathon.winners_announced
        };
      });
      
      // Extract total count
      processedResponse.total_count = data.meta?.total_count || 
                                     data.total_count || 
                                     processedResponse.hackathons.length;
    } else {
      console.error('No hackathons array in response data', data);
    }
    
    console.log(`Processed ${processedResponse.hackathons.length} hackathons (page ${page})`);
    console.log("Total count:", processedResponse.total_count);
    
    // Cache the response with the specific cache key
    cacheStore[cacheKey] = {
      data: processedResponse,
      timestamp: Date.now()
    };
    console.log("Cached response with key:", cacheKey);
    console.log("=== FETCH HACKATHONS END ===");
    
    return processedResponse;
  } catch (error) {
    console.error('Error fetching hackathons:', error);
    showErrorToast('Failed to fetch hackathons. Please try again later.');
    
    // Return empty data on error
    console.log("=== FETCH HACKATHONS ERROR END ===");
    return { hackathons: [], total_count: 0 };
  }
}

/**
 * Fetches details for a specific hackathon
 * @param hackathonId The ID of the hackathon
 * @returns Promise with detailed hackathon data
 */
export async function fetchHackathonDetails(hackathonId: number): Promise<any> {
  try {
    const devpostUrl = `https://devpost.com/api/hackathons/${hackathonId}`;
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const finalUrl = `${proxyUrl}${encodeURIComponent(devpostUrl)}`;
    
    const response = await axios.get(finalUrl, { 
      headers: SAFE_HEADERS  // Use safe headers
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching hackathon details for ID ${hackathonId}:`, error);
    showErrorToast('Failed to fetch hackathon details. Please try again later.');
    return null;
  }
} 
