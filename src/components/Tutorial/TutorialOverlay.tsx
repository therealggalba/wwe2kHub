import React, { useState } from 'react';
import styles from './TutorialOverlay.module.scss';

interface TutorialOverlayProps {
  onComplete: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete }) => {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({});

  const getTargetRect = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      return el.getBoundingClientRect();
    }
    return null;
  };

  const updateSpotlight = (step: number | null) => {
    setActiveStep(step);
    if (step === null) {
      setSpotlightStyle({});
      return;
    }

    let targetId = '';
    switch (step) {
      case 1: targetId = 'nav-roster'; break;
      case 2: targetId = 'nav-options'; break;
      case 3: targetId = 'create-weekly'; break; // Could also point to create-ple
      case 4: targetId = 'gm-fab'; break;
    }

    const rect = getTargetRect(targetId);
    if (rect) {
      // Create a spotlight slightly larger than the target
      const padding = 10;
      const hole = {
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + (padding * 2),
        height: rect.height + (padding * 2),
      };

      // clip-path: polygon(0% 0%, 0% 100%, holeLeft 100%, holeLeft holeTop, holeRight holeTop, holeRight holeBottom, holeLeft holeBottom, holeLeft 100%, 100% 100%, 100% 0%);
      // This is a common CSS trick to create a rectangular hole in an overlay
      const left = hole.left;
      const top = hole.top;
      const right = hole.left + hole.width;
      const bottom = hole.top + hole.height;

      setSpotlightStyle({
        clipPath: `polygon(0% 0%, 0% 100%, ${left}px 100%, ${left}px ${top}px, ${right}px ${top}px, ${right}px ${bottom}px, ${left}px ${bottom}px, ${left}px 100%, 100% 100%, 100% 0%)`
      });
    } else {
      setSpotlightStyle({});
    }
  };

  return (
    <div className={styles.overlay} style={activeStep !== null ? spotlightStyle : {}}>
      {/* Indicadores Visuales Condicionales */}
      {activeStep === 1 && <div className={`${styles.arrow} ${styles.arrowRoster}`} />}
      {activeStep === 2 && <div className={`${styles.arrow} ${styles.arrowOptions}`} />}
      {activeStep === 3 && (
        <>
          <div className={`${styles.arrow} ${styles.arrowWeekly}`} />
          <div className={`${styles.arrow} ${styles.arrowPLE}`} />
        </>
      )}
      {activeStep === 4 && <div className={`${styles.arrow} ${styles.arrowGM}`} />}

      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>PRÓXIMOS PASOS</h2>
          <p>Pasa el ratón por los puntos para ver dónde están:</p>
        </div>

        <div className={styles.stepsList}>
          <div 
            className={styles.stepItem} 
            onMouseEnter={() => updateSpotlight(1)}
            onMouseLeave={() => updateSpotlight(null)}
          >
            <span className={styles.stepNumber}>1</span>
            <div className={styles.stepContent}>
              <h3>Definir Campeones</h3>
              <p>Ve a <strong>ROSTER</strong> y asigna los títulos vacantes.</p>
            </div>
          </div>

          <div 
            className={styles.stepItem}
            onMouseEnter={() => updateSpotlight(2)}
            onMouseLeave={() => updateSpotlight(null)}
          >
            <span className={styles.stepNumber}>2</span>
            <div className={styles.stepContent}>
              <h3>Configurar Opciones</h3>
              <p>Revisa las <strong>OPCIONES</strong> para ajustar las reglas de juego.</p>
            </div>
          </div>

          <div 
            className={styles.stepItem}
            onMouseEnter={() => updateSpotlight(3)}
            onMouseLeave={() => updateSpotlight(null)}
          >
            <span className={styles.stepNumber}>3</span>
            <div className={styles.stepContent}>
              <h3>Crear un Show</h3>
              <p>Programa tu primer evento <strong>WEEKLY</strong> o <strong>PLE</strong>.</p>
            </div>
          </div>

          <div 
            className={styles.stepItem}
            onMouseEnter={() => updateSpotlight(4)}
            onMouseLeave={() => updateSpotlight(null)}
          >
            <span className={styles.stepNumber}>4</span>
            <div className={styles.stepContent}>
              <h3>Hablar con el GM</h3>
              <p>Usa el botón <strong>GM</strong> en la esquina para recibir consejos.</p>
            </div>
          </div>
        </div>

        <button className={styles.completeButton} onClick={onComplete}>
          ¡ENTENDIDO!
        </button>
      </div>
    </div>
  );
};

export default TutorialOverlay;
