import PLECarousel from '../../components/PLECarousel/PLECarousel';
import styles from './Home.module.scss';

const Home = () => {
  return (
    <section className={styles.homeSection}>
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>SÉ PARTE DE LA ÉLITE</h1>
        <p className={styles.heroDescription}>
          Toda la información de tus superestrellas favoritas en un solo lugar.
        </p>
      </div>

      <PLECarousel />

      <div className={styles.grid}>
        {[
          { title: 'Show Semanal', type: 'semanal', description: 'Crea y gestiona tu programación semanal (RAW, SmackDown, NXT).' },
          { title: 'Show Especial', type: 'especial', description: 'Planifica eventos premium en vivo (WrestleMania, Royal Rumble, etc.).' }
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
    </section>
  )
}

export default Home

