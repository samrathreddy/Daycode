import React, { useState, useEffect, useCallback } from 'react';
import { fetchHackathons, Hackathon } from '@/utils/api/devpost';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  MapPin, 
  Trophy, 
  Users, 
  GraduationCap,
  Clock,
  Check,
  AlertCircle,
  Globe,
  MapPin as LocationPin,
  Code,
  ExternalLink,
  SortAsc,
  Coins,
  Timer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Sorting options type
type SortOption = 'relevance' | 'prize-amount' | 'recently-added' | 'deadline';

export default function Hackathons() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<'devpost' | 'devfolio'>('devpost');
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [openEventsCount, setOpenEventsCount] = useState({ 
    devpost: 0, 
    devfolio: 0
  });

  const itemsPerPage = 12;
  const maxDisplayedPages = 5;

  // Map tab values to challenge types
  const getTypesFromTab = (filter: string): ('online' | 'in-person')[] => {
    switch (filter) {
      case 'online':
        return ['online'];
      case 'in-person':
        return ['in-person'];
      case 'all':
      default:
        return ['online', 'in-person'];
    }
  };

  // Use useCallback to prevent unnecessary re-renders
  const loadHackathons = useCallback(async (
    page: number, 
    filter: string, 
    platform: 'devpost' | 'devfolio',
    sort: SortOption
  ) => {
    setIsLoading(true);
    setError(null);
    
    // If platform is not devpost, show empty data for now
    if (platform !== 'devpost') {
      setHackathons([]);
      setTotalCount(0);
      setIsLoading(false);
      return;
    }
    
    const types = getTypesFromTab(filter);
    
    try {
      console.log(`Fetching ${platform} hackathons for page ${page} with types: ${types.join(', ')}, sort: ${sort}`);
      
      // Only pass orderBy parameter if it's not the default 'relevance'
      const orderBy = sort !== 'relevance' ? sort : undefined;
      
      const response = await fetchHackathons(page, types, orderBy);
      
      // Check if the response has the expected structure
      if (!response.hackathons || !Array.isArray(response.hackathons)) {
        console.error('Invalid API response format:', response);
        setError('Received an invalid response format from the server.');
        setHackathons([]);
        setTotalCount(0);
      } else {
        console.log(`Received ${response.hackathons.length} hackathons, total: ${response.total_count}`);
        setHackathons(response.hackathons);
        setTotalCount(response.total_count || 0);
        
        // Calculate open events count
        const openCount = response.hackathons.filter(h => h.open_state === 'open').length;
        setOpenEventsCount(prev => ({
          ...prev,
          [platform]: openCount
        }));
      }
    } catch (err) {
      console.error('Error loading hackathons:', err);
      setError('Failed to load hackathons. Please try again later.');
      setHackathons([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle platform change
  const handlePlatformChange = (value: 'devpost' | 'devfolio') => {
    setActivePlatform(value);
    setCurrentPage(1);
    setActiveFilter('all');
    setSortBy('relevance');
  };

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setActiveFilter(value);
    setCurrentPage(1); // Reset to page 1 when changing filters
  };
  
  // Handle sort change
  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setCurrentPage(1); // Reset to page 1 when changing sort
  };

  // Load hackathons when page, filter, platform or sort changes
  useEffect(() => {
    loadHackathons(currentPage, activeFilter, activePlatform, sortBy);
  }, [currentPage, activeFilter, activePlatform, sortBy, loadHackathons]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    console.log(`Changing page from ${currentPage} to ${newPage}`);
    
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    setCurrentPage(newPage);
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get human-readable location type
  const getLocationName = (type: string) => {
    switch (type) {
      case 'online': return 'Online';
      case 'in-person': return 'In Person';
      case 'hybrid': return 'Hybrid';
      default: return type;
    }
  };
  
  // Get human-readable sort name
  const getSortDisplayName = (sort: SortOption): string => {
    switch (sort) {
      case 'prize-amount': return 'Prize Amount';
      case 'recently-added': return 'Recently Added';
      case 'deadline': return 'Deadline';
      case 'relevance':
      default: return 'Relevance';
    }
  };
  
  // Get sort icon
  const getSortIcon = (sort: SortOption) => {
    switch (sort) {
      case 'prize-amount': return <Coins className="h-4 w-4" />;
      case 'recently-added': return <Clock className="h-4 w-4" />;
      case 'deadline': return <Timer className="h-4 w-4" />;
      case 'relevance':
      default: return <SortAsc className="h-4 w-4" />;
    }
  };

  // Get status color
  const getStatusColor = (state: string) => {
    switch (state) {
      case 'open': return 'bg-green-500 text-white';
      case 'upcoming': return 'bg-blue-500 text-white';
      case 'closed': return 'bg-gray-500 text-white';
      default: return 'bg-gray-200';
    }
  };

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    if (totalPages <= maxDisplayedPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSide = Math.max(1, currentPage - Math.floor(maxDisplayedPages / 2));
    const rightSide = Math.min(totalPages, leftSide + maxDisplayedPages - 1);
    
    const pages = Array.from({ length: rightSide - leftSide + 1 }, (_, i) => leftSide + i);
    
    if (leftSide > 1) {
      pages.unshift(1);
      if (leftSide > 2) pages.splice(1, 0, -1); // Add ellipsis
    }
    
    if (rightSide < totalPages) {
      if (rightSide < totalPages - 1) pages.push(-1); // Add ellipsis
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Hackathons</h1>
          <p className="text-muted-foreground">
            Explore hackathons from multiple platforms
          </p>
        </div>
      </div>
      
      {/* Platform Tabs */}
      <Tabs value={activePlatform} onValueChange={(value) => handlePlatformChange(value as 'devpost' | 'devfolio')} className="mb-6">
        <TabsList className="w-full">
          <TabsTrigger value="devpost" className="flex-1">
            <div className="flex items-center">
              <Code className="h-5 w-5 mr-2" />
              <span>Devpost</span>
              {openEventsCount.devpost > 0 && (
                <Badge className="ml-2 bg-green-500 text-white">{openEventsCount.devpost}</Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger value="devfolio" className="flex-1">
            <div className="flex items-center">
              <ExternalLink className="h-5 w-5 mr-2" />
              <span>Devfolio</span>
              {openEventsCount.devfolio > 0 && (
                <Badge className="ml-2 bg-green-500 text-white">{openEventsCount.devfolio}</Badge>
              )}
            </div>
          </TabsTrigger>
        </TabsList>
        
        {/* Devpost Tab Content */}
        <TabsContent value="devpost" className="mt-4">
          {/* Controls: Filters and Sorting */}
          <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
            {/* Filter Tabs */}
            <Tabs value={activeFilter} onValueChange={handleFilterChange} className="flex-grow md:max-w-md">
              <TabsList className="w-full flex">
                <TabsTrigger value="all" className="flex-1">
                  All Hackathons
                </TabsTrigger>
                <TabsTrigger value="online" className="flex-1">
                  <Globe className="h-4 w-4 mr-2" />
                  Online
                </TabsTrigger>
                <TabsTrigger value="in-person" className="flex-1">
                  <LocationPin className="h-4 w-4 mr-2" />
                  In Person
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</span>
              <Select value={sortBy} onValueChange={(value) => handleSortChange(value as SortOption)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance" className="flex items-center">
                    <div className="flex items-center">
                      <SortAsc className="h-4 w-4 mr-2" />
                      <span>Relevance</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="prize-amount">
                    <div className="flex items-center">
                      <Coins className="h-4 w-4 mr-2" />
                      <span>Prize Amount</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="recently-added">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Recently Added</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="deadline">
                    <div className="flex items-center">
                      <Timer className="h-4 w-4 mr-2" />
                      <span>Deadline</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Active Sort Indicator */}
          {sortBy !== 'relevance' && (
            <div className="mb-4 flex items-center text-sm text-muted-foreground">
              <span>Sorting by:</span>
              <Badge variant="outline" className="ml-2 flex items-center gap-1">
                {getSortIcon(sortBy)}
                {getSortDisplayName(sortBy)}
              </Badge>
            </div>
          )}
          
          {/* Devpost Content */}
          {renderHackathons()}
        </TabsContent>
        
        {/* Devfolio Tab Content */}
        <TabsContent value="devfolio" className="mt-4">
          {/* Controls: Filters and Sorting */}
          <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
            {/* Filter Tabs */}
            <Tabs value={activeFilter} onValueChange={handleFilterChange} className="flex-grow md:max-w-md">
              <TabsList className="w-full flex">
                <TabsTrigger value="all" className="flex-1">
                  All Hackathons
                </TabsTrigger>
                <TabsTrigger value="online" className="flex-1">
                  <Globe className="h-4 w-4 mr-2" />
                  Online
                </TabsTrigger>
                <TabsTrigger value="in-person" className="flex-1">
                  <LocationPin className="h-4 w-4 mr-2" />
                  In Person
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</span>
              <Select value={sortBy} onValueChange={(value) => handleSortChange(value as SortOption)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance" className="flex items-center">
                    <div className="flex items-center">
                      <SortAsc className="h-4 w-4 mr-2" />
                      <span>Relevance</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="prize-amount">
                    <div className="flex items-center">
                      <Coins className="h-4 w-4 mr-2" />
                      <span>Prize Amount</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="recently-added">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Recently Added</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="deadline">
                    <div className="flex items-center">
                      <Timer className="h-4 w-4 mr-2" />
                      <span>Deadline</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Coming Soon Message */}
          <div className="flex flex-col items-center justify-center p-12 text-center bg-muted/30 rounded-lg">
            <ExternalLink className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-2xl font-semibold mb-2">Coming Soon</h3>
            <p className="text-muted-foreground max-w-md">
              Devfolio integration is currently in development and will be available soon!
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
  
  // Helper function to render hackathons
  function renderHackathons() {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <Skeleton className="h-[150px] w-full" />
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }
    
    if (hackathons.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-2xl font-semibold mb-2">No hackathons found</h3>
          <p className="text-muted-foreground mb-6">
            No hackathons match your current filters. Try changing your filters or check back later.
          </p>
        </div>
      );
    }
    
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {hackathons.map((hackathon) => (
            <Card key={hackathon.id} className="overflow-hidden flex flex-col h-full">
              <div className="relative h-[150px] overflow-hidden bg-secondary">
                {hackathon.thumbnail_url ? (
                  <img 
                    src={hackathon.thumbnail_url} 
                    alt={hackathon.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-secondary">
                    <GraduationCap className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                
                <Badge 
                  className={`absolute top-2 right-2 ${getStatusColor(hackathon.open_state)}`}
                >
                  {hackathon.open_state === 'open' && <Check className="h-3 w-3 mr-1" />}
                  {hackathon.open_state === 'upcoming' && <Clock className="h-3 w-3 mr-1" />}
                  {hackathon.open_state.charAt(0).toUpperCase() + hackathon.open_state.slice(1)}
                </Badge>
              </div>
              
              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-2 text-lg">{hackathon.title}</CardTitle>
                <CardDescription>
                  {hackathon.organization_name || 'Unknown organizer'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-grow">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start">
                    <Calendar className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                    <span>{hackathon.submission_period_dates}</span>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                    <span>{getLocationName(hackathon.location_type)}</span>
                  </div>
                  
                  {hackathon.prize_amount > 0 && (
                    <div className="flex items-start">
                      <Trophy className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                      <span>{formatCurrency(hackathon.prize_amount)} in prizes</span>
                    </div>
                  )}
                  
                  <div className="flex items-start">
                    <Users className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                    <span>{hackathon.registrations_count.toLocaleString()} participants</span>
                  </div>
                  
                  {hackathon.themes && hackathon.themes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {hackathon.themes.slice(0, 3).map((theme, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {typeof theme === 'object' ? theme.name : theme}
                        </Badge>
                      ))}
                      {hackathon.themes.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{hackathon.themes.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="pt-2">
                <Button asChild className="w-full">
                  <a 
                    href={hackathon.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    View Hackathon
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => {
                  if (currentPage > 1 && !isLoading) {
                    console.log(`Going to previous page: ${currentPage - 1}`);
                    handlePageChange(currentPage - 1);
                  }
                }}
                className={currentPage === 1 || isLoading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            
            {getPageNumbers().map((page, i) => (
              page === -1 ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={page === currentPage}
                    onClick={() => {
                      if (page !== currentPage && !isLoading) {
                        console.log(`Clicking on page ${page}`);
                        handlePageChange(page);
                      }
                    }}
                    className={isLoading ? 'pointer-events-none' : page === currentPage ? 'pointer-events-none' : 'cursor-pointer'}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => {
                  if (currentPage < totalPages && !isLoading) {
                    console.log(`Going to next page: ${currentPage + 1}`);
                    handlePageChange(currentPage + 1);
                  }
                }}
                className={currentPage === totalPages || isLoading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </>
    );
  }
} 