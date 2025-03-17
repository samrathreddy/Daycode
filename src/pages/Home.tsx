import React, { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarHeatmap } from "@/components/ui/calendar-heatmap";
import { ActivityHistory } from "@/components/ui/activity-history";
import { ProblemOfTheDay } from "@/components/ui/problem-of-the-day";
import { LeetCodeStatsWidget } from "@/components/widgets/LeetCodeStatsWidget";
import { Plus, Calendar, CheckCircle, Circle, ChevronDown, ChevronRight, Clock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatInTimeZone } from 'date-fns-tz';
import { isValid } from 'date-fns';
import { Link } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Timezone constant for IST
const IST_TIMEZONE = 'Asia/Kolkata';

// Format date to IST string
const formatISTDate = (date: Date | number | string): string => {
  try {
    return formatInTimeZone(new Date(date), IST_TIMEZONE, 'MMM d, yyyy h:mm a');
  } catch (error) {
    console.error("Date formatting error:", error);
    return "Invalid date";
  }
};

// Task interface definition
interface Task {
  id: string;
  title: string;
  description: string;
  link?: string;
  datetime?: string;
  status: "todo" | "in_progress" | "completed";
  tags: string[];
  reminderSet?: boolean;
  createdAt: number;
  reminderTime?: number;
}

// TodoTasksWidget component to display TO-DO tasks
const TodoTasksWidget = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [visibleTasks, setVisibleTasks] = useState<number>(3); // Initial number of tasks to show
  const [activeTab, setActiveTab] = useState<'todo' | 'in_progress'>('todo');
  const taskContainerRef = useRef<HTMLDivElement>(null);

  // Load tasks from localStorage on component mount
  useEffect(() => {
    loadTasks();
  }, [activeTab]);

  const loadTasks = () => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      const allTasks = JSON.parse(savedTasks);
      // Filter tasks based on active tab
      const filteredTasks = allTasks.filter(task => task.status === activeTab);
      
      // Sort tasks by due date (earliest first)
      const sortedTasks = sortTasksByDueDate(filteredTasks);
      setTasks(sortedTasks);
    }
  };

  // Function to sort tasks by due date, prioritizing tasks with due dates
  const sortTasksByDueDate = (taskList: Task[]): Task[] => {
    return [...taskList].sort((a, b) => {
      // First check if both have due dates
      if (a.datetime && b.datetime) {
        const dateA = new Date(a.datetime);
        const dateB = new Date(b.datetime);
        if (isValid(dateA) && isValid(dateB)) {
          return dateA.getTime() - dateB.getTime(); // Earliest first
        }
      }
      // If only one has a due date, prioritize it
      if (a.datetime && !b.datetime) return -1;
      if (!a.datetime && b.datetime) return 1;
      
      // If neither has a due date, sort by created date (newest first)
      return b.createdAt - a.createdAt;
    });
  };

  // Toggle task expansion
  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  // Load more tasks when user scrolls or clicks "Load More"
  const loadMoreTasks = () => {
    setVisibleTasks(prev => prev + 3);
  };

  // Handle status change
  const handleStatusChange = (taskId: string, newStatus: 'todo' | 'in_progress' | 'completed') => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      const allTasks = JSON.parse(savedTasks);
      const updatedTasks = allTasks.map(task => 
        task.id === taskId ? {...task, status: newStatus} : task
      );
      
      localStorage.setItem('tasks', JSON.stringify(updatedTasks));
      loadTasks(); // Reload tasks to reflect changes
    }
  };

  // Check if there are more tasks to load
  const hasMoreTasks = tasks.length > visibleTasks;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Your Tasks</CardTitle>
          <CardDescription>Manage your upcoming work</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-muted p-1 rounded-md flex">
            <button 
              className={`px-3 py-1 text-sm font-medium rounded-sm ${
                activeTab === 'todo' 
                  ? 'bg-background shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('todo')}
            >
              To-Do
            </button>
            <button 
              className={`px-3 py-1 text-sm font-medium rounded-sm ${
                activeTab === 'in_progress' 
                  ? 'bg-background shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('in_progress')}
            >
              In Progress
            </button>
          </div>
          <Link to="/tasks">
            <Button size="sm" variant="outline">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {tasks.length > 0 ? (
          <>
            <div 
              className="space-y-3 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin" 
              ref={taskContainerRef}
            >
              {tasks.slice(0, visibleTasks).map((task) => (
                <Collapsible
                  key={task.id}
                  open={expandedTaskId === task.id}
                  onOpenChange={() => toggleTaskExpansion(task.id)}
                >
                  <div
                    className="p-4 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      {activeTab === 'todo' ? (
                        <Circle 
                          className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0 hover:text-green-500 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(task.id, 'in_progress');
                          }}
                          aria-label="Mark as In Progress"
                        />
                      ) : (
                        <div className="relative cursor-pointer" onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(task.id, 'completed');
                        }}>
                          <Circle className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
                          <div className="absolute inset-0 flex items-center justify-center mt-1">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          </div>
                          <span className="sr-only">Mark as Completed</span>
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium line-clamp-1">{task.title}</h3>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              {expandedTaskId === task.id ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                        
                        {task.datetime && (
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatISTDate(task.datetime)}
                          </div>
                        )}
                        
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {task.description}
                        </p>
                      </div>
                    </div>
                    
                    <CollapsibleContent>
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground mb-3">
                          {task.description}
                        </p>
                        
                        {task.link && (
                          <a 
                            href={task.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:text-blue-700 hover:underline flex items-center gap-1 mb-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="line-clamp-1 overflow-ellipsis">{task.link}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                        )}
                        
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {task.tags.map((tag) => (
                              <span 
                                key={tag}
                                className="text-xs bg-muted px-2 py-1 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex justify-between">
                          <div className="space-x-2">
                            {activeTab === 'todo' ? (
                              <Button 
                                size="sm" 
                                variant="secondary" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(task.id, 'in_progress');
                                }}
                              >
                                Start Task
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="secondary" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(task.id, 'completed');
                                }}
                              >
                                Complete
                              </Button>
                            )}
                          </div>
                          <Link to={`/tasks`}>
                            <Button size="sm" variant="outline">
                              View in Tasks
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
            
            {/* Load more button */}
            {hasMoreTasks && (
              <div className="text-center mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadMoreTasks}
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p>No {activeTab === 'todo' ? 'TO-DO' : 'In Progress'} Tasks</p>
            <Link to="/tasks" className="mt-4 inline-block">
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function Home() {
  // State to track enabled platforms
  const [githubEnabled, setGithubEnabled] = useState(localStorage.getItem('github-enabled') !== 'false');
  const [leetcodeEnabled, setLeetcodeEnabled] = useState(localStorage.getItem('leetcode-enabled') !== 'false');

  // Listen for changes in settings
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'github-enabled') {
        setGithubEnabled(e.newValue !== 'false');
      } else if (e.key === 'leetcode-enabled') {
        setLeetcodeEnabled(e.newValue !== 'false');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Show heatmap section if either GitHub or LeetCode is enabled
  const showHeatmapSection = githubEnabled || leetcodeEnabled;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>
      
      {showHeatmapSection && (
        <div className={cn(
          "grid gap-6 mb-8",
          // If both enabled -> 2 columns, if one enabled -> 1 column
          githubEnabled && leetcodeEnabled ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
        )}>
          {/* LeetCode Heatmap */}
          {leetcodeEnabled && (
            <Card className={cn(
              // If only LeetCode is enabled, center it
              !githubEnabled && "max-w-3xl mx-auto w-full"
            )}>
              <CardHeader>
                <CardTitle>LeetCode Activity</CardTitle>
                <CardDescription>Your coding progress on LeetCode</CardDescription>
              </CardHeader>
              <CardContent>
                <CalendarHeatmap platform="leetcode" />
              </CardContent>
            </Card>
          )}
          
          {/* GitHub Heatmap */}
          {githubEnabled && (
            <Card className={cn(
              // If only GitHub is enabled, center it
              !leetcodeEnabled && "max-w-3xl mx-auto w-full"
            )}>
              <CardHeader>
                <CardTitle>GitHub Contributions</CardTitle>
                <CardDescription>Your GitHub activity</CardDescription>
              </CardHeader>
              <CardContent>
                <CalendarHeatmap platform="github" />
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Problem of the Day with LeetCode Stats */}
        <Card className="lg:col-span-1 h-auto">
          <CardHeader className="pb-2">
            <CardTitle>LeetCode Problem of the Day</CardTitle>
            <CardDescription>Daily coding challenge</CardDescription>
          </CardHeader>
          <CardContent>
            <ProblemOfTheDay />
            {leetcodeEnabled && (
              <>
                <div className="mt-6 mb-2 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Your LeetCode Progress</h4>
                  <LeetCodeStatsWidget />
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Activity History */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent LeetCode and GitHub activity</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityHistory />
          </CardContent>
        </Card>
      </div>
      
      {/* TO-DO Tasks Widget */}
      <TodoTasksWidget />
    </div>
  );
} 