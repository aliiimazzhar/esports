import React, { useContext, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Shield, Trophy, Map, Eye, Calendar, User, DollarSign, ArrowLeft, Users, AlertTriangle } from 'lucide-react';

export default function TournamentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tournaments, teams, currentUser, createTeam, registerTeamForTournament, registrations } = useContext(AppContext);

  const tournament = tournaments.find(t => t.id === id);

  if (!tournament) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="w-16 h-16 text-tan mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold uppercase text-white">Tournament Not Found</h2>
        <p className="text-gray-400 text-sm mt-2">The tournament ID you requested does not exist or has been archived.</p>
        <Link to="/" className="mt-6 px-6 py-2.5 rounded bg-eb-yellow text-black font-black uppercase text-xs tracking-wider hover:bg-gold">
          Back to Tournaments
        </Link>
      </div>
    );
  }

  const captainTeams = teams.filter(t => t.captain === currentUser.name);

  const [registrationMode, setRegistrationMode] = useState('select'); // 'select' or 'create'
  const [selectedTeamId, setSelectedTeamId] = useState(captainTeams[0]?.id || '');
  
  const [quickTeamName, setQuickTeamName] = useState('');
  const [quickMembers, setQuickMembers] = useState(['', '', '', '']);
  const [formErrors, setFormErrors] = useState({});

  const platformFee = 75;
  const totalAmount = tournament.entryFee + platformFee;

  const isTeamRegistered = (teamId) => {
    return registrations.some(r => r.tournamentId === tournament.id && r.teamId === teamId && r.status !== 'Rejected');
  };

  const handleMemberChange = (idx, val) => {
    const updated = [...quickMembers];
    updated[idx] = val;
    setQuickMembers(updated);
    if (formErrors[`member_${idx}`]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[`member_${idx}`];
        return next;
      });
    }
  };

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    let finalTeamId = selectedTeamId;

    if (registrationMode === 'create') {
      const errors = {};
      if (!quickTeamName.trim()) {
        errors.quickTeamName = 'Squad name is required';
      } else if (quickTeamName.length < 3) {
        errors.quickTeamName = 'Squad name must be at least 3 characters';
      }

      quickMembers.forEach((m, idx) => {
        if (!m.trim()) {
          errors[`member_${idx}`] = `Player ${idx + 1} PUBG ID is required`;
        } else if (m.trim().length < 4) {
          errors[`member_${idx}`] = `PUBG ID must be at least 4 characters`;
        }
      });

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      const created = createTeam(quickTeamName, quickMembers);
      finalTeamId = created.id;
    }

    if (!finalTeamId) {
      alert('Please select or create a squad first.');
      return;
    }

    if (isTeamRegistered(finalTeamId)) {
      alert('This squad is already registered or has a pending payment for this tournament.');
      return;
    }

    navigate(`/payment/new?tournamentId=${tournament.id}&teamId=${finalTeamId}`);
  };

  return (
    <div className="min-h-screen bg-black py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Back navigation */}
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm font-semibold transition-all duration-200 hover:-translate-x-1">
          <ArrowLeft className="w-4 h-4 text-eb-yellow" />
          Back to Matches
        </Link>

        {/* Layout split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Tournament Details */}
          <div className="lg:col-span-2 space-y-6 animate-slideInLeft">
            
            {/* Header Card - Notched HUD Panel */}
            <div className="pubg-hud-panel p-6 overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                  tournament.status === 'live' 
                    ? 'bg-tan text-white animate-pulse' 
                    : 'bg-eb-yellow text-black'
                }`}>
                  {tournament.status}
                </span>
                <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">PUBG Mobile Arena</span>
              </div>

              <h2 className="text-2xl md:text-4xl font-extrabold uppercase text-white tracking-wide">
                {tournament.title}
              </h2>

              <p className="text-gray-400 text-xs mt-3 leading-relaxed">
                Step into the battlegrounds and prove your squad's dominance. This tournament is conducted under official competitive regulations. Review the match settings, perspective guidelines, and schedule map sequence below.
              </p>
            </div>

            {/* Parameter Cards - HUD Styled Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              
              <div className="pubg-hud-panel cyber-card p-4 text-center rounded animate-zoomIn">
                <Trophy className="w-5 h-5 text-gold mx-auto mb-2" />
                <span className="text-[9px] text-gray-500 uppercase font-black tracking-wider">Prize Pool</span>
                <p className="text-sm font-black text-white mt-0.5">{tournament.prizePool}</p>
              </div>

              <div className="pubg-hud-panel cyber-card p-4 text-center rounded animate-zoomIn animation-delay-100">
                <DollarSign className="w-5 h-5 text-eb-yellow mx-auto mb-2" />
                <span className="text-[9px] text-gray-500 uppercase font-black tracking-wider">Entry Fee</span>
                <p className="text-sm font-black text-white mt-0.5">PKR {tournament.entryFee.toLocaleString()}</p>
              </div>

              <div className="pubg-hud-panel cyber-card p-4 text-center rounded animate-zoomIn animation-delay-200">
                <Eye className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                <span className="text-[9px] text-gray-500 uppercase font-black tracking-wider">Perspective</span>
                <p className="text-sm font-black text-white mt-0.5">{tournament.perspective}</p>
              </div>

              <div className="pubg-hud-panel cyber-card p-4 text-center rounded animate-zoomIn animation-delay-300">
                <Calendar className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                <span className="text-[9px] text-gray-500 uppercase font-black tracking-wider">Start Date</span>
                <p className="text-sm font-black text-white mt-0.5">{tournament.date}</p>
              </div>

            </div>

            {/* Map Sequence & Schedule */}
            <div className="pubg-hud-panel p-6 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-gray-900 pb-3">
                <Map className="w-5 h-5 text-orig-yellow" />
                Map Schedule Sequence
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tournament.mapSchedule.map((map, idx) => (
                  <div key={map} className={`bg-black/60 border border-gray-900 hover:border-eb-yellow/30 rounded p-4 flex items-center justify-between transition-all duration-200 animate-slideInLeft animation-delay-${(idx + 1) * 100}`}>
                    <div>
                      <span className="text-[9px] text-gray-500 uppercase font-black tracking-wider">Match #{idx + 1}</span>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">{map}</h4>
                    </div>
                    <span className="text-[9px] px-2.5 py-0.5 bg-orig-yellow/10 border border-orig-yellow/20 text-orig-yellow font-black uppercase tracking-wider">
                      Official
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Rules & Guidelines */}
            <div className="bg-[#12120e] border border-white/5 p-6 rounded space-y-3">
              <h3 className="text-[10px] font-black text-white uppercase tracking-wider">Official Regulations</h3>
              <ul className="space-y-2.5 text-xs text-gray-400 list-disc list-inside leading-relaxed font-medium">
                <li>Manual checkout screenshot uploads are audited by organizers.</li>
                <li>Fake Transaction IDs (TxID) will lead to permanent ban.</li>
                <li>Room ID and password credential indicators are unlocked immediately upon verification approval.</li>
                <li>No substitutions are allowed once registration receipts are approved.</li>
              </ul>
            </div>

          </div>

          {/* Right Column: Checkout Registration Card */}
          <div className="space-y-6 animate-zoomIn">
            
            <div className="pubg-hud-panel cyber-card p-6 space-y-5 shadow-glow-yellow-sm">
              <h3 className="text-sm font-black uppercase text-white tracking-widest border-b border-gray-900 pb-3">
                Register Squad
              </h3>

              {/* Toggle Selector */}
              <div className="grid grid-cols-2 gap-2 bg-black p-1 rounded border border-gray-950">
                <button
                  onClick={() => { setRegistrationMode('select'); setFormErrors({}); }}
                  className={`py-1.5 rounded text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                    registrationMode === 'select' 
                      ? 'bg-eb-yellow text-black' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Select Squad
                </button>
                <button
                  onClick={() => { setRegistrationMode('create'); setFormErrors({}); }}
                  className={`py-1.5 rounded text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                    registrationMode === 'create' 
                      ? 'bg-eb-yellow text-black' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Quick-Create
                </button>
              </div>

              {/* Conditional Inputs */}
              {registrationMode === 'select' ? (
                <div className="space-y-4">
                  {captainTeams.length > 0 ? (
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
                        Choose Active Squad
                      </label>
                      <select
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        className="pubg-input w-full cursor-pointer text-xs"
                      >
                        {captainTeams.map((team) => (
                          <option key={team.id} value={team.id} className="bg-black">
                            {team.name} ({team.members.length} players)
                          </option>
                        ))}
                      </select>
                      
                      {isTeamRegistered(selectedTeamId) && (
                        <div className="p-3 rounded bg-tan/10 border border-tan/30 text-gold text-[10px] flex gap-2 items-start mt-2">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-gold" />
                          <span>This team is already registered for this match tournament.</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-6 bg-black/40 border border-gray-900 rounded space-y-3">
                      <Users className="w-8 h-8 text-gray-700 mx-auto" />
                      <p className="text-xs text-gray-500">You don't have any squads created yet.</p>
                      <button
                        type="button"
                        onClick={() => setRegistrationMode('create')}
                        className="px-4 py-1.5 rounded border border-eb-yellow/30 text-eb-yellow hover:bg-eb-yellow/10 font-bold uppercase text-[9px] tracking-wider transition-colors duration-200"
                      >
                        Create One Now
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Squad Name</label>
                    <input
                      type="text"
                      value={quickTeamName}
                      onChange={(e) => {
                        setQuickTeamName(e.target.value);
                        if (formErrors.quickTeamName) setFormErrors(prev => { const n = {...prev}; delete n.quickTeamName; return n; });
                      }}
                      placeholder="e.g. Blitz Squad"
                      className="pubg-input w-full"
                    />
                    {formErrors.quickTeamName && <p className="text-tan text-[10px] font-bold mt-1">{formErrors.quickTeamName}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">
                      Roster PUBG IDs
                    </label>
                    {quickMembers.map((member, idx) => (
                      <div key={idx} className="space-y-1">
                        <input
                          type="text"
                          value={member}
                          onChange={(e) => handleMemberChange(idx, e.target.value)}
                          placeholder={`Player ${idx + 1} character ID`}
                          className="pubg-input py-1.5 text-xs w-full"
                        />
                        {formErrors[`member_${idx}`] && (
                          <p className="text-tan text-[10px] font-bold">{formErrors[`member_${idx}`]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoice breakdown */}
              <div className="space-y-2.5 pt-4 border-t border-gray-900 text-xs text-gray-400 font-semibold">
                <div className="flex justify-between">
                  <span>Entry Fee</span>
                  <span className="font-bold text-white">PKR {tournament.entryFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Processing</span>
                  <span className="font-bold text-white">PKR {platformFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-gray-900 pt-3 text-xs text-gold font-black uppercase tracking-wider">
                  <span>Total Amount Due</span>
                  <span className="text-eb-yellow font-black text-sm">PKR {totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                onClick={handleProceedToPayment}
                disabled={registrationMode === 'select' && (!selectedTeamId || isTeamRegistered(selectedTeamId))}
                className={`w-full py-3 text-black font-black uppercase text-xs tracking-widest transition-all duration-300 ${
                  registrationMode === 'select' && (!selectedTeamId || isTeamRegistered(selectedTeamId))
                    ? 'bg-gray-950 text-gray-600 cursor-not-allowed border border-gray-900'
                    : 'bg-eb-yellow hover:bg-gold hover:scale-[1.02] hover:shadow-glow-yellow'
                }`}
              >
                Proceed to Checkout
              </button>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
