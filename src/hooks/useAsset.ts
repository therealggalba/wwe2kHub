import { useState, useEffect } from 'react';
import { resolveAssetPath, getQuickAssetPath } from '../utils/assetResolver';

/**
 * Hook to resolve an asset path (local or remote).
 */
export const useAsset = (path: string | undefined): string | undefined => {
  const [resolvedPath, setResolvedPath] = useState<string | undefined>(getQuickAssetPath(path));

  useEffect(() => {
    let isCancelled = false;

    const resolve = async () => {
      const result = await resolveAssetPath(path);
      if (!isCancelled) {
        setResolvedPath(result);
      }
    };

    resolve();

    return () => {
      isCancelled = true;
    };
  }, [path]);

  return resolvedPath;
};
