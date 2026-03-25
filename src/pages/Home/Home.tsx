import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PLECarousel from '../../components/PLECarousel/PLECarousel';
import StarBorder from '../../components/StarBorder/StarBorder';
import { db } from '../../db/db';
import DigitalNewspaper from '../../components/DigitalNewspaper/DigitalNewspaper';
import TutorialOverlay from '../../components/Tutorial/TutorialOverlay';
import styles from './Home.module.scss';
import { aiEngine } from '../../utils/aiEngine';
import { useTranslation } from 'react-i18next';
import Header from '../../components/Header/Header';
import GMChat from '../../components/GMChat/GMChat';
import type { Brand } from '../../models/types';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [heroTitleKey, setHeroTitleKey] = useState('home.hero_default');
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const checkBrand = async () => {
      const allBrands: Brand[] = await db.brands.toArray();
      const aew = allBrands.find(b => b.name.includes('AEW'));
      if (aew) {
        setHeroTitleKey('home.hero_aew');
      } else {
        const wwe = allBrands.find(b => b.name.includes('WWE'));
        if (wwe) setHeroTitleKey('home.hero_wwe');
        else setHeroTitleKey('home.hero_default');
      }
    };
    checkBrand();

    if (location.state?.newGame) {
      setShowTutorial(true);
    }

    // Precargar el motor de IA en segundo plano
    setTimeout(() => {
      aiEngine.init().catch(console.error);
    }, 1500);
  }, [location.state?.newGame]);

  return (
    <section className={styles.homeSection}>
      <Header />
      {showTutorial && <TutorialOverlay onComplete={() => setShowTutorial(false)} />}
      
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>{t(heroTitleKey)}</h1>
      </div>
      
      <DigitalNewspaper />

      <div className={styles.grid}>
        {[
          { id: 'create-weekly', title: t('home.weekly_show'), type: 'semanal', description: t('home.weekly_desc'), color: '#ff5252' },
          { id: 'create-ple', title: t('home.ple_show'), type: 'especial', description: t('home.ple_desc'), color: '#ffd700' }
        ].map((event) => (
          <StarBorder 
            key={event.id} 
            as="div"
            color={event.color}
            speed="6s"
            className={styles.electricCardWrapper}>
            <div 
              id={event.id}
              onClick={() => navigate(`/create-event/${event.type}`)}
              className={`${styles.eventCard} ${styles[event.type]}`}>
              <h3 className={styles.eventTitle}>{event.title}</h3>
              <p className={styles.eventDescription}>{event.description}</p>
            </div>
          </StarBorder>
        ))}
      </div>

      <PLECarousel />

      <div className={styles.infoSection}>
        <h2 className={styles.infoTitle}>{t('home.how_it_works')}</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <h3>{t('home.mgmt_shows')}</h3>
            <p>{t('home.mgmt_shows_desc')}</p>
          </div>
          <div className={styles.infoItem}>
            <h3>{t('home.mgmt_roster')}</h3>
            <p>{t('home.mgmt_roster_desc')}</p>
          </div>
          <div className={styles.infoItem}>
            <h3>{t('home.mgmt_titles')}</h3>
            <p>{t('home.mgmt_titles_desc')}</p>
          </div>
          <div className={styles.infoItem}>
            <h3>{t('home.mgmt_config')}</h3>
            <p>{t('home.mgmt_config_desc')}</p>
          </div>
        </div>
      </div>
      <GMChat />
    </section>
  );
};

export default Home;

