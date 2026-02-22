import React from 'react';
import styles from './FilterBar.module.scss';

export type GenderFilter = 'ALL' | 'MEN' | 'WOMEN';
export type AlignmentFilter = 'ALL' | 'FACES' | 'HEELS';

interface FilterBarProps {
  activeGender: GenderFilter;
  activeAlignment: AlignmentFilter;
  onGenderChange: (filter: GenderFilter) => void;
  onAlignmentChange: (filter: AlignmentFilter) => void;
  primaryColor: string;
  secondaryColor: string;
}

const FilterBar: React.FC<FilterBarProps> = ({ 
  activeGender,
  activeAlignment,
  onGenderChange,
  onAlignmentChange,
  primaryColor, 
  secondaryColor 
}) => {
  const genders: GenderFilter[] = ['MEN', 'WOMEN'];
  const alignments: AlignmentFilter[] = ['FACES', 'HEELS'];

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
          className={`${styles.filterButton} ${activeGender === 'ALL' && activeAlignment === 'ALL' ? styles.active : ''}`}
          onClick={() => {
            onGenderChange('ALL');
            onAlignmentChange('ALL');
          }}
        >
          ALL
        </button>
      </div>

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
