import React, { useState, FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, LifeBuoy, LoaderCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { getDiscordWebhookUrl } from "@/utils/env";

export default function Help() {
  // Help form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleHelpSubmit(e: FormEvent) {
    e.preventDefault();
    
    // Form validation
    if (!name.trim() || !email.trim() || !description.trim()) {
      toast({
        title: "Form Incomplete",
        description: "Please fill out all fields in the help form",
        variant: "destructive"
      });
      return;
    }
    
    // Email validation
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get webhook URL from environment config
      const webhookUrl = getDiscordWebhookUrl();
      
      if (!webhookUrl) {
        throw new Error("Discord webhook URL not configured");
      }
      
      // Create Discord embed message
      const payload = {
        embeds: [{
          title: "Help Request",
          color: 3447003, // Discord blue color
          fields: [
            {
              name: "Name",
              value: name,
              inline: true
            },
            {
              name: "Email",
              value: email,
              inline: true
            },
            {
              name: "Description",
              value: description
            }
          ],
          footer: {
            text: "Sent from Day Code App"
          },
          timestamp: new Date().toISOString()
        }]
      };
      
      // Send to Discord webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Discord responded with status: ${response.status}`);
      }
      
      // Reset form
      setName('');
      setEmail('');
      setDescription('');
      
      toast({
        title: "Help Request Sent",
        description: "Your request has been submitted. I'll get back to you soon!",
      });
    } catch (error) {
      console.error("Error sending help request:", error);
      toast({
        title: "Request Failed",
        description: "Unable to send your help request. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Help & Support</h1>
      
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <LifeBuoy className="h-5 w-5" />
            <CardTitle>Get Help / Provide Feedback</CardTitle>
          </div>
          <CardDescription className="space-y-2">
            <p>Hello! I'm Samrath, the developer of Day Code. If you have any questions, feedback, or need assistance with the app, please fill out the form below.</p>
            <p className="flex flex-wrap items-center gap-4">
              Connect with me on:
              <a 
                href="https://www.linkedin.com/in/samrath-reddy/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 hover:underline inline-flex items-center"
              >
                LinkedIn
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              
              <span className="text-muted-foreground">|</span>
              <a 
                href="https://samrathdev.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-500 hover:text-green-700 hover:underline inline-flex items-center"
              >
                Portfolio
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm1 16.057v-3.057h2.994c-.059 1.143-.212 2.24-.456 3.279-.823-.12-1.674-.188-2.538-.222zm1.957 2.162c-.499 1.33-1.159 2.497-1.957 3.456v-3.62c.666.028 1.319.081 1.957.164zm-1.957-7.219v-3.015c.868-.034 1.721-.103 2.548-.224.238 1.027.389 2.111.446 3.239h-2.994zm0-5.014v-3.661c.806.969 1.471 2.15 1.971 3.496-.642.084-1.3.137-1.971.165zm2.703-3.267c1.237.496 2.354 1.228 3.29 2.146-.642.234-1.311.442-2.019.607-.344-.992-.775-1.91-1.271-2.753zm-7.241 13.56c-.244-1.039-.398-2.136-.456-3.279h2.994v3.057c-.865.034-1.714.102-2.538.222zm2.538 1.776v3.62c-.798-.959-1.458-2.126-1.957-3.456.638-.083 1.291-.136 1.957-.164zm-2.994-7.055c.057-1.128.207-2.212.446-3.239.827.121 1.68.19 2.548.224v3.015h-2.994zm1.024-5.179c.5-1.346 1.165-2.527 1.97-3.496v3.661c-.671-.028-1.329-.081-1.97-.165zm-2.005-.35c-.708-.165-1.377-.373-2.018-.607.937-.918 2.053-1.65 3.29-2.146-.496.844-.927 1.762-1.272 2.753zm-.549 1.918c-.264 1.151-.434 2.36-.492 3.611h-3.933c.165-1.658.739-3.197 1.617-4.518.88.361 1.816.67 2.808.907zm.009 9.262c-.988.236-1.92.542-2.797.9-.89-1.328-1.471-2.879-1.637-4.551h3.934c.058 1.265.231 2.488.5 3.651zm.553 1.917c.342.976.768 1.881 1.257 2.712-1.223-.49-2.326-1.211-3.256-2.115.636-.229 1.299-.435 1.999-.597zm9.924 0c.7.163 1.362.367 1.999.597-.931.903-2.034 1.625-3.257 2.116.489-.832.915-1.737 1.258-2.713zm.553-1.917c.27-1.163.442-2.386.501-3.651h3.934c-.167 1.672-.748 3.223-1.638 4.551-.877-.358-1.81-.664-2.797-.9zm.501-5.651c-.058-1.251-.229-2.46-.492-3.611.992-.237 1.929-.546 2.809-.907.877 1.321 1.451 2.86 1.616 4.518h-3.933z"/>
                </svg>
              </a>

              <span className="text-muted-foreground">|</span>
              
              <a 
                href="https://x.com/samrathghana" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-600 hover:underline inline-flex items-center"
                aria-label="X (Twitter)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              
              
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleHelpSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input 
                id="name" 
                placeholder="Enter your name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email"
                placeholder="Enter your email address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Message</Label>
              <Textarea 
                id="description" 
                placeholder="Please describe your question, issue, or feedback in detail. The more information you provide, the better I can help you."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[150px]"
                required
              />
            </div>
            
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your message will be sent directly to me via Discord, and I'll respond to your email as soon as possible.
              </AlertDescription>
            </Alert>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 