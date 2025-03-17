import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getLeetcodeData } from "@/utils/api/leetcode";
import { fetchGithubActivity } from "@/utils/api/github";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  ExternalLink, 
  Check, 
  X, 
  Code, 
  GitBranch, 
  Star, 
  GitFork, 
  GitPullRequest, 
  MessageSquare,
  GitCommit,
  AlertTriangle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDistanceToNow, format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Number of items to show initially and to load each time
const ITEMS_PER_LOAD = 5;

export function ActivityHistory() {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, leetcode, or github
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_LOAD);
  const loaderRef = useRef(null);
  
  useEffect(() => {
    async function fetchActivities() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get LeetCode submissions
        const leetcodeUsername = localStorage.getItem('leetcode-username');
        const githubUsername = localStorage.getItem('github-username');
        
        const promises = [];
        
        if (leetcodeUsername) {
          // Use the shared data function
          promises.push(getLeetcodeData());
        }
        
        if (githubUsername) {
          promises.push(fetchGithubActivity(githubUsername));
        }
        
        const results = await Promise.allSettled(promises);
        
        // Format the LeetCode submissions
        let formattedSubmissions = [];
        let githubActivities = [];
        
        if (leetcodeUsername && results[0]?.status === 'fulfilled') {
          if (results[0].value?.recentSubmissions) {
            formattedSubmissions = results[0].value.recentSubmissions.map(submission => ({
              type: 'leetcode',
              title: submission.title,
              status: submission.status,
              language: submission.language,
              timestamp: submission.timestamp,
              url: submission.url
            }));
          }
        }
        
        // Add GitHub activities if available (already properly formatted by the API)
        if (githubUsername && results.length > 1 && results[1]?.status === 'fulfilled') {
          githubActivities = results[1].value;
        }
        
        // Sort all activities by timestamp (most recent first)
        const allActivities = [...formattedSubmissions, ...githubActivities]
          .sort((a, b) => b.timestamp - a.timestamp);
        
        setActivities(allActivities);
        
        if (allActivities.length === 0) {
          setError("No recent activity found");
        }
      } catch (err) {
        console.error("Error fetching activities:", err);
        setError("Failed to load recent activities");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchActivities();
  }, []);
  
  // Reset display count when filter changes
  useEffect(() => {
    setDisplayCount(ITEMS_PER_LOAD);
  }, [filter]);
  
  // Intersection Observer for infinite scrolling
  const observer = useRef();
  const lastActivityRef = useCallback(
    (node) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && filteredActivities.length > displayCount) {
          setDisplayCount(prevCount => prevCount + ITEMS_PER_LOAD);
        }
      });
      
      if (node) observer.current.observe(node);
    },
    [isLoading, displayCount]
  );
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-3/5" />
                <Skeleton className="h-4 w-1/6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (error && activities.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  const filteredActivities = filter === "all" 
    ? activities 
    : activities.filter(activity => activity.type === filter);
  
  // Get items to display based on current display count
  const displayedActivities = filteredActivities.slice(0, displayCount);
  
  return (
    <div className="space-y-3">
      <Tabs defaultValue="all" className="w-full" onValueChange={setFilter}>
        <div className="flex justify-between items-center mb-2">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="leetcode">LeetCode</TabsTrigger>
            <TabsTrigger value="github">GitHub</TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
      
      {/* Fixed height scrollable container */}
      <div className="h-[400px] overflow-y-auto pr-2 scrollbar-thin">
        {displayedActivities.map((activity, index) => {
          // Add ref to last item for intersection observer
          if (index === displayedActivities.length - 1) {
            return (
              <div key={index} ref={lastActivityRef}>
                <ActivityItem activity={activity} />
              </div>
            );
          }
          return <ActivityItem key={index} activity={activity} />;
        })}
        
        {/* Loading indicator at bottom */}
        {displayCount < filteredActivities.length && (
          <div className="text-center py-2 text-sm text-muted-foreground">
            Loading more...
          </div>
        )}
        
        {/* No more activities message */}
        {displayCount >= filteredActivities.length && filteredActivities.length > ITEMS_PER_LOAD && (
          <div className="text-center py-2 text-sm text-muted-foreground">
            No more activities to load
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ activity }) {
  // Format the timestamp to show both relative time and exact date/time
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    
    // Format as "DD-MM-YYYY hh:mm AM/PM"
    const formattedDate = format(date, "dd-MM-yyyy hh:mm aaa");
    
    // Also keep the relative time (e.g. "2 hours ago")
    const relativeTime = formatDistanceToNow(date, { addSuffix: true });
    
    return (
      <div className="text-xs text-muted-foreground text-right">
        <div>{formattedDate}</div>
        <div>{relativeTime}</div>
      </div>
    );
  };

  const getStatusIcon = (status) => {
    if (status === "Accepted") return <Check className="h-4 w-4 text-green-500" />;
    if (status === "Wrong Answer") return <X className="h-4 w-4 text-red-500" />;
    return null;
  };
  
  const getLanguageBadge = (language) => {
    const colors = {
      java: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
      javascript: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      python: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      cpp: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
      c: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
      // Add more languages as needed
    };
    
    return (
      <Badge className={
        colors[language?.toLowerCase()] || 
        "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100"
      } variant="outline">
        {language}
      </Badge>
    );
  };
  
  const getPlatformBadge = (type) => {
    const styles = {
      leetcode: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
      github: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
    };
    
    return (
      <Badge className={styles[type] || "bg-gray-100 text-gray-800"}>
        {type === 'leetcode' ? 'LeetCode' : 'GitHub'}
      </Badge>
    );
  };
  
  const getGithubEventIcon = (eventType) => {
    // Map GitHub event types to icons
    if (eventType.includes('PushEvent')) return <GitCommit className="h-4 w-4 text-blue-500" />;
    if (eventType.includes('PullRequestEvent')) return <GitPullRequest className="h-4 w-4 text-purple-500" />;
    if (eventType.includes('IssuesEvent')) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    if (eventType.includes('IssueCommentEvent')) return <MessageSquare className="h-4 w-4 text-green-500" />;
    if (eventType.includes('WatchEvent')) return <Star className="h-4 w-4 text-yellow-500" />;
    if (eventType.includes('ForkEvent')) return <GitFork className="h-4 w-4 text-blue-500" />;
    if (eventType.includes('CreateEvent')) return <GitBranch className="h-4 w-4 text-green-500" />;
    
    // Default icon
    return <GitBranch className="h-4 w-4 text-blue-500" />;
  };
  
  if (activity.type === 'leetcode') {
    return (
      <Card className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code className="h-4 w-4 text-orange-500" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getPlatformBadge(activity.type)}
                  <a 
                    href={activity.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium hover:underline flex items-center"
                  >
                    {activity.title}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
                <div className="flex items-center text-xs text-muted-foreground space-x-2">
                  <span className="flex items-center">
                    {getStatusIcon(activity.status)}
                    <span className="ml-1">{activity.status}</span>
                  </span>
                  {getLanguageBadge(activity.language)}
                </div>
              </div>
            </div>
            {formatTimestamp(activity.timestamp)}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (activity.type === 'github') {
    return (
      <Card className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getGithubEventIcon(activity.eventType || activity.type)}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getPlatformBadge(activity.type)}
                  <a 
                    href={activity.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium hover:underline flex items-center"
                  >
                    {activity.title}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
                {activity.description && (
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    {activity.description}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  <span className="font-medium">{activity.repo?.split('/')[1] || activity.repo}</span>
                </div>
              </div>
            </div>
            {formatTimestamp(activity.timestamp)}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return null;
} 