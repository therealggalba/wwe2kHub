import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout/Layout'
import Home from './pages/Home/Home'
import Options from './pages/Options/Options'
import Roster from './pages/Roster/Roster'
import WrestlerDetails from './pages/WrestlerDetails/WrestlerDetails'
import EventCreation from './pages/EventCreation/EventCreation'
import ShowArchive from './pages/ShowArchive/ShowArchive'
import ShowDetails from './pages/ShowArchive/ShowDetails'
import Landing from './pages/Landing/Landing'
import { isDatabaseEmpty } from './db/dbPersistence'

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkEmpty = async () => {
      const empty = await isDatabaseEmpty();
      if (empty && location.pathname !== '/landing') {
        navigate('/landing');
      }
    };
    checkEmpty();
  }, [navigate, location]);

  const isLanding = location.pathname === '/landing';

  const content = (
    <Routes>
      <Route path="/landing" element={<Landing />} />
      <Route path="/" element={<Home />} />
      <Route path="/options" element={<Options />} />
      <Route path="/roster" element={<Roster />} />
      <Route path="/roster/:name" element={<WrestlerDetails />} />
      <Route path="/create-event/:type" element={<EventCreation />} />
      <Route path="/archive" element={<ShowArchive />} />
      <Route path="/archive/show/:id" element={<ShowDetails />} />
    </Routes>
  );

  return isLanding ? content : <Layout>{content}</Layout>;
}

export default App
