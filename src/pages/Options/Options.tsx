import { useState, useEffect } from 'react';
import DatabaseTools from '../../components/DatabaseTools/DatabaseTools';
import { db } from '../../db/db';
import { saveToSlot, getSaveSlots, deleteSlot, clearAllData } from '../../db/dbPersistence';
import type { FullDatabaseState } from '../../db/dbPersistence';
import { GAME_CONFIG } from '../../config/gameConfig';
import styles from './Options.module.scss';
import { useNavigate } from 'react-router-dom';
import { linkAssetsFolder, initAssetsFolder, checkAssetsPermission, requestAssetsPermission } from '../../utils/assetResolver';
import { useTranslation } from 'react-i18next';

interface SaveSlot {
  id?: number;
  name: string;
  data: FullDatabaseState;
  timestamp: Date;
}

const Options = () => {
  const { t, i18n } = useTranslation();
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
    const slotName = prompt(t('options.slot_name_prompt'));
    if (!slotName) return;
    try {
      await saveToSlot(slotName);
      const slots = await getSaveSlots();
      setSaveSlots(slots);
      alert(t('options.save_success', { name: slotName }));
    } catch {
      alert(t('options.save_error'));
    }
  };

  const handleDeleteSlot = async (id: number) => {
    if (!confirm(t('options.delete_slot_confirm'))) return;
    await deleteSlot(id);
    const slots = await getSaveSlots();
    setSaveSlots(slots);
  };

  const handleResetGame = async () => {
    if (!confirm(t('options.reset_game_confirm'))) return;
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
          {t('common.options')}
        </h1>
        <DatabaseTools />
      </header>

      <div className={styles.grid}>
        {/* Game Settings */}
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>
              {t('options.game_management')}
          </h2>
          <div className={styles.settingsList}>
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>{t('options.language')}</span>
                <p className={styles.settingDescription}>{t('options.select_lang')}</p>
              </div>
              <select 
                className={styles.languageSelect}
                value={i18n.language.split('-')[0]} 
                onChange={(e) => i18n.changeLanguage(e.target.value)}
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>{t('options.injury_system')}</span>
                <p className={styles.settingDescription}>{t('options.injury_desc')}</p>
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
                <span className={styles.settingLabel}>{t('options.morale_system')}</span>
                <p className={styles.settingDescription}>{t('options.morale_desc')}</p>
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
                <span className={styles.settingLabel}>{t('options.weeks_per_season')}</span>
                <p className={styles.settingDescription}>{t('options.immutable_desc')}</p>
              </div>
              <select 
                className={styles.lockedSelect}
                value={weeksPerSeason}
                disabled
              >
                <option value={12}>12 {t('landing.shows')}</option>
                <option value={24}>24 {t('landing.shows')}</option>
                <option value={60}>60 {t('landing.shows')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Local Assets Management */}
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>{t('options.local_assets')}</h2>
          <p className={styles.sectionDescription}>
            {t('options.local_assets_desc')}
          </p>
          
          <div className={styles.assetStatus}>
            {!hasLinkedFolder ? (
              <button className={styles.linkButton} onClick={handleLinkFolder}>
                {t('options.link_visuals_folder')}
              </button>
            ) : !folderPermission ? (
              <button className={`${styles.linkButton} ${styles.warning}`} onClick={handleRequestPermission}>
                {t('options.reactivate_access')}
              </button>
            ) : (
              <div className={styles.folderActive}>
                <span className={styles.statusDot}></span>
                {t('options.connected_to')} visuals/
                <button className={styles.smallButton} onClick={handleLinkFolder}>{t('options.change')}</button>
              </div>
            )}
          </div>
          
          <p className={styles.assetNote}>
            {t('options.asset_note')}
          </p>
        </div>

        {/* Database Management */}
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>{t('options.data_backup')}</h2>
          <p className={styles.sectionDescription}>
            {t('options.persistence_desc')}
          </p>
          
          <div className={styles.persistenceActions}>
            <button className={styles.saveButton} onClick={handleCreateSaveSlot}>
              {t('common.save')}
            </button>
            <button className={styles.resetButton} onClick={handleResetGame}>
              {t('options.main_menu')}
            </button>
          </div>

          <div className={styles.slotsManagement}>
            <h3 className={styles.subTitle}>{t('options.saved_slots')}</h3>
            {saveSlots.length === 0 ? (
              <p className={styles.noSlots}>{t('options.no_slots')}</p>
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
               {t('options.load_instruction')}
             </p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Options;
