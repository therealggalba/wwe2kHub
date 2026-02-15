import React from 'react';
import { Link } from 'react-router-dom';
import { slugify } from '../../utils/slugify';
import styles from './ChampionRow.module.scss';
import type { Wrestler } from '../../models/types';

interface ChampionRowProps {
  titleName: string;
  titleImage?: string;
  champions: Wrestler[];
  primaryColor: string;
  secondaryColor: string;
}

const ChampionRow: React.FC<ChampionRowProps> = ({ 
  titleName, 
  titleImage, 
  champions, 
  primaryColor,
  secondaryColor
}) => {
  const isTagTeam = titleName.toLowerCase().includes('tag team');
  
  // 1. Deduplicate by name and Sort champions alphabetically for consistent display
  const uniqueChampionsMap = new Map<string, Wrestler>();
  champions.forEach(c => {
    if (!uniqueChampionsMap.has(c.name)) {
      uniqueChampionsMap.set(c.name, c);
    }
  });
  
  const sortedChampions = Array.from(uniqueChampionsMap.values())
    .sort((a, b) => a.name.localeCompare(b.name));
  
  let displayedName = 'No Champion';
  if (sortedChampions.length > 0) {
    if (isTagTeam && sortedChampions.length >= 2) {
      // Check if they share a faction
      const sharedFaction = sortedChampions[0].faction;
      const allShareFaction = sharedFaction && sortedChampions.every(c => c.faction === sharedFaction);
      
      if (allShareFaction) {
        displayedName = sharedFaction;
      } else {
        // Requirement: If no shared faction, use "prueba dummy faccion"
        displayedName = 'prueba dummy faccion';
      }
    } else {
      displayedName = sortedChampions[0].name;
    }
  }

  return (
    <div 
      className={styles.championRow} 
      style={{ 
        '--brand-primary': primaryColor,
        '--brand-secondary': secondaryColor 
      } as React.CSSProperties}
    >
      <div className={styles.titleInfo}>
        <div className={styles.titleIcon}>
          {titleImage ? <img src={titleImage} alt={titleName} /> : '🏆'}
        </div>
        <div className={styles.titleText}>
          <p className={styles.titleLabel}>{titleName}</p>
          <h3 className={styles.championName}>{displayedName.toUpperCase()}</h3>
        </div>
      </div>
      <div className={`${styles.portraitContainer} ${isTagTeam ? styles.tagTeamLayout : styles.singleLayout}`}>
        {sortedChampions.length > 0 ? (
          (isTagTeam ? sortedChampions.slice(0, 2) : [sortedChampions[0]]).map((champion, index) => (
            <Link 
              key={champion.id} 
              to={`/roster/${slugify(champion.name)}`}
              className={styles.championPortrait}
              style={{ '--index': index } as React.CSSProperties}
            >
              {champion.avatar ? (
                <img src={champion.avatar} alt={champion.name} />
              ) : (
                <div className={styles.placeholder}>👤</div>
              )}
            </Link>
          ))
        ) : (
          <div className={styles.championPortrait}>
            <div className={styles.placeholder}>👤</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChampionRow;
