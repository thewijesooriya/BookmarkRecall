export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

export function generateBookmarkletCode(): string {
  const replitDomains = (import.meta.env.VITE_REPLIT_DOMAINS || 'localhost:5000').split(',');
  const baseUrl = `https://${replitDomains[0]}`;
  
  return `javascript:(function(){
    var url = encodeURIComponent(window.location.href);
    var title = encodeURIComponent(document.title);
    var description = encodeURIComponent(
      document.querySelector('meta[name="description"]')?.content || 
      document.querySelector('meta[property="og:description"]')?.content || 
      ''
    );
    var bookmarkUrl = '${baseUrl}/?add=' + url + '&title=' + title + '&description=' + description;
    window.open(bookmarkUrl, '_blank', 'width=500,height=600');
  })();`;
}
