import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PLECarousel from '../../components/PLECarousel/PLECarousel';
import StarBorder from '../../components/StarBorder/StarBorder';
import { db } from '../../db/db';
import DigitalNewspaper from '../../components/DigitalNewspaper/DigitalNewspaper';
import TutorialOverlay from '../../components/Tutorial/TutorialOverlay';
import styles from './Home.module.scss';
import { aiEngine } from '../../utils/aiEngine';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [heroTitle, setHeroTitle] = useState('DOMINA EL RING');
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (location.state?.newGame) {
      // Defer state update to next tick to avoid lint error / cascading render
      Promise.resolve().then(() => {
        setShowTutorial(true);
        navigate(location.pathname, { replace: true, state: {} });
      });
    }
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
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
  };

  return (
    <section className={styles.homeSection}>
      {showTutorial && <TutorialOverlay onComplete={handleTutorialComplete} />}
      
      <div className={styles.hero}><h1 className={styles.heroTitle}>{heroTitle}</h1></div>
      
      <DigitalNewspaper />

      <div className={styles.carouselContainer}>
        <div className={styles.sectionHeader}>
          <StarBorder className={styles.starBorder}>
            <h2 className={styles.sectionTitle}>CARTELERA RECIENTE</h2>
          </StarBorder>
        </div>
        <PLECarousel />
      </div>
    </section>
  );
};

export default Home;
