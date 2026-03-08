import React from 'react';
import { Link } from 'react-router-dom';
import { slugify } from '../../utils/slugify';
import { useAsset } from '../../hooks/useAsset';
import styles from './WrestlerCard.module.scss';

interface WrestlerCardProps {
  name: string;
  avatar?: string;
  image?: string;
  faction?: string;
  primaryColor: string;
  secondaryColor: string;
  isInjured?: boolean;
  injuryWeeks?: number;
  moral?: number;
}

const WrestlerCard: React.FC<WrestlerCardProps> = ({ 
  name, 
  avatar, 
  image, 
  faction, 
  primaryColor, 
  secondaryColor,
  isInjured,
  injuryWeeks,
  moral
}) => {
  const displayImageRaw = avatar || image;
  const displayImage = useAsset(displayImageRaw);
  const isLowMorale = (moral || 80) < 20;

  return (
    <Link 
      to={`/roster/${slugify(name)}`}
      className={`${styles.card} ${isInjured ? styles.injured : ''} ${isLowMorale ? styles.lowMorale : ''}`} 
      style={{ 
        '--brand-primary': primaryColor,
        '--brand-secondary': secondaryColor 
      } as React.CSSProperties}
    >
      <div className={styles.portrait}>
        {displayImage ? (
          <img src={displayImage} alt={name} />
        ) : (
          <div className={styles.placeholder}>👤</div>
        )}
        {isInjured && (
          <div className={styles.injuryOverlay}>
            <span className={styles.injuryWeeks}>{injuryWeeks}</span>
          </div>
        )}
      </div>
      <div className={styles.details}>
        <h4 className={styles.wrestlerName}>{name.toUpperCase()}</h4>
        {faction && <p className={styles.factionName}>{faction}</p>}
      </div>
    </Link>
  );
};

export default WrestlerCard;
