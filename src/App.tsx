import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Home from './pages/Home/Home'
import Options from './pages/Options/Options'
import Roster from './pages/Roster/Roster'
import WrestlerDetails from './pages/WrestlerDetails/WrestlerDetails'
import EventCreation from './pages/EventCreation/EventCreation'
import ShowArchive from './pages/ShowArchive/ShowArchive'
import ShowDetails from './pages/ShowArchive/ShowDetails'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/options" element={<Options />} />
        <Route path="/roster" element={<Roster />} />
        <Route path="/roster/:name" element={<WrestlerDetails />} />
        <Route path="/create-event/:type" element={<EventCreation />} />
        <Route path="/archive" element={<ShowArchive />} />
        <Route path="/archive/show/:id" element={<ShowDetails />} />
      </Routes>
    </Layout>
  )
}

export default App
