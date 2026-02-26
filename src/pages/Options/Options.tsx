import DatabaseTools from '../../components/DatabaseTools/DatabaseTools';
import styles from './Options.module.scss';

const Options = () => {
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
          <div className={styles.statusBadge}>
            Próximamente: Activar/Desactivar sistemas de moral, lesiones, economía y variaciones de Roster.
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
            Modifica nombres, colores y logos de tus marcas preferidas (RAW, NXT, SMACKDOWN).
          </p>
          <div className={`${styles.statusBadge} ${styles.marginTop}`}>
            Esta sección se activará tras la implementación del sistema de edición de marcas.
          </div>
        </div>
      </div>
    </section>
  );
};

export default Options;
