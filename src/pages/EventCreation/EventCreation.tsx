import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../db/db";
import type {
  Brand,
  Wrestler,
  Championship,
  Segment,
  Show,
  TitleHistoryEntry,
} from "../../models/types";
import { GAME_CONFIG } from "../../config/gameConfig";
import { 
  MATCH_QUANTITIES, 
  STIPULATIONS_BY_QUANTITY, 
  getParticipantCount 
} from "../../constants/matchTypes";
import FilterBar, {
  type GenderFilter,
  type AlignmentFilter,
} from "../../components/FilterBar/FilterBar";
import ResolvedImage from "../../components/Common/ResolvedImage";
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
  const [showImage, setShowImage] = useState("");
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
  const [availableShows, setAvailableShows] = useState<Show[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [isShowDropdownOpen, setIsShowDropdownOpen] = useState(false);

  // Filters for Modal
  const [activeGender, setActiveGender] = useState<GenderFilter>("ALL");
  const [activeAlignment, setActiveAlignment] =
    useState<AlignmentFilter>("ALL");
  const [activeSubBrandId, setActiveSubBrandId] = useState<
    number | undefined
  >();

  const [weeksPerSeason, setWeeksPerSeason] = useState(GAME_CONFIG.settings.weeksPerSeason);

  // Sequential logic for Season/Week
  useEffect(() => {
    const suggestNextShow = async () => {
      if (!selectedBrand?.id) return;
      
      const weeksSetting = await db.settings.get("weeksPerSeason");
      const currentWeeksPerSeason = Number(weeksSetting?.value || GAME_CONFIG.settings.weeksPerSeason);
      setWeeksPerSeason(currentWeeksPerSeason);

      // Only count shows that have been actually created/played (have season and week)
      const playedShows = await db.shows
        .where("brandId")
        .equals(selectedBrand.id)
        .filter(s => s.season !== undefined && s.week !== undefined)
        .reverse()
        .sortBy("date");

      if (playedShows.length > 0) {
        const last = playedShows[0];
        if (last.week! < currentWeeksPerSeason) {
          setWeek(last.week! + 1);
          setSeason(last.season!);
        } else {
          setWeek(1);
          setSeason(last.season! + 1);
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

      const allBrands = await db.brands.toArray();

      // If no SHARED brand exists in DB, synthesize a virtual one for PLE mode
      const hasShared = allBrands.some(
        (b) => b.isShared || b.name.toUpperCase() === "SHARED",
      );
      if (!hasShared && !isWeekly) {
        const configShared = GAME_CONFIG.brands.find(
          (b) => b.isShared || b.name.toUpperCase() === "SHARED",
        );
        if (configShared) {
          allBrands.push({
            ...configShared,
            id: -1, // Virtual ID for Shared Brand
          } as Brand);
        }
      }

      const allWrestlers = await db.wrestlers.toArray();
      const allTitles = (await db.championships.toArray()).map((t) => ({
        ...t,
        gender: t.gender || (t.name.toLowerCase().includes("women") ? "Female" : "Male"),
      })) as Championship[];
      const allShows = await db.shows.toArray(); // Fetch all shows here

      // Only hide FREE AGENT from the brand list, but keep the virtual SHARED brand
      const filteredBrands = allBrands.filter(
        (brand) => brand.name !== "FREE AGENT" || brand.id === -1,
      );
      setBrands(filteredBrands);
      setAllWrestlers(allWrestlers);
      setAllTitles(allTitles);
      setAvailableShows(allShows); // Set available shows here

      // Default brand selection
      if (!selectedBrand && filteredBrands.length > 0) {
        // If PLE, try to select SHARED first if it exists
        const shared = filteredBrands.find(
          (b) => b.isShared || b.name.toUpperCase() === "SHARED" || b.id === -1,
        );
        if (!isWeekly && shared) {
          setSelectedBrand(shared);
        } else {
          // Otherwise first major brand or the first brand in the filtered list
          const major = filteredBrands.find((b) => b.isMajorBrand);
          setSelectedBrand(major || filteredBrands[0]);
        }
      }

      setLoading(false);
    };
    loadData();
  }, [selectedBrand, isWeekly]); // Added isWeekly to dependencies

  useEffect(() => {
    if (showName && availableShows.length > 0) {
      const currentShow = availableShows.find((s) => s.name === showName);
      if (currentShow && currentShow.image) {
        setShowImage(currentShow.image);
      }
    }
  }, [showName, availableShows]);

  // Sync gender filter with active title match
  useEffect(() => {
    if (activePicker?.type === "Match") {
      const segment = segments.find(s => s.id === activePicker.segmentId);
      if (segment?.matchData?.titleMatch && segment.matchData.championshipId) {
        const champ = allTitles.find(t => t.id === segment.matchData!.championshipId);
        if (champ) {
          if (champ.gender === "Female") setActiveGender("WOMEN");
          else setActiveGender("MEN");
        }
      }
    }
  }, [activePicker, segments, allTitles]);

  // Helper to fix paths

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
      if (selectedBrand?.id !== -1) { // Only check for duplicates if it's a real brand
        const existing = await db.shows
          .where({
            brandId: selectedBrand.id,
            season: season,
            week: week,
          })
          .first();

        if (existing) {
          alert(
            `A show for ${selectedBrand.name} in Season ${season}, Week ${week} already exists!`,
          );
          setIsSaving(false);
          return;
        }
      }

      // 1. Prepare the show data
      const weeklyTemplate = availableShows.find(
        (s) => s.brandId === selectedBrand.id && s.type === "Weekly",
      );
      const finalShowName = isWeekly
        ? weeklyTemplate?.name || `${selectedBrand.name} Weekly`
        : showName;

      const showData: Record<string, unknown> = {
        name: finalShowName,
        date: new Date(),
        brandId: selectedBrand.id === -1 ? undefined : selectedBrand.id, // Use undefined for virtual SHARED brand
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
        showData.poster = customPoster;
      } else if (!isWeekly && showImage) {
        showData.image = showImage;
      }

      // 2. Save to Dexie
      await db.shows.add(showData as unknown as Show);

      // 3. Automated Championship Management & Morale
      const titleLosers = new Set<number>();
      const titleWinners = new Set<number>();
      const titleDefenders = new Set<number>();

      for (const segment of segments) {
        if (
          segment.type === "Match" &&
          segment.matchData?.titleMatch &&
          segment.matchData.championshipId
        ) {
          const { championshipId, winnersIds } = segment.matchData;
          const championship = await db.championships.get(championshipId);

          if (championship) {
            const currentChampionId = championship.currentChampionId;
            const isDraw = winnersIds.includes(-1);
            const isNewChampion =
              !isDraw &&
              winnersIds.length > 0 &&
              !winnersIds.includes(currentChampionId || -1);

            if (isNewChampion) {
              // A. Remove title from former champion(s)
              const formerChampions = await db.wrestlers
                .filter((w) =>
                  (w.currentTitlesIds || []).includes(championshipId),
                )
                .toArray();

              for (const former of formerChampions) {
                titleLosers.add(former.id!);
                await db.wrestlers.update(former.id!, {
                  currentTitlesIds: (former.currentTitlesIds || []).filter(
                    (id) => id !== championshipId,
                  ),
                });
              }

              // B. Add title to new champion(s)
              for (const newChampId of winnersIds) {
                const wrestler = await db.wrestlers.get(newChampId);
                if (wrestler) {
                  titleWinners.add(newChampId);
                  const updatedTitles = Array.from(
                    new Set([
                      ...(wrestler.currentTitlesIds || []),
                      championshipId,
                    ]),
                  );
                  await db.wrestlers.update(newChampId, {
                    currentTitlesIds: updatedTitles,
                  });
                }
              }

              // C. Update Championship record
              const newChampionNames = await Promise.all(
                winnersIds.map(
                  async (id) => (await db.wrestlers.get(id))?.name || "Unknown",
                ),
              );

              const historyEntry: TitleHistoryEntry = {
                wrestlerIds: winnersIds,
                wrestlerName: newChampionNames.join(" & "),
                reignNumber: (championship.history?.length || 0) + 1,
                totalWeeks: 0,
              };

              await db.championships.update(championshipId, {
                currentChampionId: winnersIds[0],
                history: [...(championship.history || []), historyEntry],
              });
            } else if (!isDraw) {
              // Champion retained
              winnersIds.forEach((id) => titleDefenders.add(id));
            }
          }
        }
      }

      // 3.5 Increment Tenure for ALL active championships (1 week passes)
      const allChamps = await db.championships.toArray();
      for (const champ of allChamps) {
        if (
          champ.currentChampionId &&
          champ.history &&
          champ.history.length > 0
        ) {
          const lastIndex = champ.history.length - 1;
          const updatedHistory = [...champ.history];
          updatedHistory[lastIndex].totalWeeks += 1;
          await db.championships.update(champ.id!, { history: updatedHistory });
        }
      }

      // 4. Automated Wrestler Statistics & Morale Management
      const appearanceBonus = isWeekly ? 3 : 5;
      const allParticipants = new Set(
        segments.flatMap((s) =>
          s.type === "Match"
            ? s.matchData?.participantsIds || []
            : s.type === "Promo"
              ? s.promoData?.participantsIds || []
              : [],
        ),
      );

      const moraleSettings = await db.settings.get("enableMorale");
      const isMoraleEnabled = moraleSettings
        ? moraleSettings.value
        : GAME_CONFIG.settings.enableMorale;

      for (const pid of allParticipants) {
        if (pid === 0) continue;
        const wrestler = await db.wrestlers.get(pid);
        if (!wrestler) continue;

        const updateFields: Partial<Wrestler> = {};

        if (isMoraleEnabled) {
          let moraleChange = appearanceBonus;
          if (titleWinners.has(pid) || titleDefenders.has(pid))
            moraleChange += 5;
          if (titleLosers.has(pid)) moraleChange -= 10;

          const nextMorale = Math.min(
            100,
            Math.max(5, (wrestler.moral || 80) + moraleChange),
          );
          updateFields.moral = nextMorale;
          updateFields.isActive = nextMorale >= 5;
        }

        // If in a match, update stats (always, unless specifically told otherwise)
        const matchSegment = segments.find(
          (s) =>
            s.type === "Match" && s.matchData?.participantsIds.includes(pid),
        );
        if (matchSegment?.matchData) {
          const { winnersIds } = matchSegment.matchData;
          updateFields.matchesSeason = (wrestler.matchesSeason || 0) + 1;

          if (winnersIds.includes(-1)) {
            updateFields.draws = (wrestler.draws || 0) + 1;
          } else if (winnersIds.includes(pid)) {
            updateFields.wins = (wrestler.wins || 0) + 1;
          } else {
            updateFields.losses = (wrestler.losses || 0) + 1;
          }
        }

        if (Object.keys(updateFields).length > 0) {
          await db.wrestlers.update(pid, updateFields);
        }
      }

      // 6. Injury System logic
      const injurySettings = await db.settings.get("enableInjuries");
      const isInjuryEnabled = injurySettings
        ? injurySettings.value
        : GAME_CONFIG.settings.enableInjuries;

      if (isInjuryEnabled) {
        const participantsIds = new Set(
          segments.flatMap((s) =>
            s.type === "Match" ? s.matchData?.participantsIds || [] : [],
          ),
        );

        // 1. Recover/Decrement weeks for existing injuries of this brand
        const currentlyInjured = await db.wrestlers
          .where("brandId")
          .equals(selectedBrand.id!)
          .and((w) => w.injuryWeeks > 0)
          .toArray();

        for (const w of currentlyInjured) {
          // If they weren't in this show, decrement
          if (!participantsIds.has(w.id!)) {
            const nextWeeks = w.injuryWeeks - 1;
            const updateFields: Partial<Wrestler> = {
              injuryWeeks: nextWeeks,
              injuryStatus: nextWeeks > 0 ? w.injuryStatus : "None",
            };

            if (isMoraleEnabled) {
              const updatedMorale = Math.min(
                100,
                Math.max(5, (w.moral || 80) - 5),
              );
              updateFields.moral = updatedMorale;
              updateFields.isActive = updatedMorale >= 5;
            }

            await db.wrestlers.update(w.id!, updateFields);
          }
        }

        // 2. Calculate NEW injuries
        const config = GAME_CONFIG.settings.injurySystem;
        const brandWrestlers = allWrestlers.filter((w) => {
          if (selectedBrand.name === "SHARED") {
            if (activeSubBrandId) return w.brandId === activeSubBrandId;
            return true;
          }
          return w.brandId === selectedBrand.id;
        });
        for (const w of brandWrestlers) {
          if (w.injuryWeeks > 0 || w.isActive === false) continue;

          let chance = config.baseChance;
          const isInMatch = participantsIds.has(w.id!);
          if (isInMatch) {
            chance += config.matchBonus;
            const match = segments.find(
              (s) =>
                s.type === "Match" &&
                s.matchData?.participantsIds.includes(w.id!),
            )?.matchData;
            if (
              match &&
              (match.type.toLowerCase().includes("extreme") ||
                match.type.toLowerCase().includes("nodq"))
            ) {
              chance += config.extremeBonus;
            }
          }

          if (Math.random() < chance) {
            const weeks =
              Math.floor(
                Math.random() * (config.maxWeeks - config.minWeeks + 1),
              ) + config.minWeeks;
            await db.wrestlers.update(w.id!, {
              injuryWeeks: weeks,
              injuryStatus: "Injured",
            });
          }
        }
      }

      // 7. New Season Logic: Departures check
      const weeksSetting = await db.settings.get("weeksPerSeason");
      const weeksLimit =
        weeksSetting?.value || GAME_CONFIG.settings.weeksPerSeason;

      if (week === weeksLimit) {
        // This was the last show of the season. At the start of next show (New Season), checks happen.
        // Wait, rule 7 says: "Al comenzar una nueva season, se comprobará..."
        // I'll implement this during the SAVE of the LAST show of the season OR during the SAVE of the FIRST show of the next season.
        // "Al comenzar una nueva season" implies before create or during create of season N+1.
        // Let's do it right now if this is the transition.
      }

      // Better: Check if we are TRANSITIONING to a new season.
      // Since suggestNextShow handles the display, handleSave should handle the enforcement.
      // If we are saving Season S, Week W, and W is the last week.
      if (week === weeksLimit) {
        const wrestlersToCheck = await db.wrestlers.toArray();
        for (const w of wrestlersToCheck) {
          if (w.matchesSeason < 10) {
            await db.wrestlers.update(w.id!, { isActive: false });
          }
          // Reset matches count for new season
          await db.wrestlers.update(w.id!, { matchesSeason: 0 });
        }
      }

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
    const isBrandShared = selectedBrand.isShared || selectedBrand.name.toUpperCase() === "SHARED" || selectedBrand.id === -1;
    if (isBrandShared) {
      if (activeSubBrandId) return w.brandId === activeSubBrandId;
      // Dynamic Union of all Major Brands
      const majorBrandIds = brands.filter(b => b.isMajorBrand).map(b => b.id);
      return majorBrandIds.includes(w.brandId);
    }
    return w.brandId === selectedBrand.id;
  });

  const brandTitles = allTitles.filter((t) => {
    const isBrandShared = selectedBrand.isShared || selectedBrand.name.toUpperCase() === "SHARED" || selectedBrand.id === -1;
    if (isBrandShared) {
      // Dynamic Union of all Major Brands
      const majorBrandIds = brands.filter(b => b.isMajorBrand).map(b => b.id);
      return majorBrandIds.includes(t.brandId) || t.brandId === selectedBrand.id;
    }
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
            <ResolvedImage
              src={selectedBrand.logo}
              alt={selectedBrand.name}
              className={styles.currentBrandLogo}
            />
          </div>
          {isBrandDropdownOpen && (
            <div className={styles.brandDropdownList}>
              {brands
                .filter((brand) => {
                  const isBrandShared = brand.isShared || brand.name.toUpperCase() === "SHARED" || brand.id === -1;
                  if (isWeekly) {
                    // Weekly: Hide Shared brands
                    return !isBrandShared;
                  } else {
                    // PLE: Show Major Brands + Shared Brands
                    return brand.isMajorBrand || isBrandShared;
                  }
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
                    <ResolvedImage src={brand.logo} alt={brand.name} />
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
                    {showImage && (
                      <ResolvedImage
                        src={showImage}
                        alt={showName}
                        className={styles.showLogoHeader}
                      />
                    )}
                    <span>{showName}</span>
                  </div>
                ) : (
                  <span className={styles.placeholderText}>
                    Select PLE Show
                  </span>
                )}
              </div>

              {isShowDropdownOpen && (
                <div className={styles.showDropdownList}>
                  {availableShows
                    .filter(
                      (s) =>
                        s.type === "PLE" &&
                        // DO NOT show posters in the dropdown, only predefined shows (which are logos)
                        !s.season && !s.week &&
                        (s.brandId === selectedBrand.id ||
                          ((selectedBrand.isShared ||
                            selectedBrand.id === -1 ||
                            selectedBrand.name.toUpperCase() === "SHARED") &&
                            (!s.brandId ||
                              brands.find((b) => b.id === s.brandId)
                                ?.isShared))),
                    )
                    .map((s) => (
                      <div
                        key={s.id}
                        className={styles.showOption}
                        onClick={() => {
                          setShowName(s.name);
                          setShowImage(s.image || "");
                          setIsShowDropdownOpen(false);
                        }}
                      >
                        {s.image && (
                          <ResolvedImage
                            src={s.image}
                            alt={s.name}
                            className={styles.showOptionImage}
                          />
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
              <div className={styles.posterControlGroup}>
                <button
                  className={`${styles.uploadBtn} ${customPoster ? styles.hasPoster : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload custom PLE poster"
                >
                  {customPoster ? "✅ Poster" : "📤 Poster"}
                </button>
                <div className={styles.infoIcon} title="Recommended: Vertical format (e.g. 600x900px) in PNG format.">
                  ⓘ
                </div>
              </div>
            </div>
          )}
          {isWeekly && (
            <div className={styles.selectedShow}>
              {(() => {
                const show = availableShows.find(
                  (s) => s.brandId === selectedBrand.id && s.type === "Weekly",
                );
                return (
                  <span>
                    {show?.name || `${selectedBrand.name} Weekly Show`}
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
              max={weeksPerSeason}
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
                            <ResolvedImage
                              src={wrestler.avatar || wrestler.image}
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
                      const champId = e.target.value ? parseInt(e.target.value) : undefined;
                      const championship = allTitles.find((t) => t.id === champId);
                      
                      const newQuantity = segment.matchData?.type.split(" - ")[0] || "1 vs 1";
                      const newStipulation = STIPULATIONS_BY_QUANTITY[newQuantity]?.[0] || "Standard";

                      let finalQuantity = newQuantity;
                      if (championship) {
                        // DETECT QUANTITY FROM CHAMPIONSHIP NAME
                        const name = championship.name.toLowerCase();
                        if (name.includes("tag")) finalQuantity = "2 vs 2";
                        else if (name.includes("trio")) finalQuantity = "3 vs 3";
                        else finalQuantity = "1 vs 1";

                        // Set gender filter
                        if (championship.gender === "Female") setActiveGender("WOMEN");
                        else setActiveGender("MEN");
                      }

                      const fullType = `${finalQuantity} - ${newStipulation}`;
                      const numParticipants = getParticipantCount(finalQuantity);
                      const newParticipants = Array(numParticipants).fill(0);

                      // Auto-apply champions if applicable
                      if (championship) {
                        const champions = allWrestlers.filter(
                          (w) => w.currentTitlesIds?.includes(championship.id!) && 
                                 w.name.toLowerCase() !== "vacante" && 
                                 w.name.trim() !== ""
                        );
                        if (champions.length > 0) {
                          champions.slice(0, numParticipants).forEach((w, i) => {
                            newParticipants[i] = w.id!;
                          });
                        }
                      }

                      updateSegment(segment.id, {
                        matchData: {
                          ...segment.matchData!,
                          championshipId: champId,
                          titleMatch: !!champId,
                          type: fullType,
                          participantsIds: newParticipants,
                          winnersIds: [],
                        },
                      });
                    }}
                  >
                    <option value="">Non-title match</option>
                    {brandTitles.map((t) => (
                      <option key={t.id} value={t.id}> {t.name} </option>
                    ))}
                  </select>

                  <select
                    value={segment.matchData?.type.split(" - ")[0] || "1 vs 1"}
                    onChange={(e) => {
                      const newQuantity = e.target.value;
                      const currentStip = segment.matchData?.type.split(" - ")[1] || "Singles";
                      const fullType = `${newQuantity} - ${currentStip}`;
                      const numParticipants = getParticipantCount(newQuantity);
                      const newParticipants = Array(numParticipants).fill(0);

                      // If title match, re-apply champions
                      if (segment.matchData?.championshipId) {
                        const championship = allTitles.find(t => t.id === segment.matchData?.championshipId);
                        if (championship) {
                          const champions = allWrestlers.filter(w => w.currentTitlesIds?.includes(championship.id!) && w.name.toLowerCase() !== "vacante");
                          champions.slice(0, numParticipants).forEach((w, i) => {
                            newParticipants[i] = w.id!;
                          });
                        }
                      }

                      updateSegment(segment.id, {
                        matchData: {
                          ...segment.matchData!,
                          type: fullType,
                          participantsIds: newParticipants,
                          winnersIds: [],
                        },
                      });
                    }}
                  >
                    {MATCH_QUANTITIES.map(q => <option key={q} value={q}>{q}</option>)}
                  </select>

                  <select
                    value={segment.matchData?.type.split(" - ")[1] || "Singles"}
                    onChange={(e) => {
                      const newStip = e.target.value;
                      const currentQty = segment.matchData?.type.split(" - ")[0] || "1 vs 1";
                      const fullType = `${currentQty} - ${newStip}`;
                      updateSegment(segment.id, {
                        matchData: {
                          ...segment.matchData!,
                          type: fullType,
                        },
                      });
                    }}
                  >
                    {(STIPULATIONS_BY_QUANTITY[segment.matchData?.type.split(" - ")[0] || "1 vs 1"] || ["Standard"]).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className={styles.matchBody}>
                  <div className={`${styles.matchParticipants} ${styles[`grid-${segment.matchData?.participantsIds.length}`]} ${segment.matchData?.type.includes("2 vs 2") || segment.matchData?.type.includes("Tag") ? styles["tag-match"] : ""} ${segment.matchData?.type.includes("3 vs 3") || segment.matchData?.type.includes("Trios") ? styles["trios-match"] : ""}`}>
                    {(() => {
                      const qty = segment.matchData?.type.split(" - ")[0] || "1 vs 1";
                      const pIds = segment.matchData!.participantsIds;

                      if (qty === "2 vs 2") {
                        return (
                          <>
                            {[0, 2].map((startIdx) => (
                              <React.Fragment key={startIdx}>
                                <div className={styles.tagGroup}>
                                  {[startIdx, startIdx + 1].map((pIdx) => {
                                    const wrestler = allWrestlers.find((w) => w.id === pIds[pIdx]);
                                    return (
                                      <div key={pIdx} className={styles.participantNode}>
                                        <div
                                          className={`${styles.pSlot} ${segment.matchData?.titleMatch && pIdx < (segment.matchData?.championshipId ? 2 : 0) ? styles.locked : ""}`}
                                          onClick={() => setActivePicker({ segmentId: segment.id, type: "Match", index: pIdx })}
                                        >
                                          {wrestler ? <ResolvedImage src={wrestler.avatar || wrestler.image} alt={wrestler.name} /> : <div className={styles.placeholder}>?</div>}
                                        </div>
                                        <span className={styles.pName}>{wrestler?.name || `Wrestler ${pIdx + 1}`}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                                {startIdx === 0 && <span className={styles.vs}>VS.</span>}
                              </React.Fragment>
                            ))}
                          </>
                        );
                      }

                      if (qty === "3 vs 3" || qty === "Trios") {
                        return (
                          <div className={styles.triosLayout}>
                            {[0, 3].map((startIdx) => (
                              <React.Fragment key={startIdx}>
                                <div className={styles.tagGroup}>
                                  {[startIdx, startIdx + 1, startIdx + 2].map((pIdx) => {
                                    const wrestler = allWrestlers.find((w) => w.id === pIds[pIdx]);
                                    return (
                                      <div key={pIdx} className={styles.participantNode}>
                                        <div
                                          className={`${styles.pSlot} ${segment.matchData?.titleMatch && pIdx < (segment.matchData?.championshipId ? 3 : 0) ? styles.locked : ""}`}
                                          onClick={() => setActivePicker({ segmentId: segment.id, type: "Match", index: pIdx })}
                                        >
                                          {wrestler ? <ResolvedImage src={wrestler.avatar || wrestler.image} alt={wrestler.name} /> : <div className={styles.placeholder}>?</div>}
                                        </div>
                                        <span className={styles.pName}>{wrestler?.name || `Wrestler ${pIdx + 1}`}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                                {startIdx === 0 && <span className={styles.vs}>VS.</span>}
                              </React.Fragment>
                            ))}
                          </div>
                        );
                      }

                      if (qty === "5 vs 5") {
                        return (
                          <div className={styles.layout5v5}>
                            {[0, 5].map((startIdx) => (
                              <React.Fragment key={startIdx}>
                                <div className={styles.teamRow}>
                                  {[startIdx, startIdx + 1, startIdx + 2, startIdx + 3, startIdx + 4].map((pIdx) => {
                                    const wrestler = allWrestlers.find((w) => w.id === pIds[pIdx]);
                                    return (
                                      <div key={pIdx} className={styles.participantNode}>
                                        <div
                                          className={`${styles.pSlot} ${segment.matchData?.titleMatch && pIdx < (segment.matchData?.championshipId ? 5 : 0) ? styles.locked : ""}`}
                                          onClick={() => setActivePicker({ segmentId: segment.id, type: "Match", index: pIdx })}
                                        >
                                          {wrestler ? <ResolvedImage src={wrestler.avatar || wrestler.image} alt={wrestler.name} /> : <div className={styles.placeholder}>?</div>}
                                        </div>
                                        <span className={styles.pName}>{wrestler?.name || `Wrestler ${pIdx + 1}`}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                                {startIdx === 0 && <div className={styles.vsCenter}>VS</div>}
                              </React.Fragment>
                            ))}
                          </div>
                        );
                      }

                      // Triple Threat Tag (2 vs 2 vs 2)
                      if (qty === "2 vs 2 vs 2") {
                        return (
                          <div className={styles.tripleTagLayout}>
                             {[0, 2, 4].map((startIdx) => (
                              <React.Fragment key={startIdx}>
                                <div className={styles.tagGroup}>
                                   {[startIdx, startIdx + 1].map((pIdx) => {
                                      const wrestler = allWrestlers.find((w) => w.id === pIds[pIdx]);
                                      return (
                                        <div key={pIdx} className={styles.participantNode}>
                                          <div
                                            className={styles.pSlot}
                                            onClick={() => setActivePicker({ segmentId: segment.id, type: "Match", index: pIdx })}
                                          >
                                            {wrestler ? <ResolvedImage src={wrestler.avatar || wrestler.image} alt={wrestler.name} /> : <div className={styles.placeholder}>?</div>}
                                          </div>
                                          <span className={styles.pName}>{wrestler?.name || `Wrestler ${pIdx + 1}`}</span>
                                        </div>
                                      );
                                   })}
                                </div>
                                {startIdx < 4 && <span className={styles.vs}>VS.</span>}
                              </React.Fragment>
                             ))}
                          </div>
                        );
                      }

                      // Default (Singles, Triple Threat, Fatal 4-Way, Rumbles, etc.)
                      const isEliminationX = qty.includes("Elimination X");
                      const isRumble = qty.includes("Royal") || qty.includes("Gauntlet") || qty.includes("Battle");
                      
                      let gridClass = "";
                      if (isEliminationX) gridClass = styles.eliminationGrid;
                      else if (qty.includes("Battle Royal")) gridClass = styles.grid5x2;
                      else if (qty.includes("Casino Gauntlet")) gridClass = styles.grid7x3;
                      else if (qty.includes("Royal Rumble")) gridClass = styles.grid10x3;

                      return (
                        <div className={`${styles.standardLayout} ${gridClass}`}>
                          {pIds.map((pid, pIdx) => {
                            const wrestler = allWrestlers.find((w) => w.id === pid);
                            return (
                              <React.Fragment key={pIdx}>
                                <div className={styles.participantNode}>
                                  <div
                                    className={`${styles.pSlot} ${segment.matchData?.titleMatch && pIdx === 0 ? styles.locked : ""}`}
                                    onClick={() => setActivePicker({ segmentId: segment.id, type: "Match", index: pIdx })}
                                  >
                                    {wrestler ? <ResolvedImage src={wrestler.avatar || wrestler.image} alt={wrestler.name} /> : <div className={styles.placeholder}>?</div>}
                                    {isRumble && <div className={styles.entryNumber}>{pIdx + 1}</div>}
                                  </div>
                                  <span className={styles.pName}>{wrestler?.name || `Wrestler ${pIdx + 1}`}</span>
                                </div>
                                {pIdx < pIds.length - 1 && !isRumble && !isEliminationX && <span className={styles.vs}>VS.</span>}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                  <div className={styles.matchRight}>
                    <div className={styles.winnerSection}>
                      <select
                        className={styles.winnerSelect}
                        value={segment.matchData?.winnersIds.join(",")}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "-1") {
                            updateSegment(segment.id, {
                              matchData: {
                                ...segment.matchData!,
                                winnersIds: [-1],
                              },
                            });
                          } else if (val) {
                            updateSegment(segment.id, {
                              matchData: {
                                ...segment.matchData!,
                                winnersIds: val.split(",").map(Number),
                              },
                            });
                          } else {
                            updateSegment(segment.id, {
                              matchData: {
                                ...segment.matchData!,
                                winnersIds: [],
                              },
                            });
                          }
                        }}
                      >
                        <option value="">Choose the winner</option>
                        {segment.matchData?.type === "2 vs 2" ||
                        segment.matchData?.type === "3 vs 3" ? (
                          <>
                            {(() => {
                              const isTag = segment.matchData?.type === "2 vs 2";
                              const team1Ids = isTag ? [0, 1] : [0, 1, 2];
                              const team2Ids = isTag ? [2, 3] : [3, 4, 5];

                              const team1 = team1Ids.map((idx) =>
                                allWrestlers.find(
                                  (wr) =>
                                    wr.id ===
                                    segment.matchData?.participantsIds[idx],
                                ),
                              );
                              const team2 = team2Ids.map((idx) =>
                                allWrestlers.find(
                                  (wr) =>
                                    wr.id ===
                                    segment.matchData?.participantsIds[idx],
                                ),
                              );

                              const team1Ready = team1.every((w) => !!w);
                              const team2Ready = team2.every((w) => !!w);

                              return (
                                <>
                                  {team1Ready && (
                                    <option
                                      value={team1.map((w) => w!.id).join(",")}
                                    >
                                      {team1.map((w) => w!.name).join(" & ")}
                                    </option>
                                  )}
                                  {team2Ready && (
                                    <option
                                      value={
                                        team1Ready
                                          ? team2.map((w) => w!.id).join(",")
                                          : team2.map((w) => w!.id).join(",")
                                      }
                                    >
                                      {team2.map((w) => w!.name).join(" & ")}
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
                  className={
                    i < Math.floor(overallRating)
                      ? styles.starFilled
                      : styles.starEmpty
                  }
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
              <span className={styles.ratingDisplay}>
                {overallRating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        <button
          className={styles.saveBtn}
          disabled={
            isSaving ||
            overallRating === 0 ||
            (!isWeekly && !showName) ||
            segments.some(
              (s) =>
                s.type === "Match" &&
                (!s.matchData?.winnersIds.length ||
                  s.matchData.winnersIds[0] === undefined),
            )
          }
          onClick={handleSave}
        >
          {overallRating === 0
            ? "RATE THE SHOW"
            : isSaving
              ? "SAVING..."
              : "SAVE AND GO BACK"}
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
            brands={
              selectedBrand.name === "SHARED"
                ? brands.filter(
                    (b) => b.name !== "SHARED" && b.name !== "FREE AGENT",
                  )
                : undefined
            }
            activeBrandId={activeSubBrandId}
            onBrandChange={setActiveSubBrandId}
          />

          <div className={styles.wrestlerGrid}>
            {brandWrestlers
              .filter((w) => {
                // Filter inactive
                if (w.isActive === false) return false;

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
                  activePicker?.type === "Match"
                ) {
                  const segment = segments.find(
                    (s) => s.id === activePicker.segmentId,
                  );
                  
                  // NEW: Rule 1 - Championship Gender Enforcement
                  if (segment?.matchData?.titleMatch && segment.matchData.championshipId) {
                    const champ = allTitles.find(t => t.id === segment.matchData?.championshipId);
                    if (champ && w.gender !== champ.gender) {
                      matchesGender = false;
                    }
                  }

                  // Existing Intergender check for non-title matches (or as secondary check)
                  if (activePicker.index !== 0) {
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
                }

                const matchesAlignment =
                  activeAlignment === "ALL" ||
                  (activeAlignment === "FACES" && w.alignment === "Face") ||
                  (activeAlignment === "HEELS" && w.alignment === "Heel");

                // Point 1: Brand restriction for Title Matches in SHARED PLE
                let matchesTitleBrand = true;
                if (activePicker?.type === "Match") {
                  const segment = segments.find(s => s.id === activePicker.segmentId);
                  if (segment?.matchData?.titleMatch && segment.matchData.championshipId) {
                    const champ = allTitles.find(t => t.id === segment.matchData?.championshipId);
                    if (champ) {
                      matchesTitleBrand = w.brandId === champ.brandId;
                    }
                  }
                }

                return matchesGender && matchesAlignment && matchesTitleBrand;
              })
              .map((w) => (
                <div
                  key={w.id}
                  className={`${styles.wrestlerItem} ${w.injuryWeeks > 0 ? styles.injured : ""} ${(w.moral || 80) < 20 ? styles.lowMorale : ""}`}
                  onClick={() => {
                    if (w.injuryWeeks > 0) return;
                    if (activePicker) {
                      const segment = segments.find(
                        (s) => s.id === activePicker.segmentId,
                      );
                      if (segment) {
                        if (activePicker.type === "Match") {
                          // RULE: VACANTE (ID 0) cannot participate in a Title Match
                          if (segment.matchData?.titleMatch && w.id === 0) {
                            alert("A 'VACANTE' wrestler cannot participate in a Title Match.");
                            return;
                          }

                          const newP = [...segment.matchData!.participantsIds];
                          newP[activePicker.index] = w.id!;

                          // Auto-partner selection for Tag Team
                          if (
                            segment.matchData!.type === "2 vs 2" &&
                            w.faction
                          ) {
                            const isSlot0or1 = activePicker.index <= 1;
                            const partnerIndex = isSlot0or1
                              ? activePicker.index === 0
                                ? 1
                                : 0
                              : activePicker.index === 2
                                ? 3
                                : 2;

                            // If partner slot is empty, try to fill it
                            if (newP[partnerIndex] === 0) {
                              const partner = allWrestlers.find(
                                (p) =>
                                  p.faction === w.faction &&
                                  p.id !== w.id &&
                                  p.gender === w.gender &&
                                  !newP.includes(p.id!) &&
                                  (p.injuryWeeks === 0 || !p.injuryWeeks),
                              );
                              if (partner) {
                                newP[partnerIndex] = partner.id!;
                              }
                            }
                          }

                          // Auto-partner selection for Trios
                          if (
                            segment.matchData!.type === "3 vs 3" &&
                            w.faction
                          ) {
                            const isTeam1 = activePicker.index <= 2;
                            const teamIndices = isTeam1 ? [0, 1, 2] : [3, 4, 5];
                            
                            // Fill other slots in the same team if they are empty
                            teamIndices.forEach(idx => {
                              if (idx !== activePicker.index && newP[idx] === 0) {
                                const partner = allWrestlers.find(
                                  (p) =>
                                    p.faction === w.faction &&
                                    p.id !== w.id &&
                                    p.gender === w.gender &&
                                    !newP.includes(p.id!) &&
                                    (p.injuryWeeks === 0 || !p.injuryWeeks),
                                );
                                if (partner) {
                                  newP[idx] = partner.id!;
                                }
                              }
                            });
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
                  <div className={styles.wrestlerAvatar}>
                    <ResolvedImage src={w.avatar || w.image} alt={w.name} />
                    {w.injuryWeeks > 0 && (
                      <div className={styles.injuryIndicator}>
                        <span className={styles.injuryWeeks}>
                          {w.injuryWeeks}
                        </span>
                      </div>
                    )}
                  </div>
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
