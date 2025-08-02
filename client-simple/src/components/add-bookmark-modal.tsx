import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertBookmarkSchema, type Bookmark } from "@shared/schema";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X, Loader2 } from "lucide-react";

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  editBookmark?: Bookmark;
}

const formSchema = insertBookmarkSchema.extend({
  tagsInput: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function AddBookmarkModal({ isOpen, onClose, editBookmark }: AddBookmarkModalProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      title: "",
      description: "",
      imageUrl: "",
      tagsInput: "",
    },
  });

  useEffect(() => {
    if (editBookmark) {
      form.setValue("url", editBookmark.url);
      form.setValue("title", editBookmark.title);
      form.setValue("description", editBookmark.description || "");
      form.setValue("imageUrl", editBookmark.imageUrl || "");
      setTags(editBookmark.tags);
    } else {
      form.reset();
      setTags([]);
    }
  }, [editBookmark, form]);

  const fetchMetadata = async (url: string) => {
    if (!url) return;
    
    setIsLoadingMetadata(true);
    try {
      const response = await fetch(`/api/url-metadata?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const metadata = await response.json();
        
        if (!form.getValues("title")) {
          form.setValue("title", metadata.title);
        }
        if (!form.getValues("description")) {
          form.setValue("description", metadata.description);
        }
        if (!form.getValues("imageUrl")) {
          form.setValue("imageUrl", metadata.imageUrl);
        }
      }
    } catch (error) {
      console.error("Failed to fetch metadata:", error);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const bookmarkData = {
        url: data.url,
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        tags,
      };

      if (editBookmark) {
        const response = await apiRequest("PATCH", `/api/bookmarks/${editBookmark.id}`, bookmarkData);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/bookmarks", bookmarkData);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      toast({
        title: editBookmark ? "Bookmark updated" : "Bookmark saved",
        description: editBookmark 
          ? "Your bookmark has been successfully updated."
          : "Your bookmark has been successfully saved.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to ${editBookmark ? "update" : "save"} bookmark. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: FormData) => {
    saveMutation.mutate(data);
  };

  const addTag = (tagInput: string) => {
    const newTags = tagInput
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag && !tags.includes(tag));
    
    if (newTags.length > 0) {
      setTags([...tags, ...newTags]);
      form.setValue("tagsInput", "");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleUrlBlur = () => {
    const url = form.getValues("url");
    if (url && !editBookmark) {
      fetchMetadata(url);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editBookmark ? "Edit Bookmark" : "Add New Bookmark"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="url"
                      placeholder="https://example.com"
                      onBlur={handleUrlBlur}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder="Article title will be auto-fetched"
                      />
                      {isLoadingMetadata && (
                        <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      rows={3}
                      placeholder="Optional description"
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      type="url"
                      placeholder="Optional image URL"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tagsInput"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Add tags separated by commas"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          addTag(field.value || "");
                        }
                      }}
                      onBlur={() => {
                        if (field.value) {
                          addTag(field.value);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer">
                    {tag}
                    <X
                      className="w-3 h-3 ml-1"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editBookmark ? "Updating..." : "Saving..."}
                  </>
                ) : (
                  editBookmark ? "Update Bookmark" : "Save Bookmark"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
