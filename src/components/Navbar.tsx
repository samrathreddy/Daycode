import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, Settings, Award, Video, CheckSquare, LifeBuoy } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Navbar() {
  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Tasks", path: "/tasks", icon: CheckSquare },
    { name: "Contests", path: "/contests", icon: Award },
    { name: "Videos", path: "/videos", icon: Video },
    { name: "Settings", path: "/settings", icon: Settings },
    { name: "Help", path: "/help", icon: LifeBuoy }
  ];

  return (
    <nav className="border-b bg-background sticky top-0 z-40">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
          <NavLink to="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">CodeGeek</span>
          </NavLink>
        </div>
        <div className="flex-1">
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
        <div className="flex items-center space-x-2">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
} 