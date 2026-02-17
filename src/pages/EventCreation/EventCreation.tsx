import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../db/db';
import type { Brand, Wrestler, Championship, Segment, BrandName } from '../../models/types';
import { BRANDS_SEED } from '../../db/seeds/brands';
import { SHOWS_SEED } from '../../db/seeds/shows';
import FilterBar, { type GenderFilter, type AlignmentFilter } from '../../components/FilterBar/FilterBar';
import styles from './EventCreation.module.scss';

const EventCreation = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const isWeekly = type === 'semanal';

  // DB Data
  const [brands, setBrands] = useState<Brand[]>([]);
  const [allWrestlers, setAllWrestlers] = useState<Wrestler[]>([]);
  const [allTitles, setAllTitles] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [showName, setShowName] = useState('');
  const [season, setSeason] = useState(1);
  const [week, setWeek] = useState(1);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isRosterVisible, setIsRosterVisible] = useState(false);
  const [activePicker, setActivePicker] = useState<{ segmentId: string, type: 'Match' | 'Promo', index: number } | null>(null);

  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [isShowDropdownOpen, setIsShowDropdownOpen] = useState(false);

  // Filters for Modal
  const [activeGender, setActiveGender] = useState<GenderFilter>('TODOS');
  const [activeAlignment, setActiveAlignment] = useState<AlignmentFilter>('TODOS');

  useEffect(() => {
    const loadData = async () => {
      // 1. Sync Brands from Seed
      const seedNames = BRANDS_SEED.map(s => s.name.trim());
      
      for (const brandData of BRANDS_SEED) {
        const brandName = brandData.name.trim();
        const existing = await db.brands.where('name').equals(brandName).first();
        if (!existing) {
          await db.brands.add({
            name: brandName as BrandName,
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

      // Cleanup duplicates or invalid brands
      const allDBBrands = await db.brands.toArray();
      const seenNames = new Set<string>();
      const toDelete: number[] = [];

      for (const b of allDBBrands) {
        const bName = b.name.trim();
        if (!seedNames.includes(bName) || seenNames.has(bName)) {
          if (bName !== 'FREE AGENT') { // Keep special internal brands if they exist, but here we only care about seed
             toDelete.push(b.id!);
          }
        } else {
          seenNames.add(bName);
        }
      }

      if (toDelete.length > 0) {
        await db.brands.bulkDelete(toDelete);
      }

      const b = await db.brands.toArray();
      const w = await db.wrestlers.toArray();
      const t = await db.championships.toArray();
      
      const filteredBrands = b.filter(brand => brand.name !== 'FREE AGENT');
      setBrands(filteredBrands);
      setAllWrestlers(w);
      setAllTitles(t);
      
      // Default brand
      if (filteredBrands.length > 0) {
        setSelectedBrand(filteredBrands.find(brand => brand.name === 'RAW') || filteredBrands[0]);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  // Helper to fix paths
  const fixPath = (path: string | undefined): string => {
    if (!path) return '';
    if (path.startsWith('./')) return path.replace('./', '/');
    return path;
  };

  const addSegment = (segmentType: 'Match' | 'Promo' | 'Video') => {
    const newId = crypto.randomUUID();
    const newSegment: Segment = {
      id: newId,
      type: segmentType,
      matchData: segmentType === 'Match' ? { titleMatch: false, type: '1 vs 1 Singles', participantsIds: [0, 0], winnersIds: [], rating: 0 } : undefined,
      promoData: segmentType === 'Promo' ? { id: newId, participantsIds: [0], description: '' } : undefined,
      videoData: segmentType === 'Video' ? { id: newId, description: '' } : undefined,
    };
    setSegments([...segments, newSegment]);
  };

  const removeSegment = (id: string) => {
    setSegments(segments.filter(s => s.id !== id));
  };

  const updateSegment = (id: string, data: Partial<Segment>) => {
    setSegments(segments.map(s => s.id === id ? { ...s, ...data } : s));
  };

  if (loading || !selectedBrand) return <div className={styles.loading}>Loading...</div>;

  const brandWrestlers = allWrestlers.filter(w => {
    if (selectedBrand.name === 'SHARED') return true;
    return w.brandId === selectedBrand.id;
  });

  const brandTitles = allTitles.filter(t => {
    if (selectedBrand.name === 'SHARED') return true;
    return t.brandId === selectedBrand.id;
  });

  return (
    <div className={styles.eventCreationPage} style={{ '--primary': selectedBrand.primaryColor, '--secondary': selectedBrand.secondaryColor } as React.CSSProperties}>
      {/* Header / Top Bar */}
      <header className={styles.topBar}>
        <div className={styles.typeLabel}>
          {isWeekly ? 'WEEK' : 'PLE'}
        </div>

        <div className={styles.brandDropdownContainer}>
          <div 
            className={styles.brandDropdownHeader} 
            onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
          >
            <img 
              src={fixPath(selectedBrand.logo)} 
              alt={selectedBrand.name} 
              className={styles.currentBrandLogo}
            />
            {selectedBrand.name === 'SHARED' && (
              <span className={styles.sharedLabel}>SHARED</span>
            )}
          </div>
          {isBrandDropdownOpen && (
            <div className={styles.brandDropdownList}>
              {brands
                .filter(brand => {
                  if (brand.name === 'SHARED') return !isWeekly;
                  return true;
                })
                .map(brand => (
                <div 
                  key={brand.id} 
                  className={`${styles.brandOption} ${selectedBrand.id === brand.id ? styles.active : ''}`}
                  onClick={() => {
                    setSelectedBrand(brand);
                    setShowName('');
                    setSegments([]);
                    setIsBrandDropdownOpen(false);
                  }}
                >
                  <img src={fixPath(brand.logo)} alt={brand.name} />
                  <span>{brand.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.showInfo}>
          {!isWeekly && (
            <div className={styles.showDropdownContainer}>
              <div 
                className={styles.showDropdownHeader}
                onClick={() => setIsShowDropdownOpen(!isShowDropdownOpen)}
              >
                {showName ? (
                  <div className={styles.selectedShow}>
                    {(() => {
                      const show = SHOWS_SEED.find(s => s.name === showName);
                      return show ? (
                        <>
                          <img src={fixPath(show.image)} alt={show.name} className={styles.showLogoHeader} />
                          <span>{show.name}</span>
                        </>
                      ) : <span>{showName}</span>;
                    })()}
                  </div>
                ) : (
                  <span className={styles.placeholderText}>Select PLE Show</span>
                )}
              </div>

              {isShowDropdownOpen && (
                <div className={styles.showDropdownList}>
                  {SHOWS_SEED
                    .filter(show => {
                      if (show.type !== 'PLE') return false;
                      return show.brandName === selectedBrand.name;
                    })
                    .map(show => (
                      <div 
                        key={show.name} 
                        className={styles.showOption}
                        onClick={() => {
                          setShowName(show.name);
                          setIsShowDropdownOpen(false);
                        }}
                      >
                        <div className={styles.showOptionLeft}>
                          <img src={fixPath(show.image)} alt={show.name} className={styles.showOptionImage} />
                          <span>{show.name}</span>
                        </div>
                        {show.brandName === 'SHARED' && (
                          <div className={styles.sharedIndicators}>
                            {brands.filter(b => b.name === 'RAW' || b.name === 'SMACKDOWN').map(b => (
                              <img key={b.id} src={fixPath(b.logo)} alt={b.name} className={styles.miniLogo} />
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          )}
          {isWeekly && (
            <div className={styles.selectedShow}>
              {(() => {
                const show = SHOWS_SEED.find(s => s.brandName === selectedBrand.name && s.type === 'Weekly');
                return show ? (
                  <>
                    <span>{show.name}</span>
                  </>
                ) : (
                  <span className={styles.placeholderText}>{selectedBrand.name} Weekly Show</span>
                );
              })()}
            </div>
          )}
        </div>

        <div className={styles.timeInfo}>
          <div className={styles.inputGroup}>
            <input type="number" value={season} min={1} max={10} onChange={e => setSeason(parseInt(e.target.value))} />
            <span>Season</span>
          </div>
          <div className={styles.inputGroup}>
            <input type="number" value={week} min={1} max={52} onChange={e => setWeek(parseInt(e.target.value))} />
            <span>Week</span>
          </div>
        </div>
      </header>

      {/* Control Bar */}
      <nav className={styles.controlBar}>
        <div className={styles.carteleraLabel}>BILLBOARD</div>
        <div className={styles.addButtons}>
          <span>Add :</span>
          {(() => {
            const hasPendingWinners = segments.some(s => s.type === 'Match' && !s.matchData?.winnersIds.length);
            const isPLEMissingName = !isWeekly && !showName;
            const isDisabled = isPLEMissingName || hasPendingWinners;
            
            return (
              <>
                <button disabled={isDisabled} onClick={() => addSegment('Match')}>Match</button>
                <button disabled={isDisabled} onClick={() => addSegment('Promo')}>Promo</button>
                <button disabled={isDisabled} onClick={() => addSegment('Video')}>Video</button>
                {isPLEMissingName && <span className={styles.warningHint}>Pick PLE first</span>}
                {hasPendingWinners && <span className={styles.warningHint}>Assign Winners</span>}
              </>
            );
          })()}
        </div>
        <div className={styles.rosterToggle}>
          <span>Roster :</span>
          <button onClick={() => setIsRosterVisible(!isRosterVisible)} className={isRosterVisible ? styles.active : ''}>
            👁️
          </button>
        </div>
      </nav>

      {/* Segments List */}
      <main className={styles.segmentsList}>
        {segments.map((segment, index) => (
          <div key={segment.id} className={styles.segmentWrapper}>
            <div className={styles.segmentHeader}>
              <div className={styles.headerLeft}>
                <span className={styles.segmentTitle}>{segment.type} #{index + 1}</span>
                {segment.type === 'Promo' && (
                  <div className={styles.participantControls}>
                    <button 
                      onClick={() => {
                        if (segment.promoData!.participantsIds.length < 6) {
                          const newParticipants = [...segment.promoData!.participantsIds, 0];
                          updateSegment(segment.id, { promoData: { ...segment.promoData!, participantsIds: newParticipants } });
                        }
                      }} 
                      className={styles.addParticipantBtn}
                    >+
                    </button>
                    <button 
                      onClick={() => {
                        if (segment.promoData!.participantsIds.length > 1) {
                          const newParticipants = segment.promoData!.participantsIds.slice(0, -1);
                          updateSegment(segment.id, { promoData: { ...segment.promoData!, participantsIds: newParticipants } });
                        }
                      }} 
                      className={styles.removeParticipantBtn}
                    >-
                    </button>
                  </div>
                )}
              </div>
              <button className={styles.deleteBtn} onClick={() => removeSegment(segment.id)}>x</button>
            </div>
            
            {/* VIDEO SEGMENT */}
            {segment.type === 'Video' && (
               <textarea 
                placeholder="Write what happens in the video package..."
                value={segment.videoData?.description}
                onChange={(e) => updateSegment(segment.id, { videoData: { ...segment.videoData!, description: e.target.value } })}
               />
            )}

            {/* PROMO SEGMENT */}
            {segment.type === 'Promo' && (
              <div className={styles.promoContent}>
                <div className={styles.promoLeft}>
                  <div className={`${styles.promoGrid} ${styles[`grid-${segment.promoData!.participantsIds.length}`]}`}>
                    {segment.promoData!.participantsIds.map((pid, pIdx) => {
                      const wrestler = allWrestlers.find(w => w.id === pid);
                      return (
                        <div 
                          key={pIdx} 
                          className={styles.pSlot}
                          onClick={() => setActivePicker({ segmentId: segment.id, type: 'Promo', index: pIdx })}
                        >
                          {wrestler ? (
                            <img src={fixPath(wrestler.avatar || wrestler.image)} alt={wrestler.name} />
                          ) : (
                            <div className={styles.placeholder}>?</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className={styles.promoRight}>
                  <textarea 
                    placeholder="Write the promo..."
                    value={segment.promoData?.description}
                    onChange={(e) => updateSegment(segment.id, { promoData: { ...segment.promoData!, description: e.target.value } })}
                  />
                </div>
              </div>
            )}

            {/* MATCH SEGMENT */}
            {segment.type === 'Match' && (
              <div className={styles.matchContent}>
                <div className={styles.matchControls}>
                  <select 
                    value={segment.matchData?.championshipId || ''} 
                    onChange={e => {
                      const champId = e.target.value ? parseInt(e.target.value) : undefined;
                      const championship = allTitles.find(t => t.id === champId);
                      
                      // Reset participants: first slot for champ, others to 0
                      const currentCount = segment.matchData?.participantsIds.length || 2;
                      const newParticipants = Array(currentCount).fill(0);
                      
                      if (championship?.currentChampionId) {
                        newParticipants[0] = championship.currentChampionId;
                      }

                      updateSegment(segment.id, { 
                        matchData: { 
                          ...segment.matchData!, 
                          championshipId: champId, 
                          titleMatch: !!champId,
                          participantsIds: newParticipants,
                          winnersIds: [] // Also reset winner
                        } 
                      });
                    }}
                  >
                    <option value="">Combate no titular</option>
                    {brandTitles.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <select 
                    value={segment.matchData?.type} 
                    onChange={e => {
                      const newType = e.target.value;
                      let numParticipants = 2;
                      if (newType === 'Triple Threat 1 vs 1 vs 1') numParticipants = 3;
                      if (newType === 'Fatal 4-Way 1 vs 1 vs 1 vs 1') numParticipants = 4;
                      
                      // Reset participants to 0
                      const newParticipants = Array(numParticipants).fill(0);
                      
                      // If title match, re-apply champion to first slot
                      if (segment.matchData?.championshipId) {
                        const championship = allTitles.find(t => t.id === segment.matchData?.championshipId);
                        if (championship?.currentChampionId) {
                          newParticipants[0] = championship.currentChampionId;
                        }
                      }

                      updateSegment(segment.id, { 
                        matchData: { 
                          ...segment.matchData!, 
                          type: newType, 
                          participantsIds: newParticipants,
                          winnersIds: [] // Also reset winner
                        } 
                      });
                    }}
                  >
                    <option>1 vs 1 Singles</option>
                    <option>1 vs 1 noDQ</option>
                    <option>Triple Threat 1 vs 1 vs 1</option>
                    <option>Fatal 4-Way 1 vs 1 vs 1 vs 1</option>
                  </select>
                </div>
                <div className={styles.matchBody}>
                  <div className={styles.matchParticipants}>
                    {segment.matchData?.participantsIds.map((pid, pIdx) => {
                      const wrestler = allWrestlers.find(w => w.id === pid);
                      return (
                      <React.Fragment key={pIdx}>
                        <div className={styles.participantNode}>
                          <div 
                            className={`${styles.pSlot} ${ (segment.matchData?.titleMatch && pIdx === 0) ? styles.locked : '' }`}
                            onClick={() => {
                              if (segment.matchData?.titleMatch && pIdx === 0) return;
                              setActivePicker({ segmentId: segment.id, type: 'Match', index: pIdx });
                            }}
                          >
                            {wrestler ? (
                              <img src={fixPath(wrestler.avatar || wrestler.image)} alt={wrestler.name} />
                            ) : (
                              <div className={styles.placeholder}>?</div>
                            )}
                          </div>
                          <span className={styles.pName}>{wrestler?.name || `Wrestler ${pIdx+1}`}</span>
                        </div>
                        {pIdx < (segment.matchData?.participantsIds.length || 0) - 1 && <span className={styles.vs}>VS.</span>}
                      </React.Fragment>
                      );
                    })}
                  </div>
                  <div className={styles.matchRight}>
                    <div className={styles.winnerSection}>
                      <select 
                        value={segment.matchData?.winnersIds[0] || ''}
                        onChange={e => updateSegment(segment.id, { matchData: { ...segment.matchData!, winnersIds: [parseInt(e.target.value)] } })}
                      >
                        <option value="">Choose the winner</option>
                        {segment.matchData?.participantsIds.map(pid => {
                          const w = allWrestlers.find(wr => wr.id === pid);
                          if (!w) return null;
                          return <option key={pid} value={pid}>{w.name}</option>;
                        })}
                        <option value="-1">NO CONTEST</option>
                      </select>
                    </div>
                    <textarea 
                      placeholder="Post match"
                      value={segment.matchData?.notes || ''}
                      onChange={(e) => updateSegment(segment.id, { matchData: { ...segment.matchData!, notes: e.target.value } })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </main>

      {/* Footer Actions */}
      <footer className={styles.footer}>
        <button 
          className={styles.saveBtn} 
          disabled={!isWeekly && !showName || segments.some(s => s.type === 'Match' && (!s.matchData?.winnersIds.length || s.matchData.winnersIds[0] === undefined))}
          onClick={() => navigate('/')}
        >
          GUARDAR Y VOLVER
        </button>
      </footer>

      {/* Roster Modal / Overlay */}
      {(isRosterVisible || activePicker) && (
        <div className={styles.rosterModal}>
           <div className={styles.modalHeader}>
             <h3>{activePicker ? `Selecciona Wrestler para ${activePicker.type}` : `Roster ${selectedBrand.name}`}</h3>
             <button onClick={() => {
               setIsRosterVisible(false);
               setActivePicker(null);
             }}>Cerrar</button>
           </div>

           <FilterBar 
             activeGender={activeGender}
             activeAlignment={activeAlignment}
             onGenderChange={setActiveGender}
             onAlignmentChange={setActiveAlignment}
             primaryColor={selectedBrand.primaryColor}
             secondaryColor={selectedBrand.secondaryColor}
           />

           <div className={styles.wrestlerGrid}>
             {brandWrestlers
               .filter(w => {
                 // Participation filter
                 if (activePicker?.type === 'Match') {
                   const segment = segments.find(s => s.id === activePicker.segmentId);
                   if (segment?.matchData?.participantsIds.includes(w.id!)) return false;
                 }
                 if (activePicker?.type === 'Promo') {
                   const segment = segments.find(s => s.id === activePicker.segmentId);
                   if (segment?.promoData?.participantsIds.includes(w.id!)) return false;
                 }

                 // Gender filter
                 let matchesGender = 
                   activeGender === 'TODOS' || 
                   (activeGender === 'MEN' && w.gender === 'Male') || 
                   (activeGender === 'WOMEN' && w.gender === 'Female');

                 // Intergender restriction: if match and not first slot, match first participant's gender
                 if (activePicker?.type === 'Match' && activePicker.index !== 0) {
                    const segment = segments.find(s => s.id === activePicker.segmentId);
                    const firstParticipantId = segment?.matchData?.participantsIds[0];
                    if (firstParticipantId) {
                      const firstParticipant = allWrestlers.find(wr => wr.id === firstParticipantId);
                      if (firstParticipant && w.gender !== firstParticipant.gender) {
                        matchesGender = false;
                      }
                    }
                 }

                 // Alignment filter
                 const matchesAlignment = 
                   activeAlignment === 'TODOS' || 
                   (activeAlignment === 'FACES' && w.alignment === 'Face') || 
                   (activeAlignment === 'HEELS' && w.alignment === 'Heel');

                 return matchesGender && matchesAlignment;
               })
               .map(w => (
               <div 
                key={w.id} 
                className={styles.wrestlerItem}
                onClick={() => {
                  if (activePicker) {
                    const segment = segments.find(s => s.id === activePicker.segmentId);
                    if (segment) {
                      if (activePicker.type === 'Match') {
                        const newP = [...segment.matchData!.participantsIds];
                        newP[activePicker.index] = w.id!;
                        updateSegment(segment.id, { matchData: { ...segment.matchData!, participantsIds: newP } });
                      } else {
                        const newP = [...segment.promoData!.participantsIds];
                        newP[activePicker.index] = w.id!;
                        updateSegment(segment.id, { promoData: { ...segment.promoData!, participantsIds: newP } });
                      }
                    }
                    setActivePicker(null);
                  }
                }}
               >
                 <img src={fixPath(w.avatar)} alt={w.name} />
                 <span>{w.name}</span>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default EventCreation;
