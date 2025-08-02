const express = require('express');
const serverless = require('serverless-http');

// Import your existing server code
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// In-memory storage for Netlify (you can upgrade to a database later)
const storage = new Map();
let tags = new Set();

// Helper function to generate UUID
function generateId() {
  return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to fetch URL metadata
async function fetchUrlMetadata(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BookmarkBot/1.0)',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || new URL(url).hostname;
    
    // Extract description from meta tags
    const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                           html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const description = descriptionMatch?.[1]?.trim() || '';
    
    // Extract image from meta tags
    const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
    const imageUrl = imageMatch?.[1]?.trim() || '';
    
    return { title, description, imageUrl };
  } catch (error) {
    console.error('Error fetching URL metadata:', error);
    return {
      title: new URL(url).hostname,
      description: '',
      imageUrl: '',
    };
  }
}

// API Routes
app.get('/api/bookmarks', (req, res) => {
  const bookmarks = Array.from(storage.values()).sort((a, b) => 
    new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );
  res.json(bookmarks);
});

app.get('/api/bookmarks/search', (req, res) => {
  const { q, tags: tagFilter } = req.query;
  let bookmarks = Array.from(storage.values());
  
  if (q && typeof q === 'string') {
    const lowercaseQuery = q.toLowerCase();
    bookmarks = bookmarks.filter(bookmark =>
      bookmark.title.toLowerCase().includes(lowercaseQuery) ||
      bookmark.description?.toLowerCase().includes(lowercaseQuery) ||
      bookmark.url.toLowerCase().includes(lowercaseQuery) ||
      bookmark.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }
  
  if (tagFilter && typeof tagFilter === 'string') {
    const tagArray = tagFilter.split(',').map(tag => tag.trim());
    bookmarks = bookmarks.filter(bookmark =>
      tagArray.some(tag => bookmark.tags.includes(tag))
    );
  }
  
  bookmarks.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  res.json(bookmarks);
});

app.get('/api/tags', (req, res) => {
  res.json(Array.from(tags).sort());
});

app.get('/api/url-metadata', async (req, res) => {
  const { url } = req.query;
  
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ message: "URL is required" });
  }

  try {
    const metadata = await fetchUrlMetadata(url);
    res.json(metadata);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch URL metadata" });
  }
});

app.post('/api/bookmarks', async (req, res) => {
  try {
    const { url, title, description, imageUrl, tags: bookmarkTags } = req.body;
    
    if (!url || !title) {
      return res.status(400).json({ message: "URL and title are required" });
    }
    
    let finalTitle = title;
    let finalDescription = description;
    let finalImageUrl = imageUrl;
    
    // If title is not provided, fetch metadata
    if (!title || !description) {
      const metadata = await fetchUrlMetadata(url);
      finalTitle = title || metadata.title;
      finalDescription = description || metadata.description;
      finalImageUrl = imageUrl || metadata.imageUrl;
    }
    
    const id = generateId();
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    const bookmark = {
      id,
      url,
      title: finalTitle,
      description: finalDescription || null,
      imageUrl: finalImageUrl || null,
      domain,
      tags: bookmarkTags || [],
      savedAt: new Date().toISOString(),
    };
    
    storage.set(id, bookmark);
    
    // Update tags
    if (bookmarkTags) {
      bookmarkTags.forEach(tag => tags.add(tag));
    }
    
    res.status(201).json(bookmark);
  } catch (error) {
    console.error('Error creating bookmark:', error);
    res.status(500).json({ message: "Failed to create bookmark" });
  }
});

app.patch('/api/bookmarks/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const existing = storage.get(id);
  if (!existing) {
    return res.status(404).json({ message: "Bookmark not found" });
  }
  
  const updated = { ...existing, ...updates };
  storage.set(id, updated);
  
  // Update tags
  if (updates.tags) {
    updates.tags.forEach(tag => tags.add(tag));
  }
  
  res.json(updated);
});

app.delete('/api/bookmarks/:id', (req, res) => {
  const { id } = req.params;
  
  if (!storage.has(id)) {
    return res.status(404).json({ message: "Bookmark not found" });
  }
  
  storage.delete(id);
  res.status(204).send();
});

module.exports.handler = serverless(app);