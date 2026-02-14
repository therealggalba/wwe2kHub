import React from 'react';
import styles from './BrandColumn.module.scss';

interface BrandColumnProps {
  name: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  children: React.ReactNode;
}

const BrandColumn: React.FC<BrandColumnProps> = ({ name, logo, primaryColor, secondaryColor, children }) => {

  return (
    <div 
      className={styles.column}
      style={{ 
        '--brand-primary': primaryColor,
        '--brand-secondary': secondaryColor
      } as React.CSSProperties}
    >
      <div className={styles.header}>
        {logo ? (
          <img src={logo} alt={name} className={styles.brandLogo} />
        ) : (
          <h2 className={styles.title}>{name}</h2>
        )}
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
};

export default BrandColumn;
