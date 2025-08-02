import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MoreHorizontal, ExternalLink, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import AddBookmarkModal from "@/components/add-bookmark-modal";

interface BookmarkCardProps {
  bookmark: Bookmark;
  viewMode: "grid" | "list";
}

const tagColors = [
  "bg-blue-100 text-blue-800",
  "bg-green-100 text-green-800",
  "bg-purple-100 text-purple-800",
  "bg-orange-100 text-orange-800",
  "bg-red-100 text-red-800",
  "bg-yellow-100 text-yellow-800",
  "bg-pink-100 text-pink-800",
  "bg-indigo-100 text-indigo-800",
];

export default function BookmarkCard({ bookmark, viewMode }: BookmarkCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/bookmarks/${bookmark.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      toast({
        title: "Bookmark deleted",
        description: "The bookmark has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete bookmark. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this bookmark?")) {
      deleteMutation.mutate();
    }
  };

  const handleOpenUrl = () => {
    window.open(bookmark.url, "_blank", "noopener,noreferrer");
  };

  if (viewMode === "list") {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {bookmark.imageUrl && (
              <img
                src={bookmark.imageUrl}
                alt={bookmark.title}
                className="w-32 h-24 object-cover rounded-lg flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 
                  className="font-semibold text-gray-900 hover:text-primary transition-colors cursor-pointer"
                  onClick={handleOpenUrl}
                >
                  {bookmark.title}
                </h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleOpenUrl}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {bookmark.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {bookmark.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-1 mb-3">
                {bookmark.tags.slice(0, 5).map((tag, index) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className={`text-xs ${tagColors[index % tagColors.length]}`}
                  >
                    {tag}
                  </Badge>
                ))}
                {bookmark.tags.length > 5 && (
                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                    +{bookmark.tags.length - 5} more
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{bookmark.domain}</span>
                <span>{formatDistanceToNow(new Date(bookmark.savedAt), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        </CardContent>
        
        <AddBookmarkModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          editBookmark={bookmark}
        />
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      {bookmark.imageUrl && (
        <img
          src={bookmark.imageUrl}
          alt={bookmark.title}
          className="w-full h-48 object-cover rounded-t-xl"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 
            className="font-semibold text-gray-900 line-clamp-2 hover:text-primary transition-colors cursor-pointer"
            onClick={handleOpenUrl}
          >
            {bookmark.title}
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleOpenUrl}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {bookmark.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {bookmark.description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-1 mb-3">
          {bookmark.tags.slice(0, 3).map((tag, index) => (
            <Badge
              key={tag}
              variant="secondary"
              className={`text-xs ${tagColors[index % tagColors.length]}`}
            >
              {tag}
            </Badge>
          ))}
          {bookmark.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
              +{bookmark.tags.length - 3}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{bookmark.domain}</span>
          <span>{formatDistanceToNow(new Date(bookmark.savedAt), { addSuffix: true })}</span>
        </div>
      </CardContent>
      
      <AddBookmarkModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editBookmark={bookmark}
      />
    </Card>
  );
}
