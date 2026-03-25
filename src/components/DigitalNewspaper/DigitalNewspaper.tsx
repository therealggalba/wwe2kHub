import React, { useEffect, useState } from 'react';
import { db } from '../../db/db';
import type { Show, Wrestler, Championship, Brand, TitleHistoryEntry } from '../../models/types';
import ResolvedImage from '../Common/ResolvedImage';
import styles from './DigitalNewspaper.module.scss';
import { useTranslation } from 'react-i18next';

interface CollageData {
  winnersImages: string[];
  losersAvatars: string[];
  championshipImage?: string;
  fallbackImage?: string;
  mainEventImage?: string;
}

interface NewspaperData {
  showTitle: string;
  date: string;
  brandLogo?: string;
  headline: string;
  summary: string;
  mainEventImage?: string;
  collageData?: CollageData;
  championsNews: string[];
  injuriesNews: string[];
}

const DigitalNewspaper: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<NewspaperData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLastShow = async () => {
      try {
        const shows: Show[] = await db.shows.reverse().sortBy('date');
        const lastShow = shows.find(s => s.season !== undefined && s.week !== undefined);

        if (!lastShow) {
          const brands: Brand[] = await db.brands.toArray();
          const firstMajorBrand = brands.find(b => b.isMajorBrand);
          const genericLogo = "https://www.wwe.com/g/show-logo-placeholder.png";
          const brandLogo = firstMajorBrand?.logo || genericLogo;

          setData({
            showTitle: t('newspaper.welcome_title'),
            date: "S1 W1",
            brandLogo: brandLogo,
            headline: t('newspaper.welcome_headline'),
            summary: t('newspaper.welcome_summary'),
            collageData: { winnersImages: [], losersAvatars: [], fallbackImage: brandLogo },
            championsNews: [
              t('newspaper.welcome_news_1'),
              t('newspaper.welcome_news_2'),
              t('newspaper.welcome_news_3')
            ],
            injuriesNews: [
              t('newspaper.welcome_injuries_1'),
              t('newspaper.welcome_injuries_2'),
              t('newspaper.welcome_injuries_3')
            ]
          });
          setLoading(false);
          return;
        }

        const brand: Brand | undefined = await db.brands.get(lastShow.brandId || -1);
        const wrestlers: Wrestler[] = await db.wrestlers.toArray();
        const titles: Championship[] = await db.championships.toArray();

        const segments = lastShow.card?.segments || [];
        const mainEvent = segments[segments.length - 1];
        let headline = t('newspaper.fallback_headline');
        let summary = t('newspaper.fallback_summary');
        const meImage = lastShow.image || lastShow.poster;
        const collageData: CollageData = { winnersImages: [], losersAvatars: [], fallbackImage: meImage };

        if (mainEvent?.type === 'Match' && mainEvent.matchData) {
          const participants = mainEvent.matchData.participantsIds
            .map(id => wrestlers.find(w => w.id === id))
            .filter(Boolean) as Wrestler[];
          
          const winners = mainEvent.matchData.winnersIds
            .map(id => wrestlers.find(w => w.id === id))
            .filter(Boolean) as Wrestler[];

          const losers = participants.filter(p => !mainEvent.matchData!.winnersIds.includes(p.id!));

          let championshipImage: string | undefined = undefined;
          if (mainEvent.matchData.titleMatch && mainEvent.matchData.championshipId) {
             const title = titles.find(t => t.id === mainEvent.matchData!.championshipId);
             championshipImage = title?.image;
          }

          if (participants.length >= 2) {
            const getTeamName = (team: Wrestler[]) => {
              if (team.length === 0) return '';
              if (team.length === 1) return team[0].name;
              const firstFaction = team[0].faction;
              if (firstFaction && team.every(w => w.faction === firstFaction)) {
                return firstFaction;
              }
              return team.map(w => w.name).join(' & ');
            };

            const isNoContest = winners.length === 0 || mainEvent.matchData.winnersIds.some(id => id === -1 || id === null) || winners.some(w => w.name === 'NO CONTEST');
            
            const getRandomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
            
            if (isNoContest) {
              const half = Math.ceil(participants.length / 2);
              const team1 = participants.slice(0, half);
              const team2 = participants.slice(half);
              const t1Name = getTeamName(team1);
              const t2Name = getTeamName(team2);

              const headlinesList = t('newspaper.headlines.no_contest', { returnObjects: true }) as string[];
              const summariesList = t('newspaper.summaries.no_contest', { returnObjects: true }) as string[];

              headline = getRandomItem(headlinesList).replace('{{t1}}', t1Name).replace('{{t2}}', t2Name).replace('{{show}}', lastShow.name);
              summary = getRandomItem(summariesList).replace('{{t1}}', t1Name).replace('{{t2}}', t2Name).replace('{{show}}', lastShow.name);
              
              collageData.losersAvatars = participants.map(p => p.avatar || p.image || '').filter(Boolean);
            } else {
              const winnerNameStr = getTeamName(winners);
              const headlinesList = t('newspaper.headlines.victory', { returnObjects: true }) as string[];
              const summariesList = t('newspaper.summaries.victory', { returnObjects: true }) as string[];

              headline = getRandomItem(headlinesList).replace('{{winner}}', winnerNameStr).replace('{{show}}', lastShow.name);
              summary = getRandomItem(summariesList).replace('{{winner}}', winnerNameStr).replace('{{show}}', lastShow.name);

              collageData.winnersImages = winners.map(w => w.image || w.avatar || '').filter(Boolean);
              collageData.losersAvatars = losers.map(l => l.avatar || l.image || '').filter(Boolean);
            }
            collageData.championshipImage = championshipImage;
          }
        }

        const championsNews: string[] = [];
        for (const segment of segments) {
          if (segment.type === 'Match' && segment.matchData?.titleMatch && segment.matchData.championshipId) {
            const title = titles.find(t => t.id === segment.matchData!.championshipId);
            const winnerIds = segment.matchData.winnersIds;
            const isChange = title?.history.some((h: TitleHistoryEntry) => h.showId === lastShow.id);
            const winnersForTitle = winnerIds.map(id => wrestlers.find(w => w.id === id)).filter(Boolean) as Wrestler[];
            
            const getTeamNameInternal = (team: Wrestler[]) => {
              if (team.length === 0) return '';
              if (team.length === 1) return team[0].name;
              const firstFaction = team[0].faction;
              if (firstFaction && team.every(w => w.faction === firstFaction)) return firstFaction;
              return team.map(w => w.name).join(' & ');
            };

            const winnerNamesStr = getTeamNameInternal(winnersForTitle);

            if (isChange && winnerNamesStr) {
              championsNews.push(t('newspaper.new_champion', { winner: winnerNamesStr, title: title?.name }));
            } else if (winnerIds.length > 0 && !winnerIds.includes(-1) && winnerNamesStr) {
              championsNews.push(t('newspaper.retains', { winner: winnerNamesStr, title: title?.name }));
            }
          }
        }

        const injuredWrestlers = wrestlers.filter(w => w.injuryWeeks > 0 && w.brandId === lastShow.brandId);
        const injuriesNews = injuredWrestlers.slice(0, 3).map(w => t('newspaper.injury_report', { name: w.name, weeks: w.injuryWeeks }));

        setData({
          showTitle: lastShow.name,
          date: `S${lastShow.season} W${lastShow.week}`,
          brandLogo: brand?.logo || lastShow.image,
          headline,
          summary,
          collageData,
          championsNews: championsNews.length > 0 ? championsNews : [t('newspaper.no_title_changes')],
          injuriesNews: injuriesNews.length > 0 ? injuriesNews : [t('newspaper.roster_healthy')]
        });
      } catch (error) {
        console.error("Error loading newspaper data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadLastShow();
  }, [t]);

  if (loading) return null;
  if (!data) return <div className={styles.newspaperContainer}><p className={styles.emptyState}>{t('newspaper.no_editions')}</p></div>;

  return (
    <article className={styles.newspaperContainer}>
      <header className={styles.newspaperHeader}>
        <div className={styles.subline}>
          <span>{t('newspaper.edition')}</span>
          <span>{data.showTitle}</span>
          <span>{data.date}</span>
        </div>
      </header>

      <aside className={styles.leftColumn}>
        <span className={styles.sectionTitle}>{t('newspaper.titles_of_gold')}</span>
        <ul className={styles.newsList}>
          {data.championsNews.map((news, i) => (
            <li key={i}>{news}</li>
          ))}
        </ul>
      </aside>

      <main className={styles.centerColumn}>
        <div className={styles.mainEntry}>
          {data.brandLogo && (
            <ResolvedImage src={data.brandLogo} alt="Logo" className={styles.brandLogo} />
          )}
          <div className={styles.meImageContainer}>
            {data.collageData && data.collageData.winnersImages.length > 0 ? (
               <div className={styles.collage}>
                  {data.collageData.championshipImage && (
                     <ResolvedImage src={data.collageData.championshipImage} className={styles.championshipOverlay} alt="Title" />
                  )}
                  <div className={styles.winnersContainer}>
                     {data.collageData.winnersImages.map((img, idx) => (
                        <ResolvedImage key={idx} src={img} className={styles.winnerImage} alt="Winner" />
                     ))}
                  </div>
                  {data.collageData.losersAvatars.length > 0 && (
                     <div className={styles.losersContainer}>
                        {data.collageData.losersAvatars.map((img, idx) => (
                           <ResolvedImage key={idx} src={img} className={styles.loserAvatar} alt="Loser" />
                        ))}
                     </div>
                  )}
               </div>
            ) : data.collageData && data.collageData.losersAvatars.length > 0 ? (
               <div className={styles.collageNoContest}>
                  <div className={styles.losersContainer}>
                     {data.collageData.losersAvatars.map((img, idx) => (
                        <ResolvedImage key={idx} src={img} className={styles.loserAvatar} alt="Participant" />
                     ))}
                  </div>
                  {data.collageData.championshipImage && (
                     <ResolvedImage src={data.collageData.championshipImage} className={styles.championshipOverlay} alt="Title" />
                  )}
               </div>
            ) : (
              <ResolvedImage src={data.collageData?.fallbackImage || data.mainEventImage || ''} alt="Main Event" />
            )}
          </div>
          <h2 className={styles.headline}>{data.headline}</h2>
          <p className={styles.summary}>{data.summary}</p>
        </div>
      </main>

      <aside className={styles.rightColumn}>
        <span className={styles.sectionTitle}>{t('newspaper.medical_bulletin')}</span>
        <ul className={styles.newsList}>
          {data.injuriesNews.map((news, i) => (
            <li key={i}>{news}</li>
          ))}
        </ul>
      </aside>
    </article>
  );
};

export default DigitalNewspaper;
