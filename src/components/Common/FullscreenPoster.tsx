import React, { useEffect } from 'react';
import styles from './FullscreenPoster.module.scss';
import ResolvedImage from './ResolvedImage';

interface FullscreenPosterProps {
  src: string;
  alt: string;
  onClose: () => void;
}

const FullscreenPoster: React.FC<FullscreenPosterProps> = ({ src, alt, onClose }) => {
  // Prevent scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        <ResolvedImage src={src} alt={alt} className={styles.poster} />
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>
    </div>
  );
};

export default FullscreenPoster;
