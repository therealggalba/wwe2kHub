import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PLECarousel from '../../components/PLECarousel/PLECarousel';
import StarBorder from '../../components/StarBorder/StarBorder';
import { db } from '../../db/db';
import DigitalNewspaper from '../../components/DigitalNewspaper/DigitalNewspaper';
import TutorialOverlay from '../../components/Tutorial/TutorialOverlay';
import styles from './Home.module.scss';
import { aiEngine } from '../../utils/aiEngine';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [heroTitle, setHeroTitle] = useState('DOMINA EL RING');
  const [showTutorial, setShowTutorial] = useState(() => {
    const val = localStorage.getItem('showTutorial') === 'true';
    console.log('Home: Initial showTutorial state:', val);
    return val;
  });

  useEffect(() => {
    console.log('Home: showTutorial current state:', showTutorial);
    const checkBrand = async () => {
      const allBrands = await db.brands.toArray();
      const aew = allBrands.find(b => b.name.includes('AEW'));
      if (aew) {
        setHeroTitle('SÉ PARTE DE LA ÉLITE');
      } else{
        setHeroTitle('CONSTRUYE TU LEGADO')
      }
    };
    checkBrand();

    // Precargar el motor de IA en segundo plano
    setTimeout(() => {
      aiEngine.init().catch(console.error);
    }, 1500);
  }, []);

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    localStorage.removeItem('showTutorial');
  };

  return (
    <section className={styles.homeSection}>
      {showTutorial && <TutorialOverlay onComplete={handleTutorialComplete} />}
      
      <div className={styles.hero}><h1 className={styles.heroTitle}>{heroTitle}</h1></div>
      
      <DigitalNewspaper />

      <div className={styles.grid}>
        {[
          { title: 'Show Semanal', type: 'semanal', description: 'Crea y gestiona tu programación semanal.', color: '#e00012' },
          { title: 'Show PLE', type: 'especial', description: 'Crea y gestiona tus eventos especiales.', color: '#ffd700' }
        ].map((event) => (
          <StarBorder 
            key={event.type} 
            as="div"
            color={event.color}
            speed="6s"
            className={styles.electricCardWrapper}>
            <div 
              onClick={() => navigate(`/create-event/${event.type}`)}
              className={`${styles.eventCard} ${styles[event.type]}`}>
              <h3 className={styles.eventTitle}>{event.title}</h3>
              <p className={styles.eventDescription}>{event.description}</p>
            </div></StarBorder>
        ))}
      </div>
      <PLECarousel />

      <div className={styles.infoSection}>
        <h2 className={styles.infoTitle}>¿CÓMO FUNCIONA EL SIMULADOR?</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <h3>Gestión de Shows</h3>
            <p>Organiza tu calendario creando shows semanales para cada marca o eventos especiales. El sistema se guiará por season y semana actual.</p>
          </div>
          <div className={styles.infoItem}>
            <h3>Control de Roster</h3>
            <p>Gestiona la moral y lesiones de tus luchadores. Los resultados de los combates afectan directamente a sus estadísticas y estado de ánimo.</p>
          </div>
          <div className={styles.infoItem}>
            <h3>Campeonatos</h3>
            <p>Crea historias titulares y gestiona reinados. El sistema detecta ganadores y actualiza automáticamente los poseedores de los cinturones y su historial.</p>
          </div>
          <div className={styles.infoItem}>
            <h3>Configuración</h3>
            <p>Personaliza tu experiencia en Opciones, vinculando tus propios recursos visuales o exportando tu base de datos para copias de seguridad.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Home

