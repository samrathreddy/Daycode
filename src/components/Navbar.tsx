import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, Settings, Award, Video, CheckSquare, LifeBuoy, Menu, Code } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const navigate = useNavigate();

  // Simulating fetching the username
  useEffect(() => {
    // Replace this with your actual username fetching logic
    const fetchUsername = async () => {
      try {
        // Example: const response = await api.getUser();
        // setUsername(response.data.username);
        
        // For now, just set it to null to simulate username not found
        setUsername(null);
      } catch (error) {
        console.error("Failed to fetch username:", error);
        setUsername(null);
      }
    };
    
    fetchUsername();
  }, []);

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Tasks", path: "/tasks", icon: CheckSquare },
    { name: "Contests", path: "/contests", icon: Award },
    { name: "Hackathons", path: "/hackathons", icon: Code },
    { name: "Videos", path: "/videos", icon: Video },
    { name: "Settings", path: "/settings", icon: Settings },
    { name: "Help", path: "/help", icon: LifeBuoy }
  ];

  const handleNavLinkClick = () => {
    setOpen(false); // Close the mobile menu when a link is clicked
  };

  return (
    <nav className="border-b bg-background sticky top-0 z-40">
      <div className="flex h-16 items-center px-4 md:container">
        <div className="ml-0 md:ml-[-1rem] mr-4 md:mr-10">
          <NavLink to="/" className="flex items-center space-x-2">
            <span className="font-bold text-2xl md:text-3xl">DayCode</span>
          </NavLink>
        </div>
        <div className="flex-1 hidden md:block">
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )
                }
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </NavLink>
            ))}
          </div>
        </div>
        <div className="flex flex-1 justify-end items-center space-x-2">          
          <ThemeToggle />
          
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[240px] sm:w-[300px]">
              <div className="flex flex-col gap-4 py-4">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center py-2 px-3 rounded-md text-sm font-medium transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )
                    }
                    onClick={handleNavLinkClick}
                  >
                    <item.icon className="mr-2 h-5 w-5" />
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
} 