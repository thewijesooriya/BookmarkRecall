import { type Bookmark, type InsertBookmark } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getBookmark(id: string): Promise<Bookmark | undefined>;
  getAllBookmarks(): Promise<Bookmark[]>;
  searchBookmarks(query: string): Promise<Bookmark[]>;
  filterBookmarksByTags(tags: string[]): Promise<Bookmark[]>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  updateBookmark(id: string, bookmark: Partial<InsertBookmark>): Promise<Bookmark | undefined>;
  deleteBookmark(id: string): Promise<boolean>;
  getAllTags(): Promise<string[]>;
}

export class MemStorage implements IStorage {
  private bookmarks: Map<string, Bookmark>;

  constructor() {
    this.bookmarks = new Map();
  }

  async getBookmark(id: string): Promise<Bookmark | undefined> {
    return this.bookmarks.get(id);
  }

  async getAllBookmarks(): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values()).sort((a, b) => 
      new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
  }

  async searchBookmarks(query: string): Promise<Bookmark[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.bookmarks.values()).filter(bookmark =>
      bookmark.title.toLowerCase().includes(lowercaseQuery) ||
      bookmark.description?.toLowerCase().includes(lowercaseQuery) ||
      bookmark.url.toLowerCase().includes(lowercaseQuery) ||
      bookmark.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    ).sort((a, b) => 
      new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
  }

  async filterBookmarksByTags(tags: string[]): Promise<Bookmark[]> {
    if (tags.length === 0) return this.getAllBookmarks();
    
    return Array.from(this.bookmarks.values()).filter(bookmark =>
      tags.some(tag => bookmark.tags.includes(tag))
    ).sort((a, b) => 
      new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
  }

  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    const id = randomUUID();
    const url = new URL(insertBookmark.url);
    const domain = url.hostname;
    
    const bookmark: Bookmark = {
      id,
      url: insertBookmark.url,
      title: insertBookmark.title,
      description: insertBookmark.description ?? null,
      imageUrl: insertBookmark.imageUrl ?? null,
      domain,
      tags: insertBookmark.tags || [],
      savedAt: new Date(),
    };
    
    this.bookmarks.set(id, bookmark);
    return bookmark;
  }

  async updateBookmark(id: string, updateData: Partial<InsertBookmark>): Promise<Bookmark | undefined> {
    const existing = this.bookmarks.get(id);
    if (!existing) return undefined;

    const updated: Bookmark = {
      ...existing,
      ...updateData,
    };

    this.bookmarks.set(id, updated);
    return updated;
  }

  async deleteBookmark(id: string): Promise<boolean> {
    return this.bookmarks.delete(id);
  }

  async getAllTags(): Promise<string[]> {
    const tagSet = new Set<string>();
    for (const bookmark of Array.from(this.bookmarks.values())) {
      bookmark.tags.forEach((tag: string) => tagSet.add(tag));
    }
    return Array.from(tagSet).sort();
  }
}

export const storage = new MemStorage();
