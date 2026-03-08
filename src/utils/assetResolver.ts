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
  if (path.startsWith('./')) return path.substring(1);
  return path;
};

/**
 * Resolves a path like "/visuals/Wrestlers/men/cody/avatar.png" 
 * to a local Blob URL if a folder is linked.
 */
export const resolveAssetPath = async (path: string | undefined): Promise<string | undefined> => {
  if (!path) return undefined;
  
  const normalized = normalizeVisualsPath(path);
  if (!directoryHandle) return normalized;

  // We only intercept paths that start with /visuals/
  if (!normalized?.startsWith('/visuals/')) return path;

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
    // If not found in local folder, fallback to normalized path
    return normalized;
  }
};

/**
 * For functional components that need sync resolution (renders), 
 * returns the original path but we can trigger pre-fetching if needed.
 */
export const getQuickAssetPath = (path: string | undefined): string | undefined => {
  if (!path) return undefined;
  const normalized = normalizeVisualsPath(path);
  if (!directoryHandle) return normalized;
  return blobUrlCache.get(normalized!) || normalized;
};
