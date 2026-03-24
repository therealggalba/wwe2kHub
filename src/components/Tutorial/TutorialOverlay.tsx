import React from 'react';
import styles from './TutorialOverlay.module.scss';

interface TutorialOverlayProps {
  onComplete: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete }) => {
  return (
    <div className={styles.overlay}>
      {/* Indicadores Visuales Simultáneos */}
      <div className={`${styles.arrow} ${styles.arrowRoster}`} />
      <div className={`${styles.arrow} ${styles.arrowOptions}`} />
      <div className={`${styles.arrow} ${styles.arrowDashboard}`} />
      <div className={`${styles.arrow} ${styles.arrowGM}`} />

      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>PRÓXIMOS PASOS</h2>
          <p>¡Tu universo está listo! Sigue estas indicaciones para comenzar:</p>
        </div>

        <div className={styles.stepsList}>
          <div className={styles.stepItem}>
            <span className={styles.stepNumber}>1</span>
            <div className={styles.stepContent}>
              <h3>Definir Campeones</h3>
              <p>Ve a <strong>ROSTER</strong> y asigna los títulos vacantes.</p>
            </div>
          </div>

          <div className={styles.stepItem}>
            <span className={styles.stepNumber}>2</span>
            <div className={styles.stepContent}>
              <h3>Configurar Opciones</h3>
              <p>Revisa las <strong>OPCIONES</strong> para ajustar las reglas de juego.</p>
            </div>
          </div>

          <div className={styles.stepItem}>
            <span className={styles.stepNumber}>3</span>
            <div className={styles.stepContent}>
              <h3>Crear un Show</h3>
              <p>Programa tu primer evento en la sección de <strong>DASHBOARD</strong>.</p>
            </div>
          </div>

          <div className={styles.stepItem}>
            <span className={styles.stepNumber}>4</span>
            <div className={styles.stepContent}>
              <h3>Hablar con el GM</h3>
              <p>Usa el botón <strong>GM</strong> en la esquina para recibir consejos de la IA.</p>
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
