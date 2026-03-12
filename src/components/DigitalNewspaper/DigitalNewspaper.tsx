import React, { useEffect, useState } from 'react';
import { db } from '../../db/db';
import type { Show, Wrestler, Championship, Brand } from '../../models/types';
import ResolvedImage from '../Common/ResolvedImage';
import styles from './DigitalNewspaper.module.scss';

interface NewspaperData {
  showTitle: string;
  date: string;
  brandLogo?: string;
  headline: string;
  summary: string;
  mainEventImage?: string;
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
            mainEventImage: undefined, 
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
        let meImage = lastShow.image || lastShow.poster;

        if (mainEvent?.type === 'Match' && mainEvent.matchData) {
          const participants = mainEvent.matchData.participantsIds
            .map(id => wrestlers.find(w => w.id === id)?.name)
            .filter(Boolean);
          
          const winners = mainEvent.matchData.winnersIds
            .map(id => wrestlers.find(w => w.id === id)?.name)
            .filter(Boolean);

          if (participants.length >= 2) {
            const isNoContest = winners.includes('NO CONTEST') || mainEvent.matchData.winnersIds.includes(-1) || winners.length === 0;
            
            if (isNoContest) {
              headline = `¡${participants[0]} vs ${participants[1]} termina en Caos!`;
              summary = `El esperado combate entre ${participants.join(' y ')} terminó sin un ganador claro en un impactante final para ${lastShow.name}.`;
            } else {
              const winnerNames = winners.join(' & ');
              headline = `¡${winnerNames} domina el Main Event!`;
              summary = `En una demostración de superioridad, ${winnerNames} consiguió la victoria sobre sus oponentes en el evento estelar de ${lastShow.name}.`;
            }
            
            // Try to use a winner's image if show image is missing
            if (!meImage) {
              const winnerId = mainEvent.matchData.winnersIds[0];
              if (winnerId && winnerId !== -1) {
                meImage = wrestlers.find(w => w.id === winnerId)?.image;
              }
              if (!meImage) {
                meImage = wrestlers.find(w => w.id === mainEvent.matchData?.participantsIds[0])?.image;
              }
            }
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
            const winnerNames = winnerIds.map(id => wrestlers.find(w => w.id === id)?.name).filter(Boolean);

            if (isChange) {
              championsNews.push(`¡NUEVO CAMPEÓN! ${winnerNames.join(' & ')} se corona como ${title?.name}.`);
            } else if (winnerIds.length > 0 && !winnerIds.includes(-1)) {
              championsNews.push(`${winnerNames.join(' & ')} retiene el título ${title?.name}.`);
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
          mainEventImage: meImage,
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
          {data.mainEventImage && (
            <div className={styles.meImageContainer}>
              <ResolvedImage src={data.mainEventImage} alt="Main Event" />
            </div>
          )}
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
