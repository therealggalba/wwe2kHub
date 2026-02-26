import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../db/db';
import type { Show, Brand, Wrestler, Championship } from '../../models/types';
import styles from './ShowDetails.module.scss';

const ShowDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [show, setShow] = useState<Show | null>(null);
    const [brand, setBrand] = useState<Brand | null>(null);
    const [wrestlers, setWrestlers] = useState<Wrestler[]>([]);
    const [championships, setChampionships] = useState<Championship[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadShow = async () => {
            if (!id) return;
            const showData = await db.shows.get(parseInt(id));
            if (showData) {
                setShow(showData);
                const brandData = await db.brands.get(showData.brandId || 0);
                if (brandData) setBrand(brandData);
                
                const allWrestlers = await db.wrestlers.toArray();
                setWrestlers(allWrestlers);

                const allChamps = await db.championships.toArray();
                setChampionships(allChamps);
            }
            setLoading(false);
        };
        loadShow();
    }, [id]);

    const fixPath = (path: string | undefined): string => {
        if (!path) return '';
        if (path.startsWith('./')) return path.replace('./', '/');
        return path;
    };

    if (loading) return <div className={styles.loading}>Loading Show Details...</div>;
    if (!show) return <div className={styles.error}>Show not found.</div>;

    return (
        <div className={styles.detailsPage} style={{ '--brand-color': brand?.primaryColor || '#e00012' } as React.CSSProperties}>
            <header className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate('/archive')}>← Back</button>
                <div className={styles.titleInfo}>
                    <h1>{show.name}</h1>
                    <div className={styles.meta}>
                        <span className={styles.season}>Season {show.season}</span>
                        <span className={styles.bullet}>•</span>
                        <span className={styles.week}>Week {show.week}</span>
                        {show.type === 'PLE' && <span className={styles.pleBadge}>Premium Live Event</span>}
                    </div>
                    <div className={styles.ratingHeader}>
                        <div className={styles.stars}>
                            {Array.from({ length: 10 }).map((_, i) => (
                                <span key={i} className={i < Math.floor(show.valuation || 0) ? styles.starFilled : styles.starEmpty}>
                                    ★
                                </span>
                            ))}
                        </div>
                        <span className={styles.ratingValue}>{show.valuation?.toFixed(1) || '0.0'}</span>
                    </div>
                </div>
                {brand && <img src={fixPath(brand.logo)} alt={brand.name} className={styles.brandLogo} />}
            </header>

            <main className={styles.content}>
                <div className={styles.carteleraLabel}>BILLBOARD</div>
                <div className={styles.segmentsList}>
                    {show.card?.segments.map((segment, idx) => (
                        <div key={segment.id} className={styles.segmentCard}>
                            <div className={styles.segmentHeader}>
                                <span className={styles.segmentIndex}>#{idx + 1}</span>
                                <span className={styles.segmentType}>{segment.type}</span>
                            </div>

                            {segment.type === 'Match' && segment.matchData && (
                                <div className={styles.matchContent}>
                                    <div className={styles.matchMetaRow}>
                                        <div className={styles.matchType}>{segment.matchData.type}</div>
                                        {segment.matchData.titleMatch && segment.matchData.championshipId && (
                                            <div className={styles.titleInfoBadge}>
                                                {(() => {
                                                    const champ = championships.find(c => c.id === segment.matchData?.championshipId);
                                                    return champ ? (
                                                        <>
                                                            <img src={fixPath(champ.image)} alt={champ.name} className={styles.champIcon} />
                                                            <span>{champ.name}</span>
                                                        </>
                                                    ) : <span className={styles.titleMatchBadge}>TITLE MATCH</span>;
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.participants}>
                                        {segment.matchData.type === "2 vs 2 Tag Team" ? (
                                            // TAG TEAM GROUPED LAYOUT
                                            <>
                                                {[0, 2].map((startIndex) => {
                                                    const p1 = wrestlers.find(wr => wr.id === segment.matchData?.participantsIds[startIndex]);
                                                    const p2 = wrestlers.find(wr => wr.id === segment.matchData?.participantsIds[startIndex + 1]);
                                                    const isWinner = segment.matchData?.winnersIds.includes(p1?.id || -1) || segment.matchData?.winnersIds.includes(p2?.id || -1);
                                                    const commonFaction = (p1?.faction && p1.faction === p2?.faction) ? p1.faction : null;

                                                    return (
                                                        <React.Fragment key={startIndex}>
                                                            <div className={`${styles.teamBox} ${isWinner ? styles.winner : ''}`}>
                                                                <div className={styles.teamAvatars}>
                                                                    {p1?.avatar && <img src={fixPath(p1.avatar)} alt={p1.name} />}
                                                                    {p2?.avatar && <img src={fixPath(p2.avatar)} alt={p2.name} />}
                                                                </div>
                                                                <div className={styles.teamNames}>
                                                                    {commonFaction ? (
                                                                        <>
                                                                            <span className={styles.factionName}>{commonFaction}</span>
                                                                            <span className={styles.memberNames}>({p1?.name} & {p2?.name})</span>
                                                                        </>
                                                                    ) : (
                                                                        <span className={styles.namesOnly}>{p1?.name} & {p2?.name}</span>
                                                                    )}
                                                                </div>
                                                                {isWinner && <div className={styles.winnerBadge}>WINNERS</div>}
                                                            </div>
                                                            {startIndex === 0 && <span className={styles.vs}>VS</span>}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </>
                                        ) : (
                                            // SINGLES / MULTI LAYOUT (Standard)
                                            segment.matchData.participantsIds.map((pid, pIdx) => {
                                                const w = wrestlers.find(wr => wr.id === pid);
                                                const isWinner = segment.matchData?.winnersIds.includes(pid);
                                                return (
                                                    <React.Fragment key={pIdx}>
                                                        <div className={`${styles.wrestlerBox} ${isWinner ? styles.winner : ''}`}>
                                                            {w?.avatar && <img src={fixPath(w.avatar)} alt={w.name} />}
                                                            <span>{w?.name || 'Unknown'}</span>
                                                            {isWinner && <div className={styles.winnerBadge}>WINNER</div>}
                                                        </div>
                                                        {pIdx < segment.matchData!.participantsIds.length - 1 && <span className={styles.vs}>VS</span>}
                                                    </React.Fragment>
                                                );
                                            })
                                        )}
                                    </div>
                                    {segment.matchData.notes && (
                                        <div className={styles.notes}>
                                            {segment.matchData.notes}
                                        </div>
                                    )}
                                </div>
                            )}

                            {segment.type === 'Promo' && segment.promoData && (
                                <div className={styles.promoContent}>
                                    <div className={styles.promoParticipants}>
                                        {segment.promoData.participantsIds.map(pid => {
                                            const w = wrestlers.find(wr => wr.id === pid);
                                            return (
                                                <div key={pid} className={styles.promoWrestler}>
                                                    {w?.avatar && <img src={fixPath(w.avatar)} alt={w.name} />}
                                                    <span>{w?.name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className={styles.description}>{segment.promoData.description}</div>
                                </div>
                            )}

                            {segment.type === 'Video' && segment.videoData && (
                                <div className={styles.videoContent}>
                                    <div className={styles.description}>{segment.videoData.description}</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default ShowDetails;
