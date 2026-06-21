import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Register from './pages/Register';
import PortalTracker from './pages/PortalTracker';
import Leaderboard from './pages/Leaderboard';
import AdminDashboardInternal from './pages/AdminDashboardInternal';
import { AppContextProvider } from './context/AppContext';

function App() {
  return (
    <AppContextProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-black text-gray-205 relative overflow-hidden">
          
          {/* Global Background Tactical Crosshairs */}
          <div className="absolute top-10 right-[-100px] w-[500px] h-[500px] text-orig-yellow opacity-30 pointer-events-none hidden md:block">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="2 2" />
              <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="0.3" />
              <circle cx="50" cy="50" r="2" fill="currentColor" />
              <line x1="50" y1="0" x2="50" y2="30" stroke="currentColor" strokeWidth="0.3" />
              <line x1="50" y1="70" x2="50" y2="100" stroke="currentColor" strokeWidth="0.3" />
              <line x1="0" y1="50" x2="30" y2="50" stroke="currentColor" strokeWidth="0.3" />
              <line x1="70" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.3" />
            </svg>
          </div>



          <Navbar />
          <main className="flex-grow relative z-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/portal/:id" element={<PortalTracker />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/admin" element={<AdminDashboardInternal />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AppContextProvider>
  );
}

export default App;
