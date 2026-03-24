import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '../../db/db';
import ResolvedImage from '../Common/ResolvedImage';
import styles from './GMChat.module.scss';
import { aiEngine } from '../../utils/aiEngine';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const GMChat: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [gmName, setGmName] = useState('Gonzalo Galba');
  const [gmImage, setGmImage] = useState('https://res.cloudinary.com/dgvthwz6h/image/upload/v1774380691/gonzalogalbaavatar.png');
  const [showAvailabilityPopup, setShowAvailabilityPopup] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const renderMessageContent = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return (
      <>
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          }
          return <React.Fragment key={j}>{part}</React.Fragment>;
        })}
      </>
    );
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const updateGMInfo = async () => {
    const brands = await db.brands.toArray();
    const hasAEW = brands.some(b => b.name.includes('AEW') || b.name === 'Dynamite');
    const hasWWE = brands.some(b => ['RAW', 'SMACKDOWN', 'NXT'].includes(b.name));
    
    let currentGmName = 'Gonzalo Galba';
    let currentGmImage = 'https://res.cloudinary.com/dgvthwz6h/image/upload/v1774380691/gonzalogalbaavatar.png';

    if (hasAEW) {
      currentGmName = 'Tony Khan';
      currentGmImage = 'https://res.cloudinary.com/dgvthwz6h/image/upload/v1774380691/tonykhanavatar.png';
    } else if (hasWWE) {
      currentGmName = 'Triple H';
      currentGmImage = 'https://res.cloudinary.com/dgvthwz6h/image/upload/v1774380691/triplehavatar.png';
    }

    const npcs = await db.npcs.toArray();
    const gm = npcs.find(n => n.role === 'General Manager' || n.role === 'GM');
    if (gm) {
      currentGmName = gm.name;
      if (gm.image) {
          const imgName = gm.image.split('/').pop();
          currentGmImage = `https://res.cloudinary.com/dgvthwz6h/image/upload/v1774380691/${imgName}`;
      }
    }

    setGmName(currentGmName);
    setGmImage(currentGmImage);
    return currentGmName;
  };

  useEffect(() => {
    updateGMInfo().then((name) => {
      const engine = aiEngine.getEngine();
      if (engine) {
        setMessages(prev => {
          if (prev.length === 0) {
            return [{ role: 'assistant', content: `¡Hola! Soy tu General Manager, ${name}. Estoy listo para ayudarte a gestionar tu universo. ¿Qué tienes en mente para el próximo show?` }];
          }
          return prev;
        });
      }
    });
  }, [location.pathname]);

  const getUniverseContext = async () => {
    const wrestlers = await db.wrestlers.toArray();
    const championships = await db.championships.toArray();
    const shows = await db.shows.toArray();
    const brands = await db.brands.toArray();

    // Mapping wrestlers by brand
    const activeWrestlers = wrestlers.filter(w => w.isActive !== false);
    const brandWrestlersInfo = brands.map(b => {
      const roster = activeWrestlers.filter(w => w.brandId === b.id).map(w => `${w.name} (${w.alignment}, Ovr: ${w.rating})`);
      return `${b.name} Roster: ${roster.join(', ') || 'Ninguno'}`;
    }).join('\n');

    // Mapeo detallado de títulos
    const titlesInfo = championships.map(c => {
      let champName = 'Vacante';
      if (c.currentChampionId) {
        if (Array.isArray(c.currentChampionId)) {
          const champIds = c.currentChampionId as number[];
          const champs = wrestlers.filter(w => champIds.includes(w.id!));
          champName = champs.map(w => w.name).join(' & ');
        } else {
          const champ = wrestlers.find(w => w.id === c.currentChampionId);
          if (champ) champName = champ.name;
        }
      }
      const champBrand = brands.find(b => b.id === c.brandId);
      return `${c.name} (${champBrand ? 'Marca: ' + champBrand.name : 'Intermarca'}): ${champName}`;
    }).join('\n');

    const lastShowsArr = shows.slice(-5);
    const lastShows = lastShowsArr.map(s => s.name).join(', ');
    
    // Obtener las últimas rivalidades / combates importantes para contexto histórico
    let recentMatches = "No hay suficiente histórico";
    try {
      if (db.tables.find(t => t.name === 'matches')) {
        const matchesTable = db.table('matches');
        const matches = await matchesTable.toArray();
        if(matches.length > 0) {
            recentMatches = matches.slice(-15).map(m => {
                const partsNames = wrestlers.filter(w => m.participantsIds?.includes(w.id)).map(w => w.name).join(' vs ');
                const winnersNames = wrestlers.filter(w => m.winnersIds?.includes(w.id)).map(w => w.name).join(' & ');
                return `Combate: ${partsNames} (Ganador: ${winnersNames || 'N/A'}) - Rating: ${m.rating}*`;
            }).join('\n');
        }
      }
    } catch {
        // Tabla de matches podría no existir o no estar accesible de forma simple
        recentMatches = lastShowsArr.map(s => {
           if(s.card && s.card.segments) {
               return `Show ${s.name}: ` + s.card.segments.filter(seg => seg.type === 'Match' && seg.matchData).map(seg => {
                   const m = seg.matchData!;
                   const partsNames = wrestlers.filter(w => m.participantsIds?.includes(w.id!)).map(w => w.name).join(' vs ');
                   const winnersNames = wrestlers.filter(w => m.winnersIds?.includes(w.id!)).map(w => w.name).join(' & ');
                   return `Combate: ${partsNames} (Ganador: ${winnersNames || 'N/A'})`;
               }).join(' | ');
           }
           return '';
        }).filter(Boolean).join('\n');
    }

    return `Marcas: ${brands.map(b => b.name).join(', ')}
${brandWrestlersInfo}

Títulos y Campeones Actuales: 
${titlesInfo}

Últimos Shows: ${lastShows}

Historial Reciente de Combates/Rivalidades (NO REPETIR HISTORIAS):
${recentMatches}`;
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const engine = aiEngine.getEngine();
    if (!engine) {
      await aiEngine.init();
    }

    const currentEngine = aiEngine.getEngine();
    if (!currentEngine) return;

    const userMsg: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const context = await getUniverseContext();
      const systemPrompt = `Eres ${gmName}, el General Manager riguroso y profesional de WWE2kHub. Contexto actual: \n${context}
      
INSTRUCCIONES ESTRICTAS QUE DEBES CUMPLIR:
1. Formato: Escribe con un formato claro de lectura. Usa párrafos cortos y listas separadas. Nunca escribas un bloque de texto seguido sin separación.
2. Formato de nombres: Cada vez que menciones el nombre de un luchador, debes ponerlo SIEMPRE en **negrita** para identificarlo rápidamente.
3. Originalidad y Repetición: Tus ideas de booking deben ser creativas. NO repitas ideas, respeta el histórico para proponer cosas nuevas y bajo ninguna circunstancia repitas la misma idea dentro del mismo texto.
4. Límite de temática: Estás programado EXCLUSIVAMENTE para hablar de wrestling, booking, gestión de WWE2kHub, shows y negocios del juego. NO conoces ni puedes responder sobre temas personales, políticos, de salud, cuentos o cualquier cosa fuera de WWE2kHub. Si te preguntan sobre esto, hazte el despistado y responde de forma seria que a ti te pagan por gestionar a los talentos y ganar dinero, no para debatir esos temas, recomendando que vayan a otros chats para eso.
5. Tono: Mantén SIEMPRE un tono estrictamente profesional y serio. No hay espacio para las bromas. Estamos aquí para ganar dinero, dar resultados y contar buenas historias en el ring.
6. Campeones Reales: Tienes acceso a quiénes son los campeones EXACTOS actualmente en el prompt anterior. Planifica alrededor de ellos y no te inventes que alguien es campeón si no lo es.
7. División de Marcas: Respeta las marcas. Un luchador de una marca NO DEBE luchar ni interactuar en combates contra alguien de otra marca distinta (a menos que se especifique claramente que es un evento especial intermarca). Planifica siempre combates sólo dentro del mismo Roster.`;

      const fullMessages = [
        { role: 'system', content: systemPrompt },
        ...newMessages
      ];

      const chunks = await currentEngine.chat.completions.create({
        messages: fullMessages as Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
        stream: true,
      });

      let assistantContent = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      for await (const chunk of chunks) {
        const content = chunk.choices[0]?.delta?.content || '';
        assistantContent += content;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1].content = assistantContent;
          return updated;
        });
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, he tenido un problema procesando esa petición.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleChat = async () => {
    if (!isOpen) {
      updateGMInfo();
      const engine = aiEngine.getEngine();
      if (!engine) {
        setShowAvailabilityPopup(true);
        setTimeout(() => setShowAvailabilityPopup(false), 3500);
        return;
      }
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className={styles.chatWrapper}>
      <button className={styles.fab} onClick={toggleChat} title="Hablar con el GM">
        <span className={styles.fabText}>GM</span>
      </button>

      {showAvailabilityPopup && (
        <div className={styles.availabilityPopup}>
            <p>El GM está aún por llegar a su despacho. Por favor, espera a que termine de prepararse.</p>
        </div>
      )}

      <div className={`${styles.chatDrawer} ${isOpen ? styles.open : ''}`}>
        <header className={styles.chatHeader}>
          <ResolvedImage src={gmImage} alt="GM" className={styles.gmAvatar} />
          <div className={styles.titleInfo}>
            <h3>{gmName}</h3>
            <span>General Manager</span>
          </div>
        </header>

        <div className={styles.messages}>
          {messages.map((m, i) => (
            <div key={i} className={`${styles.message} ${styles[m.role]}`}>
              {renderMessageContent(m.content)}
            </div>
          ))}
          {isTyping && <div className={`${styles.message} ${styles.ai}`}>Escribiendo...</div>}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputArea}>
          <input 
            type="text" 
            placeholder="Escribe al GM..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isTyping}
          />
          <button onClick={handleSend} disabled={isTyping || !input.trim()}>
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
};

export default GMChat;
