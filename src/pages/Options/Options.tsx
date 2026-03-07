import { useState, useEffect } from 'react';
import DatabaseTools from '../../components/DatabaseTools/DatabaseTools';
import BrandEditor from '../../components/BrandEditor/BrandEditor';
import { db } from '../../db/db';
import { GAME_CONFIG } from '../../config/gameConfig';
import styles from './Options.module.scss';

const Options = () => {
  const [enableInjuries, setEnableInjuries] = useState<boolean>(GAME_CONFIG.settings.enableInjuries);
  const [enableMorale, setEnableMorale] = useState<boolean>(GAME_CONFIG.settings.enableMorale);
  const [weeksPerSeason, setWeeksPerSeason] = useState<number>(GAME_CONFIG.settings.weeksPerSeason);

  useEffect(() => {
    const loadSettings = async () => {
      const injurySetting = await db.settings.get('enableInjuries');
      if (injurySetting) setEnableInjuries(injurySetting.value);
      
      const moraleSetting = await db.settings.get('enableMorale');
      if (moraleSetting) setEnableMorale(moraleSetting.value);

      const weeksSetting = await db.settings.get('weeksPerSeason');
      if (weeksSetting) setWeeksPerSeason(weeksSetting.value);
      else await db.settings.put({ key: 'weeksPerSeason', value: GAME_CONFIG.settings.weeksPerSeason });
    };
    loadSettings();
  }, []);

  const handleToggleInjuries = async () => {
    const newValue = !enableInjuries;
    setEnableInjuries(newValue);
    await db.settings.put({ key: 'enableInjuries', value: newValue });
    
    if (!newValue) {
      // Deactivated: Clear all injuries
      const injured = await db.wrestlers.where('injuryWeeks').above(0).toArray();
      for (const w of injured) {
        await db.wrestlers.update(w.id!, { injuryWeeks: 0, injuryStatus: 'None' });
      }
    }
  };

  const handleToggleMorale = async () => {
    const newValue = !enableMorale;
    setEnableMorale(newValue);
    await db.settings.put({ key: 'enableMorale', value: newValue });

    if (!newValue) {
      // Deactivated: Reset all morale to 80%
      const all = await db.wrestlers.toArray();
      for (const w of all) {
        await db.wrestlers.update(w.id!, { moral: 80 });
      }
    }
  };

  const handleWeeksChange = async (val: number) => {
    setWeeksPerSeason(val);
    await db.settings.put({ key: 'weeksPerSeason', value: val });
  };

  return (
    <section className={styles.optionsSection}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          OPTIONS
        </h1>
        <DatabaseTools />
      </header>

      <div className={styles.grid}>
        {/* Game Settings */}
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>
             ⚙️ Gestión del Juego
          </h2>
          <div className={styles.settingsList}>
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Sistema de Lesiones</span>
                <p className={styles.settingDescription}>Activa o desactiva las lesiones aleatorias tras los shows.</p>
              </div>
              <label className={styles.switch}>
                <input 
                  type="checkbox" 
                  checked={enableInjuries} 
                  onChange={handleToggleInjuries}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Sistema de Moral</span>
                <p className={styles.settingDescription}>Activa o desactiva la progresión de moral de los luchadores.</p>
              </div>
              <label className={styles.switch}>
                <input 
                  type="checkbox" 
                  checked={enableMorale} 
                  onChange={handleToggleMorale}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Semanas por Season</span>
                <p className={styles.settingDescription}>Define cuántas semanas dura una temporada completa.</p>
              </div>
              <input 
                type="number" 
                className={styles.numberInput}
                value={weeksPerSeason}
                min={4}
                max={52}
                onChange={(e) => handleWeeksChange(parseInt(e.target.value) || 4)}
              />
            </div>
            
            <div className={styles.statusBadge}>
              Próximamente: Activar/Desactivar sistemas de moral, economía y variaciones de Roster.
            </div>
          </div>
        </div>

        {/* Database Management */}
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>📦 Datos y Backup</h2>
          <p className={styles.sectionDescription}>
            Gestiona la persistencia de tu partida. Exporta para salvar tu progreso o importa configuraciones externas de la comunidad.
          </p>
          <div className={styles.actionNote}>
             <p>
               Acciones críticas: Resetear Base de Datos (Próximamente)
             </p>
          </div>
        </div>

        {/* Brand Tuning */}
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>🎨 Personalización de Marcas</h2>
          <p className={styles.sectionDescription}>
            Modifica nombres, colores y logos de todas tus marcas configuradas en el sistema.
          </p>
          <BrandEditor />
        </div>
      </div>
    </section>
  );
};

export default Options;
