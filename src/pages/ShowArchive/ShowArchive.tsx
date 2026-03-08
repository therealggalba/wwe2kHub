import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../db/db';
import type { Show, Brand } from '../../models/types';
import ResolvedImage from '../../components/Common/ResolvedImage';
import styles from './ShowArchive.module.scss';

const ShowArchive = () => {
  const navigate = useNavigate();
  const [shows, setShows] = useState<Show[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandFilter, setBrandFilter] = useState<number | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<Show['type'] | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'valuation'>('date');

  useEffect(() => {
    const loadData = async () => {
      const allShows = await db.shows.toArray();
      const allBrands = await db.brands.toArray();
      
      setBrands(allBrands);

      const sorted = [...allShows]
        .filter(s => !!s.card)
        .sort((a, b) => {
        if ((a.season || 0) !== (b.season || 0)) {
          return (a.season || 0) - (b.season || 0);
        }
        if ((a.week || 0) !== (b.week || 0)) {
          return (a.week || 0) - (b.week || 0);
        }
        if (a.type !== b.type) {
          return a.type === 'Weekly' ? -1 : 1;
        }
        
        const priorityA = allBrands.find(br => br.id === a.brandId)?.priority ?? 99;
        const priorityB = allBrands.find(br => br.id === b.brandId)?.priority ?? 99;
        return priorityA - priorityB;
      });

      setShows(sorted);
      setLoading(false);
    };

    loadData();
  }, []);

  const handleDeleteShow = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this show permanently?')) {
      await db.shows.delete(id);
      setShows(prev => prev.filter(s => s.id !== id));
    }
  };

  const filteredShows = shows
    .filter(s => {
      const matchBrand = brandFilter === 'ALL' || s.brandId === brandFilter;
      const matchType = typeFilter === 'ALL' || s.type === typeFilter;
      return matchBrand && matchType;
    })
    .sort((a, b) => {
      if (sortBy === 'date') return b.date.getTime() - a.date.getTime();
      return (b.valuation || 0) - (a.valuation || 0);
    });


  return (
    <div className={styles.archivePage}>
      <div className={styles.controls}>
        <div className={styles.filterGroup}>
          <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}>
            <option value="ALL">All Brands</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as Show['type'] | 'ALL')}>
            <option value="ALL">All Types</option>
            <option value="Weekly">Weekly</option>
            <option value="PLE">PLE</option>
          </select>
        </div>
        <div className={styles.sortGroup}>
          <button 
            className={sortBy === 'date' ? styles.activeSort : ''} 
            onClick={() => setSortBy('date')}
          >
            By Date
          </button>
          <button 
            className={sortBy === 'valuation' ? styles.activeSort : ''} 
            onClick={() => setSortBy('valuation')}
          >
            By Rating
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading Archive...</div>
      ) : filteredShows.length === 0 ? (
        <div className={styles.emptyState}>No shows found matching the filters.</div>
      ) : (
          <div className={styles.showTable}>
            <div className={styles.tableHeader}>
            <span>Date</span>
            <span>Logo</span>
            <span>Show</span>
            <span>Brand</span>
            <span>Rating</span>
            <span style={{ textAlign: 'right' }}>Actions</span>
          </div>
            {filteredShows.map(show => {
              const brand = brands.find(b => b.id === show.brandId);
              // Use show.image specifically for the logo column
              const officialLogo = show.image || brand?.logo;

              return (
                <div key={show.id} className={styles.showRow}>
                  <div className={styles.dateCell}>
                    <span className={styles.seasonLabel}>S{show.season}</span>
                    <span className={styles.weekLabel}>W{show.week}</span>
                  </div>
                  <div className={styles.logoCell}>
                    {officialLogo && (
                      <ResolvedImage src={officialLogo} alt="Official Logo" title={show.name} className={styles.pleLogoImage} />
                    )}
                  </div>
                  <div className={styles.nameCell}>
                    <span className={styles.showName}>{show.name}</span>
                    {show.type === 'PLE' && <span className={styles.pleBadge}>PLE</span>}
                  </div>
                  <div className={styles.brandCell}>
                    {brand && <ResolvedImage src={brand.logo} alt={brand.name} className={styles.brandLogo} title={brand.name} />}
                  </div>
                  <div className={styles.ratingCell}>
                    <span className={styles.numericRating}>
                      {(show.valuation || 0).toFixed(1)} ★
                    </span>
                  </div>
                  <div className={styles.actionsCell}>
                    <button 
                      className={styles.infoBtn} 
                      onClick={() => navigate(`/archive/show/${show.id}`)}
                    >👁️
                    </button>
                    <button 
                      className={styles.deleteBtn} 
                      onClick={() => show.id && handleDeleteShow(show.id)}
                      title="Delete Show"
                    >
                      X
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
};

export default ShowArchive;
