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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ 
            backgroundColor: '#1a1a1a', 
            padding: '2rem', 
            borderRadius: '12px', 
            borderLeft: '4px solid #e00012',
            transition: 'transform 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-10px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <h3 style={{ marginBottom: '1rem', color: '#e00012' }}>Card Title {i}</h3>
            <p style={{ color: '#b3b3b3' }}>
              Descripción dummy para mostrar el estilo premium y el layout responsivo de la aplicación wwe2kHub.
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Home
