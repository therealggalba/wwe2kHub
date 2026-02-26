import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../db/db";
import type {
  Brand,
  Wrestler,
  Championship,
  Segment,
  BrandName,
  Show,
} from "../../models/types";
import { BRANDS_SEED } from "../../db/seeds/brands";
import { SHOWS_SEED } from "../../db/seeds/shows";
import FilterBar, {
  type GenderFilter,
  type AlignmentFilter,
} from "../../components/FilterBar/FilterBar";
import styles from "./EventCreation.module.scss";

const EventCreation = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const isWeekly = type === "semanal";

  // DB Data
  const [brands, setBrands] = useState<Brand[]>([]);
  const [allWrestlers, setAllWrestlers] = useState<Wrestler[]>([]);
  const [allTitles, setAllTitles] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [showName, setShowName] = useState("");
  const [season, setSeason] = useState(1);
  const [week, setWeek] = useState(1);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isRosterVisible, setIsRosterVisible] = useState(false);
  const [activePicker, setActivePicker] = useState<{
    segmentId: string;
    type: "Match" | "Promo";
    index: number;
  } | null>(null);
  const [overallRating, setOverallRating] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [customPoster, setCustomPoster] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [isShowDropdownOpen, setIsShowDropdownOpen] = useState(false);

  // Filters for Modal
  const [activeGender, setActiveGender] = useState<GenderFilter>("ALL");
  const [activeAlignment, setActiveAlignment] =
    useState<AlignmentFilter>("ALL");
  const [activeSubBrandId, setActiveSubBrandId] = useState<number | undefined>();

  // Sequential logic for Season/Week
  useEffect(() => {
    const suggestNextShow = async () => {
      if (!selectedBrand?.id) return;
      const latestShow = await db.shows
        .where("brandId")
        .equals(selectedBrand.id)
        .reverse()
        .sortBy("date");

      if (latestShow.length > 0) {
        const last = latestShow[0];
        if (last.week && last.week < 4) {
          setWeek(last.week + 1);
          setSeason(last.season || 1);
        } else {
          setWeek(1);
          setSeason((last.season || 1) + 1);
        }
      } else {
        setSeason(1);
        setWeek(1);
      }
    };
    suggestNextShow();
  }, [selectedBrand]);

  useEffect(() => {
    const loadData = async () => {
      // Reset sub-brand filter when changing main brand
      setActiveSubBrandId(undefined);

      // 1. Sync Brands from Seed
      const seedNames = BRANDS_SEED.map((s) => s.name.trim());

      for (const brandData of BRANDS_SEED) {
        const brandName = brandData.name.trim();
        const existing = await db.brands
          .where("name")
          .equals(brandName)
          .first();
        if (!existing) {
          await db.brands.add({
            name: brandName as BrandName,
            primaryColor: brandData.primaryColor,
            secondaryColor: brandData.secondaryColor,
            logo: brandData.logo,
          });
        } else {
          await db.brands.update(existing.id!, {
            primaryColor: brandData.primaryColor,
            secondaryColor: brandData.secondaryColor,
            logo: brandData.logo,
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
          if (bName !== "FREE AGENT") {
            // Keep special internal brands if they exist, but here we only care about seed
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

      const filteredBrands = b.filter((brand) => brand.name !== "FREE AGENT");
      setBrands(filteredBrands);
      setAllWrestlers(w);
      setAllTitles(t);

      // Default brand
      if (filteredBrands.length > 0) {
        setSelectedBrand(
          filteredBrands.find((brand) => brand.name === "RAW") ||
            filteredBrands[0],
        );
      }
      setLoading(false);
    };
    loadData();
  }, []);

  // Helper to fix paths
  const fixPath = (path: string | undefined): string => {
    if (!path) return "";
    if (path.startsWith("data:image")) return path; // Already a base64 string
    if (path.startsWith("./")) return path.replace("./", "/");
    return path;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes("png")) {
      alert("Please upload a PNG image.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCustomPoster(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const addSegment = (segmentType: "Match" | "Promo" | "Video") => {
    const newId = crypto.randomUUID();
    const newSegment: Segment = {
      id: newId,
      type: segmentType,
      matchData:
        segmentType === "Match"
          ? {
              titleMatch: false,
              type: "1 vs 1 Singles",
              participantsIds: [0, 0],
              winnersIds: [],
              rating: 0,
            }
          : undefined,
      promoData:
        segmentType === "Promo"
          ? { id: newId, participantsIds: [0], description: "" }
          : undefined,
      videoData:
        segmentType === "Video" ? { id: newId, description: "" } : undefined,
    };
    setSegments([...segments, newSegment]);
  };

  const removeSegment = (id: string) => {
    setSegments(segments.filter((s) => s.id !== id));
  };

  const updateSegment = (id: string, data: Partial<Segment>) => {
    setSegments(segments.map((s) => (s.id === id ? { ...s, ...data } : s)));
  };

  const handleSave = async () => {
    if (!selectedBrand) return;
    setIsSaving(true);

    try {
      // 0. Validation: Check for duplicates
      if (selectedBrand?.id) {
        const existing = await db.shows
          .where({
            brandId: selectedBrand.id,
            season: season,
            week: week
          })
          .first();

        if (existing) {
          alert(`A show for ${selectedBrand.name} in Season ${season}, Week ${week} already exists!`);
          setIsSaving(false);
          return;
        }
      }

      // 1. Prepare the show data
      const finalShowName = isWeekly
        ? SHOWS_SEED.find(
            (s) => s.brandName === selectedBrand.name && s.type === "Weekly",
          )?.name || `${selectedBrand.name} Weekly`
        : showName;

      const showData: Record<string, unknown> = {
        name: finalShowName,
        date: new Date(),
        brandId: selectedBrand.id,
        type: isWeekly ? "Weekly" : "PLE",
        card: {
          segments: segments,
        },
        valuation: overallRating,
        // Add metadata for tracking
        season,
        week,
      };

      if (customPoster) {
        showData.image = customPoster;
      }

      // 2. Save to Dexie
      await db.shows.add(showData as unknown as Show);

      // 3. Automated Championship Management
      for (const segment of segments) {
        if (segment.type === 'Match' && segment.matchData?.titleMatch && segment.matchData.championshipId) {
          const { championshipId, winnersIds } = segment.matchData;
          const championship = await db.championships.get(championshipId);
          
          if (championship) {
            const currentChampionId = championship.currentChampionId;
            const isNewChampion = winnersIds.length > 0 && !winnersIds.includes(currentChampionId || -1);

            if (isNewChampion) {
              // A. Remove title from former champion(s)
              const formerChampions = await db.wrestlers
                .filter(w => (w.currentTitlesIds || []).includes(championshipId))
                .toArray();

              for (const former of formerChampions) {
                await db.wrestlers.update(former.id!, {
                  currentTitlesIds: (former.currentTitlesIds || []).filter(id => id !== championshipId)
                });
              }

              // B. Add title to new champion(s)
              // Note: For tag team titles, winnersIds might have multiple wrestlers
              for (const newChampId of winnersIds) {
                const wrestler = await db.wrestlers.get(newChampId);
                if (wrestler) {
                  const updatedTitles = Array.from(new Set([...(wrestler.currentTitlesIds || []), championshipId]));
                  await db.wrestlers.update(newChampId, {
                    currentTitlesIds: updatedTitles
                  });
                }
              }

              // C. Update Championship record
              const newChampionNames = await Promise.all(
                winnersIds.map(async id => (await db.wrestlers.get(id))?.name || 'Unknown')
              );

              const historyEntry = {
                wrestlerName: newChampionNames.join(' & '),
                reignNumber: (championship.history?.length || 0) + 1,
                totalWeeks: 0
              };

              await db.championships.update(championshipId, {
                currentChampionId: winnersIds[0], // For tag, we store the first one or logic needs adjustment for multi-champion tracking
                history: [...(championship.history || []), historyEntry]
              });
            }
          }
        }
      }

      // 4. Automated Wrestler Statistics Management
      for (const segment of segments) {
        if (segment.type === 'Match' && segment.matchData) {
          const { participantsIds, winnersIds } = segment.matchData;
          const isDraw = winnersIds.includes(-1);

          for (const pid of participantsIds) {
            if (pid === 0) continue; // Skip unassigned slots
            const wrestler = await db.wrestlers.get(pid);
            if (!wrestler) continue;

            const updateFields: Partial<typeof wrestler> = {};

            if (isDraw) {
              updateFields.draws = (wrestler.draws || 0) + 1;
            } else {
              const won = winnersIds.includes(pid);
              if (won) {
                updateFields.wins = (wrestler.wins || 0) + 1;
              } else {
                updateFields.losses = (wrestler.losses || 0) + 1;
              }
            }

            await db.wrestlers.update(pid, updateFields);
          }
        }
      }

      // 5. Dummy JSON Export for verification
      const blob = new Blob([JSON.stringify(showData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${finalShowName.replace(/\s+/g, "_")}_S${season}W${week}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // 4. Navigate back
      navigate("/");
    } catch (error) {
      console.error("Error saving show:", error);
      alert("Failed to save show. Check console.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !selectedBrand)
    return <div className={styles.loading}>Loading...</div>;

  const brandWrestlers = allWrestlers.filter((w) => {
    if (selectedBrand.name === "SHARED") {
      if (activeSubBrandId) return w.brandId === activeSubBrandId;
      return true;
    }
    return w.brandId === selectedBrand.id;
  });

  const brandTitles = allTitles.filter((t) => {
    if (selectedBrand.name === "SHARED") return true;
    return t.brandId === selectedBrand.id;
  });

  return (
    <div
      className={styles.eventCreationPage}
      style={
        {
          "--primary": selectedBrand.primaryColor,
          "--secondary": selectedBrand.secondaryColor,
        } as React.CSSProperties
      }
    >
      {/* Header / Top Bar */}
      <header className={styles.topBar}>
        <div className={styles.typeLabel}>{isWeekly ? "WEEK" : "PLE"}</div>

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
            {selectedBrand.name === "SHARED" && (
              <span className={styles.sharedLabel}>SHARED</span>
            )}
          </div>
          {isBrandDropdownOpen && (
            <div className={styles.brandDropdownList}>
              {brands
                .filter((brand) => {
                  if (brand.name === "SHARED") return !isWeekly;
                  return true;
                })
                .map((brand) => (
                  <div
                    key={brand.id}
                    className={`${styles.brandOption} ${selectedBrand.id === brand.id ? styles.active : ""}`}
                    onClick={() => {
                      setSelectedBrand(brand);
                      setShowName("");
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
                      const show = SHOWS_SEED.find((s) => s.name === showName);
                      return show ? (
                        <>
                          <img
                            src={fixPath(show.image)}
                            alt={show.name}
                            className={styles.showLogoHeader}
                          />
                          <span>{show.name}</span>
                        </>
                      ) : (
                        <span>{showName}</span>
                      );
                    })()}
                  </div>
                ) : (
                  <span className={styles.placeholderText}>
                    Select PLE Show
                  </span>
                )}
              </div>

              {isShowDropdownOpen && (
                <div className={styles.showDropdownList}>
                  {SHOWS_SEED.filter((show) => {
                    if (show.type !== "PLE") return false;
                    return show.brandName === selectedBrand.name;
                  }).map((show) => (
                    <div
                      key={show.name}
                      className={styles.showOption}
                      onClick={() => {
                        setShowName(show.name);
                        setIsShowDropdownOpen(false);
                      }}
                    >
                      <div className={styles.showOptionLeft}>
                        <img
                          src={fixPath(show.image)}
                          alt={show.name}
                          className={styles.showOptionImage}
                        />
                        <span>{show.name}</span>
                      </div>
                      {show.brandName === "SHARED" && (
                        <div className={styles.sharedIndicators}>
                          {brands
                            .filter(
                              (b) => b.name === "RAW" || b.name === "SMACKDOWN",
                            )
                            .map((b) => (
                              <img
                                key={b.id}
                                src={fixPath(b.logo)}
                                alt={b.name}
                                className={styles.miniLogo}
                              />
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {!isWeekly && (
            <div className={styles.posterUploadArea}>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/png"
                onChange={handleImageUpload}
              />
              <button
                className={`${styles.uploadBtn} ${customPoster ? styles.hasPoster : ""}`}
                onClick={() => fileInputRef.current?.click()}
                title="Upload custom PLE poster"
              >
                {customPoster ? "✅ Poster" : "📤 Poster"}
              </button>
            </div>
          )}
          {isWeekly && (
            <div className={styles.selectedShow}>
              {(() => {
                const show = SHOWS_SEED.find(
                  (s) =>
                    s.brandName === selectedBrand.name && s.type === "Weekly",
                );
                return show ? (
                  <>
                    <span>{show.name}</span>
                  </>
                ) : (
                  <span className={styles.placeholderText}>
                    {selectedBrand.name} Weekly Show
                  </span>
                );
              })()}
            </div>
          )}
        </div>

        <div className={styles.timeInfo}>
          <div className={styles.inputGroup}>
            <input
              type="number"
              value={season}
              min={1}
              max={10}
              onChange={(e) => setSeason(parseInt(e.target.value))}
            />
            <span>Season</span>
          </div>
          <div className={styles.inputGroup}>
            <input
              type="number"
              value={week}
              min={1}
              max={52}
              onChange={(e) => setWeek(parseInt(e.target.value))}
            />
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
            const hasPendingWinners = segments.some(
              (s) => s.type === "Match" && !s.matchData?.winnersIds.length,
            );
            const isPLEMissingName = !isWeekly && !showName;
            const isDisabled = isPLEMissingName || hasPendingWinners;

            return (
              <>
                <button
                  disabled={isDisabled}
                  onClick={() => addSegment("Match")}
                >
                  Match
                </button>
                <button
                  disabled={isDisabled}
                  onClick={() => addSegment("Promo")}
                >
                  Promo
                </button>
                <button
                  disabled={isDisabled}
                  onClick={() => addSegment("Video")}
                >
                  Video
                </button>
                {isPLEMissingName && (
                  <span className={styles.warningHint}>Pick PLE first</span>
                )}
                {hasPendingWinners && (
                  <span className={styles.warningHint}>Assign Winners</span>
                )}
              </>
            );
          })()}
        </div>
        <div className={styles.rosterToggle}>
          <span>Roster :</span>
          <button
            onClick={() => setIsRosterVisible(!isRosterVisible)}
            className={isRosterVisible ? styles.active : ""}
          >
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
                <span className={styles.segmentTitle}>
                  {segment.type} #{index + 1}
                </span>
                {segment.type === "Promo" && (
                  <div className={styles.participantControls}>
                    <button
                      onClick={() => {
                        if (segment.promoData!.participantsIds.length < 6) {
                          const newParticipants = [
                            ...segment.promoData!.participantsIds,
                            0,
                          ];
                          updateSegment(segment.id, {
                            promoData: {
                              ...segment.promoData!,
                              participantsIds: newParticipants,
                            },
                          });
                        }
                      }}
                      className={styles.addParticipantBtn}
                    >
                      +
                    </button>
                    <button
                      onClick={() => {
                        if (segment.promoData!.participantsIds.length > 1) {
                          const newParticipants =
                            segment.promoData!.participantsIds.slice(0, -1);
                          updateSegment(segment.id, {
                            promoData: {
                              ...segment.promoData!,
                              participantsIds: newParticipants,
                            },
                          });
                        }
                      }}
                      className={styles.removeParticipantBtn}
                    >
                      -
                    </button>
                  </div>
                )}
              </div>
              <button
                className={styles.deleteBtn}
                onClick={() => removeSegment(segment.id)}
              >
                x
              </button>
            </div>

            {/* VIDEO SEGMENT */}
            {segment.type === "Video" && (
              <textarea
                placeholder="Write what happens in the video package..."
                value={segment.videoData?.description}
                onChange={(e) =>
                  updateSegment(segment.id, {
                    videoData: {
                      ...segment.videoData!,
                      description: e.target.value,
                    },
                  })
                }
              />
            )}

            {/* PROMO SEGMENT */}
            {segment.type === "Promo" && (
              <div className={styles.promoContent}>
                <div className={styles.promoLeft}>
                  <div
                    className={`${styles.promoGrid} ${styles[`grid-${segment.promoData!.participantsIds.length}`]}`}
                  >
                    {segment.promoData!.participantsIds.map((pid, pIdx) => {
                      const wrestler = allWrestlers.find((w) => w.id === pid);
                      return (
                        <div
                          key={pIdx}
                          className={styles.pSlot}
                          onClick={() =>
                            setActivePicker({
                              segmentId: segment.id,
                              type: "Promo",
                              index: pIdx,
                            })
                          }
                        >
                          {wrestler ? (
                            <img
                              src={fixPath(wrestler.avatar || wrestler.image)}
                              alt={wrestler.name}
                            />
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
                    onChange={(e) =>
                      updateSegment(segment.id, {
                        promoData: {
                          ...segment.promoData!,
                          description: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            )}

            {/* MATCH SEGMENT */}
            {segment.type === "Match" && (
              <div className={styles.matchContent}>
                <div className={styles.matchControls}>
                  <select
                    value={segment.matchData?.championshipId || ""}
                    onChange={(e) => {
                      const champId = e.target.value
                        ? parseInt(e.target.value)
                        : undefined;
                      const championship = allTitles.find(
                        (t) => t.id === champId,
                      );

                      // Reset participants
                      const currentCount =
                        segment.matchData?.participantsIds.length || 2;
                      const currentType = segment.matchData?.type;
                      const newParticipants = Array(currentCount).fill(0);

                      if (championship) {
                        const champions = allWrestlers.filter(w => w.currentTitlesIds?.includes(championship.id!));
                        if (champions.length > 0) {
                          if (currentType === "2 vs 2 Tag Team") {
                            newParticipants[0] = champions[0].id!;
                            if (champions[1]) newParticipants[1] = champions[1].id!;
                          } else {
                            newParticipants[0] = champions[0].id!;
                          }
                        }
                      }

                      updateSegment(segment.id, {
                        matchData: {
                          ...segment.matchData!,
                          championshipId: champId,
                          titleMatch: !!champId,
                          participantsIds: newParticipants,
                          winnersIds: [], // Also reset winner
                        },
                      });
                    }}
                  >
                    <option value="">Non-title match</option>
                    {brandTitles.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={segment.matchData?.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      let numParticipants = 2;
                      if (newType === "Triple Threat 1 vs 1 vs 1")
                        numParticipants = 3;
                      if (newType === "Fatal 4-Way 1 vs 1 vs 1 vs 1" || newType === "2 vs 2 Tag Team")
                        numParticipants = 4;

                      // Reset participants to 0
                      const newParticipants = Array(numParticipants).fill(0);

                      // If title match, re-apply champions
                      if (segment.matchData?.championshipId) {
                        const championship = allTitles.find(
                          (t) => t.id === segment.matchData?.championshipId,
                        );
                        if (championship) {
                          // Find all wrestlers who have this title
                          const champions = allWrestlers.filter(w => w.currentTitlesIds?.includes(championship.id!));
                          if (champions.length > 0) {
                            if (newType === "2 vs 2 Tag Team") {
                              // Tag match: fill first two slots with champions
                              newParticipants[0] = champions[0].id!;
                              if (champions[1]) newParticipants[1] = champions[1].id!;
                            } else {
                              // Singles/Multi: first slot for champ
                              newParticipants[0] = champions[0].id!;
                            }
                          }
                        }
                      }

                      updateSegment(segment.id, {
                        matchData: {
                          ...segment.matchData!,
                          type: newType,
                          participantsIds: newParticipants,
                          winnersIds: [], // Also reset winner
                        },
                      });
                    }}
                  >
                    <option>1 vs 1 Singles</option>
                    <option>1 vs 1 noDQ</option>
                    <option>Triple Threat 1 vs 1 vs 1</option>
                    <option>Fatal 4-Way 1 vs 1 vs 1 vs 1</option>
                    <option>2 vs 2 Tag Team</option>
                  </select>
                </div>
                <div className={styles.matchBody}>
                  <div className={styles.matchParticipants}>
                    {segment.matchData?.type === "2 vs 2 Tag Team" ? (
                      // TAG TEAM LAYOUT
                      <>
                        <div className={styles.tagGroup}>
                          {[0, 1].map((pIdx) => {
                            const pid = segment.matchData!.participantsIds[pIdx];
                            const wrestler = allWrestlers.find((w) => w.id === pid);
                            return (
                              <div key={pIdx} className={styles.participantNode}>
                                <div
                                  className={`${styles.pSlot} ${segment.matchData?.titleMatch && pIdx < 2 ? styles.locked : ""}`}
                                  onClick={() => {
                                    if (segment.matchData?.titleMatch && pIdx < 2) return;
                                    setActivePicker({ segmentId: segment.id, type: "Match", index: pIdx });
                                  }}
                                >
                                  {wrestler ? <img src={fixPath(wrestler.avatar || wrestler.image)} alt={wrestler.name} /> : <div className={styles.placeholder}>?</div>}
                                </div>
                                <span className={styles.pName}>{wrestler?.name || `Wrestler ${pIdx + 1}`}</span>
                              </div>
                            );
                          })}
                        </div>
                        <span className={styles.vs}>VS.</span>
                        <div className={styles.tagGroup}>
                          {[2, 3].map((pIdx) => {
                            const pid = segment.matchData!.participantsIds[pIdx];
                            const wrestler = allWrestlers.find((w) => w.id === pid);
                            return (
                              <div key={pIdx} className={styles.participantNode}>
                                <div
                                  className={styles.pSlot}
                                  onClick={() => setActivePicker({ segmentId: segment.id, type: "Match", index: pIdx })}
                                >
                                  {wrestler ? <img src={fixPath(wrestler.avatar || wrestler.image)} alt={wrestler.name} /> : <div className={styles.placeholder}>?</div>}
                                </div>
                                <span className={styles.pName}>{wrestler?.name || `Wrestler ${pIdx + 1}`}</span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      // SINGLES / MULTI LAYOUT
                      segment.matchData?.participantsIds.map((pid, pIdx) => {
                        const wrestler = allWrestlers.find((w) => w.id === pid);
                        return (
                          <React.Fragment key={pIdx}>
                            <div className={styles.participantNode}>
                              <div
                                className={`${styles.pSlot} ${segment.matchData?.titleMatch && pIdx === 0 ? styles.locked : ""}`}
                                onClick={() => {
                                  if (segment.matchData?.titleMatch && pIdx === 0)
                                    return;
                                  setActivePicker({
                                    segmentId: segment.id,
                                    type: "Match",
                                    index: pIdx,
                                  });
                                }}
                              >
                                {wrestler ? (
                                  <img
                                    src={fixPath(
                                      wrestler.avatar || wrestler.image,
                                    )}
                                    alt={wrestler.name}
                                  />
                                ) : (
                                  <div className={styles.placeholder}>?</div>
                                )}
                              </div>
                              <span className={styles.pName}>
                                {wrestler?.name || `Wrestler ${pIdx + 1}`}
                              </span>
                            </div>
                            {pIdx < (segment.matchData?.participantsIds.length || 0) - 1 && <span className={styles.vs}>VS.</span>}
                          </React.Fragment>
                        );
                      })
                    )}
                  </div>
                  <div className={styles.matchRight}>
                    <div className={styles.winnerSection}>
                      <select
                        className={styles.winnerSelect}
                        value={segment.matchData?.winnersIds.join(",")}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "-1") {
                            updateSegment(segment.id, { matchData: { ...segment.matchData!, winnersIds: [-1] } });
                          } else if (val) {
                            updateSegment(segment.id, { matchData: { ...segment.matchData!, winnersIds: val.split(",").map(Number) } });
                          } else {
                            updateSegment(segment.id, { matchData: { ...segment.matchData!, winnersIds: [] } });
                          }
                        }}
                      >
                        <option value="">Choose the winner</option>
                        {segment.matchData?.type === "2 vs 2 Tag Team" ? (
                          <>
                            {(() => {
                              const p0 = allWrestlers.find(wr => wr.id === segment.matchData?.participantsIds[0]);
                              const p1 = allWrestlers.find(wr => wr.id === segment.matchData?.participantsIds[1]);
                              const p2 = allWrestlers.find(wr => wr.id === segment.matchData?.participantsIds[2]);
                              const p3 = allWrestlers.find(wr => wr.id === segment.matchData?.participantsIds[3]);
                              return (
                                <>
                                  {p0 && p1 && (
                                    <option value={[p0.id, p1.id].join(",")}>
                                      {p0.name} & {p1.name}
                                    </option>
                                  )}
                                  {p2 && p3 && (
                                    <option value={[p2.id, p3.id].join(",")}>
                                      {p2.name} & {p3.name}
                                    </option>
                                  )}
                                </>
                              );
                            })()}
                          </>
                        ) : (
                          segment.matchData?.participantsIds.map((pid) => {
                            const w = allWrestlers.find((wr) => wr.id === pid);
                            if (!w) return null;
                            return (
                              <option key={pid} value={pid.toString()}>
                                {w.name}
                              </option>
                            );
                          })
                        )}
                        <option value="-1">NO CONTEST</option>
                      </select>
                    </div>
                    <textarea
                      placeholder="Post match"
                      value={segment.matchData?.notes || ""}
                      onChange={(e) =>
                        updateSegment(segment.id, {
                          matchData: {
                            ...segment.matchData!,
                            notes: e.target.value,
                          },
                        })
                      }
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
        <div className={styles.ratingSection}>
          <div className={styles.ratingTitle}>SHOW RATING</div>
          <div className={styles.ratingControls}>
            <div className={styles.starsRow}>
              {Array.from({ length: 10 }).map((_, i) => (
                <span
                  key={i}
                  className={i < Math.floor(overallRating) ? styles.starFilled : styles.starEmpty}
                  onClick={() => setOverallRating(i + 1)}
                >
                  ★
                </span>
              ))}
            </div>
            <div className={styles.ratingInputGroup}>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={overallRating}
                onChange={(e) => setOverallRating(parseFloat(e.target.value))}
                className={styles.ratingSlider}
              />
              <span className={styles.ratingDisplay}>{overallRating.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <button
          className={styles.saveBtn}
          disabled={isSaving || overallRating === 0 || (!isWeekly && !showName) || segments.some(s => s.type === 'Match' && (!s.matchData?.winnersIds.length || s.matchData.winnersIds[0] === undefined))}
          onClick={handleSave}
        >
          {overallRating === 0 ? 'RATE THE SHOW' : (isSaving ? 'SAVING...' : 'SAVE AND GO BACK')}
        </button>
      </footer>

      {/* Roster Modal / Overlay */}
      {(isRosterVisible || activePicker) && (
        <div className={styles.rosterModal}>
          <div className={styles.modalHeader}>
            <h3>
              {activePicker
                ? `Select Wrestler for ${activePicker.type}`
                : `${selectedBrand.name} Roster`}
            </h3>
            <button
              onClick={() => {
                setIsRosterVisible(false);
                setActivePicker(null);
              }}
            >
              Close
            </button>
          </div>

          <FilterBar
            activeGender={activeGender}
            activeAlignment={activeAlignment}
            onGenderChange={setActiveGender}
            onAlignmentChange={setActiveAlignment}
            primaryColor={selectedBrand.primaryColor}
            secondaryColor={selectedBrand.secondaryColor}
            brands={selectedBrand.name === "SHARED" ? brands.filter(b => b.name !== "SHARED" && b.name !== "FREE AGENT") : undefined}
            activeBrandId={activeSubBrandId}
            onBrandChange={setActiveSubBrandId}
          />

          <div className={styles.wrestlerGrid}>
            {brandWrestlers
              .filter((w) => {
                // Participation filter
                if (activePicker?.type === "Match") {
                  const segment = segments.find(
                    (s) => s.id === activePicker.segmentId,
                  );
                  if (segment?.matchData?.participantsIds.includes(w.id!))
                    return false;
                }
                if (activePicker?.type === "Promo") {
                  const segment = segments.find(
                    (s) => s.id === activePicker.segmentId,
                  );
                  if (segment?.promoData?.participantsIds.includes(w.id!))
                    return false;
                }

                // Gender filter
                let matchesGender =
                  activeGender === "ALL" ||
                  (activeGender === "MEN" && w.gender === "Male") ||
                  (activeGender === "WOMEN" && w.gender === "Female");

                // Intergender restriction: if match and not first slot, match first participant's gender
                if (
                  activePicker?.type === "Match" &&
                  activePicker.index !== 0
                ) {
                  const segment = segments.find(
                    (s) => s.id === activePicker.segmentId,
                  );
                  const firstParticipantId =
                    segment?.matchData?.participantsIds[0];
                  if (firstParticipantId) {
                    const firstParticipant = allWrestlers.find(
                      (wr) => wr.id === firstParticipantId,
                    );
                    if (
                      firstParticipant &&
                      w.gender !== firstParticipant.gender
                    ) {
                      matchesGender = false;
                    }
                  }
                }

                // Alignment filter
                const matchesAlignment =
                  activeAlignment === "ALL" ||
                  (activeAlignment === "FACES" && w.alignment === "Face") ||
                  (activeAlignment === "HEELS" && w.alignment === "Heel");

                return matchesGender && matchesAlignment;
              })
              .map((w) => (
                <div
                  key={w.id}
                  className={styles.wrestlerItem}
                  onClick={() => {
                    if (activePicker) {
                      const segment = segments.find(
                        (s) => s.id === activePicker.segmentId,
                      );
                      if (segment) {
                        if (activePicker.type === "Match") {
                          const newP = [...segment.matchData!.participantsIds];
                          newP[activePicker.index] = w.id!;

                          // Auto-partner selection for Tag Team
                          if (segment.matchData!.type === "2 vs 2 Tag Team" && w.faction) {
                            const isSlot0or1 = activePicker.index <= 1;
                            const partnerIndex = isSlot0or1
                              ? (activePicker.index === 0 ? 1 : 0)
                              : (activePicker.index === 2 ? 3 : 2);
                            
                            // If partner slot is empty, try to fill it
                            if (newP[partnerIndex] === 0) {
                              const partner = allWrestlers.find(p => 
                                p.faction === w.faction && 
                                p.id !== w.id && 
                                p.gender === w.gender &&
                                !newP.includes(p.id!)
                              );
                              if (partner) {
                                newP[partnerIndex] = partner.id!;
                              }
                            }
                          }

                          updateSegment(segment.id, {
                            matchData: {
                              ...segment.matchData!,
                              participantsIds: newP,
                              winnersIds: [], // Reset winners on change
                            },
                          });
                        } else {
                          const newP = [...segment.promoData!.participantsIds];
                          newP[activePicker.index] = w.id!;
                          updateSegment(segment.id, {
                            promoData: {
                              ...segment.promoData!,
                              participantsIds: newP,
                            },
                          });
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
