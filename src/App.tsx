import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'
import About from './pages/About'
import Roster from './pages/Roster/Roster'
import WrestlerDetails from './pages/WrestlerDetails/WrestlerDetails'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/roster" element={<Roster />} />
        <Route path="/roster/:name" element={<WrestlerDetails />} />
      </Routes>
    </Layout>
  )
}

export default App
