import React, { useState } from 'react';
import styles from './TutorialOverlay.module.scss';

interface TutorialStep {
  title: string;
  description: string;
  target?: string; // CSS selector of the element to point to
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const steps: TutorialStep[] = [
  {
    title: '¡BIENVENIDO A TU UNIVERSO!',
    description: 'Acabas de cargar un preset. Vamos a ver los primeros pasos para que tu carrera como promotor sea un éxito.',
  },
  {
    title: '1. GESTIONA TU ROSTER',
    description: 'Todos los campeonatos están vacantes. Ve a la sección de **Roster** para coronar a tus primeros campeones y revisar el estado de tus luchadores.',
    target: 'a[href$="/roster"]',
    position: 'bottom'
  },
  {
    title: '2. CONFIGURA TU EXPERIENCIA',
    description: 'En **Options** puedes activar o desactivar el sistema de lesiones, moral y vincular tus propias imágenes locales.',
    target: 'a[href$="/options"]',
    position: 'bottom'
  },
  {
    title: '3. CREA TU PRIMER SHOW',
    description: 'Usa estas tarjetas para crear tu primer show semanal o un gran evento PLE. ¡Es hora de empezar a bookear!',
    target: `.${styles.dummyHomeCards}`, // We will provide a dummy target if needed, or point to the grid
    position: 'top'
  },
  {
    title: '4. TU ASISTENTE PERSONAL',
    description: 'Si tienes dudas, el **GM** siempre está disponible aquí abajo para asesorarte sobre booking y rivalidades.',
    target: 'button[title="Hablar con el GM"]',
    position: 'left'
  }
];

interface TutorialOverlayProps {
  onComplete: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const step = steps[currentStep];

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <h2>{step.title}</h2>
        <p dangerouslySetInnerHTML={{ __html: step.description.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
        
        <div className={styles.controls}>
          <span>Paso {currentStep + 1} de {steps.length}</span>
          <button onClick={handleNext}>
            {currentStep === steps.length - 1 ? '¡ENTENDIDO!' : 'SIGUIENTE'}
          </button>
        </div>
      </div>

      {step.target && (
         <div className={styles.arrowContainer}>
             {/* Note: In a real app we'd use a portal or calculate positions, 
                 but for this aesthetic we'll use fixed positions or general indicators 
                 if specific selectors are hard to reach in this simplified implementation */}
             <div className={`${styles.arrow} ${styles[step.target.replace(/[^a-z]/gi, '')] || styles.generic}`}>
                <div className={styles.arrowPoint}></div>
             </div>
         </div>
      )}
    </div>
  );
};

export default TutorialOverlay;
