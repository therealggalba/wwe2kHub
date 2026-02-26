import React from 'react';
import styles from './FilterBar.module.scss';
import type { Brand } from '../../models/types';

export type GenderFilter = 'ALL' | 'MEN' | 'WOMEN';
export type AlignmentFilter = 'ALL' | 'FACES' | 'HEELS';

interface FilterBarProps {
  activeGender: GenderFilter;
  activeAlignment: AlignmentFilter;
  onGenderChange: (filter: GenderFilter) => void;
  onAlignmentChange: (filter: AlignmentFilter) => void;
  primaryColor: string;
  secondaryColor: string;
  // Brand filtering additions
  brands?: Brand[];
  activeBrandId?: number;
  onBrandChange?: (brandId: number | undefined) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ 
  activeGender,
  activeAlignment,
  onGenderChange,
  onAlignmentChange,
  primaryColor, 
  secondaryColor,
  brands,
  activeBrandId,
  onBrandChange
}) => {
  const genders: GenderFilter[] = ['MEN', 'WOMEN'];
  const alignments: AlignmentFilter[] = ['FACES', 'HEELS'];

  const fixPath = (path: string | undefined): string => {
    if (!path) return "";
    if (path.startsWith("./")) return path.replace("./", "/");
    return path;
  };

  return (
    <div 
      className={styles.filterBar}
      style={{ 
        '--brand-primary': primaryColor,
        '--brand-secondary': secondaryColor 
      } as React.CSSProperties}
    >
      <div className={styles.filterGroup}>
        <button
          className={`${styles.filterButton} ${activeGender === 'ALL' && activeAlignment === 'ALL' && !activeBrandId ? styles.active : ''}`}
          onClick={() => {
            onGenderChange('ALL');
            onAlignmentChange('ALL');
            if (onBrandChange) onBrandChange(undefined);
          }}
        >
          ALL
        </button>
      </div>

      {brands && brands.length > 0 && onBrandChange && (
        <div className={styles.filterGroup}>
          {brands.map((brand) => (
            <button
              key={brand.id}
              className={`${styles.filterButton} ${styles.brandBtn} ${activeBrandId === brand.id ? styles.active : ''}`}
              onClick={() => onBrandChange(activeBrandId === brand.id ? undefined : brand.id)}
              title={brand.name}
            >
              <img src={fixPath(brand.logo)} alt={brand.name} className={styles.miniBrandLogo} />
            </button>
          ))}
        </div>
      )}

      <div className={styles.filterGroup}>
        {genders.map((filter) => (
          <button
            key={filter}
            className={`${styles.filterButton} ${activeGender === filter ? styles.active : ''}`}
            onClick={() => onGenderChange(activeGender === filter ? 'ALL' : filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className={styles.filterGroup}>
        {alignments.map((filter) => (
          <button
            key={filter}
            className={`${styles.filterButton} ${activeAlignment === filter ? styles.active : ''}`}
            onClick={() => onAlignmentChange(activeAlignment === filter ? 'ALL' : filter)}
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterBar;
