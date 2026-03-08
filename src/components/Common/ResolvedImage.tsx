import React from 'react';
import { useAsset } from '../../hooks/useAsset';

interface ResolvedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
}

/**
 * An <img> tag that automatically resolves local asset paths.
 */
const ResolvedImage: React.FC<ResolvedImageProps> = ({ src, alt, ...props }) => {
  const resolvedSrc = useAsset(src);
  
  if (!src) return null;
  
  return <img src={resolvedSrc} alt={alt} {...props} />;
};

export default ResolvedImage;
