import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBookmarkSchema } from "@shared/schema";
import { z } from "zod";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bookmark, X, Loader2, CheckCircle, ArrowLeft } from "lucide-react";

const formSchema = insertBookmarkSchema.extend({
  tagsInput: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function Share() {
  const [, navigate] = useLocation();
  const [tags, setTags] = useState<string[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
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

  // Extract URL parameters for shared content
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedUrl = urlParams.get('url') || urlParams.get('text');
    const sharedTitle = urlParams.get('title');
    const sharedDescription = urlParams.get('description');

    if (sharedUrl) {
      form.setValue("url", sharedUrl);
      if (sharedTitle) {
        form.setValue("title", decodeURIComponent(sharedTitle));
      }
      if (sharedDescription) {
        form.setValue("description", decodeURIComponent(sharedDescription));
      }
      
      // Auto-fetch metadata if title is not provided
      if (!sharedTitle) {
        fetchMetadata(sharedUrl);
      }
    }
  }, [form]);

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

      const response = await apiRequest("POST", "/api/bookmarks", bookmarkData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      setIsSaved(true);
      toast({
        title: "Bookmark saved",
        description: "Your bookmark has been successfully saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save bookmark. Please try again.",
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
    if (url) {
      fetchMetadata(url);
    }
  };

  if (isSaved) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Bookmark Saved!</h2>
            <p className="text-gray-600 mb-6">
              Your article has been successfully added to your bookmarks.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate("/")} className="w-full">
                View All Bookmarks
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsSaved(false)} 
                className="w-full"
              >
                Save Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="mr-3"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900 flex items-center">
              <Bookmark className="w-5 h-5 text-primary mr-2" />
              Save to My Bookmarks
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 sm:px-6 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Bookmark</CardTitle>
          </CardHeader>
          <CardContent>
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
                          required
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
                            required
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
                    onClick={() => navigate("/")}
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
                        Saving...
                      </>
                    ) : (
                      "Save Bookmark"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}