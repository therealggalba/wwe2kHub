import { db } from '../db/db';

let directoryHandle: FileSystemDirectoryHandle | null = null;
const blobUrlCache = new Map<string, string>();

/**
 * Request or refresh permission for the local assets folder.
 */
export const linkAssetsFolder = async (): Promise<boolean> => {
  try {
    // @ts-expect-error - showDirectoryPicker is a newer API
    const handle = await window.showDirectoryPicker();
    directoryHandle = handle;
    
    // Store handle in settings for persistence
    await db.settings.put({ key: 'assetsDirectoryHandle', value: handle });
    
    // Clear cache on new link
    blobUrlCache.forEach(url => URL.revokeObjectURL(url));
    blobUrlCache.clear();
    
    return true;
  } catch (err) {
    console.error('Error linking assets folder:', err);
    return false;
  }
};

/**
 * Load the stored handle from IndexedDB and verify permissions.
 */
export const initAssetsFolder = async (): Promise<boolean> => {
  const stored = await db.settings.get('assetsDirectoryHandle');
  if (stored && stored.value) {
    directoryHandle = stored.value as FileSystemDirectoryHandle;
    return true;
  }
  return false;
};

/**
 * Check if the handle still has permission.
 */
export const checkAssetsPermission = async (): Promise<boolean> => {
  if (!directoryHandle) return false;
  // @ts-expect-error - FileSystemDirectoryHandle.queryPermission is experimental
  const state = await directoryHandle.queryPermission({ mode: 'read' });
  return state === 'granted';
};

/**
 * Re-request permission for the existing handle.
 */
export const requestAssetsPermission = async (): Promise<boolean> => {
  if (!directoryHandle) return false;
  // @ts-expect-error - FileSystemDirectoryHandle.requestPermission is experimental
  const state = await directoryHandle.requestPermission({ mode: 'read' });
  return state === 'granted';
};

/**
 * Normalizes a path to ensure it's absolute-style for the public folder
 * (e.g., "./visuals/..." -> "/visuals/...")
 */
export const normalizeVisualsPath = (path: string | undefined): string | undefined => {
  if (!path) return undefined;
  
  let cleanPath = path;
  
  // If it's already an absolute HTTP URL or blob, leave it alone
  if (cleanPath.startsWith('http') || cleanPath.startsWith('blob:') || cleanPath.startsWith('data:')) {
    return cleanPath;
  }
  
  // Don't modify if it's already prefixed correctly with base URL
  const baseUrl = import.meta.env.BASE_URL;
  if (baseUrl !== '/' && cleanPath.startsWith(baseUrl)) {
      return cleanPath;
  }

  // Remove leading dot or slash to standardize
  if (cleanPath.startsWith('./')) cleanPath = cleanPath.substring(1);
  if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
  
  return cleanPath;
};

/**
 * Resolves a path like "/visuals/Wrestlers/men/cody/avatar.png" 
 * to a local Blob URL if a folder is linked.
 */
export const resolveAssetPath = async (path: string | undefined): Promise<string | undefined> => {
  if (!path) return undefined;
  
  const normalized = normalizeVisualsPath(path);
  const baseUrl = import.meta.env.BASE_URL;

  const appendBaseUrl = (p: string) => {
    // If it's an external URL, just return it
    if (p.startsWith('http') || p.startsWith('data:') || p.startsWith('blob:')) return p;
    
    // Check if it already has the BASE_URL to prevent duplicates
    if (baseUrl !== '/' && p.startsWith(baseUrl)) return p;
    
    // For GitHub Pages subdirectory deploy via Vite, it's safer to use relative paths without a leading slash
    // or properly structure them as `${baseUrl}visuals/...`
    const cleanPath = p.startsWith('/') ? p.substring(1) : p;
    if (baseUrl !== '/') {
        return `${baseUrl}${cleanPath}`;
    }
    
    // On localhost (where baseUrl is '/'), we keep the leading slash for root absolute resolution
    return `/${cleanPath}`;
  };

  if (!directoryHandle) return normalized ? appendBaseUrl(normalized) : normalized;

  if (!normalized?.startsWith('/visuals/')) {
    return appendBaseUrl(normalized!);
  }

  // Check cache
  if (blobUrlCache.has(normalized)) return blobUrlCache.get(normalized);

  try {
    // Normalize path: remove leading /visuals/ and split segments
    const parts = normalized.replace(/^\/visuals\//, '').split('/');
    
    let currentHandle = directoryHandle;
    
    // Traverse subdirectories
    for (let i = 0; i < parts.length - 1; i++) {
        currentHandle = await currentHandle.getDirectoryHandle(parts[i]);
    }
    
    // Get the file
    const fileHandle = await currentHandle.getFileHandle(parts[parts.length - 1]);
    const file = await fileHandle.getFile();
    
    // Create Blob URL
    const url = URL.createObjectURL(file);
    blobUrlCache.set(normalized, url);
    
    return url;
  } catch {
    return appendBaseUrl(normalized!);
  }
};

/**
 * For functional components that need sync resolution (renders), 
 * returns the original path but we can trigger pre-fetching if needed.
 */
export const getQuickAssetPath = (path: string | undefined): string | undefined => {
  if (!path) return undefined;
  const normalized = normalizeVisualsPath(path);
  const baseUrl = import.meta.env.BASE_URL;

  const appendBaseUrl = (p: string) => {
    // If it's an external URL, just return it
    if (p.startsWith('http') || p.startsWith('data:') || p.startsWith('blob:')) return p;
    
    // Check if it already has the BASE_URL to prevent duplicates
    if (baseUrl !== '/' && p.startsWith(baseUrl)) return p;
    
    // Fix absolute pathing by joining with the configured base
    const cleanPath = p.startsWith('/') ? p.substring(1) : p;
    if (baseUrl !== '/') {
        return `${baseUrl}${cleanPath}`;
    }
    
    // Localhost fallback
    return `/${cleanPath}`;
  };

  if (!directoryHandle) return normalized ? appendBaseUrl(normalized) : normalized;

  let finalPath = blobUrlCache.get(normalized!) || normalized;
  
  if (finalPath && !finalPath.startsWith('blob:')) {
    finalPath = appendBaseUrl(finalPath);
  }
  
  return finalPath;
};
