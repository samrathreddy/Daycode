import React, { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { fetchGithubContributions } from "@/utils/api/github";
import { fetchLeetcodeSubmissions } from "@/utils/api/leetcode";
import { AlertCircle, Flame, Trophy } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReactCalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

interface CalendarHeatmapProps {
  platform: "github" | "leetcode";
  className?: string;
}

export function CalendarHeatmap({ platform, className }: CalendarHeatmapProps) {
  const [data, setData] = useState<{ date: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  
  // Get username from localStorage
  const [username, setUsername] = useState<string | null>(localStorage.getItem(`${platform}-username`));
  
  // State for inline username input
  const [tempUsername, setTempUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      
      try {
        if (!username) {
          setData(generateEmptyData());
          setError(`No ${platform} username found.`);
          return;
        }
        
        let contributionData;
        if (platform === "github") {
          contributionData = await fetchGithubContributions(username);
        } else {
          contributionData = await fetchLeetcodeSubmissions(username);
        }
        
        setData(contributionData.length ? contributionData : generateEmptyData());
        
        // Calculate streaks
        if (contributionData.length > 0) {
          const { current, max } = calculateStreaks(contributionData);
          setCurrentStreak(current);
          setMaxStreak(max);
        }
        
        if (contributionData.length === 0) {
          setError(`No activity data found for ${username}`);
        }
      } catch (err) {
        console.error(`Error fetching ${platform} data:`, err);
        setData(generateEmptyData());
        setError(`Could not load ${platform} data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
    
    // Add event listener for storage changes
    const handleStorageChange = (e) => {
      if (e.key === `${platform}-username`) {
        const newUsername = e.newValue;
        setUsername(newUsername);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [platform, username]);
  
  // Calculate current and max streaks
  const calculateStreaks = (contributionData: { date: string; count: number }[]) => {
    console.log(`Calculating streaks for ${platform}...`);
    
    // Sort data by date (oldest first)
    const sortedData = [...contributionData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Create a map of dates with activity
    const activeDays = new Map();
    sortedData.forEach(item => {
      if (item.count > 0) {
        activeDays.set(item.date, true);
      }
    });
    
    // Properly calculate today's date in IST
    // IST is UTC+5:30
    const now = new Date();
    // Add the IST offset (5 hours and 30 minutes) to get IST time
    const istTime = new Date(now.getTime() + (5 * 60 + 30) * 60 * 1000);
    // Format as YYYY-MM-DD
    const todayStr = istTime.toISOString().split('T')[0];
    
    // Get yesterday's date in IST
    const yesterdayIST = new Date(istTime);
    yesterdayIST.setDate(istTime.getDate() - 1);
    const yesterdayStr = yesterdayIST.toISOString().split('T')[0];
    
    // Debug logging
    console.log(`Today (IST): ${todayStr}, Activity: ${activeDays.has(todayStr)}`);
    console.log(`Yesterday (IST): ${yesterdayStr}, Activity: ${activeDays.has(yesterdayStr)}`);
    
    // Calculate current streak
    let current = 0;
    
    // Check if there was activity today
    if (activeDays.has(todayStr)) {
      current = 1;
      
      // Count streak backward from yesterday
      let date = new Date(yesterdayIST);
      let dateStr = yesterdayStr;
      
      while (activeDays.has(dateStr)) {
        current++;
        date.setDate(date.getDate() - 1);
        dateStr = date.toISOString().split('T')[0];
      }
    }
    // If no activity today, but there was yesterday, count from yesterday
    else if (activeDays.has(yesterdayStr)) {
      current = 1;
      
      // Count streak backward from day before yesterday
      let date = new Date(yesterdayIST);
      date.setDate(date.getDate() - 1);
      let dateStr = date.toISOString().split('T')[0];
      
      while (activeDays.has(dateStr)) {
        current++;
        date.setDate(date.getDate() - 1);
        dateStr = date.toISOString().split('T')[0];
      }
    }
    // No activity today or yesterday means no current streak
    else {
      current = 0;
      console.log("No activity today or yesterday - current streak is 0");
    }
    
    // Calculate max streak
    let max = 0;
    let currentStreak = 0;
    
    // Sort dates by ascending order (oldest first)
    const dates = Array.from(activeDays.keys()).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );
    
    if (dates.length > 0) {
      let prevDate = new Date(dates[0]);
      currentStreak = 1; // Start with the first day
      
      // Check each active day
      for (let i = 1; i < dates.length; i++) {
        const currentDate = new Date(dates[i]);
        const dayDiff = Math.round(
          (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // If consecutive days
        if (dayDiff === 1) {
          currentStreak++;
        } 
        // If there's a gap, reset streak
        else {
          max = Math.max(max, currentStreak);
          currentStreak = 1;
        }
        
        // Update previous date
        prevDate = currentDate;
      }
      
      // Don't forget to check the last streak
      max = Math.max(max, currentStreak);
    }
    
    // Debug logging
    console.log(`Platform: ${platform}, Current streak: ${current}, Max streak: ${max}`);
    console.log("Active days:", Array.from(activeDays.keys()).sort());
    
    return { current, max };
  };
  
  // Generate empty data as fallback
  const generateEmptyData = () => {
    const emptyData = [];
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 364); // Last 365 days
    
    for (let i = 0; i < 365; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      emptyData.push({
        date: date.toISOString().split('T')[0],
        count: 0
      });
    }
    
    return emptyData;
  };
  
  // Calculate the date range for the heatmap
  const getDateRange = () => {
    // End date should be today (not future dates)
    const endDate = new Date();
    
    // For GitHub, we need to use 12 PM IST
    if (platform === "github") {
      // 12 PM IST = UTC+5:30, so 6:30 AM UTC
      endDate.setHours(6, 30, 0, 0); // 12 PM IST for GitHub
    } else {
      endDate.setHours(0, 0, 0, 0); // Midnight for LeetCode
    }
    
    // Start date is 364 days before today (365 days total including today)
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 364);
    
    console.log(`${platform} date range:`, { startDate, endDate });
    return { startDate, endDate };
  };
  
  // Format data for the calendar heatmap - only include days with actual contributions
  const formatHeatmapData = () => {
    // Create a map of all dates in the desired range
    const { startDate, endDate } = getDateRange();
    const dateMap = new Map();
    
    // Fill with all possible dates, but only up to today
    const currentDate = new Date(startDate);
    const today = new Date();
    
    // For GitHub, we need to use 12 PM IST
    if (platform === "github") {
      // 12 PM IST = UTC+5:30, so 6:30 AM UTC
      today.setHours(6, 30, 0, 0); // 12 PM IST for GitHub
    } else {
      today.setHours(0, 0, 0, 0); // Midnight for LeetCode
    }
    
    while (currentDate <= endDate && currentDate <= today) {
      const dateString = currentDate.toISOString().split('T')[0];
      // Only set value if it will be visible in the heatmap
      dateMap.set(dateString, null); // Use null instead of {date, count:0}
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Add only actual data with non-zero counts
    data.forEach(item => {
      if (dateMap.has(item.date) && item.count > 0) {
        dateMap.set(item.date, { date: item.date, count: item.count });
      }
    });
    
    // Convert map back to array, filtering out null values
    return Array.from(dateMap.entries())
      .map(([date, value]) => value || { date, count: 0 });
  };
  
  // Get color scale based on platform
  const getColorScale = (count) => {
    if (platform === "github") {
      if (count === 0) return "color-empty";
      if (count < 3) return "color-github-1";
      if (count < 5) return "color-github-2";
      if (count < 8) return "color-github-3";
      return "color-github-4";
    } else {
      if (count === 0) return "color-empty";
      if (count < 3) return "color-leetcode-1";
      if (count < 5) return "color-leetcode-2";
      if (count < 8) return "color-leetcode-3";
      return "color-leetcode-4";
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      weekday: 'long' as const, 
      year: 'numeric' as const, 
      month: 'long' as const, 
      day: 'numeric' as const 
    };
    return date.toLocaleDateString(undefined, options);
  };
  
  const tooltipDataAttrs = (value) => {
    if (!value || !value.date) return null;
    
    const activityName = platform === "github" ? "contribution" : "submission";
    return {
      'data-tooltip-id': 'calendar-tooltip',
      'data-tooltip-content': `${formatDate(value.date)}: ${value.count} ${value.count === 1 ? activityName : activityName + 's'}`
    };
  };
  
  // Add CSS to your global styles or directly here
  const heatmapStyles = `
    .react-calendar-heatmap .color-empty { fill: var(--background-muted, #f0f0f0); }
    
    .react-calendar-heatmap .color-github-1 { fill: #c6e48b; }
    .react-calendar-heatmap .color-github-2 { fill: #7bc96f; }
    .react-calendar-heatmap .color-github-3 { fill: #239a3b; }
    .react-calendar-heatmap .color-github-4 { fill: #196127; }
    
    .react-calendar-heatmap .color-leetcode-1 { fill: #ffb380; }
    .react-calendar-heatmap .color-leetcode-2 { fill: #ff9248; }
    .react-calendar-heatmap .color-leetcode-3 { fill: #ff7216; }
    .react-calendar-heatmap .color-leetcode-4 { fill: #e65c00; }
    
    .dark .react-calendar-heatmap .color-empty { fill: var(--background-dark-muted, #333); }
    
    .dark .react-calendar-heatmap .color-github-1 { fill: #0e4429; }
    .dark .react-calendar-heatmap .color-github-2 { fill: #006d32; }
    .dark .react-calendar-heatmap .color-github-3 { fill: #26a641; }
    .dark .react-calendar-heatmap .color-github-4 { fill: #39d353; }
    
    .dark .react-calendar-heatmap .color-leetcode-1 { fill: #7a3500; }
    .dark .react-calendar-heatmap .color-leetcode-2 { fill: #a84b00; }
    .dark .react-calendar-heatmap .color-leetcode-3 { fill: #d16200; }
    .dark .react-calendar-heatmap .color-leetcode-4 { fill: #ff8534; }
  `;
  
  // Add this function to detect dark mode
  const isDarkMode = () => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || 
             window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  };
  
  const saveUsername = async () => {
    if (!tempUsername.trim()) {
      toast({
        title: `${platform === 'github' ? 'GitHub' : 'LeetCode'} Username Required`,
        description: "Please enter a valid username",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Extract username if a URL was pasted
      let finalUsername = tempUsername.trim();
      
      if (platform === 'github' && finalUsername.includes('github.com/')) {
        try {
          const url = new URL(finalUsername.includes('http') ? finalUsername : `https://${finalUsername}`);
          const pathParts = url.pathname.split('/').filter(Boolean);
          if (pathParts.length > 0) {
            finalUsername = pathParts[0];
          }
        } catch (error) {
          // Not a valid URL, keep as is
        }
      } else if (platform === 'leetcode' && finalUsername.includes('leetcode.com/')) {
        try {
          const url = new URL(finalUsername.includes('http') ? finalUsername : `https://${finalUsername}`);
          const pathParts = url.pathname.split('/').filter(Boolean);
          
          if (pathParts.length > 0) {
            if (pathParts[0] === 'u' && pathParts.length > 1) {
              finalUsername = pathParts[1];
            } else {
              finalUsername = pathParts[0];
            }
          }
        } catch (error) {
          // Not a valid URL, keep as is
        }
      }
      
      // Save to localStorage
      localStorage.setItem(`${platform}-username`, finalUsername);
      
      // Update state
      setUsername(finalUsername);
      setTempUsername("");
      
      // Trigger storage event for other components
      window.dispatchEvent(new Event('storage'));
      
      toast({
        title: `${platform === 'github' ? 'GitHub' : 'LeetCode'} Username Saved`,
        description: `Your ${platform} username has been saved and data will be loaded.`,
      });
      
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "There was an error saving your username. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return <Skeleton className="w-full h-32" />;
  }
  
  if (error && !username) {
    return (
      <Card className="w-full">
        {/* <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Set up {platform === 'github' ? 'GitHub' : 'LeetCode'} Integration
          </CardTitle>
        </CardHeader> */}
        <CardContent className="space-y-4 p-4">
          <p className="text-sm text-muted-foreground">
            Enter your {platform === 'github' ? 'GitHub' : 'LeetCode'} username to start tracking your activity.
          </p>
          
          <div className="space-y-2">
            <Label htmlFor={`${platform}-username-input`}>
              {platform === 'github' ? 'GitHub' : 'LeetCode'} Username
            </Label>
            <Input
              id={`${platform}-username-input`}
              placeholder={platform === 'github' 
                ? "Enter your GitHub username or profile URL"
                : "Enter your LeetCode username or profile URL"
              }
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  saveUsername();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              {platform === 'github' 
                ? 'Example: "username" or "https://github.com/username"'
                : 'Example: "username" or "https://leetcode.com/username"'
              }
            </p>
          </div>
          
          <div className="flex justify-between items-center">
            <Button onClick={saveUsername} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Username"}
            </Button>
            
            <Link to="/settings" className="text-sm text-muted-foreground hover:text-primary underline">
              Or configure in Settings
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const { startDate, endDate } = getDateRange();
  
  return (
    <div className={cn("", className)}>
      {error && (
        <div className="text-sm text-red-500 mb-2">{error}</div>
      )}
      
      <style>{heatmapStyles}</style>
      
      <ReactCalendarHeatmap
        startDate={startDate}
        endDate={endDate}
        values={formatHeatmapData()}
        classForValue={(value) => {
          if (!value) return "color-empty";
          return getColorScale(value.count);
        }}
        tooltipDataAttrs={tooltipDataAttrs}
        showWeekdayLabels={true}
        titleForValue={(value) => value ? `${value.count} on ${value.date}` : '0'}
        monthLabels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
      />
      
      <ReactTooltip id="calendar-tooltip" />
      
      {/* Footer with streaks and color legend */}
      <div className="flex flex-wrap justify-between items-center mt-2">
        {/* Streak information */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Flame className="h-4 w-4 text-orange-500 mr-1" />
            <span className="text-sm font-medium">Current: {currentStreak} day{currentStreak !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center">
            <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
            <span className="text-sm font-medium">Max: {maxStreak} day{maxStreak !== 1 ? 's' : ''}</span>
          </div>
        </div>
        
        {/* Color legend */}
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="mr-1">More</span>
          
          {/* Empty color */}
          <div className="w-3 h-3 rounded-sm" 
               style={{ 
                 backgroundColor: isDarkMode() ? "#333" : "#ebedf0", 
                 border: `1px solid ${isDarkMode() ? "#444" : "#d0d7de"}` 
               }} />
          
          {/* Level 1 color */}
          <div className="w-3 h-3 rounded-sm ml-1" 
               style={{ 
                 backgroundColor: platform === "github" 
                   ? (isDarkMode() ? "#0e4429" : "#c6e48b") 
                   : (isDarkMode() ? "#7a3500" : "#ffb380") 
               }} />
          
          {/* Level 2 color */}
          <div className="w-3 h-3 rounded-sm ml-1" 
               style={{ 
                 backgroundColor: platform === "github" 
                   ? (isDarkMode() ? "#006d32" : "#7bc96f") 
                   : (isDarkMode() ? "#a84b00" : "#ff9248") 
               }} />
          
          {/* Level 3 color */}
          <div className="w-3 h-3 rounded-sm ml-1" 
               style={{ 
                 backgroundColor: platform === "github" 
                   ? (isDarkMode() ? "#26a641" : "#239a3b") 
                   : (isDarkMode() ? "#d16200" : "#ff7216") 
               }} />
          
          {/* Level 4 color */}
          <div className="w-3 h-3 rounded-sm ml-1" 
               style={{ 
                 backgroundColor: platform === "github" 
                   ? (isDarkMode() ? "#39d353" : "#196127") 
                   : (isDarkMode() ? "#ff8534" : "#e65c00") 
               }} />
          
          <span className="ml-1">Less</span>
        </div>
      </div>
    </div>
  );
} 