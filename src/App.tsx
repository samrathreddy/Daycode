import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from './pages/Home';
import Settings from './pages/Settings';
import Help from './pages/Help';
import Tasks from './pages/Tasks';
import Contest from "./pages/Contest";
import Videos from "./pages/Videos";
import Hackathons from "./pages/Hackathons";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Router>
        <Routes>
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
          <Route path="/help" element={<Layout><Help /></Layout>} />
          <Route path="/tasks" element={<Layout><Tasks /></Layout>} />
          <Route path="/contests" element={<Contest />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/hackathons" element={<Layout><Hackathons /></Layout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
