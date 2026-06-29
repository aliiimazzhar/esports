import React, { useContext, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { 
  Trophy, Search, Calendar, Swords, Shield, AlertTriangle, Crosshair, 
  Map, DollarSign, ListOrdered, ChevronLeft, ChevronRight, Clock, Users, X
} from 'lucide-react';
import RegisterModal from '../components/RegisterModal';

export default function Home() {
  const { events, activeEvent, loadingActiveEvent, searchPortal, user, fetchTournamentReport } = useContext(AppContext);
  const navigate = useNavigate();

  const [searchUid, setSearchUid] = useState('');
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);

  // Tournament Report Modal States
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Clickable Card Details Modal State
  const [detailsModalEvent, setDetailsModalEvent] = useState(null);

  // Carousel refs for manual scrolling
  const soloScrollRef = useRef(null);
  const squadScrollRef = useRef(null);
  const completedScrollRef = useRef(null);

  const scrollLeft = (ref) => {
    if (ref.current) {
      ref.current.scrollBy({ left: -340, behavior: 'smooth' });
    }
  };

  const scrollRight = (ref) => {
    if (ref.current) {
      ref.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

  const handleRegisterClick = (eventId) => {
    if (user) {
      setSelectedEventId(eventId || null);
      setIsRegisterOpen(true);
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

  const handleOpenReport = async (eventId) => {
    setReportModalOpen(true);
    setLoadingReport(true);
    setReportData(null);
    try {
      const res = await fetchTournamentReport(eventId);
      if (res.ok) {
        setReportData(res.data);
      } else {
        setReportData(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReport(false);
    }
  };

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

  const getStatusTag = (status) => {
    if (status === 'active') return 'ACTIVE';
    if (status === 'upcoming') return 'UPCOMING';
    if (status === 'live') return 'LIVE';
    if (status === 'ended') return 'ENDED';
    return status?.toUpperCase() || '';
  };

  if (loadingActiveEvent) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
        <Crosshair className="w-12 h-12 text-eb-yellow animate-spin mb-4" />
        <h3 className="text-sm font-black uppercase text-white tracking-widest">Synchronizing Ops Data...</h3>
      </div>
    );
  }

  // Filter Tournaments
  const soloTournaments = events.filter(
    (evt) => evt.type === 'Solo' && (evt.status === 'active' || evt.status === 'upcoming' || evt.status === 'live')
  );
  
  const squadTournaments = events.filter(
    (evt) => evt.type === 'Squad' && (evt.status === 'active' || evt.status === 'upcoming' || evt.status === 'live')
  );

  const completedTournaments = events.filter((evt) => evt.status === 'ended');

  return (
    <div className="min-h-screen bg-black text-gray-250 relative overflow-hidden">
      {/* Global Background Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#EBB014_1px,transparent_1px),linear-gradient(to_bottom,#EBB014_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none"></div>

      {/* 1. Tactical Hero Banner */}
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

              <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-none italic select-none text-eb-yellow">
                ESPORTS
              </h1>

              <p className="text-gray-400 text-xs md:text-sm max-w-xl mx-auto leading-relaxed font-medium">
                The account-free PUBG Battlegrounds hosting portal. Retrieve custom room credentials, submit payment screenshots, or view detailed ended tournament reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main content area with Carousels */}
      <section className="py-12 px-4 md:px-8 max-w-7xl mx-auto space-y-16">
        
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

        {/* SOLO TOURNAMENTS CAROUSEL */}
        <div className="space-y-4 relative">
          <div className="flex justify-between items-center border-b border-gray-900 pb-3">
            <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Swords className="w-6 h-6 text-eb-yellow" />
              Solo Tournaments (Active/Upcoming)
            </h3>
            {soloTournaments.length > 0 && (
              <div className="flex gap-2">
                <button 
                  onClick={() => scrollLeft(soloScrollRef)}
                  className="p-1.5 border border-gray-800 bg-black/60 hover:border-eb-yellow text-white rounded transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => scrollRight(soloScrollRef)}
                  className="p-1.5 border border-gray-800 bg-black/60 hover:border-eb-yellow text-white rounded transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {soloTournaments.length === 0 ? (
            <div className="text-center py-10 bg-[#12120e]/40 border border-white/5 rounded text-gray-500 font-semibold text-xs">
              No active or upcoming Solo tournaments.
            </div>
          ) : (
            <div 
              ref={soloScrollRef}
              className="flex gap-6 overflow-x-auto scrollbar-none py-2 scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {soloTournaments.map((evt) => {
                const isActive = evt.status === 'active';
                return (
                  <div 
                    key={evt._id} 
                    onClick={() => setDetailsModalEvent(evt)}
                    className={`min-w-[320px] max-w-[320px] shrink-0 p-5 hover:scale-[1.02] transition-transform duration-300 cursor-pointer rounded-none relative border-2 before:content-none ${
                      isActive 
                        ? 'bg-eb-yellow text-black border-eb-yellow shadow-glow-yellow-sm' 
                        : 'pubg-hud-panel border-gray-800 bg-[#12120e]/40 text-gray-200'
                    }`}
                  >
                    {/* HUD Bracket Corners positioned relative to outer border-2 boundary */}
                    <div className={`absolute w-3 h-3 border-t-2 border-l-2 ${isActive ? 'border-black' : 'border-eb-yellow'}`} style={{ top: '-2px', left: '-2px' }}></div>
                    <div className={`absolute w-3 h-3 border-t-2 border-r-2 ${isActive ? 'border-black' : 'border-eb-yellow'}`} style={{ top: '-2px', right: '-2px' }}></div>
                    <div className={`absolute w-3 h-3 border-b-2 border-l-2 ${isActive ? 'border-black' : 'border-eb-yellow'}`} style={{ bottom: '-2px', left: '-2px' }}></div>
                    <div className={`absolute w-3 h-3 border-b-2 border-r-2 ${isActive ? 'border-black' : 'border-eb-yellow'}`} style={{ bottom: '-2px', right: '-2px' }}></div>

                    {/* Content wrapper with space-y-4 to protect brackets from sibling margin-top rules */}
                    <div className="space-y-4">
                      <div className={`flex items-center justify-between border-b pb-2 ${
                        isActive ? 'border-black/20' : 'border-gray-900'
                      }`}>
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase ${
                          isActive ? 'bg-black text-eb-yellow' : 'bg-eb-yellow text-black'
                        }`}>
                          {getStatusTag(evt.status)}
                        </span>
                        <span className={`px-2 py-0.5 text-[8px] font-mono uppercase font-black ${
                          isActive ? 'bg-black/10 text-black border border-black/20' : 'bg-eb-yellow/10 text-eb-yellow border border-eb-yellow/20'
                        }`}>
                          {evt.map || 'Erangel'}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-lg font-extrabold uppercase truncate">{evt.title}</h4>
                        <p className={`text-xs mt-1 font-semibold flex items-center gap-1 font-mono ${
                          isActive ? 'text-neutral-900 font-bold' : 'text-gray-400'
                        }`}>
                          Solo Entry Fee: PKR {evt.soloEntryFee?.toLocaleString()}
                        </p>
                        <p className={`text-[10px] font-semibold font-mono ${
                          isActive ? 'text-neutral-800' : 'text-gray-500'
                        }`}>
                          Duration: {evt.numberOfDays || 1} {evt.numberOfDays === 1 ? 'Day' : 'Days'}
                        </p>
                      </div>

                      <div className={`space-y-2 pt-2 text-[10px] font-mono border-t ${
                        isActive ? 'border-black/20 text-neutral-800' : 'border-gray-900/60 text-gray-400'
                      }`}>
                        <div className="flex justify-between">
                          <span>Reg. Deadline:</span>
                          <span className="font-bold">{formatDateTime(evt.registrationDeadline)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Start Time:</span>
                          <span className={`font-black ${isActive ? 'text-black' : 'text-eb-yellow'}`}>
                            {formatDateTime(evt.matchStartTime)}
                          </span>
                        </div>
                      </div>

                      <div className={`text-center py-2 text-[10px] font-black uppercase tracking-widest border transition-all ${
                        isActive 
                          ? 'bg-black text-eb-yellow border-black hover:bg-neutral-900' 
                          : 'bg-eb-yellow/10 border-eb-yellow/30 text-eb-yellow hover:bg-eb-yellow hover:text-black'
                      }`}>
                        View Details & Register
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SQUAD TOURNAMENTS CAROUSEL */}
        <div className="space-y-4 relative">
          <div className="flex justify-between items-center border-b border-gray-900 pb-3">
            <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Users className="w-6 h-6 text-eb-yellow" />
              Squad Tournaments (Active/Upcoming)
            </h3>
            {squadTournaments.length > 0 && (
              <div className="flex gap-2">
                <button 
                  onClick={() => scrollLeft(squadScrollRef)}
                  className="p-1.5 border border-gray-800 bg-black/60 hover:border-eb-yellow text-white rounded transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => scrollRight(squadScrollRef)}
                  className="p-1.5 border border-gray-800 bg-black/60 hover:border-eb-yellow text-white rounded transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {squadTournaments.length === 0 ? (
            <div className="text-center py-10 bg-[#12120e]/40 border border-white/5 rounded text-gray-500 font-semibold text-xs">
              No active or upcoming Squad tournaments.
            </div>
          ) : (
            <div 
              ref={squadScrollRef}
              className="flex gap-6 overflow-x-auto scrollbar-none py-2 scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {squadTournaments.map((evt) => {
                const isActive = evt.status === 'active';
                return (
                  <div 
                    key={evt._id} 
                    onClick={() => setDetailsModalEvent(evt)}
                    className={`min-w-[320px] max-w-[320px] shrink-0 p-5 hover:scale-[1.02] transition-transform duration-300 cursor-pointer rounded-none relative border-2 before:content-none ${
                      isActive 
                        ? 'bg-eb-yellow text-black border-eb-yellow shadow-glow-yellow-sm' 
                        : 'pubg-hud-panel border-gray-800 bg-[#12120e]/40 text-gray-200'
                    }`}
                  >
                    {/* HUD Bracket Corners positioned relative to outer border-2 boundary */}
                    <div className={`absolute w-3 h-3 border-t-2 border-l-2 ${isActive ? 'border-black' : 'border-eb-yellow'}`} style={{ top: '-2px', left: '-2px' }}></div>
                    <div className={`absolute w-3 h-3 border-t-2 border-r-2 ${isActive ? 'border-black' : 'border-eb-yellow'}`} style={{ top: '-2px', right: '-2px' }}></div>
                    <div className={`absolute w-3 h-3 border-b-2 border-l-2 ${isActive ? 'border-black' : 'border-eb-yellow'}`} style={{ bottom: '-2px', left: '-2px' }}></div>
                    <div className={`absolute w-3 h-3 border-b-2 border-r-2 ${isActive ? 'border-black' : 'border-eb-yellow'}`} style={{ bottom: '-2px', right: '-2px' }}></div>

                    {/* Content wrapper with space-y-4 to protect brackets from sibling margin-top rules */}
                    <div className="space-y-4">
                      <div className={`flex items-center justify-between border-b pb-2 ${
                        isActive ? 'border-black/20' : 'border-gray-900'
                      }`}>
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase ${
                          isActive ? 'bg-black text-eb-yellow' : 'bg-eb-yellow text-black'
                        }`}>
                          {getStatusTag(evt.status)}
                        </span>
                        <span className={`px-2 py-0.5 text-[8px] font-mono uppercase font-black ${
                          isActive ? 'bg-black/10 text-black border border-black/20' : 'bg-eb-yellow/10 text-eb-yellow border border-eb-yellow/20'
                        }`}>
                          {evt.map || 'Erangel'}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-lg font-extrabold uppercase truncate">{evt.title}</h4>
                        <p className={`text-xs mt-1 font-semibold flex items-center gap-1 font-mono ${
                          isActive ? 'text-neutral-900 font-bold' : 'text-gray-400'
                        }`}>
                          Team Entry Fee: PKR {evt.teamEntryFee?.toLocaleString()}
                        </p>
                        <p className={`text-[10px] font-semibold font-mono ${
                          isActive ? 'text-neutral-800' : 'text-gray-500'
                        }`}>
                          Duration: {evt.numberOfDays || 1} {evt.numberOfDays === 1 ? 'Day' : 'Days'}
                        </p>
                      </div>

                      <div className={`space-y-2 pt-2 text-[10px] font-mono border-t ${
                        isActive ? 'border-black/20 text-neutral-800' : 'border-gray-900/60 text-gray-400'
                      }`}>
                        <div className="flex justify-between">
                          <span>Reg. Deadline:</span>
                          <span className="font-bold">{formatDateTime(evt.registrationDeadline)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Start Time:</span>
                          <span className={`font-black ${isActive ? 'text-black' : 'text-eb-yellow'}`}>
                            {formatDateTime(evt.matchStartTime)}
                          </span>
                        </div>
                      </div>

                      <div className={`text-center py-2 text-[10px] font-black uppercase tracking-widest border transition-all ${
                        isActive 
                          ? 'bg-black text-eb-yellow border-black hover:bg-neutral-900' 
                          : 'bg-eb-yellow/10 border-eb-yellow/30 text-eb-yellow hover:bg-eb-yellow hover:text-black'
                      }`}>
                        View Details & Register
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* COMPLETED TOURNAMENTS CAROUSEL */}
        <div className="space-y-4 relative">
          <div className="flex justify-between items-center border-b border-gray-900 pb-3">
            <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Trophy className="w-6 h-6 text-eb-yellow" />
              Completed Tournaments (Status: Ended)
            </h3>
            {completedTournaments.length > 0 && (
              <div className="flex gap-2">
                <button 
                  onClick={() => scrollLeft(completedScrollRef)}
                  className="p-1.5 border border-gray-800 bg-black/60 hover:border-eb-yellow text-white rounded transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => scrollRight(completedScrollRef)}
                  className="p-1.5 border border-gray-800 bg-black/60 hover:border-eb-yellow text-white rounded transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {completedTournaments.length === 0 ? (
            <div className="text-center py-10 bg-[#12120e]/40 border border-white/5 rounded text-gray-500 font-semibold text-xs">
              No completed tournaments available.
            </div>
          ) : (
            <div 
              ref={completedScrollRef}
              className="flex gap-6 overflow-x-auto scrollbar-none py-2 scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {completedTournaments.map((evt) => (
                <div 
                  key={evt._id} 
                  onClick={() => handleOpenReport(evt._id)}
                  className="pubg-hud-panel p-5 space-y-4 min-w-[320px] max-w-[320px] shrink-0 border-2 border-gray-800 bg-[#12120e]/40 hover:scale-[1.02] transition-transform duration-300 cursor-pointer text-gray-250 before:content-none"
                >
                  {/* HUD Bracket Corners positioned relative to outer border-2 boundary */}
                  <div className="absolute w-3 h-3 border-t-2 border-l-2 border-eb-yellow" style={{ top: '-2px', left: '-2px' }}></div>
                  <div className="absolute w-3 h-3 border-t-2 border-r-2 border-eb-yellow" style={{ top: '-2px', right: '-2px' }}></div>
                  <div className="absolute w-3 h-3 border-b-2 border-l-2 border-eb-yellow" style={{ bottom: '-2px', left: '-2px' }}></div>
                  <div className="absolute w-3 h-3 border-b-2 border-r-2 border-eb-yellow" style={{ bottom: '-2px', right: '-2px' }}></div>

                  {/* Content wrapper with space-y-4 to protect brackets from sibling margin-top rules */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-900 pb-2">
                      <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-[9px] font-black uppercase font-mono">
                        ENDED
                      </span>
                      <span className="px-2 py-0.5 bg-gray-800/40 text-gray-400 border border-gray-800 text-[8px] font-mono uppercase font-bold">
                        {evt.map || 'Erangel'}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-lg font-extrabold uppercase text-gray-300 truncate">{evt.title}</h4>
                      <p className="text-xs text-gray-500 mt-1 font-semibold flex items-center gap-1 font-mono">
                        Format: {evt.type || 'Squad'} | {evt.numberOfDays || 1} {evt.numberOfDays === 1 ? 'Day' : 'Days'}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 text-[10px] font-mono border-t border-gray-900/60 text-gray-500">
                      <div className="flex justify-between">
                        <span>Played on:</span>
                        <span className="text-gray-400">{new Date(evt.matchStartTime).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="text-center py-2 text-[10px] font-black uppercase tracking-widest border bg-eb-yellow/10 border-eb-yellow/30 text-eb-yellow hover:bg-eb-yellow hover:text-black transition-all">
                      View Report & Standings
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. Tournament Report modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 bg-black/85 flex justify-center items-start overflow-y-auto z-[100] p-4 backdrop-blur-sm">
          <div className="pubg-hud-panel p-6 max-w-2xl w-full bg-[#090907] relative border-2 border-eb-yellow before:content-none">
            {/* HUD Corner Brackets positioned relative to outer border-2 boundary */}
            <div className="absolute w-4 h-4 border-t-2 border-l-2 border-eb-yellow" style={{ top: '-2px', left: '-2px' }}></div>
            <div className="absolute w-4 h-4 border-t-2 border-r-2 border-eb-yellow" style={{ top: '-2px', right: '-2px' }}></div>
            <div className="absolute w-4 h-4 border-b-2 border-l-2 border-eb-yellow" style={{ bottom: '-2px', left: '-2px' }}></div>
            <div className="absolute w-4 h-4 border-b-2 border-r-2 border-eb-yellow" style={{ bottom: '-2px', right: '-2px' }}></div>

            {/* Content wrapper with space-y-6 to protect brackets from sibling margin-top rules */}
            <div className="space-y-6">
              <div className="border-b border-gray-900 pb-3 flex justify-between items-center">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-eb-yellow" />
                  Official Tournament Report
                </h3>
                <button
                  onClick={() => setReportModalOpen(false)}
                  className="text-gray-500 hover:text-white font-black text-sm p-1 transition-colors"
                >
                  ✕
                </button>
              </div>

              {loadingReport ? (
                <div className="text-center py-16 space-y-4">
                  <Crosshair className="w-10 h-10 text-eb-yellow animate-spin mx-auto" />
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Compiling scoreboard stats...</p>
                </div>
              ) : reportData ? (
                <div className="space-y-6">
                  
                  {/* Event header info */}
                  <div className="bg-[#12120e]/60 border border-gray-900 p-4 rounded text-xs space-y-1">
                    <h4 className="text-base font-extrabold text-white uppercase tracking-wide">{reportData.event?.title}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-gray-400 font-medium font-mono pt-1">
                      <div>Format: <span className="text-white font-bold">{reportData.event?.type}</span></div>
                      <div>Map: <span className="text-white font-bold">{reportData.event?.map}</span></div>
                      <div>Participants: <span className="text-white font-bold">{reportData.totalPlayersCount} Players</span></div>
                    </div>
                  </div>

                  {/* WINNER SPOTLIGHT BANNER */}
                  {reportData.winner ? (
                    <div className="relative p-5 bg-gradient-to-r from-eb-yellow/15 to-transparent border border-eb-yellow/30 rounded overflow-hidden flex items-center justify-between">
                      <div className="space-y-2 relative z-10">
                        <span className="px-2 py-0.5 bg-eb-yellow text-black font-black text-[9px] tracking-widest uppercase rounded-sm">
                          CHAMPION / WINNER
                        </span>
                        <h5 className="text-2xl font-black text-white uppercase tracking-wide italic">
                          {reportData.winner.allInGameNames?.join(' / ') || reportData.winner.trackingUid}
                        </h5>
                        <p className="text-xs text-gray-400 font-mono">
                          Roster Lead UID: <span className="text-white font-bold">{reportData.winner.trackingUid}</span>
                        </p>
                        <div className="flex gap-4 text-xs font-mono font-bold text-eb-yellow pt-1">
                          <span>Rank: #{reportData.winner.rank || 1}</span>
                          <span>Total Points: {reportData.winner.points || 0} pts</span>
                          {reportData.event?.type === 'Squad' && (
                            <span>Kills: {(reportData.winner.playerKills || []).reduce((a, b) => a + b, 0)} kills</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Big background watermark icon */}
                      <Trophy className="w-24 h-24 text-eb-yellow opacity-10 absolute right-4 bottom-[-10px] pointer-events-none" />
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed border-gray-800 rounded bg-[#12120e]/30 text-center text-xs text-gray-500 font-semibold">
                      No winner has been officially ranked for this tournament yet.
                    </div>
                  )}

                  {/* STANDINGS SCOREBOARD TABLE */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Final Scoreboard Standings</span>
                    
                    {reportData.registrations?.length > 0 ? (
                      <div className="border border-gray-900 rounded overflow-hidden max-h-60 overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-black text-gray-400 font-black uppercase tracking-wider border-b border-gray-900 text-[10px]">
                              <th className="p-3 w-16 text-center">Rank</th>
                              <th className="p-3">Squad / Player Members</th>
                              <th className="p-3 font-mono">Lead UID</th>
                              <th className="p-3 text-right">Points</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-950 text-gray-300 font-medium font-mono">
                            {reportData.registrations.map((reg) => (
                              <tr 
                                key={reg._id} 
                                className={`transition-colors ${
                                  reg.rank === 1 
                                    ? 'bg-eb-yellow/5 text-eb-yellow font-bold' 
                                    : 'hover:bg-black/40'
                                }`}
                              >
                                <td className="p-3 text-center text-white font-extrabold">
                                  {reg.rank ? `#${reg.rank}` : 'N/A'}
                                </td>
                                <td className="p-3 font-sans">
                                  <div className="text-white font-bold">{reg.allInGameNames?.join(', ')}</div>
                                </td>
                                <td className="p-3 uppercase text-[11px] font-bold text-gray-400">
                                  {reg.trackingUid}
                                </td>
                                <td className="p-3 text-right text-white font-extrabold">
                                  {reg.points || 0} pts
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-[#12120e]/30 border border-white/5 rounded text-xs text-gray-500 font-semibold">
                        No approved registrations found for this tournament.
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="text-center py-12 text-xs text-tan font-bold uppercase tracking-wider">
                  Failed to compile tournament report. Please try again.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Clicked Tournament Detail / Info Modal */}
      {detailsModalEvent && (
        <div className="fixed inset-0 bg-black/85 flex justify-center items-center overflow-y-auto z-[100] p-4 backdrop-blur-sm animate-fadeIn">
          <div className="pubg-hud-panel p-6 max-w-lg w-full bg-[#090907] relative border-2 border-eb-yellow before:content-none">
            {/* HUD Corner Brackets positioned relative to outer border-2 boundary */}
            <div className="absolute w-4 h-4 border-t-2 border-l-2 border-eb-yellow" style={{ top: '-2px', left: '-2px' }}></div>
            <div className="absolute w-4 h-4 border-t-2 border-r-2 border-eb-yellow" style={{ top: '-2px', right: '-2px' }}></div>
            <div className="absolute w-4 h-4 border-b-2 border-l-2 border-eb-yellow" style={{ bottom: '-2px', left: '-2px' }}></div>
            <div className="absolute w-4 h-4 border-b-2 border-r-2 border-eb-yellow" style={{ bottom: '-2px', right: '-2px' }}></div>

            {/* Content wrapper with space-y-5 to protect brackets from sibling margin-top rules */}
            <div className="space-y-5">
              <div className="border-b border-gray-900 pb-3 flex justify-between items-center">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Swords className="w-5 h-5 text-eb-yellow" />
                  Tournament Details
                </h3>
                <button
                  onClick={() => setDetailsModalEvent(null)}
                  className="text-gray-500 hover:text-white font-black text-sm p-1 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="px-2 py-0.5 bg-eb-yellow text-black font-black text-[9px] tracking-widest uppercase rounded-sm">
                    {getStatusTag(detailsModalEvent.status)}
                  </span>
                  <h4 className="text-2xl font-black text-white uppercase tracking-wide mt-2">{detailsModalEvent.title}</h4>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-[#12120e]/60 border border-gray-900 p-4 rounded text-xs font-mono">
                  <div>Format: <span className="text-white font-bold">{detailsModalEvent.type || 'Squad'}</span></div>
                  <div>Map: <span className="text-white font-bold">{detailsModalEvent.map || 'Erangel'}</span></div>
                  <div>Solo Fee: <span className="text-white font-bold">PKR {detailsModalEvent.soloEntryFee?.toLocaleString()}</span></div>
                  <div>Team Fee: <span className="text-white font-bold">PKR {detailsModalEvent.teamEntryFee?.toLocaleString()}</span></div>
                  <div className="col-span-2 border-t border-gray-900/60 pt-2">
                    Duration: <span className="text-white font-bold">{detailsModalEvent.numberOfDays || 1} Day(s)</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono text-gray-400">
                  <div className="flex justify-between border-b border-gray-900 pb-1">
                    <span>Registration Deadline:</span>
                    <span className="text-white">{formatDateTime(detailsModalEvent.registrationDeadline)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Match Start Time:</span>
                    <span className="text-eb-yellow font-bold">{formatDateTime(detailsModalEvent.matchStartTime)}</span>
                  </div>
                </div>

                {detailsModalEvent.description && (
                  <div className="space-y-1">
                    <span className="text-gray-400 uppercase text-[9px] font-black tracking-wider block">Description & Rules:</span>
                    <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-line bg-[#12120e]/40 p-3 border border-gray-900 rounded font-medium font-sans">
                      {detailsModalEvent.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => setDetailsModalEvent(null)}
                    className="py-2.5 bg-black border border-gray-800 hover:border-tan text-white font-black uppercase text-xs tracking-wider rounded transition-all duration-300 hover:scale-[1.02]"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      const evtId = detailsModalEvent?._id;
                      setDetailsModalEvent(null);
                      handleRegisterClick(evtId);
                    }}
                    className="py-2.5 bg-eb-yellow text-black font-black uppercase text-xs tracking-wider rounded transition-all duration-300 hover:scale-[1.02]"
                  >
                    Register Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <RegisterModal 
        isOpen={isRegisterOpen} 
        onClose={() => { setIsRegisterOpen(false); setSelectedEventId(null); }} 
        eventId={selectedEventId}
      />
    </div>
  );
}
