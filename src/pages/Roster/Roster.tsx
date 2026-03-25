import React, { useEffect, useState } from 'react';
import { db } from '../../db/db';
import type { Brand, Wrestler, Championship } from '../../models/types';
import BrandColumn from '../../components/BrandColumn/BrandColumn';
import WrestlerCard from '../../components/WrestlerCard/WrestlerCard';
import ChampionRow from '../../components/ChampionRow/ChampionRow';
import FilterBar, { type GenderFilter, type AlignmentFilter } from '../../components/FilterBar/FilterBar';
import styles from './Roster.module.scss';
import { useTranslation } from 'react-i18next';

interface BrandFilters {
  gender: GenderFilter;
  alignment: AlignmentFilter;
}

const Roster: React.FC = () => {
  const { t } = useTranslation();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [wrestlers, setWrestlers] = useState<Wrestler[]>([]);
  const [titles, setTitles] = useState<Championship[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<number, BrandFilters>>({});
  const [loading, setLoading] = useState(true);
  const loadingRef = React.useRef(false);

  useEffect(() => {
    const loadData = async () => {
      if (loadingRef.current) return;
      loadingRef.current = true;

      const allBrands = await db.brands.toArray();
      const allWrestlers = await db.wrestlers.toArray();
      const allTitles = await db.championships.toArray();

      setBrands(allBrands.filter(b => b.name !== 'FREE AGENT' && b.name !== 'SHARED'));
      setWrestlers(allWrestlers);
      setTitles(allTitles);
      setLoading(false);
      loadingRef.current = false;
    };

    loadData();
  }, []);

  const handleGenderChange = (brandId: number, filter: GenderFilter) => {
    setActiveFilters(prev => ({
      ...prev,
      [brandId]: { ...(prev[brandId] || { gender: 'ALL', alignment: 'ALL' }), gender: filter }
    }));
  };

  const handleAlignmentChange = (brandId: number, filter: AlignmentFilter) => {
    setActiveFilters(prev => ({
      ...prev,
      [brandId]: { ...(prev[brandId] || { gender: 'ALL', alignment: 'ALL' }), alignment: filter }
    }));
  };

  if (loading) return <div>{t('roster.loading')}</div>;

  return (
    <div className={styles.rosterPage}>
      <div className={styles.brandContainer}>
        {brands.map((brand) => {
          const brandId = brand.id!;
          const brandWrestlers = wrestlers.filter((w) => w.brandId === brandId && w.isActive !== false);
          const brandTitles = titles.filter((t) => t.brandId === brandId);
          const currentFilters = activeFilters[brandId] || { gender: 'ALL', alignment: 'ALL' };

          const filteredWrestlers = brandWrestlers.filter(w => {
            const matchesGender = 
              currentFilters.gender === 'ALL' || 
              (currentFilters.gender === 'MEN' && w.gender === 'Male') || 
              (currentFilters.gender === 'WOMEN' && w.gender === 'Female');

            const matchesAlignment = 
              currentFilters.alignment === 'ALL' || 
              (currentFilters.alignment === 'FACES' && w.alignment === 'Face') || 
              (currentFilters.alignment === 'HEELS' && w.alignment === 'Heel');

            return matchesGender && matchesAlignment;
          });

          return (
            <BrandColumn 
              key={brandId}
              name={brand.name}
              logo={brand.logo}
              primaryColor={brand.primaryColor}
              secondaryColor={brand.secondaryColor}
            >
              <div className={styles.championsSection}>
                {brandTitles.map(title => {
                  const titleChampions = brandWrestlers.filter(w => w.currentTitlesIds.includes(title.id!));
                  return (
                    <ChampionRow 
                      key={title.id}
                      titleName={title.name}
                      titleImage={title.image}
                      champions={titleChampions}
                      primaryColor={brand.primaryColor}
                      secondaryColor={brand.secondaryColor}
                    />
                  );
                })}
              </div>

              <FilterBar 
                activeGender={currentFilters.gender}
                activeAlignment={currentFilters.alignment}
                onGenderChange={(f) => handleGenderChange(brandId, f)}
                onAlignmentChange={(f) => handleAlignmentChange(brandId, f)}
                primaryColor={brand.primaryColor}
                secondaryColor={brand.secondaryColor}
              />

              <div className={styles.rosterGrid}>
                {filteredWrestlers
                  .filter(w => !brandTitles.some(t => w.currentTitlesIds.includes(t.id!))) // Exclude champions from grid
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((wrestler) => (
                    <WrestlerCard 
                      key={wrestler.id}
                      name={wrestler.name}
                      avatar={wrestler.avatar}
                      image={wrestler.image}
                      faction={wrestler.faction}
                      primaryColor={brand.primaryColor}
                      secondaryColor={brand.secondaryColor}
                      isInjured={wrestler.injuryWeeks > 0}
                      injuryWeeks={wrestler.injuryWeeks}
                    />
                  ))}
              </div>
            </BrandColumn>
          );
        })}
      </div>
    </div>
  );
};

export default Roster;
