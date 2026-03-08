import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { importState, getSaveSlots, loadFromSlot, deleteSlot } from '../../db/dbPersistence';
import type { FullDatabaseState } from '../../db/dbPersistence';
import { linkAssetsFolder, initAssetsFolder, checkAssetsPermission, requestAssetsPermission } from '../../utils/assetResolver';
import styles from './Landing.module.scss';

type ViewState = 'MAIN' | 'NEW_GAME' | 'LOAD_GAME' | 'WIZARD';
type WizardStep = '1_NAME' | '2_PREP' | '3_IMPORT' | '4_ASSETS' | '5_CONFIRM';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>('MAIN');
  const [wizardStep, setWizardStep] = useState<WizardStep>('1_NAME');
  
  const [saveSlots, setSaveSlots] = useState<{ id?: number, name: string, data: FullDatabaseState, timestamp: Date }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  
  // Custom Preset Wizard State
  const [customPresetName, setCustomPresetName] = useState('');
  const [importedData, setImportedData] = useState<FullDatabaseState | null>(null);

  // Local Assets State
  const [hasLinkedFolder, setHasLinkedFolder] = useState(false);
  const [folderPermission, setFolderPermission] = useState<boolean>(false);

  const jsonTemplate = {
    brands: [
      { 
        id: 1, 
        name: "RAW", 
        primaryColor: "#FF0000", 
        secondaryColor: "#000000", 
        logo: "/visuals/Brands/raw.png", 
        priority: 1, 
        isMajorBrand: true, 
        isShared: false 
      }
    ],
    wrestlers: [
      { 
        id: 1, 
        name: "Cody Rhodes", 
        gender: "Male", 
        brandId: 1, 
        avatar: "/visuals/Wrestlers/men/cody/avatar.png", 
        image: "/visuals/Wrestlers/men/cody/full.png"
      }
    ],
    championships: [
      { id: 1, name: "WWE Championship", brandId: 1, history: [] }
    ],
    npcs: [
      { id: 100, name: "Adam Pearce", role: "General Manager", brandId: 1 }
    ],
    settings: [],
    shows: [
      { id: 1, name: "Monday Night RAW", type: "Weekly", day: "Monday", brandId: 1 }
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
      const response = await fetch(presetPath);
      if (!response.ok) throw new Error('Preset no encontrado.');
      const data = await response.json();
      await importState(data, true);
      navigate('/');
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
      navigate('/');
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
      // We could inject the custom name into settings if we had a "universe name" setting
      await importState(importedData, true);
      navigate('/');
    } catch (error) {
      alert('Error al finalizar la creación: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMainMenu = () => (
    <div className={styles.mainMenu}>
      <button className={styles.menuItem} onClick={() => setView('NEW_GAME')}>
        <span className={styles.icon}>➕</span>
        <div className={styles.text}>
          <h3>NUEVA PARTIDA</h3>
          <p>Crea un nuevo universo desde un preset o personalizalo.</p>
        </div>
      </button>
      
      <button 
        className={`${styles.menuItem} ${saveSlots.length === 0 ? styles.disabled : ''}`} 
        onClick={() => saveSlots.length > 0 && setView('LOAD_GAME')}
      >
        <span className={styles.icon}>💾</span>
        <div className={styles.text}>
          <h3>CARGAR PARTIDA</h3>
          <p>{saveSlots.length > 0 ? `Tienes ${saveSlots.length} partidas guardadas.` : 'No hay partidas guardadas.'}</p>
        </div>
      </button>

      <div className={styles.footerInfo}>
        <p>WWE 2K HUB - v1.2.0</p>
      </div>
    </div>
  );

  const renderNewGameMenu = () => (
    <div className={styles.subMenu}>
      <button className={styles.backButton} onClick={() => setView('MAIN')}>← Volver</button>
      <h2 className={styles.viewTitle}>ELEGIR PRESET</h2>
      
      <div className={styles.presetGrid}>
        <div className={styles.presetCard} onClick={() => handleNewGameFromPreset('/presets/wwe_universe.json')}>
          <div className={styles.presetLogo}>WWE</div>
          <h4>WWE UNIVERSE</h4>
          <p>Configuración completa con RAW, SD y NXT.</p>
        </div>

        <div className={styles.presetCard} onClick={() => handleNewGameFromPreset('/presets/aew_universe.json')}>
          <div className={`${styles.presetLogo} ${styles.aew}`}>AEW</div>
          <h4>AEW DYNAMITE</h4>
          <p>Preset básico para All Elite Wrestling.</p>
        </div>

        <div className={`${styles.presetCard} ${styles.custom}`} onClick={() => setView('WIZARD')}>
          <div className={styles.presetLogo}>⚙️</div>
          <h4>PERSONALIZADO</h4>
          <p>Guía paso a paso para importar tus propios datos.</p>
        </div>
      </div>
    </div>
  );

  const renderLoadGameMenu = () => (
    <div className={styles.subMenu}>
      <button className={styles.backButton} onClick={() => setView('MAIN')}>← Volver</button>
      <h2 className={styles.viewTitle}>MIS PARTIDAS</h2>
      
      <div className={styles.slotsList}>
        {saveSlots.map(slot => (
          <div key={slot.id} className={styles.slotItem} onClick={() => slot.id && handleLoadSlot(slot.id)}>
            <div className={styles.slotBadge}>{slot.name.substring(0, 1).toUpperCase()}</div>
            <div className={styles.slotMain}>
              <span className={styles.slotName}>{slot.name}</span>
              <span className={styles.slotDate}>{new Date(slot.timestamp).toLocaleString()}</span>
            </div>
            <button className={styles.deleteSlotBtn} onClick={(e) => slot.id && handleDeleteSlot(slot.id, e)}>🗑️</button>
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
              <h2>Nombre del Universo</h2>
              <p>Dale un nombre a tu nueva creación para identificarla en los slots.</p>
              <input 
                type="text" 
                placeholder="Ej: My Custom Universe" 
                value={customPresetName}
                onChange={e => setCustomPresetName(e.target.value)}
                autoFocus
              />
              <button disabled={!customPresetName} onClick={() => setWizardStep('2_PREP')}>Siguiente</button>
            </div>
          )}

          {wizardStep === '2_PREP' && (
            <div className={styles.wizardView}>
              <h2>Preparación de Datos</h2>
              <p>Necesitas un archivo JSON con la estructura correcta. Descarga nuestra plantilla y rellénala con tus datos.</p>
              <div className={styles.actionBox}>
                <button className={styles.downloadBtn} onClick={() => setShowTemplateModal(true)}>📖 Ver Instrucciones y Plantilla</button>
                <div className={styles.tip}>Tip: Asegúrate de que los IDs no se repitan y que las rutas de imagen coincidan con tu carpeta local.</div>
              </div>
              <button onClick={() => setWizardStep('3_IMPORT')}>Tengo mi archivo listo</button>
            </div>
          )}

          {wizardStep === '3_IMPORT' && (
            <div className={styles.wizardView}>
              <h2>Importar JSON</h2>
              <p>Selecciona el archivo <code>.json</code> que has modificado.</p>
              <label className={styles.fileLabel}>
                <span>📂 Seleccionar Archivo</span>
                <input type="file" accept=".json" onChange={handleJsonUpload} />
              </label>
              {importedData && <p className={styles.successMsg}>✅ Archivo detectado correctamente.</p>}
            </div>
          )}

          {wizardStep === '4_ASSETS' && (
            <div className={styles.wizardView}>
              <h2>Recursos Visuales</h2>
              <p>Vincula la carpeta local donde guardas las imágenes para que se vean en el HUB.</p>
              <div className={styles.assetWizardBox}>
                 {!hasLinkedFolder ? (
                  <button className={styles.wizardActionBtn} onClick={handleLinkFolder}>📂 Vincular Carpeta de Imágenes</button>
                ) : !folderPermission ? (
                  <button className={styles.wizardActionBtn} onClick={handleRequestPermission}>⚠️ Reactivar Permisos</button>
                ) : (
                  <div className={styles.successBox}>✅ Carpeta vinculada correctamente.</div>
                )}
              </div>
              <p className={styles.hint}>Si no vinculas la carpeta ahora, podrás hacerlo más tarde en Opciones.</p>
              <button onClick={() => setWizardStep('5_CONFIRM')}>Continuar</button>
            </div>
          )}

          {wizardStep === '5_CONFIRM' && (
            <div className={styles.wizardView}>
              <h2>¡Todo listo!</h2>
              <p>Vas a crear el universo <strong>{customPresetName}</strong>.</p>
              <div className={styles.summaryBox}>
                <ul>
                  <li>Marcas: {importedData?.brands.length || 0}</li>
                  <li>Luchadores: {importedData?.wrestlers.length || 0}</li>
                  <li>Títulos: {importedData?.championships.length || 0}</li>
                </ul>
              </div>
              <button className={styles.finalBtn} onClick={finalizeCustomWizard} disabled={isLoading}>
                {isLoading ? 'CREANDO...' : 'COMENZAR AVENTURA'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.landingPage}>
      <div className={styles.overlay}></div>
      <div className={styles.content}>
        <div className={styles.logoContainer}>
          <h1 className={styles.title}>WWE 2K<span>HUB</span></h1>
          <p className={styles.subtitle}>UNIVERSE MANAGER ELITE</p>
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
            <button className={styles.closeModal} onClick={() => setShowTemplateModal(false)}>×</button>
            <h2>Guía de Configuración JSON</h2>
            <div className={styles.modalScroll}>
              <section className={styles.guideSection}>
                <h3>Instrucciones de Rellenado</h3>
                <p className={styles.description}>
                  Sigue estos pasos para que tu preset funcione perfectamente:
                </p>
                <ul>
                  <li><strong>IDs Únicos:</strong> Cada luchador, marca y título debe tener un ID numérico único.</li>
                  <li><strong>Rutas de Imagen:</strong> Usa rutas que empiecen por <code>/visuals/</code> (ej: <code>/visuals/Wrestlers/cena.png</code>).</li>
                  <li><strong>Campos Dinámicos:</strong> No te preocupes por victorias, derrotas o lesiones; el sistema los inicializará por ti.</li>
                  <li><strong>Marcas:</strong> Define al menos una marca para que el sistema pueda asignar luchadores.</li>
                </ul>
              </section>

              <section className={styles.templateSection}>
                <h3>Plantilla JSON (Estructura Base)</h3>
                <pre className={styles.codeBlock}>
                  {JSON.stringify(jsonTemplate, null, 2)}
                </pre>
                <button 
                  className={styles.copyButton}
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(jsonTemplate, null, 2));
                    alert('Plantilla copiada al portapapeles');
                  }}
                >
                  📋 Copiar Plantilla
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
