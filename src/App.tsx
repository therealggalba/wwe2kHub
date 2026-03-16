import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy } from 'react'
import Layout from "./components/Layout/Layout";
import Home from "./pages/Home/Home";
import Options from "./pages/Options/Options";
import Roster from "./pages/Roster/Roster";
import WrestlerDetails from "./pages/WrestlerDetails/WrestlerDetails";
import EventCreation from "./pages/EventCreation/EventCreation";
import ShowArchive from "./pages/ShowArchive/ShowArchive";
import ShowDetails from "./pages/ShowArchive/ShowDetails";
import Landing from "./pages/Landing/Landing";

const GMChat = lazy(() => import('./components/GMChat/GMChat'));

function App() {
  const location = useLocation();
  const isLanding =
    location.pathname === "/landing" || location.pathname === "/";

  const content = (
    <Routes>
      <Route path="/" element={<Navigate to="/landing" replace />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/home" element={<Home />} />
      <Route path="/options" element={<Options />} />
      <Route path="/roster" element={<Roster />} />
      <Route path="/roster/:name" element={<WrestlerDetails />} />
      <Route path="/create-event/:type" element={<EventCreation />} />
      <Route path="/archive" element={<ShowArchive />} />
      <Route path="/archive/show/:id" element={<ShowDetails />} />
    </Routes>
  );

  return (
    <>
      <Suspense fallback={null}>
        <GMChat />
      </Suspense>
      {isLanding ? content : <Layout>{content}</Layout>}
    </>
  );
}

export default App;
