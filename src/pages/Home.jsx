import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Trophy, Search, Calendar, Swords, Shield, AlertTriangle, Crosshair, Map, DollarSign, ListOrdered } from 'lucide-react';
import RegisterModal from '../components/RegisterModal';

export default function Home() {
  const { events, activeEvent, loadingActiveEvent, searchPortal, user } = useContext(AppContext);
  const navigate = useNavigate();

  const [searchUid, setSearchUid] = useState('');
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const handleRegisterClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/signin?redirect=dashboard');
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchUid.trim()) return;

    setSearching(true);
    setSearchError('');

    try {
      const res = await searchPortal(searchUid.trim());
      if (res.ok) {
        // Redirect directly to the portal page using the registration ID or the search UID itself
        navigate(`/portal/${res.data._id}`);
      } else {
        setSearchError(res.data.error || 'No active registration found for this Character ID.');
      }
    } catch (err) {
      setSearchError('Failed to search. System offline.');
    } finally {
      setSearching(false);
    }
  };

  // Helper to format Date into human-readable local layout
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loadingActiveEvent) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
        <Crosshair className="w-12 h-12 text-eb-yellow animate-spin mb-4" />
        <h3 className="text-sm font-black uppercase text-white tracking-widest">Synchronizing Ops Data...</h3>
      </div>
    );
  }

  const hasTournaments = events && events.length > 0;

  return (
    <div className="min-h-screen bg-black text-gray-250 relative overflow-hidden">

      {/* Global Background Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#EBB014_1px,transparent_1px),linear-gradient(to_bottom,#EBB014_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none"></div>

      {/* 1. Tactical Hero Banner - Brand Header */}
      <section className="relative py-16 px-4 md:px-8 overflow-hidden bg-transparent flex items-center justify-center">

        {/* Rotating Background Reticle */}
        <div className="absolute w-[300px] h-[300px] md:w-[400px] md:h-[400px] text-eb-yellow opacity-20 pointer-events-none animate-spin" style={{ animationDuration: '40s' }}>
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.1" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.15" strokeDasharray="1 3" />
            <path d="M 50 2 L 50 12 M 50 88 L 50 98 M 2 50 L 12 50 M 88 50 L 98 50" stroke="currentColor" strokeWidth="0.2" fill="none" />
          </svg>
        </div>

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10 animate-slideUp w-full">
          <div className="border border-white/5 p-8 md:p-12 bg-[#12120e]/60 backdrop-blur-sm relative animate-hudCrop">

            {/* HUD Bracket Corners */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-eb-yellow"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-eb-yellow"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-eb-yellow"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-eb-yellow"></div>

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-eb-yellow/10 border border-eb-yellow/30 text-eb-yellow text-xs font-black uppercase tracking-widest">
                <Crosshair className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                Dominating the local scene
              </div>

              {/* Brand Header: Esports styled in heavy italicized gold styling */}
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-none italic select-none text-eb-yellow">
                ESPORTS
              </h1>

              <p className="text-gray-400 text-xs md:text-sm max-w-xl mx-auto leading-relaxed font-medium">
                The account-free PUBG Battlegrounds hosting portal. Enter your Character ID to retrieve custom room credentials, submit payment screenshots, or upload match standings screenshots.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Active Event Hub & Standings Grid */}
      <section className="py-12 px-4 md:px-8 max-w-7xl mx-auto space-y-12">

        {/* LIVE TOURNAMENT SECTION (If exists) */}
        {events.find(evt => evt.status === 'live') && (() => {
          const liveEvent = events.find(evt => evt.status === 'live');
          return (
            <div className="pubg-hud-panel p-6 space-y-5 animate-slideInLeft border-2 border-red-500 shadow-glow-yellow-sm">
              <div className="flex items-center justify-between border-b border-gray-900 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-red-500 font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block animate-ping mr-1"></span>
                    LIVE GAMEPLAY UNDERWAY
                  </span>
                  <h2 className="text-2xl md:text-3xl font-extrabold uppercase text-white tracking-wide">
                    {liveEvent.title}
                  </h2>
                </div>
                <span className="px-2.5 py-1 text-[9px] font-black uppercase bg-red-600 text-white select-none tracking-wider border border-red-500 animate-pulse">
                  MATCH LIVE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3 text-xs">
                  <p className="text-gray-400 font-medium">
                    This tournament is currently live and matches are being contested in the battlegrounds. Registration is closed.
                  </p>
                  <div className="p-3 border-l-4 border-eb-yellow bg-eb-yellow/5 space-y-1">
                    <span className="text-[9px] text-gray-400 uppercase font-black tracking-wider block">Match Timing</span>
                    <p className="text-white font-bold font-mono">{formatDateTime(liveEvent.matchStartTime)}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 justify-center">
                  <button
                    onClick={() => navigate('/leaderboard')}
                    className="pubg-btn-primary text-center font-black uppercase tracking-wider"
                  >
                    View Live Scoreboard Standings
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ACTIVE TOURNAMENT REGISTRATION HUB */}
        {events.find(evt => evt.status === 'active') ? (() => {
          const activeEvt = events.find(evt => evt.status === 'active');
          return (
            <div className="w-full space-y-6">

              {/* Event Hub Card */}
              <div className="pubg-hud-panel p-6 space-y-5 animate-slideInLeft">
                <div className="flex items-center justify-between border-b border-gray-900 pb-3">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-eb-yellow font-black uppercase tracking-widest flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" />
                      Active Tournament
                    </span>
                    <h2 className="text-2xl md:text-3xl font-extrabold uppercase text-white tracking-wide">
                      {activeEvt.title}
                    </h2>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2.5 py-1 text-[9px] font-black uppercase bg-eb-yellow text-black select-none tracking-wider">
                      REGISTRATION OPEN
                    </span>
                    <span className="px-2 py-0.5 text-[8px] font-black uppercase bg-black border border-gray-800 text-gold select-none tracking-wider font-mono">
                      Format: {activeEvt.type || 'Squad'}
                    </span>
                  </div>
                </div>

                {/* Entry details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-black/60 p-4 border border-gray-950 rounded">
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-gray-500 uppercase font-black tracking-wider">Solo Registration Fee</span>
                    <p className="text-md font-black text-white flex items-center gap-0.5">
                      <DollarSign className="w-3.5 h-3.5 text-eb-yellow" />
                      PKR {activeEvt.soloEntryFee?.toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-gray-500 uppercase font-black tracking-wider">Team Registration Fee</span>
                    <p className="text-md font-black text-white flex items-center gap-0.5">
                      <DollarSign className="w-3.5 h-3.5 text-eb-yellow" />
                      PKR {activeEvt.teamEntryFee?.toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <span className="text-[8px] text-gray-500 uppercase font-black tracking-wider">Duration</span>
                    <p className="text-md font-black text-gray-300">{activeEvt.numberOfDays || 1} {activeEvt.numberOfDays === 1 ? 'Day' : 'Days'}</p>
                  </div>
                </div>

                {/* Timing Coordinates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="p-3 border-l-4 border-tan bg-tan/5 space-y-1">
                    <span className="text-[9px] text-gray-400 uppercase font-black tracking-wider block">Registration Deadline</span>
                    <p className="text-white font-bold">{formatDateTime(activeEvt.registrationDeadline)}</p>
                  </div>
                  <div className="p-3 border-l-4 border-eb-yellow bg-eb-yellow/5 space-y-1">
                    <span className="text-[9px] text-gray-400 uppercase font-black tracking-wider block">Match Timing</span>
                    <p className="text-white font-bold">{formatDateTime(activeEvt.matchStartTime)}</p>
                  </div>
                </div>

                {/* Dynamic Tournament Description */}
                {activeEvt.description && (
                  <div className="space-y-2 text-xs">
                    <span className="text-gray-400 uppercase text-[9px] font-black tracking-wider block">Tournament Description:</span>
                    <p className="text-gray-405 text-gray-300 leading-relaxed font-medium whitespace-pre-line bg-[#12120e]/50 p-3 border border-white/5">
                      {activeEvt.description}
                    </p>
                  </div>
                )}

                {/* Register Action */}
                <div className="pt-2">
                  <button
                    onClick={handleRegisterClick}
                    className="pubg-btn-primary w-full text-center font-black"
                  >
                    {user ? 'Register via Dashboard' : 'Sign In to Register'}
                  </button>
                </div>
              </div>

            </div>
          );
        })() : (
          !events.find(evt => evt.status === 'live') && (
            <div className="pubg-hud-panel p-16 text-center space-y-6 max-w-xl mx-auto animate-zoomIn">
              <Shield className="w-16 h-16 text-eb-yellow mx-auto" />
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white uppercase tracking-wider">No active tournaments</h3>
              </div>
            </div>
          )
        )}

        {/* Upcoming Events Grid */}
        {events.filter(evt => evt.status === 'upcoming').length > 0 && (
          <div className="mt-16 space-y-6">
            <h3 className="text-xl font-black text-white uppercase tracking-widest border-b border-gray-900 pb-3 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-eb-yellow" />
              Upcoming Events
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.filter(evt => evt.status === 'upcoming').map((evt) => (
                <div key={evt._id} className="pubg-hud-panel cyber-card p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-900 pb-2">
                    <span className="text-[10px] text-eb-yellow font-black uppercase tracking-widest">
                      Upcoming: {evt.type || 'Squad'} format
                    </span>
                    <span className="px-2 py-0.5 bg-eb-yellow/10 text-eb-yellow border border-eb-yellow/20 text-[8px] font-mono uppercase font-black">
                      {evt.map || 'Erangel'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-extrabold uppercase text-white truncate">{evt.title}</h4>
                    <p className="text-xs text-gray-400 mt-1 font-semibold flex items-center gap-1">
                      Solo: PKR {evt.soloEntryFee?.toLocaleString()} | Team: PKR {evt.teamEntryFee?.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-500 font-semibold font-mono">
                      Duration: {evt.numberOfDays || 1} {evt.numberOfDays === 1 ? 'Day' : 'Days'}
                    </p>
                  </div>
                  <div className="space-y-2 pt-2 text-[10px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Reg. Deadline:</span>
                      <span className="text-gray-300">{formatDateTime(evt.registrationDeadline)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Start Time:</span>
                      <span className="text-eb-yellow font-bold">{formatDateTime(evt.matchStartTime)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
    </div>
  );
}
