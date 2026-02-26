import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../db/db";
import type { Show } from "../../models/types";
import styles from "./PLECarousel.module.scss";

const PLECarousel = () => {
  const navigate = useNavigate();
  const [ples, setPles] = useState<Show[]>([]);
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const allShows = await db.shows.toArray();
        const pleShows = allShows.filter(s => s.type === 'PLE');
        
        // Get unique seasons that have PLEs, excluding Season 0
        const seasons = Array.from(new Set(pleShows.map(s => s.season || 0)))
          .filter(s => s > 0)
          .sort((a, b) => b - a); // Sort descending
        
        setAvailableSeasons(seasons);

        // Default to the highest season if not selected
        if (selectedSeason === null && seasons.length > 0) {
          setSelectedSeason(seasons[0]);
        }
        
        // Filter PLEs for the selected season
        const currentSeasonToFilter = selectedSeason !== null ? selectedSeason : (seasons.length > 0 ? seasons[0] : 1);
        
        if (currentSeasonToFilter !== null) {
          const seasonPLEs = pleShows
            .filter(s => (s.season || 0) === currentSeasonToFilter)
            .sort((a, b) => (a.week || 0) - (b.week || 0));
          setPles(seasonPLEs);
        }

      } catch (error) {
        console.error('Error loading PLE data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedSeason]);

  const fixPath = (path: string | undefined): string => {
    if (!path) return '';
    if (path.startsWith('data:image')) return path; // Handle custom posters
    if (path.startsWith('./')) return path.replace('./', '/');
    return path;
  };

  if (loading) return null;
  if (availableSeasons.length === 0) return null;

  return (
    <div className={styles.carouselContainer}>
      <div className={styles.header}>
        <h2>Premium Live Events</h2>
        <div className={styles.seasonSelector}>
          <span>Season</span>
          <select 
            value={selectedSeason || ''} 
            onChange={(e) => setSelectedSeason(Number(e.target.value))}
          >
            {availableSeasons.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      <div className={styles.carousel}>
        {ples.map((ple) => (
          <div key={ple.id} className={styles.pleCard}>
            <div className={styles.posterWrapper}>
              <img src={fixPath(ple.image)} alt={ple.name} />
            </div>
            <div className={styles.cardInfo}>
              <h3>{ple.name}</h3>
              <button 
                className={styles.detailsBtn}
                onClick={() => navigate(`/archive/show/${ple.id}`)}
              >
                Ver Detalles
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


export default PLECarousel;
