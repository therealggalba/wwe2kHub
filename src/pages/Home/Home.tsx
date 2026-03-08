import { useEffect, useState } from 'react';
import PLECarousel from '../../components/PLECarousel/PLECarousel';
import { db } from '../../db/db';
import styles from './Home.module.scss';

const Home = () => {
  const [heroTitle, setHeroTitle] = useState('TU UNIVERSO, TUS REGLAS');

  useEffect(() => {
    const checkBrand = async () => {
      const allBrands = await db.brands.toArray();
      const aew = allBrands.find(b => b.name.includes('AEW'));
      if (aew) {
        setHeroTitle('SÉ PARTE DE LA ÉLITE');
      } else {
        setHeroTitle('DOMINA EL RING');
      }
    };
    checkBrand();
  }, []);

  return (
    <section className={styles.homeSection}>
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>{heroTitle}</h1>
        <p className={styles.heroDescription}>
          Toda la información de tus superestrellas favoritas en un solo lugar.
        </p>
      </div>

      <div className={styles.grid}>
        {[
          { title: 'Show Semanal', type: 'semanal', description: 'Crea y gestiona tu programación semanal de marcas y programas.' },
          { title: 'Show PLE', type: 'especial', description: 'Planifica eventos premium en vivo (WrestleMania, SummerSlam, etc.).' }
        ].map((event) => (
          <div 
            key={event.type} 
            onClick={() => window.location.href = `/create-event/${event.type}`}
            className={`${styles.eventCard} ${styles[event.type]}`}
          >
            <h3 className={styles.eventTitle}>
              {event.title}
            </h3>
            <p className={styles.eventDescription}>
              {event.description}
            </p>
            <div className={styles.eventAction}>
              GESTIONAR →
            </div>
          </div>
        ))}
      </div>

      <PLECarousel />

      <div className={styles.infoSection}>
        <h2 className={styles.infoTitle}>¿CÓMO FUNCIONA EL SIMULADOR?</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <h3>📅 Gestión de Shows</h3>
            <p>Organiza tu calendario creando shows semanales para cada marca o eventos especiales (PLE). El sistema rastrea automáticamente la Season y la Semana actual.</p>
          </div>
          <div className={styles.infoItem}>
            <h3>🤼 Control de Roster</h3>
            <p>Gestiona la moral, victorias/derrotas y lesiones de tus luchadores. Los resultados de los combates afectan directamente a sus estadísticas y estado de ánimo.</p>
          </div>
          <div className={styles.infoItem}>
            <h3>🏆 Campeonatos</h3>
            <p>Crea historias titulares y gestiona los reinados. El sistema detecta ganadores y actualiza automáticamente los poseedores de los cinturones y su historial.</p>
          </div>
          <div className={styles.infoItem}>
            <h3>⚙️ Configuración</h3>
            <p>Personaliza tu experiencia en la sección de Opciones, vinculando tus propios recursos visuales o exportando tu base de datos para copias de seguridad.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Home

