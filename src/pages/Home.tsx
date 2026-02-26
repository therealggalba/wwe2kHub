import PLECarousel from '../components/PLECarousel/PLECarousel';

const Home = () => {
  return (
    <section>
      <div style={{ 
        background: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url("https://images.unsplash.com/photo-1549413204-7476e81fabb6?q=80&w=2070&auto=format&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        height: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '16px',
        marginBottom: '2rem',
        border: '1px solid #333'
      }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '1rem' }}>SÉ PARTE DE LA ÉLITE</h1>
        <p style={{ fontSize: '1.2rem', color: '#ccc', maxWidth: '600px', textAlign: 'center' }}>
          Toda la información de tus superestrellas favoritas en un solo lugar.
        </p>
      </div>

      <PLECarousel />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', justifyContent: 'center', marginTop: '2rem' }}>
        {[
          { title: 'Show Semanal', type: 'semanal', description: 'Crea y gestiona tu programación semanal (RAW, SmackDown, NXT).' },
          { title: 'Show Especial', type: 'especial', description: 'Planifica eventos premium en vivo (WrestleMania, Royal Rumble, etc.).' }
        ].map((event) => (
          <div 
            key={event.type} 
            onClick={() => window.location.href = `/create-event/${event.type}`}
            style={{ 
              backgroundColor: '#1a1a1a', 
              padding: '2rem', 
              borderRadius: '12px', 
              borderLeft: `4px solid ${event.type === 'semanal' ? '#e00012' : '#ffd700'}`,
              transition: 'transform 0.3s ease, border-color 0.3s ease',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.backgroundColor = '#252525';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.backgroundColor = '#1a1a1a';
            }}
          >
            <h3 style={{ margin: 0, color: event.type === 'semanal' ? '#e00012' : '#ffd700', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {event.title}
            </h3>
            <p style={{ color: '#b3b3b3', fontSize: '1rem', lineHeight: '1.5' }}>
              {event.description}
            </p>
            <div style={{ 
              marginTop: 'auto', 
              paddingTop: '1rem', 
              color: event.type === 'semanal' ? '#e00012' : '#ffd700',
              fontWeight: '900',
              fontSize: '0.9rem',
              letterSpacing: '1px'
            }}>
              GESTIONAR →
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Home

