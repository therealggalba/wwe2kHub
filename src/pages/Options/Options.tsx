import { useState, useEffect } from 'react';
import DatabaseTools from '../../components/DatabaseTools/DatabaseTools';
import { db } from '../../db/db';
import { saveToSlot, getSaveSlots, deleteSlot, clearAllData } from '../../db/dbPersistence';
import type { FullDatabaseState } from '../../db/dbPersistence';
import { GAME_CONFIG } from '../../config/gameConfig';
import styles from './Options.module.scss';
import { useNavigate } from 'react-router-dom';
import { linkAssetsFolder, initAssetsFolder, checkAssetsPermission, requestAssetsPermission } from '../../utils/assetResolver';

interface SaveSlot {
  id?: number;
  name: string;
  data: FullDatabaseState;
  timestamp: Date;
}

const Options = () => {
  const navigate = useNavigate();
  const [enableInjuries, setEnableInjuries] = useState<boolean>(GAME_CONFIG.settings.enableInjuries);
  const [enableMorale, setEnableMorale] = useState<boolean>(GAME_CONFIG.settings.enableMorale);
  const [weeksPerSeason, setWeeksPerSeason] = useState<number>(GAME_CONFIG.settings.weeksPerSeason);
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>([]);
  
  // Local Assets State
  const [hasLinkedFolder, setHasLinkedFolder] = useState(false);
  const [folderPermission, setFolderPermission] = useState<boolean>(false);

  useEffect(() => {
    const loadSettings = async () => {
      const injurySetting = await db.settings.get('enableInjuries');
      if (injurySetting) setEnableInjuries(injurySetting.value as boolean);
      
      const moraleSetting = await db.settings.get('enableMorale');
      if (moraleSetting) setEnableMorale(moraleSetting.value as boolean);

      const weeksSetting = await db.settings.get('weeksPerSeason');
      if (weeksSetting) setWeeksPerSeason(weeksSetting.value as number);
      else await db.settings.put({ key: 'weeksPerSeason', value: GAME_CONFIG.settings.weeksPerSeason });
      
      const slots = await getSaveSlots();
      setSaveSlots(slots);

      // Init Assets
      const linked = await initAssetsFolder();
      setHasLinkedFolder(linked);
      if (linked) {
        const permitted = await checkAssetsPermission();
        setFolderPermission(permitted);
      }
    };
    loadSettings();
  }, []);

  const handleLinkFolder = async () => {
    const success = await linkAssetsFolder();
    if (success) {
      setHasLinkedFolder(true);
      setFolderPermission(true);
    }
  };

  const handleRequestPermission = async () => {
    const success = await requestAssetsPermission();
    setFolderPermission(success);
  };

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


  const handleCreateSaveSlot = async () => {
    const slotName = prompt('Nombre para el slot de guardado:');
    if (!slotName) return;
    try {
      await saveToSlot(slotName);
      const slots = await getSaveSlots();
      setSaveSlots(slots);
      alert(`Partida guardada en el slot: ${slotName}`);
    } catch {
      alert('Error al guardar la partida');
    }
  };

  const handleDeleteSlot = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este slot de guardado?')) return;
    await deleteSlot(id);
    const slots = await getSaveSlots();
    setSaveSlots(slots);
  };

  const handleResetGame = async () => {
    if (!confirm('¿Estás seguro de resetear la partida actual? Se borrarán todos los datos no guardados en slots.')) return;
    try {
      console.log('Resetting game data...');
      await clearAllData();
      console.log('Data cleared, navigating to /landing');
      navigate('/landing');
    } catch (err) {
      console.error('Error resetting game:', err);
      // Fallback
      window.location.hash = '/landing';
    }
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
              Gestión del Juego
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
                  checked={!enableInjuries} 
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
                  checked={!enableMorale} 
                  onChange={handleToggleMorale}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Semanas por Season</span>
                <p className={styles.settingDescription}>Configurado al inicio de la partida (Inmutable).</p>
              </div>
              <select 
                className={styles.lockedSelect}
                value={weeksPerSeason}
                disabled
              >
                <option value={12}>12 SHOWS</option>
                <option value={24}>24 SHOWS</option>
                <option value={60}>60 SHOWS</option>
              </select>
            </div>
          </div>
        </div>

        {/* Local Assets Management */}
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Recursos Locales</h2>
          <p className={styles.sectionDescription}>
            Vincula una carpeta local para cargar imágenes sin modificar el código.
          </p>
          
          <div className={styles.assetStatus}>
            {!hasLinkedFolder ? (
              <button className={styles.linkButton} onClick={handleLinkFolder}>
                Vincular Carpeta visuals
              </button>
            ) : !folderPermission ? (
              <button className={`${styles.linkButton} ${styles.warning}`} onClick={handleRequestPermission}>
                Reactivar Acceso
              </button>
            ) : (
              <div className={styles.folderActive}>
                <span className={styles.statusDot}></span>
                Conectado a visuals/
                <button className={styles.smallButton} onClick={handleLinkFolder}>Cambiar</button>
              </div>
            )}
          </div>
          
          <p className={styles.assetNote}>
            Asegúrate de que la estructura sea <code>visuals/Wrestlers</code>, <code>visuals/Brands</code>, etc.
          </p>
        </div>

        {/* Database Management */}
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Datos y Backup</h2>
          <p className={styles.sectionDescription}>
            Gestiona la persistencia de tu partida. Guarda tu progreso en slots internos.
          </p>
          
          <div className={styles.persistenceActions}>
            <button className={styles.saveButton} onClick={handleCreateSaveSlot}>
              Guardar
            </button>
            <button className={styles.resetButton} onClick={handleResetGame}>
              Menú Principal
            </button>
          </div>

          <div className={styles.slotsManagement}>
            <h3 className={styles.subTitle}>Slots Guardados</h3>
            {saveSlots.length === 0 ? (
              <p className={styles.noSlots}>No hay slots de guardado.</p>
            ) : (
              <div className={styles.slotsMiniList}>
                {saveSlots.map(slot => (
                  <div key={slot.id} className={styles.slotMiniItem}>
                    <div className={styles.slotMiniInfo}>
                      <span className={styles.slotMiniName}>{slot.name}</span>
                      <span className={styles.slotMiniDate}>{new Date(slot.timestamp).toLocaleDateString()}</span>
                    </div>
                    <button 
                      className={styles.deleteSlotBtn} 
                      onClick={() => slot.id && handleDeleteSlot(slot.id)}
                      title="Eliminar Slot"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.actionNote}>
             <p>
               Para cargar una partida guardada, sal al Menú Principal.
             </p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Options;
