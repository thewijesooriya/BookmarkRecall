import { useState, useEffect } from 'react';
import { Route, Switch, Link, useLocation } from 'wouter';
import { Bookmark, Plus, Search, Share, Menu, X } from 'lucide-react';
import { clsx } from 'clsx';

interface BookmarkType {
  id: string;
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  domain: string;
  tags: string[];
  savedAt: string;
}

// Simple API client
async function apiRequest(method: string, url: string, data?: any) {
  const res = await fetch(url, {
    method,
    headers: data ? { 'Content-Type': 'application/json' } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!res.ok) {
    throw new Error(`${res.status}: ${res.statusText}`);
  }
  
  return res;
}

function AddBookmarkForm({ onAdd }: { onAdd: (bookmark: BookmarkType) => void }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !title) return;

    setLoading(true);
    try {
      const res = await apiRequest('POST', '/api/bookmarks', {
        url,
        title,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean)
      });
      const bookmark = await res.json();
      onAdd(bookmark);
      setUrl('');
      setTitle('');
      setTags('');
    } catch (error) {
      console.error('Failed to add bookmark:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-white">
      <div>
        <label className="block text-sm font-medium mb-1">URL</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="https://example.com"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Article title"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="tech, web, design"
        />
      </div>
      <button
        type="submit"
        disabled={loading || !url || !title}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Bookmark'}
      </button>
    </form>
  );
}

function BookmarkCard({ bookmark, onDelete }: { bookmark: BookmarkType; onDelete: (id: string) => void }) {
  const handleDelete = async () => {
    try {
      await apiRequest('DELETE', `/api/bookmarks/${bookmark.id}`);
      onDelete(bookmark.id);
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg line-clamp-2">
          <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {bookmark.title}
          </a>
        </h3>
        <button
          onClick={handleDelete}
          className="text-red-500 hover:text-red-700 ml-2"
        >
          <X size={16} />
        </button>
      </div>
      
      {bookmark.description && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">{bookmark.description}</p>
      )}
      
      <div className="flex flex-wrap gap-1 mb-2">
        {bookmark.tags.map((tag, index) => (
          <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
            {tag}
          </span>
        ))}
      </div>
      
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>{bookmark.domain}</span>
        <span>{new Date(bookmark.savedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

function HomePage() {
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const res = await apiRequest('GET', '/api/bookmarks');
      const data = await res.json();
      setBookmarks(data);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBookmark = (bookmark: BookmarkType) => {
    setBookmarks(prev => [bookmark, ...prev]);
    setShowAddForm(false);
  };

  const handleDeleteBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  const filteredBookmarks = bookmarks.filter(bookmark =>
    bookmark.title.toLowerCase().includes(search.toLowerCase()) ||
    bookmark.description?.toLowerCase().includes(search.toLowerCase()) ||
    bookmark.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading bookmarks...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="text-blue-600" size={24} />
              <h1 className="text-xl font-bold">My Bookmarks</h1>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={16} />
              Add Bookmark
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {showAddForm && (
          <div className="mb-6">
            <AddBookmarkForm onAdd={handleAddBookmark} />
          </div>
        )}

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bookmarks..."
              className="w-full pl-10 pr-4 py-2 border rounded-md"
            />
          </div>
        </div>

        {filteredBookmarks.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {search ? 'No bookmarks found' : 'No bookmarks yet'}
            </h3>
            <p className="text-gray-500">
              {search ? 'Try a different search term' : 'Add your first bookmark to get started'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredBookmarks.map(bookmark => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onDelete={handleDeleteBookmark}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function SharePage() {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check for shared content from Web Share API
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get('url');
    const sharedTitle = params.get('title');
    
    if (sharedUrl) setUrl(sharedUrl);
    if (sharedTitle) setTitle(sharedTitle);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !title) return;

    setLoading(true);
    try {
      await apiRequest('POST', '/api/bookmarks', { url, title });
      setSuccess(true);
    } catch (error) {
      console.error('Failed to save bookmark:', error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <div className="text-green-600 mb-4">
            <Bookmark size={48} className="mx-auto" />
          </div>
          <h2 className="text-xl font-bold mb-2">Bookmark Saved!</h2>
          <p className="text-gray-600 mb-4">Your article has been saved successfully.</p>
          <Link href="/">
            <a className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              View All Bookmarks
            </a>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Share className="text-blue-600" size={24} />
            <h1 className="text-xl font-bold">Save Article</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="https://example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Article title"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url || !title}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Bookmark'}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Switch>
      <Route path="/share" component={SharePage} />
      <Route path="/" component={HomePage} />
    </Switch>
  );
}