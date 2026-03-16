import React, { useEffect, useState } from 'react';
import { db } from '../../db/db';
import type { Show, Wrestler, Championship, Brand } from '../../models/types';
import ResolvedImage from '../Common/ResolvedImage';
import styles from './DigitalNewspaper.module.scss';

interface CollageData {
  winnersImages: string[];
  losersAvatars: string[];
  championshipImage?: string;
  fallbackImage?: string;
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
  const [data, setData] = useState<NewspaperData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLastShow = async () => {
      try {
        const shows: Show[] = await db.shows.reverse().sortBy('date');
        const lastShow = shows.find(s => s.season !== undefined && s.week !== undefined);

        if (!lastShow) {
          // Welcome Edition for first-time users - try to find the brand logo
          const brands = await db.brands.toArray();
          const firstMajorBrand = brands.find(b => b.isMajorBrand);
          const genericLogo = "https://www.wwe.com/g/show-logo-placeholder.png";
          const brandLogo = firstMajorBrand?.logo || genericLogo;

          setData({
            showTitle: "Temporada I: El Comienzo",
            date: "S1 W1",
            brandLogo: brandLogo,
            headline: "¡UNA NUEVA ERA COMIENZA EN EL HUB!",
            summary: "Todo está listo para el inicio de la temporada. El roster está preparado, los títulos esperan dueño y tú tienes el control total. ¿Quiénes se convertirán en las próximas leyendas de tu universo?",
            collageData: { winnersImages: [], losersAvatars: [], fallbackImage: brandLogo },
            championsNews: ["¡Todos los títulos están vacantes!", "La carrera por el oro comienza hoy mismo.", "Prepara el primer Main Event de la historia."],
            injuriesNews: ["El vestuario está al 100% de energía.", "Sin bajas registradas para el debut.", "Listos para dar el espectáculo."]
          });
          setLoading(false);
          return;
        }

        const brand: Brand | undefined = await db.brands.get(lastShow.brandId || -1);
        const wrestlers: Wrestler[] = await db.wrestlers.toArray();
        const titles: Championship[] = await db.championships.toArray();

        // 1. Process Main Event
        const segments = lastShow.card?.segments || [];
        const mainEvent = segments[segments.length - 1];
        let headline = "¡Guerra sin Cuartel!";
        let summary = "Un show para la historia que deja a todos los fans con ganas de más.";
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
              // Intento dividir a los participantes a la mitad para los nombres de la rivalidad si son equipo
              const half = Math.ceil(participants.length / 2);
              const team1 = participants.slice(0, half);
              const team2 = participants.slice(half);
              const t1Name = getTeamName(team1);
              const t2Name = getTeamName(team2);

              headline = getRandomItem([
                 `¡${t1Name} vs ${t2Name} termina en Caos!`,
                 `Sin Decisión en el Combate Estelar`,
                 `¡La controversia mancha ${lastShow.name}!`,
                 `Nadie Resulta Vencedor Hoy`
              ]);
              summary = getRandomItem([
                 `El esperado combate entre ${t1Name} y ${t2Name} terminó sin un ganador claro en un impactante final para ${lastShow.name}.`,
                 `Los oficiales no pudieron mantener el control y declararon un "No Contest" entre ${t1Name} y ${t2Name}.`,
                 `Una batalla tan brutal entre ${t1Name} y ${t2Name} que el árbitro se vio obligado a detenerla.`,
                 `¡Qué escándalo! ${t1Name} y ${t2Name} destrozaron irremediablemente todo a su paso sin importarles la victoria legal.`
              ]);
              collageData.losersAvatars = participants.map(p => p.avatar || p.image || '').filter(Boolean);
            } else {
              const winnerNameStr = getTeamName(winners);
              headline = getRandomItem([
                 `¡${winnerNameStr} domina el Main Event!`,
                 `Una Noche Triunfal para ${winnerNameStr}`,
                 `¡${winnerNameStr} sella su victoria!`,
                 `La gloria pertenece a ${winnerNameStr}`
              ]);
              summary = getRandomItem([
                 `En una demostración de superioridad, ${winnerNameStr} consiguió la victoria sobre sus oponentes en el evento estelar de ${lastShow.name}.`,
                 `El público enloqueció cuando ${winnerNameStr} remató la faena, llevándose el aplauso general tras un gran Main Event.`,
                 `Contra todo pronóstico y dejando el alma en el ring, ${winnerNameStr} se impuso a sus rivales cerrando ${lastShow.name} magistralmente.`,
                 `La cartelera estelar no defraudó, concluyendo con una espectacular contienda donde ${winnerNameStr} logró alzarse con el brazo en alto.`
              ]);
              collageData.winnersImages = winners.map(w => w.image || w.avatar || '').filter(Boolean);
              collageData.losersAvatars = losers.map(l => l.avatar || l.image || '').filter(Boolean);
            }
            collageData.championshipImage = championshipImage;
          }
        }

        // 2. Process Champions
        const championsNews: string[] = [];
        for (const segment of segments) {
          if (segment.type === 'Match' && segment.matchData?.titleMatch && segment.matchData.championshipId) {
            const title = titles.find(t => t.id === segment.matchData!.championshipId);
            const winnerIds = segment.matchData.winnersIds;
            
            // A title change is detected if there's a history entry corresponding to THIS show
            const isChange = title?.history.some(h => h.showId === lastShow.id);
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
              championsNews.push(`¡NUEVO CAMPEÓN! ${winnerNamesStr} se corona como ${title?.name}.`);
            } else if (winnerIds.length > 0 && !winnerIds.includes(-1) && winnerNamesStr) {
              championsNews.push(`${winnerNamesStr} retiene el título ${title?.name}.`);
            }
          }
        }

        // 3. Process Injuries (Simplified: any wrestler with injuryWeeks > 0 who appeared or was already injured)
        // More specific: check who got injured in THIS show (this logic might need a field in Wrestler like 'injuredInShowId')
        // For now, let's look for wrestlers with high injury weeks who are active
        const injuredWrestlers = wrestlers.filter(w => w.injuryWeeks > 0 && w.brandId === lastShow.brandId);
        const injuriesNews = injuredWrestlers.slice(0, 3).map(w => `${w.name} estará fuera ${w.injuryWeeks} semanas.`);

        setData({
          showTitle: lastShow.name,
          date: `S${lastShow.season} W${lastShow.week}`,
          brandLogo: brand?.logo || lastShow.image,
          headline,
          summary,
          collageData,
          championsNews: championsNews.length > 0 ? championsNews : ["Sin cambios titulares reportados."],
          injuriesNews: injuriesNews.length > 0 ? injuriesNews : ["El roster se mantiene saludable."]
        });
      } catch (error) {
        console.error("Error loading newspaper data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadLastShow();
  }, []);

  if (loading) return null;
  if (!data) return <div className={styles.newspaperContainer}><p className={styles.emptyState}>No hay ediciones anteriores disponibles. ¡Crea tu primer show para ver las noticias!</p></div>;

  return (
    <article className={styles.newspaperContainer}>
      <header className={styles.newspaperHeader}>
        <div className={styles.subline}>
          <span>Edición Especial</span>
          <span>{data.showTitle}</span>
          <span>{data.date}</span>
        </div>
      </header>

      <aside className={styles.leftColumn}>
        <span className={styles.sectionTitle}>Títulos de Oro</span>
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
        <span className={styles.sectionTitle}>Boletín Médico</span>
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
