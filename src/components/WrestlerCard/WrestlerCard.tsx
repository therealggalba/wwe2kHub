import React from 'react';
import { Link } from 'react-router-dom';
import { slugify } from '../../utils/slugify';
import styles from './WrestlerCard.module.scss';

interface WrestlerCardProps {
  name: string;
  avatar?: string;
  image?: string;
  faction?: string;
  primaryColor: string;
  secondaryColor: string;
}

const WrestlerCard: React.FC<WrestlerCardProps> = ({ 
  name, 
  avatar, 
  image, 
  faction, 
  primaryColor, 
  secondaryColor 
}) => {
  const displayImage = avatar || image;
  return (
    <Link 
      to={`/roster/${slugify(name)}`}
      className={styles.card} 
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
      </div>
      <div className={styles.details}>
        <h4 className={styles.wrestlerName}>{name.toUpperCase()}</h4>
        {faction && <p className={styles.factionName}>{faction}</p>}
      </div>
    </Link>
  );
};

export default WrestlerCard;
