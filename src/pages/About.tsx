const About = () => {
  return (
    <section style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ 
        fontSize: '2.5rem', 
        fontWeight: '900', 
        marginBottom: '2rem', 
        borderBottom: '4px solid #e00012',
        display: 'inline-block'
      }}>
        SOBRE NOSOTROS
      </h1>
      <div style={{ lineHeight: '1.8', color: '#ccc', fontSize: '1.1rem' }}>
        <p style={{ marginBottom: '1.5rem' }}>
          wwe2kHub es el destino definitivo para los fans de la lucha libre profesional que buscan datos precisos y una experiencia premium.
        </p>
        <div style={{ backgroundColor: '#111', padding: '2rem', borderRadius: '12px', border: '1px solid #333' }}>
          <h2 style={{ color: '#fff', marginBottom: '1rem' }}>Nuestra Misión</h2>
          <p>
            Proporcionar una plataforma modular, rápida y moderna utilizando las últimas tecnologías de desarrollo web para los entusiastas de WWE 2K.
          </p>
        </div>
      </div>
    </section>
  )
}

export default About
