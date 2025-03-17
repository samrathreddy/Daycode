import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Calendar,
  Link as LinkIcon,
  Clock,
  CheckCircle2,
  Circle,
  CalendarPlus,
  Tag as TagIcon,
  ExternalLink,
  Edit,
  Trash2,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, isValid } from "date-fns";
import { formatInTimeZone } from 'date-fns-tz';
import { toast } from "@/components/ui/use-toast";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Timezone constant for IST
const IST_TIMEZONE = 'Asia/Kolkata';

// Update the utility functions to use the correct API
const toISTTime = (date: Date | number | string): Date => {
  return new Date(date);  // Just use the native Date as we'll format with timezone
};

// Format date to IST string
const formatISTDate = (date: Date | number | string): string => {
  try {
    return formatInTimeZone(new Date(date), IST_TIMEZONE, 'MMM d, yyyy h:mm a');
  } catch (error) {
    console.error("Date formatting error:", error);
    return "Invalid date";
  }
};

// Task status types
type TaskStatus = "todo" | "in_progress" | "completed";
type SortOption = "title" | "date" | "status" | "due";
type SortDirection = "asc" | "desc";

interface Task {
  id: string;
  title: string;
  description: string;
  link?: string;
  datetime?: string;
  status: TaskStatus;
  tags: string[];
  reminderSet?: boolean;
  createdAt: number; // timestamp
  reminderTime?: number; // minutes before event
}

interface SortConfig {
  field: SortOption;
  direction: SortDirection;
}

interface EditingTask extends Partial<Task> {
  editingTags?: string[];
}

interface TaskSectionProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  taskCount: number;
  onDragEnd: (result: any) => void;
  onTaskClick: (task: Task) => void;
  onToggleStatus: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onSetReminder: (task: Task) => void;
  getStatusIcon: (status: TaskStatus) => JSX.Element;
  getStatusColor: (status: TaskStatus) => string;
  sortConfig: SortConfig;
  onSortChange: (field: SortOption) => void;
}

// New TaskSection component for collapsible sections
const TaskSection = ({ 
  title, 
  status, 
  tasks, 
  taskCount,
  onDragEnd, 
  onTaskClick, 
  onToggleStatus, 
  onDeleteTask, 
  onSetReminder,
  getStatusIcon,
  getStatusColor,
  sortConfig,
  onSortChange
}: TaskSectionProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full mb-6">
      <div className="flex items-center">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="flex-shrink-0 p-0 h-auto">
            {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </Button>
        </CollapsibleTrigger>
        <h2 className="text-xl font-semibold ml-2 flex-shrink-0 flex items-center">
          {title} 
          <span className="ml-2 text-sm text-muted-foreground font-normal">({taskCount})</span>
        </h2>
        <div className="ml-4 h-[1px] bg-border flex-grow"></div>
        
        {/* Section-specific sort control */}
        <div className="ml-4 flex-shrink-0">
          <Select 
            value={`${sortConfig.field}-${sortConfig.direction}`}
            onValueChange={(value) => {
              const [field] = value.split('-') as [SortOption, SortDirection];
              onSortChange(field);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="title-asc">Title A-Z</SelectItem>
              <SelectItem value="title-desc">Title Z-A</SelectItem>
              <SelectItem value="due-asc">Due Date (Earliest)</SelectItem>
              <SelectItem value="due-desc">Due Date (Latest)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <CollapsibleContent className="mt-4">
        <Droppable droppableId={status}>
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {tasks.map((task, index) => (
                <Draggable 
                  key={`${task.id}-${status}`} 
                  draggableId={task.id} 
                  index={index}
                >
                  {(provided) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="hover:shadow-lg transition-shadow flex flex-col cursor-pointer"
                      onClick={() => onTaskClick(task)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleStatus(task.id);
                                }}
                                className="hover:opacity-80 transition-opacity"
                              >
                                {getStatusIcon(task.status)}
                              </button>
                              <span className="line-clamp-1">{task.title}</span>
                            </CardTitle>
                            {task.link && (
                              <a 
                                href={task.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:text-blue-700 hover:underline flex items-center mt-1 gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <LinkIcon className="h-3 w-3" />
                                <span className="line-clamp-1 overflow-ellipsis">{task.link}</span>
                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                              </a>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onDeleteTask(task.id);
                              }}
                              className="hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="flex-1 pt-2">
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                          {task.description}
                        </p>
                        
                        {task.datetime && (
                          <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-4">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                {formatISTDate(task.datetime)}
                              </span>
                            </div>
                            <div className="flex items-center">
                              {/* For todo tasks, always show "Set Reminder" regardless of reminder status */}
                              {task.status === 'todo' || !task.reminderSet ? (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSetReminder(task);
                                  }}
                                  className="h-8 px-2 text-xs"
                                >
                                  <CalendarPlus className="h-3 w-3 mr-1" />
                                  Set Reminder
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSetReminder(task);
                                  }}
                                >
                                  <Calendar className="h-3 w-3 mr-1" />
                                  View Reminder
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex flex-col gap-2 mt-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(task.status)}>
                              {task.status.toUpperCase()}
                            </Badge>
                          </div>
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {task.tags.map((tag) => (
                                <Badge 
                                  key={tag}
                                  variant="outline"
                                  className="flex items-center gap-1 text-xs py-0 h-5"
                                >
                                  <TagIcon className="h-3 w-3" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              {tasks.length === 0 && (
                <div className="col-span-full text-center p-6 text-muted-foreground">
                  No tasks in this section. Drag tasks here or add a new task.
                </div>
              )}
            </div>
          )}
        </Droppable>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem('tasks');
    const defaultTasks = [
      {
        id: "1",
        title: "Complete Two Sum Problem",
        description: "Solve the Two Sum problem on LeetCode to practice array manipulation and hash tables.",
        link: "https://leetcode.com/problems/two-sum/",
        datetime: "2024-03-01T14:00:00",
        status: "todo",
        tags: ["LeetCode", "Arrays", "Easy"],
        reminderSet: false,
        createdAt: Date.now()
      },
      {
        id: "2",
        title: "Update Portfolio Website",
        description: "Add recent projects and update the skills section with new technologies learned.",
        link: "https://github.com/yourusername/portfolio",
        datetime: "2024-03-15T18:00:00",
        status: "in_progress",
        tags: ["Portfolio", "React", "Personal"],
        reminderSet: true,
        createdAt: Date.now() - 1000
      }
    ];

    // If tasks exist in localStorage, use those; otherwise use default tasks
    const parsedTasks = savedTasks ? JSON.parse(savedTasks) : defaultTasks;
    
    // Sort tasks by due date and status on initial load
    return sortTasksByDueDate(parsedTasks);
  });

  // Function to sort tasks by due date, prioritizing tasks with due dates
  function sortTasksByDueDate(taskList: Task[]): Task[] {
    return [...taskList].sort((a, b) => {
      // First check if both have due dates
      if (a.datetime && b.datetime) {
        const dateA = new Date(a.datetime);
        const dateB = new Date(b.datetime);
        if (isValid(dateA) && isValid(dateB)) {
          return dateA.getTime() - dateB.getTime();
        }
      }
      // If only one has a due date, prioritize it
      if (a.datetime && !b.datetime) return -1;
      if (!a.datetime && b.datetime) return 1;
      
      // If neither has a due date, sort by created date
      return b.createdAt - a.createdAt;
    });
  }

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: "date", direction: "desc" });
  
  // New task form state
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: "",
    description: "",
    link: "",
    datetime: "",
    status: "todo",
    tags: []
  });
  const [newTagInput, setNewTagInput] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [editingTask, setEditingTask] = useState<EditingTask | null>(null);
  const [editTagInput, setEditTagInput] = useState("");
  const [allTags, setAllTags] = useState<Set<string>>(() => {
    const savedTasks = localStorage.getItem('tasks');
    if (!savedTasks) return new Set();
    const tasks = JSON.parse(savedTasks);
    return new Set(tasks.flatMap(task => task.tags).map(tag => tag.toLowerCase()));
  });
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Update allTags when tasks change
  useEffect(() => {
    const newTags = new Set(tasks.flatMap(task => task.tags).map(tag => tag.toLowerCase()));
    setAllTags(newTags);
  }, [tasks]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const sourceId = result.source.droppableId;
    const destId = result.destination.droppableId;
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    
    // Create a deep copy of all tasks to avoid reference issues
    const allTasks = [...tasks];
    
    // If moved within the same section
    if (sourceId === destId) {
      // Get the tasks for this specific status
      const sectionTasks = allTasks.filter(task => task.status === sourceId);
      // Remove the task from its original position
      const [movedTask] = sectionTasks.splice(sourceIndex, 1);
      // Insert at the new position
      sectionTasks.splice(destIndex, 0, movedTask);
      
      // Update all tasks by replacing tasks of this status with the reordered list
      const otherTasks = allTasks.filter(task => task.status !== sourceId);
      setTasks([...otherTasks, ...sectionTasks]);
    } 
    // If moved between different sections
    else {
      // Get all tasks for the source status
      const sourceTasks = allTasks.filter(task => task.status === sourceId);
      // Remove the task from the source section
      const [movedTask] = sourceTasks.splice(sourceIndex, 1);
      
      // Create a new task object with updated status to avoid reference issues
      const updatedTask = {
        ...movedTask,
        status: destId as TaskStatus
      };
      
      // Get all tasks for the destination status
      const destTasks = allTasks.filter(task => task.status === destId);
      // Insert the task at the correct position in the destination section
      destTasks.splice(destIndex, 0, updatedTask);
      
      // Combine all tasks from all sections
      const otherTasks = allTasks.filter(task => task.status !== sourceId && task.status !== destId);
      
      // Update the tasks state with the new combined array
      setTasks([...otherTasks, ...sourceTasks, ...destTasks]);
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "todo":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "in_progress":
        return <Circle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Circle className="h-5 w-5 text-blue-500" />;
    }
  };

  const handleSetReminder = (task: Task) => {
    if (!task.datetime) {
      toast({
        title: "Date Required",
        description: "Please set a date and time for the task first.",
        variant: "destructive"
      });
      return;
    }

    try {
      const taskDate = new Date(task.datetime);
      const reminderMinutes = 15; // Fixed to 15 minutes
      
      // Format the task description to include the link if available
      const taskDescription = task.link 
        ? `${task.description}\n\nLink: ${task.link}`
        : task.description;
      
      // Format dates for Google Calendar (YYYYMMDDTHHMMSS/YYYYMMDDTHHMMSS)
      // Add 1 hour duration by default
      const startDate = taskDate;
      const endDate = new Date(taskDate.getTime() + 60 * 60 * 1000); // Add 1 hour
      
      const formatDateForCalendar = (date) => {
        return date.toISOString().replace(/-|:|\.\d+/g, '');
      };
      
      const formattedStartDate = formatDateForCalendar(startDate);
      const formattedEndDate = formatDateForCalendar(endDate);
      
      // Create Google Calendar URL with parameters
      const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(task.title)}&details=${encodeURIComponent(taskDescription)}&dates=${formattedStartDate}/${formattedEndDate}&reminders=MINUTES=${reminderMinutes}`;
      
      window.open(calendarUrl, '_blank');

      const updatedTasks = tasks.map(t => 
        t.id === task.id ? { ...t, reminderSet: true } : t
      );
      setTasks(updatedTasks);
      
      toast({
        title: "Added to Calendar",
        description: "Task added to Google Calendar with a 15-minute reminder.",
      });
    } catch (error) {
      console.error('Error opening Google Calendar:', error);
      toast({
        title: "Calendar Error",
        description: "Failed to open Google Calendar.",
        variant: "destructive"
      });
    }
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const statusOrder: TaskStatus[] = ["todo", "in_progress", "completed"];
        const currentIndex = statusOrder.indexOf(task.status);
        const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
        return { ...task, status: nextStatus };
      }
      return task;
    }));
  };

  const handleCreateTask = () => {
    if (!newTask.title?.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a task title",
        variant: "destructive"
      });
      return;
    }

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description || "",
      link: newTask.link,
      datetime: newTask.datetime,
      status: newTask.status as TaskStatus || "todo",
      tags: Array.isArray(newTask.tags) ? [...newTask.tags] : [],
      reminderSet: false,
      createdAt: Date.now(),
      reminderTime: 15
    };

    console.log("Creating task with tags:", task.tags);
    setTasks([task, ...tasks]);
    setNewTask({
      title: "",
      description: "",
      link: "",
      datetime: "",
      status: "todo",
      tags: []
    });
    setIsDialogOpen(false);
    toast({
      title: "Task Created",
      description: "Your new task has been created successfully."
    });
  };

  const handleTagInput = (input: string, isEditing: boolean) => {
    const searchTerm = input.toLowerCase();
    if (searchTerm) {
      const suggestions = Array.from(allTags)
        .filter(tag => tag.includes(searchTerm))
        .slice(0, 5);
      setTagSuggestions(suggestions);
    } else {
      setTagSuggestions([]);
    }

    if (isEditing) {
      setEditTagInput(input);
    } else {
      setNewTagInput(input);
    }
  };

  const addTag = (tag: string, isEditing: boolean) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (!normalizedTag) return;

    if (isEditing && editingTask) {
      if (!editingTask.editingTags?.includes(normalizedTag)) {
        setEditingTask({
          ...editingTask,
          editingTags: [...(editingTask.editingTags || []), normalizedTag]
        });
      }
      setEditTagInput("");
    } else {
      const currentTags = newTask.tags || [];
      if (!currentTags.includes(normalizedTag)) {
        setNewTask({
          ...newTask,
          tags: [...currentTags, normalizedTag]
        });
      }
      setNewTagInput("");
    }
    setTagSuggestions([]);
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      addTag(newTagInput, false);
    }
  };

  const handleEditAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && editTagInput.trim() && editingTask) {
      e.preventDefault();
      addTag(editTagInput, true);
    }
  };

  const handleRemoveTag = (tagToRemove: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (newTask.tags && newTask.tags.length > 0) {
      console.log("Removing tag:", tagToRemove, "from", newTask.tags);
      setNewTask({
        ...newTask,
        tags: newTask.tags.filter(tag => tag !== tagToRemove)
      });
    }
  };

  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const confirmDelete = (taskId: string) => {
    setTaskToDelete(taskId);
  };

  const handleDeleteTask = (taskId: string) => {
    confirmDelete(taskId);
  };

  const executeDelete = () => {
    if (!taskToDelete) return;
    
    // Create a fresh copy of tasks to avoid reference issues
    const updatedTasks = tasks.filter(task => task.id !== taskToDelete);
    
    // Update state
    setTasks(updatedTasks);
    
    // Save to localStorage explicitly
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    
    // Reset deletion state
    setTaskToDelete(null);
    
    // Show toast notification
    toast({
      title: "Task Deleted",
      description: "The task has been deleted successfully."
    });
  };

  const handleEditTask = (task: Task) => {
    setEditingTask({
      ...task,
      editingTags: [...task.tags]
    });
    setIsDialogOpen(true);
  };

  const handleUpdateTask = () => {
    if (!editingTask?.id || !editingTask.title?.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a task title",
        variant: "destructive"
      });
      return;
    }

    const updatedTask: Task = {
      id: editingTask.id,
      title: editingTask.title,
      description: editingTask.description || "",
      link: editingTask.link,
      datetime: editingTask.datetime,
      status: editingTask.status as TaskStatus || "todo",
      tags: Array.isArray(editingTask.editingTags) ? [...editingTask.editingTags] : [],
      reminderSet: editingTask.reminderSet || false,
      createdAt: editingTask.createdAt || Date.now(),
      reminderTime: editingTask.reminderTime || 15
    };

    setTasks(tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));

    setEditingTask(null);
    setIsDialogOpen(false);
    toast({
      title: "Task Updated",
      description: "Your task has been updated successfully."
    });
  };

  const handleEditRemoveTag = (tagToRemove: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (editingTask && editingTask.editingTags) {
      console.log("Removing tag:", tagToRemove, "from editing task:", editingTask.editingTags);
      setEditingTask({
        ...editingTask,
        editingTags: editingTask.editingTags.filter(tag => tag !== tagToRemove)
      });
    }
  };

  // Add separate sort configurations for each section
  const [inProgressSortConfig, setInProgressSortConfig] = useState<SortConfig>({ field: "due", direction: "asc" });
  const [todoSortConfig, setTodoSortConfig] = useState<SortConfig>({ field: "due", direction: "asc" });
  const [completedSortConfig, setCompletedSortConfig] = useState<SortConfig>({ field: "due", direction: "desc" });
  
  // Add functions to toggle sort for each section
  const toggleInProgressSort = (field: SortOption) => {
    setInProgressSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === "asc" ? "desc" : "asc"
    }));
  };

  const toggleTodoSort = (field: SortOption) => {
    setTodoSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === "asc" ? "desc" : "asc"
    }));
  };

  const toggleCompletedSort = (field: SortOption) => {
    setCompletedSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === "asc" ? "desc" : "asc"
    }));
  };

  // Filter tasks
  const filteredTasks = tasks
    .filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

  // Calculate task counts for each section
  const inProgressCount = tasks.filter(task => task.status === "in_progress").length;
  const todoCount = tasks.filter(task => task.status === "todo").length;
  const completedCount = tasks.filter(task => task.status === "completed").length;

  // Update the sorting logic to handle IST times and due dates
  const getSortedTasks = (tasksToSort: Task[], sortConfig: SortConfig) => {
    return [...tasksToSort].sort((a, b) => {
      switch (sortConfig.field) {
        case "title":
          return sortConfig.direction === "asc" 
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title);
        case "due":
          // Handle the case where one or both tasks don't have datetime
          if (!a.datetime && !b.datetime) {
          return sortConfig.direction === "asc"
            ? a.createdAt - b.createdAt
            : b.createdAt - a.createdAt;
          }
          if (a.datetime && !b.datetime) {
            return sortConfig.direction === "asc" ? -1 : 1;
          }
          if (!a.datetime && b.datetime) {
            return sortConfig.direction === "asc" ? 1 : -1;
          }
          // Sort by due date when both have datetime
          const dateA = new Date(a.datetime!);
          const dateB = new Date(b.datetime!);
          return sortConfig.direction === "asc" 
            ? dateA.getTime() - dateB.getTime() 
            : dateB.getTime() - dateA.getTime();
        case "date":
        default:
          return sortConfig.direction === "asc" 
            ? a.createdAt - b.createdAt 
            : b.createdAt - a.createdAt;
      }
    });
  };

  // Group tasks by status with section-specific sorting and IST time
  const inProgressTasks = getSortedTasks(
    filteredTasks.filter(task => task.status === "in_progress"),
    inProgressSortConfig
  );
  
  const todoTasks = getSortedTasks(
    filteredTasks.filter(task => task.status === "todo"),
    todoSortConfig
  );
  
  const completedTasks = getSortedTasks(
    filteredTasks.filter(task => task.status === "completed"),
    completedSortConfig
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Tasks</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
              <DialogDescription>
                {editingTask ? 'Update task details' : 'Add a new task with details'}. Press enter to add tags.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editingTask ? editingTask.title : newTask.title}
                  onChange={(e) => editingTask 
                    ? setEditingTask({ ...editingTask, title: e.target.value })
                    : setNewTask({ ...newTask, title: e.target.value })
                  }
                  placeholder="Task title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingTask ? editingTask.description : newTask.description}
                  onChange={(e) => editingTask 
                    ? setEditingTask({ ...editingTask, description: e.target.value })
                    : setNewTask({ ...newTask, description: e.target.value })
                  }
                  placeholder="Task description"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="link">Link (Optional)</Label>
                <Input
                  id="link"
                  value={editingTask ? editingTask.link : newTask.link}
                  onChange={(e) => editingTask 
                    ? setEditingTask({ ...editingTask, link: e.target.value })
                    : setNewTask({ ...newTask, link: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="datetime" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Due Date & Time</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="date" className="text-xs text-muted-foreground mb-1">Date</Label>
                <Input
                      id="date"
                      type="date"
                      value={editingTask ? (editingTask.datetime ? editingTask.datetime.split('T')[0] : '') : (newTask.datetime ? newTask.datetime.split('T')[0] : '')}
                      onChange={(e) => {
                        const currentTime = editingTask 
                          ? (editingTask.datetime ? editingTask.datetime.split('T')[1] : '00:00') 
                          : (newTask.datetime ? newTask.datetime.split('T')[1] : '00:00');
                        const newDateTime = `${e.target.value}T${currentTime}`;
                        editingTask 
                          ? setEditingTask({ ...editingTask, datetime: newDateTime })
                          : setNewTask({ ...newTask, datetime: newDateTime });
                      }}
                  className="focus:ring-2 focus:ring-blue-500"
                />
                  </div>
                  <div>
                    <Label htmlFor="time" className="text-xs text-muted-foreground mb-1">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={editingTask 
                        ? (editingTask.datetime ? editingTask.datetime.split('T')[1] : '') 
                        : (newTask.datetime ? newTask.datetime.split('T')[1] : '')}
                      onChange={(e) => {
                        const currentDate = editingTask 
                          ? (editingTask.datetime ? editingTask.datetime.split('T')[0] : new Date().toISOString().split('T')[0]) 
                          : (newTask.datetime ? newTask.datetime.split('T')[0] : new Date().toISOString().split('T')[0]);
                        const newDateTime = `${currentDate}T${e.target.value}`;
                        editingTask 
                          ? setEditingTask({ ...editingTask, datetime: newDateTime })
                          : setNewTask({ ...newTask, datetime: newDateTime });
                      }}
                      className="focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Tasks with time will have a reminder option</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={editingTask ? editingTask.status : newTask.status} 
                  onValueChange={(value: TaskStatus) => editingTask 
                    ? setEditingTask({ ...editingTask, status: value })
                    : setNewTask({ ...newTask, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tags" className="flex items-center gap-2">
                  <TagIcon className="h-4 w-4" />
                  <span>Tags</span>
                </Label>
                <div className="flex flex-wrap gap-2 mb-2 min-h-8 p-1 border rounded-md">
                  {(editingTask ? editingTask.editingTags : newTask.tags)?.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          editingTask 
                            ? handleEditRemoveTag(tag, e)
                            : handleRemoveTag(tag, e);
                        }}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="relative">
                  <Input
                    id="tags"
                    value={editingTask ? editTagInput : newTagInput}
                    onChange={(e) => handleTagInput(e.target.value, !!editingTask)}
                    onKeyDown={editingTask ? handleEditAddTag : handleAddTag}
                    placeholder="Type tag and press enter"
                  />
                  {tagSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-10">
                      {tagSuggestions.map((tag) => (
                        <button
                          key={tag}
                          className="w-full px-3 py-2 text-left hover:bg-accent transition-colors"
                          onClick={() => addTag(tag, !!editingTask)}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsDialogOpen(false);
                setEditingTask(null);
              }}>
                Cancel
              </Button>
              <Button onClick={editingTask ? handleUpdateTask : handleCreateTask}>
                {editingTask ? 'Update Task' : 'Create Task'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Search and Filter Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search tasks..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <Select value={statusFilter} onValueChange={(value: TaskStatus | "all") => setStatusFilter(value)}>
                  <SelectTrigger className="w-[140px]">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="todo">TO-DO</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delete confirmation dialog */}
        <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the task. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setTaskToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Tasks Sections with DragDropContext wrapping all sections */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="space-y-6">
            {/* In Progress Section - Only show if filter is "all" or "in_progress" */}
            {(statusFilter === "all" || statusFilter === "in_progress") && (
              <TaskSection
                title="In Progress"
                status="in_progress"
                tasks={inProgressTasks}
                taskCount={inProgressCount}
                onDragEnd={handleDragEnd}
                onTaskClick={handleEditTask}
                onToggleStatus={toggleTaskStatus}
                onDeleteTask={handleDeleteTask}
                onSetReminder={handleSetReminder}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                sortConfig={inProgressSortConfig}
                onSortChange={toggleInProgressSort}
              />
            )}
            
            {/* TO-DO Section - Only show if filter is "all" or "todo" */}
            {(statusFilter === "all" || statusFilter === "todo") && (
              <TaskSection
                title="TO-DO"
                status="todo"
                tasks={todoTasks}
                taskCount={todoCount}
                onDragEnd={handleDragEnd}
                onTaskClick={handleEditTask}
                onToggleStatus={toggleTaskStatus}
                onDeleteTask={handleDeleteTask}
                onSetReminder={handleSetReminder}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                sortConfig={todoSortConfig}
                onSortChange={toggleTodoSort}
              />
            )}
            
            {/* Completed Section - Only show if filter is "all" or "completed" */}
            {(statusFilter === "all" || statusFilter === "completed") && (
              <TaskSection
                title="Completed"
                status="completed"
                tasks={completedTasks}
                taskCount={completedCount}
                onDragEnd={handleDragEnd}
                onTaskClick={handleEditTask}
                onToggleStatus={toggleTaskStatus}
                onDeleteTask={handleDeleteTask}
                onSetReminder={handleSetReminder}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                sortConfig={completedSortConfig}
                onSortChange={toggleCompletedSort}
              />
            )}
                </div>
          </DragDropContext>
      </div>
    </div>
  );
} 