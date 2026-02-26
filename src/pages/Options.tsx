import DatabaseTools from '../components/DatabaseTools/DatabaseTools';

const Options = () => {
  return (
    <section style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '4rem' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem', 
        paddingBottom: '1rem',
        borderBottom: '4px solid #e00012' 
      }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', margin: 0 }}>
          OPTIONS
        </h1>
        <DatabaseTools />
      </header>

      <div style={{ display: 'grid', gap: '2rem' }}>
        {/* Game Settings */}
        <div style={{ backgroundColor: '#111', padding: '2rem', borderRadius: '12px', border: '1px solid #333' }}>
          <h2 style={{ color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             ⚙️ Gestión del Juego
          </h2>
          <div style={{ opacity: 0.6, fontSize: '0.9rem', fontStyle: 'italic' }}>
            Próximamente: Activar/Desactivar sistemas de moral, lesiones, economía y variaciones de Roster.
          </div>
        </div>

        {/* Database Management */}
        <div style={{ backgroundColor: '#111', padding: '2rem', borderRadius: '12px', border: '1px solid #333' }}>
          <h2 style={{ color: '#fff', marginBottom: '1rem' }}>📦 Datos y Backup</h2>
          <p style={{ color: '#ccc', marginBottom: '1.5rem' }}>
            Gestiona la persistencia de tu partida. Exporta para salvar tu progreso o importa configuraciones externas de la comunidad.
          </p>
          <div style={{ marginTop: '1rem', padding: '1rem', border: '1px dashed #444', borderRadius: '8px' }}>
             <p style={{ color: '#888', fontSize: '0.85rem' }}>
               Acciones críticas: Resetear Base de Datos (Próximamente)
             </p>
          </div>
        </div>

        {/* Brand Tuning */}
        <div style={{ backgroundColor: '#111', padding: '2rem', borderRadius: '12px', border: '1px solid #333' }}>
          <h2 style={{ color: '#fff', marginBottom: '1rem' }}>🎨 Personalización de Marcas</h2>
          <p style={{ color: '#ccc' }}>
            Modifica nombres, colores y logos de tus marcas preferidas (RAW, NXT, SMACKDOWN).
          </p>
          <div style={{ opacity: 0.6, fontSize: '0.9rem', fontStyle: 'italic', marginTop: '1rem' }}>
            Esta sección se activará tras la implementación del sistema de edición de marcas.
          </div>
        </div>
      </div>
    </section>
  );
};

export default Options;
