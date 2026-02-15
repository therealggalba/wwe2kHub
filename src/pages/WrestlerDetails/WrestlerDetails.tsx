import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../../db/db';
import type { Wrestler, Brand, Championship } from '../../models/types';
import { slugify } from '../../utils/slugify';
import styles from './WrestlerDetails.module.scss';
const fixImagePath = (path: string | undefined): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('./')) {
    return path.substring(1); // Transform ./visuals/... to /visuals/...
  }
  return path;
};

const WrestlerDetails: React.FC = () => {
  const { name: slug } = useParams<{ name: string }>();
  const [wrestler, setWrestler] = useState<Wrestler | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [allBrands, setAllBrands] = useState<Brand[]>([]);
  const [titles, setTitles] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Wrestler>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      
      const brandsData = await db.brands.toArray();
      setAllBrands(brandsData);

      const allWrestlers = await db.wrestlers.toArray();
      const foundWrestler = allWrestlers.find(w => slugify(w.name) === slug);
      
      if (foundWrestler) {
        setWrestler(foundWrestler);
        setFormData(foundWrestler);
        
        if (foundWrestler.brandId) {
          const brandData = await db.brands.get(foundWrestler.brandId);
          if (brandData) setBrand(brandData);
        }
        
        if (foundWrestler.currentTitlesIds && foundWrestler.currentTitlesIds.length > 0) {
          const titleData = await db.championships.bulkGet(foundWrestler.currentTitlesIds);
          setTitles(titleData.filter((t): t is Championship => t !== undefined));
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [slug]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'rating' || name === 'brandId') ? Number(value) : value
    }));
  };

  const handleSave = async () => {
    if (!wrestler?.id) return;
    
    try {
      await db.wrestlers.update(wrestler.id, formData);
      setWrestler({ ...wrestler, ...formData } as Wrestler);
      setIsEditing(false);
      alert('Cambios guardados correctamente');
    } catch (error) {
      console.error('Error saving wrestler:', error);
      alert('Error al guardar los cambios');
    }
  };

  if (loading) return <div className={styles.loading}>Cargando datos del luchador...</div>;
  if (!wrestler) return <div className={styles.error}>Luchador no encontrado</div>;

  return (
    <div 
      className={styles.detailsPage}
      style={{ 
        '--brand-primary': brand?.primaryColor || '#ff0000',
        '--brand-secondary': brand?.secondaryColor || '#000000'
      } as React.CSSProperties}
    >
      <header className={styles.header}>
        <Link to="/roster" className={styles.backButton}>
          ← Back to Roster
        </Link>
      </header>
      
      <main className={styles.mainContent}>
        {/* LEFT COLUMN: VISUAL INFO */}
        <section className={styles.leftColumn}>
          <div className={styles.portraitWrapper}>
            {wrestler.image ? (
              <img src={fixImagePath(wrestler.image)} alt={wrestler.name} className={styles.mainImage} />
            ) : (
              <div className={styles.imagePlaceholder}>👤</div>
            )}
          </div>
          
          <div className={styles.basicInfo}>
            <h1 className={styles.wrestlerName}>{wrestler.name.toUpperCase()}</h1>
            {wrestler.faction && <p className={styles.factionName}>{wrestler.faction}</p>}
            
            <div className={styles.titlesContainer}>
              {titles.map(title => (
                <div key={title.id} className={styles.titleItem}>
                  {title.image && <img src={fixImagePath(title.image)} alt={title.name} className={styles.titleLogo} />}
                  <span className={styles.titleName}>{title.name.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className={styles.verticalDivider}></div>

        {/* RIGHT COLUMN: ACTIONS & STATS */}
        <section className={styles.rightColumn}>
          <div className={styles.actionHeader}>
            <button 
              className={styles.editButton} 
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {isEditing ? (
            <div className={styles.editForm}>
              <div className={styles.formGroup}>
                <label>MEDIA</label>
                <input 
                  type="number" 
                  name="rating" 
                  value={formData.rating || 0} 
                  onChange={handleInputChange}
                  min="0" max="100"
                />
              </div>
              <div className={styles.formGroup}>
                <label>FACCION</label>
                <input 
                  type="text" 
                  name="faction" 
                  value={formData.faction || ''} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className={styles.formGroup}>
                <label>ALIGNMENT</label>
                <select name="alignment" value={formData.alignment} onChange={handleInputChange}>
                  <option value="Face">Face</option>
                  <option value="Heel">Heel</option>
                  <option value="Tweener">Tweener</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>BRAND</label>
                <select name="brandId" value={formData.brandId || ''} onChange={handleInputChange}>
                  <option value="">Seleccionar Brand</option>
                  {allBrands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <button className={styles.saveButton} onClick={handleSave}>
                Save
              </button>
            </div>
          ) : (
            <div className={styles.statsContainer}>
              <h2 className={styles.sectionTitle}>Stadistics</h2>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Wins</span>
                  <span className={styles.statValue}>{wrestler.wins}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Losses</span>
                  <span className={styles.statValue}>{wrestler.losses}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Draws</span>
                  <span className={styles.statValue}>{wrestler.draws}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Injuries</span>
                  <span className={styles.statValue}>{wrestler.injuryStatus}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Moral</span>
                  <span className={styles.statValue}>{wrestler.moral}%</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Overall</span>
                  <span className={styles.statValue}>{wrestler.rating}</span>
                </div>
              </div>

              <h2 className={styles.sectionTitle} style={{ marginTop: '3rem' }}>
                Honors
              </h2>
              <p className={styles.placeholderText}>Coming soon...</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default WrestlerDetails;
