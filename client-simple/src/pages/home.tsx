import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bookmark } from "@shared/schema";
import Header from "@/components/header";
import SearchFilters from "@/components/search-filters";
import BookmarkCard from "@/components/bookmark-card";
import AddBookmarkModal from "@/components/add-bookmark-modal";
import { Button } from "@/components/ui/button";
import { Plus, Grid3X3, List, Share2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showShareInfo, setShowShareInfo] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Check if Web Share API is supported
  const canShare = typeof navigator !== 'undefined' && navigator.share;

  useEffect(() => {
    // Show share info on first visit
    const hasSeenShareInfo = localStorage.getItem('hasSeenShareInfo');
    if (!hasSeenShareInfo && isMobile) {
      setShowShareInfo(true);
      localStorage.setItem('hasSeenShareInfo', 'true');
    }
  }, [isMobile]);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'My Bookmarks',
        text: 'Save and organize your favorite articles',
        url: window.location.origin
      });
    } catch (error) {
      toast({
        title: "Share not supported",
        description: "Your browser doesn't support sharing. You can copy the URL instead.",
        variant: "destructive",
      });
    }
  };

  const { data: bookmarks = [], isLoading } = useQuery<Bookmark[]>({
    queryKey: ["/api/bookmarks/search", { q: searchQuery, tags: selectedTags.join(",") }],
    enabled: true,
  });

  const { data: allTags = [] } = useQuery<string[]>({
    queryKey: ["/api/tags"],
  });

  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesSearch = !searchQuery || 
      bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => bookmark.tags.includes(tag));

    return matchesSearch && matchesTags;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Share Info Banner */}
      {showShareInfo && isMobile && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mx-4 mt-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <Share2 className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-blue-700">
                <strong>Tip:</strong> You can share articles directly from your browser! 
                When reading an article, tap the share button and select "My Bookmarks" to save it instantly.
              </p>
              <button 
                onClick={() => setShowShareInfo(false)}
                className="mt-2 text-xs text-blue-600 underline"
              >
                Got it, don't show again
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SearchFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          allTags={allTags}
        />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {filteredBookmarks.length} bookmarks
            </span>
          </div>
          
          {!isMobile && (
            <div className="flex space-x-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="w-4 h-4 mr-2" />
                Grid
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4 mr-2" />
                List
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 animate-pulse">
                <div className="w-full h-48 bg-gray-200 rounded-t-xl"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-3"></div>
                  <div className="flex gap-2 mb-3">
                    <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                    <div className="h-6 w-12 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                    <div className="h-3 w-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookmarks found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || selectedTags.length > 0 
                ? "Try adjusting your search or filters" 
                : "Start saving your favorite articles and websites"}
            </p>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Bookmark
            </Button>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === "grid" 
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1"
          }`}>
            {filteredBookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="flex justify-around items-center">
            <button className="flex flex-col items-center space-y-1 text-primary">
              <div className="w-6 h-6 flex items-center justify-center">
                <Grid3X3 className="w-5 h-5" />
              </div>
              <span className="text-xs">Home</span>
            </button>
            <button 
              className="flex flex-col items-center space-y-1 text-gray-400"
              onClick={() => setIsAddModalOpen(true)}
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs">Add</span>
            </button>
          </div>
        </div>
      )}

      <AddBookmarkModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
