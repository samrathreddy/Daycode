import React from "react";
import Navbar from "./Navbar";
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Award, Menu, Settings, X } from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

// This function will be both the default export and named export
function LayoutComponent({ children }: LayoutProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      
      <footer className="border-t border-border py-6 bg-muted/50">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">
              Keep grinding!
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} DayCode by <a href="https://www.linkedin.com/in/samrath-reddy/" className="underline">Samrath</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

// Export as both default and named export
export default LayoutComponent;
export const Layout = LayoutComponent;
