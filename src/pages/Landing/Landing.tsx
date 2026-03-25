import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { importState, getSaveSlots, loadFromSlot, deleteSlot } from '../../db/dbPersistence';
import type { FullDatabaseState } from '../../db/dbPersistence';
import { linkAssetsFolder, initAssetsFolder, checkAssetsPermission, requestAssetsPermission } from '../../utils/assetResolver';
import ResolvedImage from '../../components/Common/ResolvedImage';
import styles from './Landing.module.scss';
import Hyperspeed from '../../components/Hyperspeed/Hyperspeed';
import { hyperspeedPresets } from '../../components/Hyperspeed/hyperspeedPresets';
import { useTranslation } from 'react-i18next';

type ViewState = 'MAIN' | 'NEW_GAME' | 'LOAD_GAME' | 'WIZARD';
type WizardStep = '1_NAME' | '2_PREP' | '3_IMPORT' | '4_ASSETS' | '5_CONFIRM';

const Landing: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>('MAIN');
  const [wizardStep, setWizardStep] = useState<WizardStep>('1_NAME');
  
  const [saveSlots, setSaveSlots] = useState<{ id?: number, name: string, data: FullDatabaseState, timestamp: Date }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  
  // Custom Preset Wizard State
  const [customPresetName, setCustomPresetName] = useState('');
  const [importedData, setImportedData] = useState<FullDatabaseState | null>(null);
  const [seasonDuration, setSeasonDuration] = useState<number>(24);

  // Local Assets State
  const [hasLinkedFolder, setHasLinkedFolder] = useState(false);
  const [folderPermission, setFolderPermission] = useState<boolean>(false);

  const jsonTemplate = {
    brands: [
      {
      "id": 1,
      "name": "NombreDeMarca",
      "primaryColor": "#FFFFFF",
      "secondaryColor": "#000000",
      "logo": "/visuals/Brands/nombredemarca.png",
      "priority": 1,
      "isMajorBrand": true,
      "isShared": false
    },
    ],
    wrestlers: [
      { 
        id: 1, 
        name: "Nombre Wrestler", 
        gender: "Male", 
        brandId: 1, 
        avatar: "/visuals/Wrestlers/men/nombrewrestler/nombrewrestleravatar.png", 
        image: "/visuals/Wrestlers/men/nombrewrestler/nombrewrestlerfull.png"
      },
      { 
        id: 2, 
        name: "Nombre Wrestler", 
        gender: "Female", 
        brandId: 1, 
        avatar: "/visuals/Wrestlers/women/nombrewrestler/nombrewrestleravatar.png", 
        image: "/visuals/Wrestlers/women/nombrewrestler/nombrewrestlerfull.png"
      }
    ],
    championships: [
      { id: 1, name: "World Championship", image: "/visuals/Championships/worldchampionship.png", brandId: 1}
    ],
    npcs: [
      { id: 100, name: "Name NPC", role: "General Manager", brandId: 1 }
    ],
    settings: [
    { "key": "enableInjuries", "value": true },
    { "key": "enableMorale", "value": true },
    { "key": "weeksPerSeason", "value": 60 }
    ],
    shows: [
      { "id": 1, "name": "Tuesday Night Show", "brandName": "NombreDeMarca", "type": "Weekly", "image": "./visuals/Events/Logos/nombredemarca.png" },
      { "id": 2, "name": "WrestleShow", "brandName": "SHARED", "type": "PLE", "image": "./visuals/Events/Logos/wrestleshow.png" }
    ]
  };

  useEffect(() => {
    const checkStatus = async () => {
      const slots = await getSaveSlots();
      setSaveSlots(slots);
      
      const linked = await initAssetsFolder();
      setHasLinkedFolder(linked);
      if (linked) {
        const permitted = await checkAssetsPermission();
        setFolderPermission(permitted);
      }
    };
    checkStatus();

    // Subtle AI Preloading
    setTimeout(() => {
      import('../../utils/aiEngine').then(({ aiEngine }) => {
        aiEngine.init().catch(console.error);
      });
    }, 2000);
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

  const handleNewGameFromPreset = async (presetPath: string) => {
    setIsLoading(true);
    try {
      const baseUrl = import.meta.env.BASE_URL;
      const cleanPath = presetPath.startsWith('/') ? presetPath.substring(1) : presetPath;
      const response = await fetch(`${baseUrl}${cleanPath}?t=${new Date().getTime()}`);
      if (!response.ok) throw new Error('Preset no encontrado.');
      const data = await response.json();
      
      // Inject selected season duration into settings
      if (!data.settings) data.settings = [];
      const setIdx = data.settings.findIndex((s: { key: string }) => s.key === 'weeksPerSeason');
      if (setIdx > -1) data.settings[setIdx].value = seasonDuration;
      else data.settings.push({ key: 'weeksPerSeason', value: seasonDuration });

      await importState(data);
      navigate('/home', { state: { newGame: true } });
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Error al cargar preset');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        setImportedData(data);
        setWizardStep('4_ASSETS');
      } catch (err: unknown) {
        alert('Error al procesar el archivo JSON: ' + (err instanceof Error ? err.message : 'Error desconocido'));
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSlot = async (id: number) => {
    setIsLoading(true);
    try {
      await loadFromSlot(id);
      navigate('/home');
    } catch {
      alert('Error al cargar la partida');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSlot = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de que quieres eliminar esta partida?')) return;
    await deleteSlot(id);
    setSaveSlots(await getSaveSlots());
  };

  const finalizeCustomWizard = async () => {
    if (!importedData) return;
    setIsLoading(true);
    try {
      // Inject selected season duration into settings
      if (!importedData.settings) importedData.settings = [];
      const settings = importedData.settings as { key: string; value: any }[];
      const setIdx = settings.findIndex(s => s.key === 'weeksPerSeason');
      if (setIdx > -1) settings[setIdx].value = seasonDuration;
      else settings.push({ key: 'weeksPerSeason', value: seasonDuration });

      // Inject Gonzalo Galba as GM if not present
      if (!importedData.npcs) importedData.npcs = [];
      const npcs = importedData.npcs as { id: number; name: string; role: string; brandName?: string; image?: string }[];
      const hasGM = npcs.some(n => n.role === 'General Manager' || n.role === 'GM');
      if (!hasGM) {
        npcs.push({
          id: 999,
          name: "Gonzalo Galba",
          role: "General Manager",
          brandName: "SHARED",
          image: "./visuals/Wrestlers/others/gonzalogalba/gonzalogalbaavatar.png"
        });
      }

      await importState(importedData as Partial<FullDatabaseState>);
      navigate('/home', { state: { newGame: true } });
    } catch (error) {
      alert('Error al finalizar la creación: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMainMenu = () => (
    <div className={styles.mainMenu}>
      <button className={styles.menuItem} onClick={() => setView('NEW_GAME')}>
        <div className={styles.text}>
          <h3>{t('common.new_game')}</h3>
        </div>
      </button>
      <button 
        className={`${styles.menuItem} ${saveSlots.length === 0 ? styles.disabled : ''}`} 
        onClick={() => saveSlots.length > 0 && setView('LOAD_GAME')}>
        <div className={styles.text}>
          <h3>{t('common.continue')}</h3>
          <p>{saveSlots.length > 0 ? t('landing.has_saves', { count: saveSlots.length }) : t('landing.no_saves')}</p>
        </div>
      </button>
    </div>
  );

  const renderNewGameMenu = () => (
    <div className={styles.subMenu}>
      <button className={styles.backButton} onClick={() => setView('MAIN')}>← {t('common.back')}</button>
      <h2 className={styles.viewTitle}>{t('landing.pick_preset')}</h2>
      
      <div className={styles.durationSelector}>
        <label>{t('landing.season_duration')}:</label>
        <div className={styles.durationOptions}>{[12, 24, 60].map(d => (
            <button key={d} className={seasonDuration === d ? styles.active : ''} 
              onClick={() => setSeasonDuration(d)}>{d} {t('landing.shows')}</button>
          ))}
        </div>
      </div>
      
      <div className={styles.presetGrid}>
        <div className={styles.presetCard} onClick={() => handleNewGameFromPreset('/presets/wwe_universe.json')}>
          <div className={styles.presetLogo}>
            <ResolvedImage src="https://res.cloudinary.com/dgvthwz6h/image/upload/v1774380691/wwe.png" alt="WWE" />
          </div>
          <p>{t('landing.preset_wwe_desc')}</p>
          <p>2026</p>
        </div>

        <div className={styles.presetCard} onClick={() => handleNewGameFromPreset('/presets/aew_universe.json')}>
          <div className={`${styles.presetLogo} ${styles.aew}`}>
            <ResolvedImage src="https://res.cloudinary.com/dgvthwz6h/image/upload/v1774380691/aew.png" alt="AEW" />
          </div>
          <p>{t('landing.preset_aew_desc')}</p>
          <p>2026</p>
        </div>

        <div className={`${styles.presetCard} ${styles.custom}`} onClick={() => setView('WIZARD')}>
          <div className={styles.presetLogo}>⚙️</div>
          <p>{t('landing.custom_universe')}</p>
          <p>2026</p>
        </div>
      </div>
    </div>
  );

  const renderLoadGameMenu = () => (
    <div className={styles.subMenu}>
      <button className={styles.backButton} onClick={() => setView('MAIN')}>← {t('common.back')}</button>
      <h2 className={styles.viewTitle}>{t('landing.select_slot')}</h2>
      
      <div className={styles.slotsList}>
        {saveSlots.map(slot => (
          <div key={slot.id} className={styles.slotItem} onClick={() => slot.id && handleLoadSlot(slot.id)}>
            <div className={styles.slotBadge}>{slot.name.substring(0, 1).toUpperCase()}</div>
            <div className={styles.slotMain}>
              <span className={styles.slotName}>{slot.name}</span>
              <span className={styles.slotDate}>{new Date(slot.timestamp).toLocaleString()}</span>
            </div>
            <button className={styles.deleteSlotBtn} onClick={(e) => slot.id && handleDeleteSlot(slot.id, e)}>X</button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderWizard = () => {
    return (
      <div className={styles.wizardContainer}>
        <button className={styles.backButton} onClick={() => setView('NEW_GAME')}>← Cancelar</button>
        
        <div className={styles.wizardSteps}>
          <div className={`${styles.step} ${wizardStep === '1_NAME' ? styles.active : ''} ${['2_PREP', '3_IMPORT', '4_ASSETS', '5_CONFIRM'].includes(wizardStep) ? styles.done : ''}`}>1</div>
          <div className={`${styles.step} ${wizardStep === '2_PREP' ? styles.active : ''} ${['3_IMPORT', '4_ASSETS', '5_CONFIRM'].includes(wizardStep) ? styles.done : ''}`}>2</div>
          <div className={`${styles.step} ${wizardStep === '3_IMPORT' ? styles.active : ''} ${['4_ASSETS', '5_CONFIRM'].includes(wizardStep) ? styles.done : ''}`}>3</div>
          <div className={`${styles.step} ${wizardStep === '4_ASSETS' ? styles.active : ''} ${['5_CONFIRM'].includes(wizardStep) ? styles.done : ''}`}>4</div>
          <div className={`${styles.step} ${wizardStep === '5_CONFIRM' ? styles.active : ''}`}>5</div>
        </div>

        <div className={styles.stepContent}>
          {wizardStep === '1_NAME' && (
            <div className={styles.wizardView}>
              <h2>{t('landing.wizard_step_1_title')}</h2>
              <p>{t('landing.wizard_step_1_desc')}</p>
              <input 
                type="text" 
                placeholder={t('landing.wizard_step_1_placeholder')}
                value={customPresetName}
                onChange={e => setCustomPresetName(e.target.value)}
                autoFocus
              />
              <button disabled={!customPresetName} onClick={() => setWizardStep('2_PREP')}>{t('landing.next')}</button>
            </div>
          )}

          {wizardStep === '2_PREP' && (
            <div className={styles.wizardView}>
              <h2>{t('landing.wizard_step_2_title')}</h2>
              <p>{t('landing.wizard_step_2_desc')}</p>
              <div className={styles.actionBox}>
                <button className={styles.downloadBtn} onClick={() => setShowTemplateModal(true)}>{t('landing.wizard_step_2_instructions')}</button>
                <div className={styles.tip}>{t('landing.wizard_step_2_tip')}</div>
              </div>
              <button onClick={() => setWizardStep('3_IMPORT')}>{t('landing.wizard_step_2_ready')}</button>
            </div>
          )}

          {wizardStep === '3_IMPORT' && (
            <div className={styles.wizardView}>
              <h2>{t('landing.wizard_step_3_title')}</h2>
              <p>{t('landing.wizard_step_3_desc')}</p>
              <label className={styles.fileLabel}>
                <span>📂 {t('landing.select_file')}</span>
                <input type="file" accept=".json" onChange={handleJsonUpload} />
              </label>
              {importedData && <p className={styles.successMsg}>✅ {t('landing.file_detected')}</p>}
            </div>
          )}

          {wizardStep === '4_ASSETS' && (
            <div className={styles.wizardView}>
              <h2>{t('landing.wizard_step_4_title')}</h2>
              <p>{t('landing.wizard_step_4_desc')}</p>
              <div className={styles.assetWizardBox}>
                 {!hasLinkedFolder ? (
                  <button className={styles.wizardActionBtn} onClick={handleLinkFolder}>📂 {t('landing.link_folder')}</button>
                ) : !folderPermission ? (
                  <button className={styles.wizardActionBtn} onClick={handleRequestPermission}>⚠️ {t('landing.reactivate_perms')}</button>
                ) : (
                  <div className={styles.successBox}>✅ {t('landing.folder_linked')}</div>
                )}
              </div>
              <p className={styles.hint}>{t('landing.link_later_hint')}</p>
              <button onClick={() => setWizardStep('5_CONFIRM')}>{t('landing.next')}</button>
            </div>
          )}

          {wizardStep === '5_CONFIRM' && (
            <div className={styles.wizardView}>
              <h2>{t('landing.wizard_step_5_title')}</h2>
              <p>
                {t('landing.wizard_step_5_desc').split('<strong>{{name}}</strong>')[0]}
                <strong>{customPresetName}</strong>
                {t('landing.wizard_step_5_desc').split('<strong>{{name}}</strong>')[1]}
              </p>
              <div className={styles.summaryBox}>
                <ul>
                  <li>{t('landing.brands')}: {importedData?.brands?.length ?? 0}</li>
                  <li>{t('landing.wrestlers')}: {importedData?.wrestlers?.length ?? 0}</li>
                  <li>{t('landing.championships')}: {importedData?.championships?.length ?? 0}</li>
                </ul>
              </div>
              <button className={styles.finalBtn} onClick={finalizeCustomWizard} disabled={isLoading}>
                {isLoading ? t('landing.creating') : t('landing.start_adventure')}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.landingPage}>
      <Hyperspeed effectOptions={hyperspeedPresets.two} />
      <div className={styles.overlay}></div>
      <div className={styles.content}>
        <div className={styles.languageSwitcher}>
          <button 
            className={i18n.language === 'es' ? styles.active : ''} 
            onClick={() => i18n.changeLanguage('es')}
          >
            ES
          </button>
          <button 
            className={i18n.language === 'en' ? styles.active : ''} 
            onClick={() => i18n.changeLanguage('en')}
          >
            EN
          </button>
        </div>

        <div className={styles.logoContainer}>
          <h1 className={styles.title}>ELITE<span>BOOKER</span></h1>
          <p className={styles.subtitle}>{t('landing.subtitle')}</p>
        </div>

        <div className={styles.viewLayer}>
          {view === 'MAIN' && renderMainMenu()}
          {view === 'NEW_GAME' && renderNewGameMenu()}
          {view === 'LOAD_GAME' && renderLoadGameMenu()}
          {view === 'WIZARD' && renderWizard()}
        </div>
      </div>

      {showTemplateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowTemplateModal(false)}>
          <div className={styles.templateModal} onClick={e => e.stopPropagation()}>
            <div className={styles.titleModal}>
              <h2>Guía de Configuración JSON</h2>
              <button className={styles.closeModal} onClick={() => setShowTemplateModal(false)}>X</button>
            </div>
            <div className={styles.modalScroll}>
              <section className={styles.guideSection}>
                <h3>Instrucciones</h3>
                <p className={styles.description}>
                  Sigue estos pasos para que tu preset funcione perfectamente:
                </p>
                <ul>
                  <li><strong>IDs Únicos:</strong> Cada wrestler, marca y título debe tener un ID numérico único.</li>
                  <li><strong>Estructura:</strong> /visuals/Brands, /visuals/Championships, /visuals/Events, /visuals/Wrestlers/(wo)men/wrestler.</li>
                  <li><strong>Detalles:</strong> No te preocupes por victorias o lesiones; el sistema los inicializará.</li>
                  <li><strong>Marcas:</strong> Define al menos una marca para asignar luchadores.</li>
                </ul>
              </section>

              <section className={styles.templateSection}>
                <h3>Plantilla JSON (Estructura de ejemplo)</h3>
                <pre className={styles.codeBlock}>
                  {JSON.stringify(jsonTemplate, null, 2)}
                </pre>
                <button 
                  className={styles.copyButton}
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(jsonTemplate, null, 2));
                    alert('Plantilla copiada al portapapeles');
                  }}
                >Copiar Plantilla
                </button>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
