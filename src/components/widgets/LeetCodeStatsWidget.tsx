import { useEffect, useState } from "react";
import { getLeetcodeData } from "@/utils/api/leetcode";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface LeetCodeStatsWidgetProps {
  className?: string;
}

export function LeetCodeStatsWidget({ className }: LeetCodeStatsWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const { toast } = useToast();
  
  // State for inline username input
  const [tempUsername, setTempUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [username, setUsername] = useState<string | null>(localStorage.getItem('leetcode-username'));

  const saveUsername = async () => {
    if (!tempUsername.trim()) {
      toast({
        title: "LeetCode Username Required",
        description: "Please enter a valid username",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Extract username if a URL was pasted
      let finalUsername = tempUsername.trim();
      
      if (finalUsername.includes('leetcode.com/')) {
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
      localStorage.setItem('leetcode-username', finalUsername);
      
      // Update state
      setUsername(finalUsername);
      setTempUsername("");
      
      // Trigger storage event for other components
      window.dispatchEvent(new Event('storage'));
      
      toast({
        title: "LeetCode Username Saved",
        description: "Your LeetCode username has been saved and data will be loaded.",
      });
      
      // Reload stats with new username
      loadStats();
      
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

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await getLeetcodeData();
      setStats(data);
    } catch (error) {
      console.error("Error loading LeetCode stats:", error);
      toast({
        title: "Error",
        description: "Failed to load LeetCode statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    
    // Listen for username changes
    const handleStorageChange = (e) => {
      if (e.key === 'leetcode-username') {
        const newUsername = e.newValue;
        setUsername(newUsername);
        if (newUsername) {
          loadStats();
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (loading) {
    return (
      <div className={cn("space-y-3 mt-4", className)}>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (!stats && !username) {
    return (
      <div className={cn("space-y-4 mt-4", className)}>
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">Setup Required</span>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Enter your LeetCode username to view your progress.
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="leetcode-username-widget" className="text-xs">
              LeetCode Username
            </Label>
            <Input
              id="leetcode-username-widget"
              placeholder="Enter username or profile URL"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  saveUsername();
                }
              }}
              className="text-sm h-8"
            />
          </div>
          
          <div className="flex justify-between items-center">
            <Button size="sm" onClick={saveUsername} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
            
            <Link to="/settings" className="text-xs text-muted-foreground hover:text-primary underline">
              Settings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={cn("space-y-3 mt-4", className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Total</span>
        <span className="text-sm font-medium">
          {stats.solvedCounts.total} / {stats.problemCounts.total}
        </span>
      </div>
      <Progress 
        value={(stats.solvedCounts.total / stats.problemCounts.total) * 100} 
        className="h-1.5 bg-muted"
      />
      
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-green-500">Easy</span>
        <span className="text-sm font-medium">
          {stats.solvedCounts.easy} / {stats.problemCounts.easy}
        </span>
      </div>
      <Progress 
        value={(stats.solvedCounts.easy / stats.problemCounts.easy) * 100} 
        className="h-1.5 bg-muted"
        indicatorClassName="bg-green-500"
      />
      
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-yellow-500">Medium</span>
        <span className="text-sm font-medium">
          {stats.solvedCounts.medium} / {stats.problemCounts.medium}
        </span>
      </div>
      <Progress 
        value={(stats.solvedCounts.medium / stats.problemCounts.medium) * 100} 
        className="h-1.5 bg-muted"
        indicatorClassName="bg-yellow-500"
      />
      
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-red-500">Hard</span>
        <span className="text-sm font-medium">
          {stats.solvedCounts.hard} / {stats.problemCounts.hard}
        </span>
      </div>
      <Progress 
        value={(stats.solvedCounts.hard / stats.problemCounts.hard) * 100} 
        className="h-1.5 bg-muted"
        indicatorClassName="bg-red-500"
      />
    </div>
  );
} 