import { useEffect, useState } from "react";
import { getLeetcodeData } from "@/utils/api/leetcode";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface LeetCodeStatsWidgetProps {
  className?: string;
}

export function LeetCodeStatsWidget({ className }: LeetCodeStatsWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function loadStats() {
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
    }

    loadStats();
  }, [toast]);

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