import React, { useEffect, useState } from 'react';
import { db } from '../../db/db';
import type { Brand, Wrestler, Championship, BrandName } from '../../models/types';
import BrandColumn from '../../components/BrandColumn/BrandColumn';
import WrestlerCard from '../../components/WrestlerCard/WrestlerCard';
import ChampionRow from '../../components/ChampionRow/ChampionRow';
import FilterBar, { type GenderFilter, type AlignmentFilter } from '../../components/FilterBar/FilterBar';
import styles from './Roster.module.scss';

interface BrandFilters {
  gender: GenderFilter;
  alignment: AlignmentFilter;
}

const Roster: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [wrestlers, setWrestlers] = useState<Wrestler[]>([]);
  const [titles, setTitles] = useState<Championship[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<number, BrandFilters>>({});
  const [loading, setLoading] = useState(true);
  const loadingRef = React.useRef(false);

  useEffect(() => {
    const initData = async () => {
      if (loadingRef.current) return;
      loadingRef.current = true;

      // Import new modular seed data (using internal variable names to avoid conflicts)
      const { BRANDS_SEED, CHAMPIONSHIPS_SEED, WRESTLERS_SEED, SHOWS_SEED } = await import('../../db/seedData');

      // 1. Seed Brands
      for (const brandData of BRANDS_SEED) {
        const brandName = brandData.name.trim() as BrandName;
        const existing = await db.brands.where('name').equals(brandName).first();
        if (!existing) {
          await db.brands.add({
            name: brandName,
            primaryColor: brandData.primaryColor,
            secondaryColor: brandData.secondaryColor,
            logo: brandData.logo
          });
        } else {
          await db.brands.update(existing.id!, {
            primaryColor: brandData.primaryColor,
            secondaryColor: brandData.secondaryColor,
            logo: brandData.logo
          });
        }
      }

      // Cleanup brands not in seed AND duplicates in DB
      const refreshedBrands = await db.brands.toArray();
      const seenBrandNames = new Set<string>();
      const brandCleanupIds: number[] = [];
      const validNames = BRANDS_SEED.map(b => b.name.trim() as BrandName);

      for (const b of refreshedBrands) {
        if (!validNames.includes(b.name as BrandName) || seenBrandNames.has(b.name)) {
          brandCleanupIds.push(b.id!);
        } else {
          seenBrandNames.add(b.name);
        }
      }

      if (brandCleanupIds.length > 0) {
        await db.brands.bulkDelete(brandCleanupIds);
        await db.championships.where('brandId').anyOf(brandCleanupIds).delete();
        await db.wrestlers.where('brandId').anyOf(brandCleanupIds).delete();
      }

      const finalBrands = await db.brands.toArray();
      const brandMap = new Map(finalBrands.map(b => [b.name, b.id!]));

      // 2. Seed Championships
      for (const titleData of CHAMPIONSHIPS_SEED) {
        const brandId = brandMap.get(titleData.brandName);
        if (!brandId) continue;
        const titleName = titleData.name.trim();

        const existing = await db.championships
          .where('name').equals(titleName)
          .and(t => t.brandId === brandId)
          .first();

        if (!existing) {
          await db.championships.add({
            name: titleName,
            brandId: brandId,
            image: titleData.image,
            history: []
          });
        } else {
          await db.championships.update(existing.id!, {
            image: titleData.image
          });
        }
      }

      // Cleanup championships not in seed OR duplicates
      const refreshedTitles = await db.championships.toArray();
      const seenTitles = new Set<string>();
      const titleCleanupIds: number[] = [];

      for (const t of refreshedTitles) {
        const bName = finalBrands.find(rb => rb.id === t.brandId)?.name;
        const key = `${t.name.trim()}_${bName}`;
        const isCurrentlyInSeed = CHAMPIONSHIPS_SEED.some(st => st.name.trim() === t.name.trim() && st.brandName === bName);

        if (!isCurrentlyInSeed || seenTitles.has(key)) {
          titleCleanupIds.push(t.id!);
        } else {
          seenTitles.add(key);
        }
      }
      if (titleCleanupIds.length > 0) await db.championships.bulkDelete(titleCleanupIds);

      const finalTitles = await db.championships.toArray();
      const titleIdMap = new Map();
      finalTitles.forEach(t => {
        const bName = finalBrands.find(rb => rb.id === t.brandId)?.name;
        if (bName) titleIdMap.set(`${t.name.trim()}_${bName}`, t.id!);
      });

      // 3. Seed Wrestlers
      for (const wrestlerData of WRESTLERS_SEED) {
        const brandId = brandMap.get(wrestlerData.brandName);
        if (!brandId) continue;
        const wrestlerName = wrestlerData.name.trim();

        const existing = await db.wrestlers
          .where('name').equals(wrestlerName)
          .and(w => w.brandId === brandId)
          .first();

        const currentTitlesIds = (wrestlerData.holdsTitleNames || [])
          .map(tn => titleIdMap.get(`${tn.trim()}_${wrestlerData.brandName}`))
          .filter(id => id !== undefined);

        if (!existing) {
          const wrestlerId = await db.wrestlers.add({
            ...wrestlerData,
            name: wrestlerName,
            brandId: brandId,
            currentTitlesIds,
            historicalTitlesIds: []
          });
          // Sync titles table
          for (const titleId of currentTitlesIds) {
            await db.championships.update(titleId, { currentChampionId: wrestlerId });
          }
        } else {
          // Only update visual metadata to avoid overwriting user edits in the UI
          await db.wrestlers.update(existing.id!, { 
            image: wrestlerData.image,
            avatar: wrestlerData.avatar,
            gender: wrestlerData.gender
          });
          
          // CRITICAL: Even if wrestler exists, if we haven't synced titles yet in this DB session, 
          // we should ensure the championship record points to this wrestler if they hold it.
          for (const titleId of existing.currentTitlesIds || []) {
            const title = await db.championships.get(titleId);
            if (title && !title.currentChampionId) {
              await db.championships.update(titleId, { currentChampionId: existing.id });
            }
          }
        }
      }

      // Cleanup wrestlers not in seed OR duplicates
      const refreshedWrestlers = await db.wrestlers.toArray();
      const seenWrestlers = new Set<string>();
      const wrestlerCleanupIds: number[] = [];

      for (const w of refreshedWrestlers) {
        const bName = finalBrands.find(rb => rb.id === w.brandId)?.name;
        const key = `${w.name.trim()}_${bName}`;
        const isCurrentlyInSeed = WRESTLERS_SEED.some(sw => sw.name.trim() === w.name.trim() && sw.brandName === bName);

        if (!isCurrentlyInSeed || seenWrestlers.has(key)) {
          wrestlerCleanupIds.push(w.id!);
        } else {
          seenWrestlers.add(key);
        }
      }
      if (wrestlerCleanupIds.length > 0) await db.wrestlers.bulkDelete(wrestlerCleanupIds);

      // 4. Seed Shows
      for (const showData of SHOWS_SEED) {
        const brandId = showData.brandName === 'SHARED' ? undefined : brandMap.get(showData.brandName as BrandName);
        const showName = showData.name.trim();
        const existing = await db.shows.where('name').equals(showName).first();
        if (!existing) {
          await db.shows.add({
            name: showName,
            brandId: brandId,
            valuation: showData.valuation,
            type: showData.type,
            date: new Date()
          });
        }
      }

      const allBrands = await db.brands.toArray();
      const allWrestlers = await db.wrestlers.toArray();
      const allTitles = await db.championships.toArray();

      setBrands(allBrands.filter(b => b.name !== 'FREE AGENT'));
      setWrestlers(allWrestlers);
      setTitles(allTitles);
      setLoading(false);
      loadingRef.current = false;
    };

    initData();
  }, []);

  const handleGenderChange = (brandId: number, filter: GenderFilter) => {
    setActiveFilters(prev => ({
      ...prev,
      [brandId]: { ...(prev[brandId] || { gender: 'TODOS', alignment: 'TODOS' }), gender: filter }
    }));
  };

  const handleAlignmentChange = (brandId: number, filter: AlignmentFilter) => {
    setActiveFilters(prev => ({
      ...prev,
      [brandId]: { ...(prev[brandId] || { gender: 'TODOS', alignment: 'TODOS' }), alignment: filter }
    }));
  };

  if (loading) return <div>Loading Roster...</div>;

  return (
    <div className={styles.rosterPage}>
      <div className={styles.brandContainer}>
        {brands.map((brand) => {
          const brandId = brand.id!;
          const brandWrestlers = wrestlers.filter((w) => w.brandId === brandId);
          const brandTitles = titles.filter((t) => t.brandId === brandId);
          const currentFilters = activeFilters[brandId] || { gender: 'TODOS', alignment: 'TODOS' };

          const filteredWrestlers = brandWrestlers.filter(w => {
            const matchesGender = 
              currentFilters.gender === 'TODOS' || 
              (currentFilters.gender === 'MEN' && w.gender === 'Male') || 
              (currentFilters.gender === 'WOMEN' && w.gender === 'Female');

            const matchesAlignment = 
              currentFilters.alignment === 'TODOS' || 
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
