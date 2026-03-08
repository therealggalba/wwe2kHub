import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../../db/db';
import type { Wrestler, Brand, Championship } from '../../models/types';
import { slugify } from '../../utils/slugify';
import ResolvedImage from '../../components/Common/ResolvedImage';
import styles from './WrestlerDetails.module.scss';

const WrestlerDetails: React.FC = () => {
  const { name: slug } = useParams<{ name: string }>();
  const [wrestler, setWrestler] = useState<Wrestler | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [allBrands, setAllBrands] = useState<Brand[]>([]);
  const [titles, setTitles] = useState<Championship[]>([]);
  const [allChampionships, setAllChampionships] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Wrestler>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      
      const brandsData = await db.brands.toArray();
      setAllBrands(brandsData);

      const championshipsData = await db.championships.toArray();
      setAllChampionships(championshipsData);

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
    
    if (name === 'currentTitlesIds') {
      const select = e.target as HTMLSelectElement;
      const values = Array.from(select.selectedOptions).map(opt => Number(opt.value));
      setFormData(prev => ({ ...prev, currentTitlesIds: values }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: (name === 'rating' || name === 'brandId') ? Number(value) : value
    }));
  };

  const handleSave = async () => {
    if (!wrestler?.id) return;
    
    try {
      const oldTitles = wrestler.currentTitlesIds || [];
      const newTitles = formData.currentTitlesIds || [];

      // 1. Identify titles removed from this wrestler
      const removedTitles = oldTitles.filter(id => !newTitles.includes(id));
      for (const titleId of removedTitles) {
        await db.championships.update(titleId, { currentChampionId: undefined });
      }

      // 2. Identify titles added to this wrestler
      const addedTitles = newTitles.filter(id => !oldTitles.includes(id));
      for (const titleId of addedTitles) {
        const title = await db.championships.get(titleId);
        if (!title) continue;

        const isTagTeam = title.name.toLowerCase().includes('tag team');
        const isTrios = title.name.toLowerCase().includes('trios') || title.name.toLowerCase().includes('trio');
        const currentHolders = await db.wrestlers.where('currentTitlesIds').equals(titleId).toArray();

        if (isTrios) {
          // Trios Logic: Max 3 holders
          if (currentHolders.length >= 3) {
            // Remove from the "oldest" holder (first one that isn't the current wrestler)
            const oldestHolder = currentHolders.find(h => h.id !== wrestler.id);
            if (oldestHolder) {
              const updatedOwnerTitles = (oldestHolder.currentTitlesIds || []).filter(id => id !== titleId);
              await db.wrestlers.update(oldestHolder.id!, { currentTitlesIds: updatedOwnerTitles });
            }
          }
        } else if (isTagTeam) {
          // Tag Team Logic: Max 2 holders
          if (currentHolders.length >= 2) {
            // Remove from the "oldest" holder (first one that isn't the current wrestler)
            const oldestHolder = currentHolders.find(h => h.id !== wrestler.id);
            if (oldestHolder) {
              const updatedOwnerTitles = (oldestHolder.currentTitlesIds || []).filter(id => id !== titleId);
              await db.wrestlers.update(oldestHolder.id!, { currentTitlesIds: updatedOwnerTitles });
            }
          }
        } else {
          // Singular Title Logic: Max 1 holder
          for (const holder of currentHolders) {
            if (holder.id !== wrestler.id) {
              const updatedOwnerTitles = (holder.currentTitlesIds || []).filter(id => id !== titleId);
              await db.wrestlers.update(holder.id!, { currentTitlesIds: updatedOwnerTitles });
            }
          }
        }
        
        // Update championship to point to the most recent owner
        await db.championships.update(titleId, { currentChampionId: wrestler.id });
      }

      // 3. Update current wrestler
      await db.wrestlers.update(wrestler.id, formData);
      
      // Reload wrestler and titles to reflect changes correctly
      const updatedWrestler = await db.wrestlers.get(wrestler.id);
      if (updatedWrestler) {
        setWrestler(updatedWrestler);
        if (updatedWrestler.brandId) {
          const brandData = await db.brands.get(updatedWrestler.brandId);
          if (brandData) setBrand(brandData);
        }
        if (updatedWrestler.currentTitlesIds && updatedWrestler.currentTitlesIds.length > 0) {
          const titleData = await db.championships.bulkGet(updatedWrestler.currentTitlesIds);
          setTitles(titleData.filter((t): t is Championship => t !== undefined));
        } else {
          setTitles([]);
        }
      }

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
            {(wrestler.image || wrestler.avatar) ? (
              <ResolvedImage 
                src={wrestler.image || wrestler.avatar} 
                alt={wrestler.name} 
                className={styles.mainImage} 
              />
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
                  {title.image && <ResolvedImage src={title.image} alt={title.name} className={styles.titleLogo} />}
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
              <div className={styles.formGroup}>
                <label>TITLES (Ctrl+Click multi)</label>
                <select 
                  name="currentTitlesIds" 
                  multiple 
                  value={(formData.currentTitlesIds || []).map(String)} 
                  onChange={handleInputChange}
                  className={styles.multiSelect}
                >
                  {allChampionships
                    .filter(c => c.brandId === formData.brandId)
                    .filter(c => {
                      const isWomenTitle = c.name.toLowerCase().includes('women');
                      return wrestler.gender === 'Female' ? isWomenTitle : !isWomenTitle;
                    })
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
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
                  <span className={`${styles.statValue} ${wrestler.injuryWeeks > 0 ? styles.injuredValue : ''}`}>
                    {wrestler.injuryWeeks > 0 ? `${wrestler.injuryWeeks} Weeks` : 'None'}
                  </span>
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
              <div className={styles.honorsList}>
                {allChampionships
                  .map(champ => {
                    const reigns = (champ.history || []).filter(h => 
                      (h.wrestlerIds && h.wrestlerIds.includes(wrestler.id!)) || 
                      (!h.wrestlerIds && h.wrestlerName === wrestler.name)
                    );
                    
                    if (reigns.length === 0) return null;
                    
                    const totalDays = reigns.reduce((sum, r) => sum + (r.totalWeeks * 7), 0);
                    const isCurrentHolder = (wrestler.currentTitlesIds || []).includes(champ.id!);
                    
                    return (
                      <div key={champ.id} className={styles.honorItem}>
                        <span className={styles.honorReigns}>{reigns.length} x</span>
                        <span className={styles.honorTitleName}>{champ.name}</span>
                        {champ.image && (
                          <ResolvedImage 
                            src={champ.image} 
                            alt={champ.name} 
                            className={styles.honorImage} 
                          />
                        )}
                        <span className={styles.honorDays}>- {totalDays}{isCurrentHolder ? '+' : ''} días</span>
                      </div>
                    );
                  })
                  .filter(item => item !== null)}
                {allChampionships.every(champ => 
                  !(champ.history || []).some(h => 
                    (h.wrestlerIds && h.wrestlerIds.includes(wrestler.id!)) || 
                    (!h.wrestlerIds && h.wrestlerName === wrestler.name)
                  )
                ) && <p className={styles.placeholderText}>No honors yet.</p>}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default WrestlerDetails;
