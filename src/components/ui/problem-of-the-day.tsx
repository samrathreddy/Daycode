import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Code, AlertCircle } from "lucide-react";
import { fetchProblemOfTheDay } from "@/utils/api/leetcode";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ProblemOfTheDay() {
  const [problem, setProblem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPotdEnabled, setIsPotdEnabled] = useState(
    localStorage.getItem('leetcode-potd') !== 'false'
  );

  useEffect(() => {
    // Listen for changes to the leetcode-potd setting
    const handleStorageChange = (e) => {
      if (e.key === 'leetcode-potd') {
        setIsPotdEnabled(e.newValue !== 'false');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (!isPotdEnabled) {
      setIsLoading(false);
      return;
    }
    
    async function loadProblemOfTheDay() {
      setIsLoading(true);
      try {
        const data = await fetchProblemOfTheDay();
        if (data) {
          setProblem(data);
        } else {
          setError("Unable to fetch today's problem");
        }
      } catch (err) {
        console.error("Error fetching problem of the day:", err);
        setError("Unable to fetch today's problem");
      } finally {
        setIsLoading(false);
      }
    }
    
    loadProblemOfTheDay();
  }, [isPotdEnabled]);

  const difficultyColor = {
    Easy: "bg-green-500",
    Medium: "bg-yellow-500",
    Hard: "bg-red-500"
  };

  if (!isPotdEnabled) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Problem of the Day is disabled. Enable it in Settings.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-20 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  
  if (!problem) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Problem of the Day is not available. Try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium">{problem.title}</h3>
          <Badge className={difficultyColor[problem.difficulty]}>
            {problem.difficulty}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">
          Acceptance: {problem.acceptanceRate}
        </span>
      </div>
      
      <p className="text-sm text-muted-foreground">
        {problem.description}
      </p>
      
      <div className="flex items-center flex-wrap gap-1 mb-1">
        {problem.tags.map(tag => (
          <Badge key={tag} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>
      
      <Button variant="outline" className="w-full" asChild>
        <a 
          href={problem.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center"
        >
          <Code className="h-4 w-4 mr-2" />
          Solve Problem
          <ExternalLink className="h-3 w-3 ml-1" />
        </a>
      </Button>
    </div>
  );
} 