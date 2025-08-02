import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookmarkSchema } from "@shared/schema";
import { z } from "zod";

async function fetchUrlMetadata(url: string) {
  try {
    // Validate URL format
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid URL protocol');
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BookmarkBot/1.0)',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      // Return basic info for non-HTML content
      return {
        title: parsedUrl.hostname,
        description: '',
        imageUrl: '',
      };
    }
    
    const html = await response.text();
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || parsedUrl.hostname;
    
    // Extract description from meta tags
    const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                           html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const description = descriptionMatch?.[1]?.trim() || '';
    
    // Extract image from meta tags
    const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
    let imageUrl = imageMatch?.[1]?.trim() || '';
    
    // Convert relative URLs to absolute
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = new URL(imageUrl, url).href;
    }
    
    return { title, description, imageUrl };
  } catch (error) {
    console.error('Error fetching URL metadata:', error);
    try {
      const fallbackUrl = new URL(url);
      return {
        title: fallbackUrl.hostname,
        description: '',
        imageUrl: '',
      };
    } catch {
      return {
        title: 'Invalid URL',
        description: '',
        imageUrl: '',
      };
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all bookmarks
  app.get("/api/bookmarks", async (_req, res) => {
    try {
      const bookmarks = await storage.getAllBookmarks();
      res.json(bookmarks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  // Search bookmarks
  app.get("/api/bookmarks/search", async (req, res) => {
    try {
      const { q, tags } = req.query;
      
      let bookmarks;
      if (q && typeof q === 'string') {
        bookmarks = await storage.searchBookmarks(q);
      } else if (tags && typeof tags === 'string') {
        const tagArray = tags.split(',').map(tag => tag.trim());
        bookmarks = await storage.filterBookmarksByTags(tagArray);
      } else {
        bookmarks = await storage.getAllBookmarks();
      }
      
      res.json(bookmarks);
    } catch (error) {
      res.status(500).json({ message: "Failed to search bookmarks" });
    }
  });

  // Get all tags
  app.get("/api/tags", async (_req, res) => {
    try {
      const tags = await storage.getAllTags();
      res.json(tags);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  // Fetch URL metadata
  app.get("/api/url-metadata", async (req, res) => {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: "URL is required" });
      }

      const metadata = await fetchUrlMetadata(url);
      res.json(metadata);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch URL metadata" });
    }
  });

  // Create bookmark
  app.post("/api/bookmarks", async (req, res) => {
    try {
      const validatedData = insertBookmarkSchema.parse(req.body);
      
      // If title is not provided, fetch metadata
      if (!validatedData.title || !validatedData.description) {
        const metadata = await fetchUrlMetadata(validatedData.url);
        validatedData.title = validatedData.title || metadata.title;
        validatedData.description = validatedData.description || metadata.description;
        validatedData.imageUrl = validatedData.imageUrl || metadata.imageUrl;
      }
      
      const bookmark = await storage.createBookmark(validatedData);
      res.status(201).json(bookmark);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid bookmark data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create bookmark" });
      }
    }
  });

  // Update bookmark
  app.patch("/api/bookmarks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertBookmarkSchema.partial().parse(req.body);
      
      const bookmark = await storage.updateBookmark(id, validatedData);
      if (!bookmark) {
        return res.status(404).json({ message: "Bookmark not found" });
      }
      
      res.json(bookmark);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid bookmark data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update bookmark" });
      }
    }
  });

  // Delete bookmark
  app.delete("/api/bookmarks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteBookmark(id);
      
      if (!success) {
        return res.status(404).json({ message: "Bookmark not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete bookmark" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
