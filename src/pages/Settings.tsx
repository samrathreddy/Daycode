import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Github, Code, Database, Download, Upload, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("integration");
  const [githubUsername, setGithubUsername] = useState(localStorage.getItem('github-username') || '');
  const [githubEnabled, setGithubEnabled] = useState(localStorage.getItem('github-enabled') !== 'false');
  
  const [leetcodeUsername, setLeetcodeUsername] = useState(localStorage.getItem('leetcode-username') || '');
  const [leetcodeEnabled, setLeetcodeEnabled] = useState(localStorage.getItem('leetcode-enabled') !== 'false');
  const [leetcodePotd, setLeetcodePotd] = useState(localStorage.getItem('leetcode-potd') !== 'false');

  // Reference for file input element
  const fileInputRef = useRef(null);

  function saveGitHubSettings() {
    if (!githubUsername.trim()) {
      toast({
        title: "GitHub Username Required",
        description: "Please enter a valid GitHub username",
        variant: "destructive"
      });
      return;
    }
    
    // Extract username if a URL was pasted
    let username = githubUsername.trim();
    
    // Handle GitHub URL formats
    if (username.includes('github.com/')) {
      try {
        const url = new URL(username.includes('http') ? username : `https://${username}`);
        const pathParts = url.pathname.split('/').filter(Boolean);
        if (pathParts.length > 0) {
          username = pathParts[0]; // First path segment after domain is username
        }
      } catch (error) {
        // Not a valid URL, keep as is
      }
    }
    
    localStorage.setItem('github-username', username);
    localStorage.setItem('github-enabled', githubEnabled.toString());
    
    // Update the displayed username
    setGithubUsername(username);
    
    // Trigger localStorage event for components that are listening
    window.dispatchEvent(new Event('storage'));
    
    toast({
      title: "GitHub Settings Saved",
      description: "Your GitHub settings have been saved and heatmap updated.",
    });
  }

  function saveLeetCodeSettings() {
    if (!leetcodeUsername.trim()) {
      toast({
        title: "LeetCode Username Required",
        description: "Please enter a valid LeetCode username",
        variant: "destructive"
      });
      return;
    }
    
    // Extract username if a URL was pasted
    let username = leetcodeUsername.trim();
    
    // Handle LeetCode URL formats
    if (username.includes('leetcode.com/')) {
      try {
        const url = new URL(username.includes('http') ? username : `https://${username}`);
        const pathParts = url.pathname.split('/').filter(Boolean);
        
        // Handle both URL formats: leetcode.com/username/ and leetcode.com/u/username/
        if (pathParts.length > 0) {
          if (pathParts[0] === 'u' && pathParts.length > 1) {
            // For URLs like leetcode.com/u/username/
            username = pathParts[1];
          } else {
            // For URLs like leetcode.com/username/
            username = pathParts[0];
          }
        }
      } catch (error) {
        // Not a valid URL, keep as is
      }
    }
    
    localStorage.setItem('leetcode-username', username);
    localStorage.setItem('leetcode-enabled', leetcodeEnabled.toString());
    localStorage.setItem('leetcode-potd', leetcodePotd.toString());
    
    // Update the displayed username
    setLeetcodeUsername(username);
    
    // Trigger localStorage event for components that are listening
    window.dispatchEvent(new Event('storage'));
    
    toast({
      title: "LeetCode Settings Saved",
      description: "Your LeetCode settings have been saved and data updated.",
    });
  }

  function backupData() {
    try {
      // Collect all localStorage items
      const backupData = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        backupData[key] = localStorage.getItem(key);
      }

      // Create a Blob with the JSON data
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      
      // Create a download link and trigger the download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      a.href = url;
      a.download = `Daycode_Backup_${date}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);

      toast({
        title: "Backup Created",
        description: "Your data has been successfully backed up.",
      });
    } catch (error) {
      console.error('Backup error:', error);
      toast({
        title: "Backup Failed",
        description: "There was an error creating your backup. Please try again.",
        variant: "destructive"
      });
    }
  }

  function triggerFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  function handleRestore(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // Cast the result to string before parsing
        const backupData = JSON.parse(e.target.result as string);
        
        // Restore the data to localStorage
        Object.keys(backupData).forEach(key => {
          localStorage.setItem(key, backupData[key]);
        });
        
        // Update the current state with restored data
        setGithubUsername(localStorage.getItem('github-username') || '');
        setGithubEnabled(localStorage.getItem('github-enabled') !== 'false');
        setLeetcodeUsername(localStorage.getItem('leetcode-username') || '');
        setLeetcodeEnabled(localStorage.getItem('leetcode-enabled') !== 'false');
        setLeetcodePotd(localStorage.getItem('leetcode-potd') !== 'false');
        
        // Trigger localStorage event for components that are listening
        window.dispatchEvent(new Event('storage'));
        
        toast({
          title: "Data Restored",
          description: "Your backup has been successfully restored.",
        });
      } catch (error) {
        console.error('Restore error:', error);
        toast({
          title: "Restore Failed",
          description: "There was an error restoring your backup. Please check the file and try again.",
          variant: "destructive"
        });
      }
    };
    
    reader.readAsText(file);
    
    // Reset the input so the same file can be selected again if needed
    event.target.value = null;
  }

  function resetAllData() {
    try {
      // Clear all localStorage data
      localStorage.clear();
      
      // Reset the current state
      setGithubUsername('');
      setGithubEnabled(true);
      setLeetcodeUsername('');
      setLeetcodeEnabled(true);
      setLeetcodePotd(true);
      
      // Trigger localStorage event for components that are listening
      window.dispatchEvent(new Event('storage'));
      
      toast({
        title: "Data Reset",
        description: "All your application data has been reset. The app will use default settings.",
      });
    } catch (error) {
      console.error('Reset error:', error);
      toast({
        title: "Reset Failed",
        description: "There was an error resetting your data. Please try again.",
        variant: "destructive"
      });
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Settings</h1>
      
      <Tabs defaultValue="integration" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-4">
          <TabsTrigger value="integration" className="flex items-center space-x-2">
            <Code className="h-4 w-4" />
            <span>Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="storage" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Storage</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="integration" className="space-y-6">
          {/* GitHub Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Github className="h-5 w-5" />
                <CardTitle>GitHub Integration</CardTitle>
              </div>
              <CardDescription>
                Connect your GitHub account to track contributions and activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="github-username">GitHub Username</Label>
                <Input 
                  id="github-username" 
                  placeholder="Enter your GitHub username or profile URL" 
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Example: "username" or "https://github.com/username"
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="github-enabled" 
                  checked={githubEnabled}
                  onCheckedChange={setGithubEnabled}
                />
                <Label htmlFor="github-enabled">Show GitHub heatmap on dashboard</Label>
              </div>
              
              <Button onClick={saveGitHubSettings}>Save GitHub Settings</Button>
            </CardContent>
          </Card>
          
          {/* LeetCode Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Code className="h-5 w-5" />
                <CardTitle>LeetCode Integration</CardTitle>
              </div>
              <CardDescription>
                Connect your LeetCode account to track problem-solving activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="leetcode-username">LeetCode Username</Label>
                <Input 
                  id="leetcode-username" 
                  placeholder="Enter your LeetCode username or profile URL"
                  value={leetcodeUsername}
                  onChange={(e) => setLeetcodeUsername(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Example: "username" or "https://leetcode.com/username"
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="leetcode-enabled" 
                  checked={leetcodeEnabled}
                  onCheckedChange={setLeetcodeEnabled}
                />
                <Label htmlFor="leetcode-enabled">Show LeetCode heatmap on dashboard</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="leetcode-potd" 
                  checked={leetcodePotd}
                  onCheckedChange={setLeetcodePotd}
                />
                <Label htmlFor="leetcode-potd">Show Problem of the Day on dashboard</Label>
              </div>
              
              <Button onClick={saveLeetCodeSettings}>Save LeetCode Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="storage" className="space-y-6">
          {/* Storage Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <CardTitle>Storage Management</CardTitle>
              </div>
              <CardDescription>
                Backup, restore, or reset your application data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={backupData} 
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Backup Data</span>
                </Button>
                
                <Button 
                  onClick={triggerFileInput} 
                  variant="outline" 
                  className="flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Restore from Backup</span>
                </Button>
                
                {/* Hidden file input for restore */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept=".json" 
                  onChange={handleRestore} 
                  style={{ display: 'none' }} 
                />
              </div>
              
              <div className="border-t pt-4 mt-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="flex items-center space-x-2"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <span>Reset All Data</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will permanently delete all your saved settings, 
                        preferences, and cached data. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={resetAllData}>
                        Yes, Reset Everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 