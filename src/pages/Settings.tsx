import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Github, Code } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function Settings() {
  const [githubUsername, setGithubUsername] = useState(localStorage.getItem('github-username') || '');
  const [githubEnabled, setGithubEnabled] = useState(localStorage.getItem('github-enabled') !== 'false');
  
  const [leetcodeUsername, setLeetcodeUsername] = useState(localStorage.getItem('leetcode-username') || '');
  const [leetcodeEnabled, setLeetcodeEnabled] = useState(localStorage.getItem('leetcode-enabled') !== 'false');
  const [leetcodePotd, setLeetcodePotd] = useState(localStorage.getItem('leetcode-potd') !== 'false');

  function saveGitHubSettings() {
    if (!githubUsername.trim()) {
      toast({
        title: "GitHub Username Required",
        description: "Please enter a valid GitHub username",
        variant: "destructive"
      });
      return;
    }
    
    localStorage.setItem('github-username', githubUsername);
    localStorage.setItem('github-enabled', githubEnabled.toString());
    
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
    
    localStorage.setItem('leetcode-username', leetcodeUsername);
    localStorage.setItem('leetcode-enabled', leetcodeEnabled.toString());
    localStorage.setItem('leetcode-potd', leetcodePotd.toString());
    
    // Trigger localStorage event for components that are listening
    window.dispatchEvent(new Event('storage'));
    
    toast({
      title: "LeetCode Settings Saved",
      description: "Your LeetCode settings have been saved and data updated.",
    });
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Settings</h1>
      
      <div className="space-y-6">
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
                placeholder="Enter your GitHub username" 
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
              />
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
                placeholder="Enter your LeetCode username"
                value={leetcodeUsername}
                onChange={(e) => setLeetcodeUsername(e.target.value)}
              />
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
      </div>
    </div>
  );
} 