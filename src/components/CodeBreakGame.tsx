import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Brain, Trophy, RefreshCw } from 'lucide-react';

const CodeBreakGame = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [puzzle, setPuzzle] = useState<{ question: string, solution: string }>({ question: "", solution: "" });
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  
  // Load best score from localStorage
  useEffect(() => {
    const savedBestScore = localStorage.getItem('codebreak-best-score');
    if (savedBestScore) {
      setBestScore(parseInt(savedBestScore));
    }
  }, []);
  
  // Timer countdown when game is active
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isPlaying) {
      endGame(false);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, timeLeft]);
  
  // Generate puzzles
  const puzzles = [
    { 
      question: "Decode: 01100011 01101111 01100100 01100101", 
      solution: "code" 
    },
    { 
      question: "Fix: console.log('Hello, Wrld!');", 
      solution: "World" 
    },
    { 
      question: "What CSS property creates rounded corners?", 
      solution: "border-radius" 
    },
    { 
      question: "In programming, what does API stand for?", 
      solution: "Application Programming Interface" 
    },
    { 
      question: "Which is NOT a JavaScript framework: Vue, Angular, Django, React?", 
      solution: "Django" 
    },
    { 
      question: "Complete: const x = y => { return y * ___ }", 
      solution: "2" 
    },
    { 
      question: "What HTML tag creates a line break?", 
      solution: "br" 
    },
    { 
      question: "What symbol is used for comments in Python?", 
      solution: "#" 
    }
  ];
  
  // Start a new game
  const startGame = () => {
    const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
    setPuzzle(randomPuzzle);
    setIsPlaying(true);
    setAnswer("");
    setAttempts(0);
    setTimeLeft(30);
  };
  
  // End the current game
  const endGame = (success: boolean) => {
    setIsPlaying(false);
    
    if (success) {
      // Calculate score based on time left and attempts
      const score = Math.max(10, Math.round(timeLeft * 3 - attempts * 5));
      
      // Update best score if needed
      if (bestScore === null || score > bestScore) {
        setBestScore(score);
        localStorage.setItem('codebreak-best-score', score.toString());
        toast({
          title: "New High Score!",
          description: `You scored ${score} points!`,
        });
      } else {
        toast({
          title: "Good job!",
          description: `You scored ${score} points.`,
        });
      }
    } else {
      toast({
        title: "Time's up!",
        description: "Better luck next time!",
        variant: "destructive"
      });
    }
  };
  
  // Handle answer submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    setAttempts(prev => prev + 1);
    
    // Check if answer is correct (case insensitive)
    if (answer.trim().toLowerCase() === puzzle.solution.toLowerCase()) {
      endGame(true);
    } else {
      toast({
        title: "Try again!",
        description: "That's not quite right.",
        variant: "destructive"
      });
    }
  };
  
  // Toggle visibility of the game
  const [isVisible, setIsVisible] = useState(true);
  
  if (!isVisible) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="mb-4" 
        onClick={() => setIsVisible(true)}
      >
        <Brain className="w-4 h-4 mr-2" /> Show Code Challenge
      </Button>
    );
  }
  
  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            <CardTitle className="text-lg">Quick Code Challenge</CardTitle>
          </div>
          {bestScore !== null && (
            <div className="flex items-center">
              <Trophy className="w-4 h-4 text-yellow-500 mr-1" />
              <Badge variant="outline" className="font-semibold">Best: {bestScore}</Badge>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={() => setIsVisible(false)}
          >
            ×
          </Button>
        </div>
        <CardDescription>
          Take a quick coding break before browsing contests
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isPlaying ? (
          <div className="flex justify-center py-4">
            <Button onClick={startGame}>
              <Brain className="w-4 h-4 mr-2" /> Start Challenge
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 bg-muted rounded-md">
              <p className="font-mono text-sm">{puzzle.question}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Your answer..."
                className="flex-1"
                autoFocus
              />
              <Button type="submit">Submit</Button>
            </div>
            
            <div className="flex justify-between text-sm">
              <div>
                Attempts: <span className="font-semibold">{attempts}</span>
              </div>
              <div className={timeLeft < 10 ? "text-red-500 font-semibold" : ""}>
                Time: <span className="font-semibold">{timeLeft}s</span>
              </div>
            </div>
          </form>
        )}
      </CardContent>
      {isPlaying && (
        <CardFooter className="pt-0 justify-center">
          <Button variant="ghost" size="sm" onClick={() => endGame(false)}>
            Give Up
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default CodeBreakGame; 