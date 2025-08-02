import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  allTags: string[];
}

const tagColors = [
  "bg-blue-100 text-blue-800 hover:bg-blue-200",
  "bg-green-100 text-green-800 hover:bg-green-200",
  "bg-purple-100 text-purple-800 hover:bg-purple-200",
  "bg-orange-100 text-orange-800 hover:bg-orange-200",
  "bg-red-100 text-red-800 hover:bg-red-200",
  "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  "bg-pink-100 text-pink-800 hover:bg-pink-200",
  "bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
];

export default function SearchFilters({
  searchQuery,
  onSearchChange,
  selectedTags,
  onTagsChange,
  allTags,
}: SearchFiltersProps) {
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const clearAllTags = () => {
    onTagsChange([]);
  };

  return (
    <div className="mb-8">
      {/* Search Bar */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <Input
          type="text"
          placeholder="Search bookmarks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 py-3 bg-white shadow-sm border-gray-300 focus:border-primary focus:ring-primary"
        />
      </div>

      {/* Filter Tags */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm font-medium text-gray-700 mr-2 py-1">Filter by tags:</span>
          {allTags.slice(0, 10).map((tag, index) => {
            const isSelected = selectedTags.includes(tag);
            const colorClass = tagColors[index % tagColors.length];
            
            return (
              <Button
                key={tag}
                variant="ghost"
                size="sm"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  isSelected 
                    ? colorClass + " ring-2 ring-blue-500 ring-offset-1"
                    : colorClass
                }`}
              >
                {tag}
                {isSelected && <X className="w-3 h-3 ml-1" />}
              </Button>
            );
          })}
          
          {selectedTags.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllTags}
              className="px-3 py-1 text-gray-500 hover:text-gray-700"
            >
              Clear all
            </Button>
          )}
        </div>
      )}

      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm font-medium text-gray-700 mr-2 py-1">Active filters:</span>
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="px-3 py-1 cursor-pointer hover:bg-gray-200"
              onClick={() => toggleTag(tag)}
            >
              {tag}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
