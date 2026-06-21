import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { 
  ShieldAlert, Check, X, FileImage, ShieldCheck, Gamepad2, Award, 
  ClipboardCheck, ArrowRight, Eye, Edit, Trash2, Plus, Users, Key, Save, 
  Calendar, Map, ListOrdered, Undo
} from 'lucide-react';

export default function AdminPanel() {
  const { 
    currentUser, 
    registrations, 
    tournaments, 
    teams,
    matchResults,
    updateRegistrationStatus, 
    addMatchResults,
    addTournament,
    updateTournament,
    deleteTournament,
    deleteMatchResult,
    updateMatchResult,
    updateTeam,
    deleteTeam,
    updateRegistrationRoomInfo
  } = useContext(AppContext);

  const [adminTab, setAdminTab] = useState('payments');
  const [zoomReceiptUrl, setZoomReceiptUrl] = useState(null);

  const [selectedTourneyId, setSelectedTourneyId] = useState(tournaments[0]?.id || '');
  const [selectedMap, setSelectedMap] = useState('');
  const [scoresInput, setScoresInput] = useState([]);
  const [scoreSuccess, setScoreSuccess] = useState('');

  // Tournaments tab state
  const [editTourneyId, setEditTourneyId] = useState(null);
  const [tourneyTitle, setTourneyTitle] = useState('');
  const [tourneyStatus, setTourneyStatus] = useState('upcoming');
  const [tourneyPrizePool, setTourneyPrizePool] = useState('');
  const [tourneyEntryFee, setTourneyEntryFee] = useState(0);
  const [tourneyPerspective, setTourneyPerspective] = useState('TPP');
  const [tourneyMapSchedule, setTourneyMapSchedule] = useState('Erangel');
  const [tourneyMaxTeams, setTourneyMaxTeams] = useState(16);
  const [tourneyDate, setTourneyDate] = useState('');
  const [tourneySuccess, setTourneySuccess] = useState('');

  // Leaderboard tab state
  const [editMatchResultId, setEditMatchResultId] = useState(null);
  const [editMatchScores, setEditMatchScores] = useState([]);
  const [editMatchMap, setEditMatchMap] = useState('');
  const [editMatchTourneyId, setEditMatchTourneyId] = useState('');
  const [matchSuccess, setMatchSuccess] = useState('');

  // Squads tab state
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamMembers, setEditTeamMembers] = useState(['', '', '', '']);
  const [rosterError, setRosterError] = useState('');
  const [editingRegRoomId, setEditingRegRoomId] = useState(null);
  const [roomNumInput, setRoomNumInput] = useState('');
  const [roomPassInput, setRoomPassInput] = useState('');
  const [squadSuccess, setSquadSuccess] = useState('');

  if (currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
        <div className="p-8 max-w-md bg-[#12120e] border border-tan/30 rounded relative shadow-lg">
          {/* Brackets */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-tan"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-tan"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-tan"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-tan"></div>

          <div className="space-y-4">
            <ShieldAlert className="w-14 h-14 text-tan mx-auto animate-pulse" />
            <h2 className="text-xl font-extrabold uppercase text-white tracking-widest">Access Restricted</h2>
            <p className="text-gray-400 text-xs leading-relaxed font-semibold">
              Organizer Panel controls require Admin level authorization flags.
            </p>
            <div className="bg-black/60 p-3 rounded-sm text-[11px] text-gray-500 border border-gray-950 font-medium">
              Click the <span className="font-bold text-eb-yellow uppercase">"Captain Mode"</span> switcher in the navbar profile to enable Admin Mode features.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeTourney = tournaments.find(t => t.id === selectedTourneyId);
  const registeredTeams = registrations.filter(r => r.tournamentId === selectedTourneyId && r.status === 'Approved');

  const handleTourneyChange = (tourneyId) => {
    setSelectedTourneyId(tourneyId);
    const tourney = tournaments.find(t => t.id === tourneyId);
    setSelectedMap(tourney?.mapSchedule[0] || '');
    
    const teamsList = registrations.filter(r => r.tournamentId === tourneyId && r.status === 'Approved');
    setScoresInput(teamsList.map(t => ({
      teamId: t.teamId,
      teamName: t.teamName,
      placementPoints: 0,
      killPoints: 0
    })));
    setScoreSuccess('');
  };

  const handleScoreValueChange = (teamId, field, val) => {
    const numericVal = Math.max(0, parseInt(val) || 0);
    setScoresInput(prev => prev.map(item => {
      if (item.teamId === teamId) {
        return { ...item, [field]: numericVal };
      }
      return item;
    }));
  };

  const handleScoreSubmit = (e) => {
    e.preventDefault();
    if (!selectedTourneyId) return;
    if (!selectedMap) {
      alert('Please select the match map');
      return;
    }
    if (scoresInput.length === 0) {
      alert('There are no approved squads registered for this tournament to record scores.');
      return;
    }

    addMatchResults(selectedTourneyId, selectedMap, scoresInput);
    setScoreSuccess(`Scores for match on ${selectedMap} submitted successfully! Standings updated.`);
    setScoresInput(prev => prev.map(item => ({ ...item, placementPoints: 0, killPoints: 0 })));
    
    setTimeout(() => {
      setScoreSuccess('');
    }, 4000);
  };

  if (activeTourney && scoresInput.length === 0 && registeredTeams.length > 0) {
    setSelectedMap(activeTourney.mapSchedule[0] || '');
    setScoresInput(registeredTeams.map(t => ({
      teamId: t.teamId,
      teamName: t.teamName,
      placementPoints: 0,
      killPoints: 0
    })));
  }

  // Tournaments tab handlers
  const handleTournamentSubmit = (e) => {
    e.preventDefault();
    if (!tourneyTitle.trim()) {
      alert('Tournament title is required');
      return;
    }
    const maps = tourneyMapSchedule.split(',')
      .map(m => m.trim())
      .filter(m => m !== '');
    
    if (maps.length === 0) {
      alert('At least one map schedule is required');
      return;
    }

    const tData = {
      title: tourneyTitle,
      status: tourneyStatus,
      prizePool: tourneyPrizePool || 'PKR 0',
      entryFee: Number(tourneyEntryFee) || 0,
      perspective: tourneyPerspective,
      mapSchedule: maps,
      maxTeams: Number(tourneyMaxTeams) || 16,
      date: tourneyDate || new Date().toISOString().split('T')[0]
    };

    if (editTourneyId) {
      updateTournament({ id: editTourneyId, ...tData });
      setTourneySuccess('Tournament updated successfully!');
    } else {
      addTournament(tData);
      setTourneySuccess('Tournament created successfully!');
    }

    resetTournamentForm();
    setTimeout(() => setTourneySuccess(''), 3000);
  };

  const handleEditTourneyClick = (t) => {
    setEditTourneyId(t.id);
    setTourneyTitle(t.title);
    setTourneyStatus(t.status);
    setTourneyPrizePool(t.prizePool);
    setTourneyEntryFee(t.entryFee);
    setTourneyPerspective(t.perspective);
    setTourneyMapSchedule(t.mapSchedule.join(', '));
    setTourneyMaxTeams(t.maxTeams);
    setTourneyDate(t.date);
  };

  const resetTournamentForm = () => {
    setEditTourneyId(null);
    setTourneyTitle('');
    setTourneyStatus('upcoming');
    setTourneyPrizePool('');
    setTourneyEntryFee(0);
    setTourneyPerspective('TPP');
    setTourneyMapSchedule('Erangel');
    setTourneyMaxTeams(16);
    setTourneyDate('');
  };

  // Leaderboard maintenance handlers
  const handleEditMatchClick = (match) => {
    setEditMatchResultId(match.id);
    setEditMatchScores(match.scores);
    setEditMatchMap(match.mapName);
    setEditMatchTourneyId(match.tournamentId);
  };

  const handleEditMatchValueChange = (teamId, field, val) => {
    const numericVal = Math.max(0, parseInt(val) || 0);
    setEditMatchScores(prev => prev.map(item => {
      if (item.teamId === teamId) {
        return { ...item, [field]: numericVal };
      }
      return item;
    }));
  };

  const handleEditMatchSubmit = (e) => {
    e.preventDefault();
    const updatedResult = {
      id: editMatchResultId,
      tournamentId: editMatchTourneyId,
      mapName: editMatchMap,
      scores: editMatchScores.map(s => ({
        ...s,
        placementPoints: Number(s.placementPoints),
        killPoints: Number(s.killPoints)
      }))
    };
    updateMatchResult(updatedResult);
    setEditMatchResultId(null);
    setMatchSuccess('Match scoresheet updated successfully!');
    setTimeout(() => setMatchSuccess(''), 3000);
  };

  // Registered Squads handlers
  const handleEditTeamClick = (team) => {
    setEditingTeamId(team.id);
    setEditTeamName(team.name);
    const members = [...team.members];
    while (members.length < 4) members.push('');
    setEditTeamMembers(members);
  };

  const handleTeamMemberChange = (idx, val) => {
    const updated = [...editTeamMembers];
    updated[idx] = val;
    setEditTeamMembers(updated);
  };

  const handleTeamSubmit = (e) => {
    e.preventDefault();
    if (!editTeamName.trim()) {
      setRosterError('Team name is required');
      return;
    }
    const cleanMembers = editTeamMembers.map(m => m.trim()).filter(m => m !== '');
    if (cleanMembers.length < 4) {
      setRosterError('A squad must have at least 4 active players');
      return;
    }
    const updated = {
      id: editingTeamId,
      name: editTeamName,
      members: cleanMembers
    };
    updateTeam(updated);
    setEditingTeamId(null);
    setRosterError('');
    setSquadSuccess('Squad roster updated successfully!');
    setTimeout(() => setSquadSuccess(''), 3000);
  };

  const handleEditRoomClick = (reg) => {
    setEditingRegRoomId(reg.id);
    setRoomNumInput(reg.roomInfo?.roomId || '');
    setRoomPassInput(reg.roomInfo?.roomPass || '');
  };

  const handleSaveRoomCredentials = (regId) => {
    if (!roomNumInput.trim() || !roomPassInput.trim()) {
      alert('Room ID and Password are required');
      return;
    }
    updateRegistrationRoomInfo(regId, {
      roomId: roomNumInput.trim(),
      roomPass: roomPassInput.trim()
    });
    setEditingRegRoomId(null);
    setSquadSuccess('Lobby room credentials updated successfully!');
    setTimeout(() => setSquadSuccess(''), 3000);
  };

  return (
    <div className="min-h-screen bg-black py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Admin Dashboard header */}
        <div className="border-b border-gray-900 pb-5 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold uppercase text-white tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-gold" />
              Organizer <span className="text-eb-yellow">Panel</span>
            </h2>
            <p className="text-gray-500 text-xs font-semibold">Review squad rosters, audit transaction proofs, and enter points sheet scores.</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-[#12120e] p-1 border border-white/5">
          <button
            onClick={() => setAdminTab('payments')}
            className={`flex items-center justify-center gap-2 py-3 font-black text-[10px] uppercase tracking-wider transition-all duration-250 ${
              adminTab === 'payments'
                ? 'bg-eb-yellow text-black'
                : 'text-gray-400 hover:text-white hover:bg-black/20'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Payment Reviews
          </button>
          
          <button
            onClick={() => setAdminTab('scores')}
            className={`flex items-center justify-center gap-2 py-3 font-black text-[10px] uppercase tracking-wider transition-all duration-250 ${
              adminTab === 'scores'
                ? 'bg-eb-yellow text-black'
                : 'text-gray-400 hover:text-white hover:bg-black/20'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            Scoresheet Input
          </button>

          <button
            onClick={() => setAdminTab('tournaments')}
            className={`flex items-center justify-center gap-2 py-3 font-black text-[10px] uppercase tracking-wider transition-all duration-250 ${
              adminTab === 'tournaments'
                ? 'bg-eb-yellow text-black'
                : 'text-gray-400 hover:text-white hover:bg-black/20'
            }`}
          >
            <Award className="w-4 h-4" />
            Tournaments
          </button>

          <button
            onClick={() => setAdminTab('leaderboard')}
            className={`flex items-center justify-center gap-2 py-3 font-black text-[10px] uppercase tracking-wider transition-all duration-250 ${
              adminTab === 'leaderboard'
                ? 'bg-eb-yellow text-black'
                : 'text-gray-400 hover:text-white hover:bg-black/20'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            Leaderboard Audit
          </button>

          <button
            onClick={() => setAdminTab('squads')}
            className={`flex items-center justify-center gap-2 py-3 font-black text-[10px] uppercase tracking-wider transition-all duration-250 ${
              adminTab === 'squads'
                ? 'bg-eb-yellow text-black'
                : 'text-gray-400 hover:text-white hover:bg-black/20'
            }`}
          >
            <Users className="w-4 h-4" />
            Squads & Roster
          </button>
        </div>

        {/* Tab Panels */}
        <div className="mt-6">
          
          {/* TAB 1: PAYMENT REVIEWS */}
          {adminTab === 'payments' && (
            <div className="space-y-6 animate-fadeIn">
              {registrations.length > 0 ? (
                <div className="pubg-hud-panel overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-black text-gray-400 font-black uppercase tracking-wider border-b border-gray-900 text-[10px]">
                          <th className="p-4">Tournament</th>
                          <th className="p-4">Squad Name</th>
                          <th className="p-4">TxID</th>
                          <th className="p-4 text-center">Receipt Confirmation</th>
                          <th className="p-4 text-center">Status</th>
                          <th className="p-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-950 text-gray-300">
                        {registrations.map((reg) => {
                          const tourney = tournaments.find(t => t.id === reg.tournamentId) || {};
                          return (
                            <tr key={reg.id} className="hover:bg-black/40 transition-colors">
                              <td className="p-4 font-black text-white uppercase tracking-wide">{tourney.title}</td>
                              <td className="p-4 font-bold text-gray-200">{reg.teamName}</td>
                              <td className="p-4 font-mono text-gray-500">{reg.txId}</td>
                              <td className="p-4 text-center">
                                <div className="inline-flex items-center justify-center">
                                  <button
                                    onClick={() => setZoomReceiptUrl(reg.screenshot)}
                                    className="group relative block w-16 h-10 rounded-sm border border-gray-800 overflow-hidden bg-black focus:outline-none"
                                    title="View receipt"
                                  >
                                    <img 
                                      src={reg.screenshot} 
                                      alt="slip" 
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[8px] font-black uppercase tracking-wider">
                                      <Eye className="w-3.5 h-3.5 text-eb-yellow" />
                                    </div>
                                  </button>
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <span className={`inline-flex px-2 py-0.5 rounded-sm text-[9px] font-black uppercase border ${
                                  reg.status === 'Approved'
                                    ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30'
                                    : reg.status === 'Rejected'
                                      ? 'bg-tan/20 text-gold border-tan'
                                      : 'bg-harvest/15 text-eb-yellow border-harvest animate-pulse'
                                }`}>
                                  {reg.status}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                {reg.status === 'Pending' ? (
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => updateRegistrationStatus(reg.id, 'Approved')}
                                      className="p-1 px-3 rounded-sm bg-[#10b981] hover:bg-[#059669] text-black font-black uppercase text-[9px] tracking-wider flex items-center gap-1 transition-colors duration-150"
                                    >
                                      <Check className="w-3 h-3" /> Approve
                                    </button>
                                    <button
                                      onClick={() => updateRegistrationStatus(reg.id, 'Rejected')}
                                      className="p-1 px-3 rounded-sm bg-tan hover:bg-[#7e3400] text-white font-black uppercase text-[9px] tracking-wider flex items-center gap-1 transition-colors duration-150"
                                    >
                                      <X className="w-3 h-3" /> Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-gray-500 italic text-[10px] font-semibold">Audit Complete</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 bg-[#12120e] border border-white/5 rounded">
                  <p className="text-gray-500 text-xs font-semibold">No squad checkout registrations found in database.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MATCH RESULTS INPUT */}
          {adminTab === 'scores' && (
            <div className="pubg-hud-panel cyber-card p-6 space-y-6 animate-fadeIn">
              
              <div className="border-b border-gray-900 pb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Award className="w-5 h-5 text-gold" />
                  Scoresheet Entry
                </h3>
                <p className="text-gray-500 text-[10px] font-semibold mt-0.5">
                  Input kills and placement scores for approved squads. Standings recalculate dynamically.
                </p>
              </div>

              {scoreSuccess && (
                <div className="p-3 bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 rounded-sm text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 animate-bounce" />
                  {scoreSuccess}
                  <Link to="/leaderboards" className="ml-auto text-white underline flex items-center gap-1 font-bold text-[10px] uppercase">
                    Open Standings Table <ArrowRight className="w-3.5 h-3.5 text-eb-yellow" />
                  </Link>
                </div>
              )}

              <form onSubmit={handleScoreSubmit} className="space-y-6">
                
                {/* Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Select Tournament */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Tournament</label>
                    <select
                      value={selectedTourneyId}
                      onChange={(e) => handleTourneyChange(e.target.value)}
                      className="pubg-input cursor-pointer text-xs w-full"
                    >
                      {tournaments.map(t => (
                        <option key={t.id} value={t.id} className="bg-black">{t.title} ({t.status})</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Map */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Match Map</label>
                    <select
                      value={selectedMap}
                      onChange={(e) => setSelectedMap(e.target.value)}
                      className="pubg-input cursor-pointer text-xs w-full uppercase"
                    >
                      {activeTourney?.mapSchedule.map(map => (
                        <option key={map} value={map} className="bg-black">{map}</option>
                      ))}
                    </select>
                  </div>

                </div>

                {/* Squad Scoring Input Grid */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest block">Approved Squads Scoring</h4>
                  
                  {registeredTeams.length > 0 ? (
                    <div className="border border-gray-900 rounded overflow-hidden divide-y divide-gray-950">
                      
                      {/* Table Header */}
                      <div className="bg-black p-3.5 grid grid-cols-12 gap-3 text-[9px] text-gray-500 font-black uppercase tracking-wider">
                        <div className="col-span-6">Squad Name</div>
                        <div className="col-span-3 text-center">Placement Points</div>
                        <div className="col-span-3 text-center">Kill Points</div>
                      </div>

                      {/* Team score rows */}
                      {scoresInput.map((teamInput, index) => (
                        <div key={teamInput.teamId} className="p-3 bg-[#12120e] grid grid-cols-12 gap-3 items-center text-xs">
                          <div className="col-span-6 font-bold text-white uppercase tracking-wider text-[11px]">{teamInput.teamName}</div>
                          
                          {/* Placement Input */}
                          <div className="col-span-3">
                            <input
                              type="number"
                              min="0"
                              value={teamInput.placementPoints}
                              onChange={(e) => handleScoreValueChange(teamInput.teamId, 'placementPoints', e.target.value)}
                              className="pubg-input w-full text-center py-1.5 font-mono"
                              placeholder="e.g. 15"
                            />
                          </div>

                          {/* Kill Input */}
                          <div className="col-span-3">
                            <input
                              type="number"
                              min="0"
                              value={teamInput.killPoints}
                              onChange={(e) => handleScoreValueChange(teamInput.teamId, 'killPoints', e.target.value)}
                              className="pubg-input w-full text-center py-1.5 font-mono"
                              placeholder="e.g. 8"
                            />
                          </div>

                        </div>
                      ))}

                    </div>
                  ) : (
                    <div className="p-8 rounded border border-gray-900 bg-black/40 text-center text-xs text-gray-500 font-medium">
                      No approved teams found for this tournament match. Please verify registrations in Payment Reviews first.
                    </div>
                  )}
                </div>

                {/* Form submit */}
                <button
                  type="submit"
                  disabled={registeredTeams.length === 0}
                  className={`w-full py-3 rounded text-black font-black uppercase text-xs tracking-widest transition-all duration-300 ${
                    registeredTeams.length === 0
                      ? 'bg-gray-950 text-gray-600 cursor-not-allowed border border-gray-900'
                      : 'bg-eb-yellow hover:bg-gold hover:scale-[1.01] hover:shadow-glow-yellow'
                  }`}
                >
                  Submit Scores & Re-aggregate standings
                </button>

              </form>

            </div>
          )}

          {/* TAB 3: TOURNAMENTS CONTROL */}
          {adminTab === 'tournaments' && (
            <div className="space-y-6 animate-fadeIn">
              {tourneySuccess && (
                <div className="p-3 bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 rounded-sm text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {tourneySuccess}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form to Add/Edit Tournament */}
                <div className="pubg-hud-panel p-6 space-y-4 h-fit">
                  <div className="border-b border-gray-900 pb-3 flex justify-between items-center">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <Award className="w-5 h-5 text-gold" />
                      {editTourneyId ? 'Edit Tournament' : 'Add Tournament'}
                    </h3>
                    {editTourneyId && (
                      <button 
                        onClick={resetTournamentForm}
                        className="text-[9px] font-black uppercase text-gray-400 hover:text-white flex items-center gap-1 bg-gray-950 px-2 py-1 border border-gray-900 font-mono"
                      >
                        <Undo className="w-3 h-3" /> Cancel
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleTournamentSubmit} className="space-y-4">
                    {/* Title */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Tournament Title</label>
                      <input 
                        type="text" 
                        value={tourneyTitle}
                        onChange={(e) => setTourneyTitle(e.target.value)}
                        placeholder="e.g. Miramar Desert Sniper Cup"
                        className="pubg-input w-full text-xs"
                        required
                      />
                    </div>

                    {/* Status & Perspective */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Status</label>
                        <select
                          value={tourneyStatus}
                          onChange={(e) => setTourneyStatus(e.target.value)}
                          className="pubg-input w-full text-xs bg-black"
                        >
                          <option value="upcoming">Upcoming</option>
                          <option value="live">Live</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Perspective</label>
                        <select
                          value={tourneyPerspective}
                          onChange={(e) => setTourneyPerspective(e.target.value)}
                          className="pubg-input w-full text-xs bg-black"
                        >
                          <option value="TPP">TPP</option>
                          <option value="FPP">FPP</option>
                        </select>
                      </div>
                    </div>

                    {/* Prize Pool & Entry Fee */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Prize Pool</label>
                        <input 
                          type="text" 
                          value={tourneyPrizePool}
                          onChange={(e) => setTourneyPrizePool(e.target.value)}
                          placeholder="e.g. PKR 150,000"
                          className="pubg-input w-full text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Entry Fee (PKR)</label>
                        <input 
                          type="number" 
                          min="0"
                          value={tourneyEntryFee}
                          onChange={(e) => setTourneyEntryFee(Number(e.target.value))}
                          className="pubg-input w-full text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Max Teams & Date */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Max Teams</label>
                        <input 
                          type="number" 
                          min="2"
                          value={tourneyMaxTeams}
                          onChange={(e) => setTourneyMaxTeams(Number(e.target.value))}
                          className="pubg-input w-full text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Start Date</label>
                        <input 
                          type="date" 
                          value={tourneyDate}
                          onChange={(e) => setTourneyDate(e.target.value)}
                          onClick={(e) => e.target.showPicker()}
                          onFocus={(e) => e.target.showPicker()}
                          className="pubg-input w-full text-xs font-mono cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Map Schedule */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
                        Map Rotation (comma separated)
                      </label>
                      <input 
                        type="text" 
                        value={tourneyMapSchedule}
                        onChange={(e) => setTourneyMapSchedule(e.target.value)}
                        placeholder="Erangel, Miramar, Sanhok"
                        className="pubg-input w-full text-xs"
                      />
                      <span className="text-[8px] text-gray-500 block leading-tight">
                        * Input maps separated by commas. Each map represents one match scoresheet.
                      </span>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full py-2 bg-eb-yellow text-black font-black uppercase text-xs tracking-widest hover:bg-gold transition-colors"
                    >
                      {editTourneyId ? 'Update Tournament' : 'Create Tournament'}
                    </button>
                  </form>
                </div>

                {/* Tournaments List */}
                <div className="lg:col-span-2 pubg-hud-panel overflow-hidden">
                  <div className="bg-black p-4 border-b border-gray-950 flex items-center justify-between">
                    <span className="text-[10px] font-black text-gold uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-eb-yellow" />
                      Active Tournaments Audit
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase">{tournaments.length} Registered</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-black text-gray-400 font-black uppercase tracking-wider border-b border-gray-900 text-[10px]">
                          <th className="p-4">Tournament Details</th>
                          <th className="p-4 text-center">Fee / Prize</th>
                          <th className="p-4 text-center">Perspective</th>
                          <th className="p-4 text-center">Teams Count</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-950 text-gray-300">
                        {tournaments.map((t) => (
                          <tr key={t.id} className="hover:bg-black/40 transition-colors">
                            <td className="p-4">
                              <div className="font-black text-white uppercase tracking-wide text-xs">{t.title}</div>
                              <div className="flex gap-2 items-center mt-1">
                                <span className={`px-1.5 py-0.5 rounded-sm text-[8px] font-black uppercase border ${
                                  t.status === 'live'
                                    ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30 animate-pulse'
                                    : t.status === 'completed'
                                      ? 'bg-gray-800 text-gray-400 border-gray-700'
                                      : 'bg-harvest/15 text-eb-yellow border-harvest'
                                }`}>
                                  {t.status}
                                </span>
                                <span className="text-[9px] text-gray-500 font-mono font-semibold">{t.date}</span>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <div className="font-extrabold text-gold text-xs">{t.prizePool}</div>
                              <div className="text-[9px] text-gray-500 mt-0.5">Entry: PKR {t.entryFee}</div>
                            </td>
                            <td className="p-4 text-center font-bold text-gray-200">{t.perspective}</td>
                            <td className="p-4 text-center font-bold text-gray-200">
                              {t.registrationsCount} / {t.maxTeams}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleEditTourneyClick(t)}
                                  className="p-1.5 rounded-sm bg-gray-950 border border-gray-850 hover:border-eb-yellow text-gray-400 hover:text-eb-yellow transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete "${t.title}"? This will delete all registrations and match results for this tournament.`)) {
                                      deleteTournament(t.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-sm bg-gray-950 border border-gray-850 hover:border-tan text-gray-400 hover:text-tan transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: LEADERBOARD AUDIT */}
          {adminTab === 'leaderboard' && (
            <div className="space-y-6 animate-fadeIn">
              {matchSuccess && (
                <div className="p-3 bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 rounded-sm text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {matchSuccess}
                </div>
              )}

              {editMatchResultId ? (
                /* Edit Match Scoresheet Block */
                <div className="pubg-hud-panel cyber-card p-6 space-y-6">
                  <div className="border-b border-gray-900 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Edit className="w-5 h-5 text-eb-yellow" />
                        Edit Match Scoresheet
                      </h3>
                      <p className="text-gray-500 text-[10px] font-semibold mt-0.5">
                        Modifying scores for {tournaments.find(t => t.id === editMatchTourneyId)?.title} on Map: {editMatchMap}
                      </p>
                    </div>
                    <button 
                      onClick={() => setEditMatchResultId(null)}
                      className="text-[9px] font-black uppercase text-gray-400 hover:text-white flex items-center gap-1 bg-gray-950 px-2.5 py-1 border border-gray-900 font-mono"
                    >
                      <Undo className="w-3 h-3" /> Go Back
                    </button>
                  </div>

                  <form onSubmit={handleEditMatchSubmit} className="space-y-6">
                    <div className="space-y-3">
                      <div className="border border-gray-900 rounded overflow-hidden divide-y divide-gray-950">
                        {/* Table Header */}
                        <div className="bg-black p-3.5 grid grid-cols-12 gap-3 text-[9px] text-gray-500 font-black uppercase tracking-wider">
                          <div className="col-span-6">Squad Name</div>
                          <div className="col-span-3 text-center">Placement Points</div>
                          <div className="col-span-3 text-center">Kill Points</div>
                        </div>

                        {/* Team score rows */}
                        {editMatchScores.map((teamInput) => (
                          <div key={teamInput.teamId} className="p-3 bg-[#12120e] grid grid-cols-12 gap-3 items-center text-xs">
                            <div className="col-span-6 font-bold text-white uppercase tracking-wider text-[11px]">
                              {teamInput.teamName}
                            </div>
                            
                            <div className="col-span-3">
                              <input
                                type="number"
                                min="0"
                                value={teamInput.placementPoints}
                                onChange={(e) => handleEditMatchValueChange(teamInput.teamId, 'placementPoints', e.target.value)}
                                className="pubg-input w-full text-center py-1.5 font-mono"
                              />
                            </div>

                            <div className="col-span-3">
                              <input
                                type="number"
                                min="0"
                                value={teamInput.killPoints}
                                onChange={(e) => handleEditMatchValueChange(teamInput.teamId, 'killPoints', e.target.value)}
                                className="pubg-input w-full text-center py-1.5 font-mono"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-eb-yellow text-black font-black uppercase text-xs tracking-widest hover:bg-gold transition-all"
                    >
                      Save Scoresheet Modifications
                    </button>
                  </form>
                </div>
              ) : (
                /* Scoresheets List */
                <div className="pubg-hud-panel overflow-hidden">
                  <div className="bg-black p-4 border-b border-gray-950 flex items-center justify-between">
                    <span className="text-[10px] font-black text-gold uppercase tracking-widest flex items-center gap-1.5">
                      <ListOrdered className="w-4 h-4 text-eb-yellow" />
                      Recorded Match Scoresheets
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase">{matchResults.length} Scoresheets</span>
                  </div>

                  {matchResults.length > 0 ? (
                    <div className="divide-y divide-gray-950">
                      {matchResults.map((match) => {
                        const tourney = tournaments.find(t => t.id === match.tournamentId) || {};
                        return (
                          <div key={match.id} className="p-4 hover:bg-black/20 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1.5">
                              <div className="font-black text-white uppercase text-xs tracking-wide font-semibold">
                                {tourney.title || 'Deleted Tournament'}
                              </div>
                              <div className="flex flex-wrap gap-2 items-center">
                                <span className="px-2 py-0.5 bg-black border border-gray-850 rounded-sm text-[9px] text-gray-400 font-black uppercase tracking-wider">
                                  Match #{match.matchIndex}
                                </span>
                                <span className="px-2 py-0.5 bg-black border border-gray-850 rounded-sm text-[9px] text-eb-yellow font-black uppercase tracking-wider">
                                  Map: {match.mapName}
                                </span>
                                <span className="text-[9px] text-gray-500 font-semibold font-mono">
                                  ID: {match.id}
                                </span>
                              </div>
                              {/* Roster Points summary */}
                              <div className="text-[10px] text-gray-400 flex flex-wrap gap-x-4 gap-y-1 pt-1.5 font-medium">
                                {match.scores.map(s => (
                                  <span key={s.teamId} className="border-r border-gray-800 pr-4 last:border-0 last:pr-0">
                                    <span className="font-bold text-white">{s.teamName}</span>: {s.placementPoints + s.killPoints} pts ({s.placementPoints}P, {s.killPoints}K)
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="flex gap-2 items-center self-end md:self-auto">
                              <button
                                onClick={() => handleEditMatchClick(match)}
                                className="px-3 py-1.5 rounded-sm bg-gray-950 border border-gray-850 hover:border-eb-yellow text-gray-400 hover:text-eb-yellow font-black uppercase text-[9px] tracking-widest flex items-center gap-1 transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5" /> Edit scores
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete this match scoresheet (Match #${match.matchIndex} on ${match.mapName})?`)) {
                                    deleteMatchResult(match.id);
                                    setMatchSuccess('Match scoresheet deleted successfully!');
                                    setTimeout(() => setMatchSuccess(''), 3000);
                                  }
                                }}
                                className="px-3 py-1.5 rounded-sm bg-gray-950 border border-gray-850 hover:border-tan text-gray-400 hover:text-tan font-black uppercase text-[9px] tracking-widest flex items-center gap-1 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <p className="text-gray-500 text-xs font-semibold">No match scoresheets entered yet. Enter scores in the "Scoresheet Input" tab.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: REGISTERED SQUADS & USERS */}
          {adminTab === 'squads' && (
            <div className="space-y-6 animate-fadeIn">
              {squadSuccess && (
                <div className="p-3 bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 rounded-sm text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {squadSuccess}
                </div>
              )}

              {/* Roster Editing Mode (Modal or Form panel) */}
              {editingTeamId && (
                <div className="pubg-hud-panel p-6 space-y-4">
                  <div className="border-b border-gray-900 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Users className="w-5 h-5 text-eb-yellow" />
                        Edit Squad Combat Roster
                      </h3>
                      <p className="text-gray-500 text-[10px] font-semibold mt-0.5">Modify team name and roster player tags.</p>
                    </div>
                    <button 
                      onClick={() => { setEditingTeamId(null); setRosterError(''); }}
                      className="text-[9px] font-black uppercase text-gray-400 hover:text-white flex items-center gap-1 bg-gray-950 px-2 py-1 border border-gray-900 font-mono"
                    >
                      <Undo className="w-3 h-3" /> Cancel
                    </button>
                  </div>

                  <form onSubmit={handleTeamSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Squad Name</label>
                      <input 
                        type="text" 
                        value={editTeamName}
                        onChange={(e) => setEditTeamName(e.target.value)}
                        className="pubg-input w-full text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Roster Player IDs</label>
                      {editTeamMembers.map((m, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-orig-yellow w-6 font-mono text-right">P{idx+1}:</span>
                          <input 
                            type="text" 
                            value={m}
                            onChange={(e) => handleTeamMemberChange(idx, e.target.value)}
                            placeholder={`Player ${idx + 1} character tag`}
                            className="pubg-input py-1.5 text-xs w-full"
                          />
                        </div>
                      ))}
                    </div>

                    {rosterError && <p className="text-tan text-[10px] font-bold">{rosterError}</p>}

                    <button
                      type="submit"
                      className="w-full py-2 bg-eb-yellow text-black font-black uppercase text-xs tracking-widest hover:bg-gold transition-colors"
                    >
                      Save Roster Changes
                    </button>
                  </form>
                </div>
              )}

              {/* Squads Listing */}
              <div className="pubg-hud-panel overflow-hidden">
                <div className="bg-black p-4 border-b border-gray-950 flex items-center justify-between">
                  <span className="text-[10px] font-black text-gold uppercase tracking-widest flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-eb-yellow" />
                    Squad Directory
                  </span>
                  <span className="text-[9px] text-gray-400 font-bold uppercase">{teams.length} Roster Profiles</span>
                </div>

                <div className="divide-y divide-gray-950">
                  {teams.map((team) => {
                    const teamRegistrations = registrations.filter(r => r.teamId === team.id);
                    
                    return (
                      <div key={team.id} className="p-4 hover:bg-black/10 transition-colors space-y-4">
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          {/* Team Identity block */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-white uppercase text-sm tracking-wide">{team.name}</h4>
                              <span className="bg-black border border-gray-850 px-2 py-0.5 rounded-sm text-[8px] text-gold font-mono font-bold">
                                CODE: {team.inviteCode}
                              </span>
                            </div>
                            <p className="text-[9px] text-gray-500 uppercase font-black tracking-wider">
                              Captain: {team.captain} | Roster Size: {team.members.length}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {team.members.map((m, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-black/60 border border-gray-900 text-gray-300 font-mono text-[9px]">
                                  {m}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Action controls */}
                          <div className="flex gap-2 self-end md:self-auto">
                            <button
                              onClick={() => handleEditTeamClick(team)}
                              className="px-2.5 py-1.5 rounded-sm bg-gray-950 border border-gray-850 hover:border-eb-yellow text-gray-400 hover:text-eb-yellow font-black uppercase text-[9px] tracking-wider flex items-center gap-1 transition-colors font-semibold"
                            >
                              <Edit className="w-3.5 h-3.5" /> Edit Roster
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete team "${team.name}"? This will delete all their tournament registrations and match scores.`)) {
                                  deleteTeam(team.id);
                                  setSquadSuccess('Squad directory entry deleted.');
                                  setTimeout(() => setSquadSuccess(''), 3000);
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-sm bg-gray-950 border border-gray-850 hover:border-tan text-gray-400 hover:text-tan font-black uppercase text-[9px] tracking-wider flex items-center gap-1 transition-colors font-semibold"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Ban Squad
                            </button>
                          </div>
                        </div>

                        {/* Tournament registration credentials management */}
                        {teamRegistrations.length > 0 && (
                          <div className="bg-black/40 border border-gray-900/60 p-3 rounded-sm space-y-2.5">
                            <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tournament Credentials Control</h5>
                            
                            <div className="divide-y divide-gray-950 space-y-2">
                              {teamRegistrations.map((reg) => {
                                const tourney = tournaments.find(t => t.id === reg.tournamentId) || {};
                                const isEditingRoom = editingRegRoomId === reg.id;

                                return (
                                  <div key={reg.id} className="pt-2 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                    <div className="space-y-0.5">
                                      <span className="font-extrabold text-gray-200 uppercase tracking-wider text-[11px]">
                                        {tourney.title || 'Deleted Tournament'}
                                      </span>
                                      <div className="flex gap-2 items-center">
                                        <span className={`px-1.5 py-0.2 rounded-sm text-[8px] font-black uppercase border ${
                                          reg.status === 'Approved'
                                            ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30'
                                            : 'bg-harvest/15 text-eb-yellow border-harvest'
                                        }`}>
                                          {reg.status}
                                        </span>
                                        {!isEditingRoom && reg.roomInfo && (
                                          <span className="text-[9px] text-gray-500 font-mono font-semibold">
                                            Lobby: ID={reg.roomInfo.roomId} | PASS={reg.roomInfo.roomPass}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Inline credentials editing form */}
                                    {isEditingRoom ? (
                                      <div className="flex flex-wrap gap-2 items-center">
                                        <input
                                          type="text"
                                          placeholder="Room ID"
                                          value={roomNumInput}
                                          onChange={(e) => setRoomNumInput(e.target.value)}
                                          className="pubg-input py-1 px-2 text-[10px] w-24 font-mono bg-black"
                                        />
                                        <input
                                          type="text"
                                          placeholder="Room Pass"
                                          value={roomPassInput}
                                          onChange={(e) => setRoomPassInput(e.target.value)}
                                          className="pubg-input py-1 px-2 text-[10px] w-24 font-mono bg-black"
                                        />
                                        <button
                                          onClick={() => handleSaveRoomCredentials(reg.id)}
                                          className="p-1 px-2 bg-[#10b981] hover:bg-[#059669] text-black font-black uppercase text-[9px] tracking-wider flex items-center gap-0.5 rounded-sm transition-colors font-semibold"
                                        >
                                          <Save className="w-3 h-3" /> Save
                                        </button>
                                        <button
                                          onClick={() => setEditingRegRoomId(null)}
                                          className="p-1 px-2 bg-gray-900 border border-gray-800 text-gray-400 font-bold text-[9px] rounded-sm transition-colors"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ) : (
                                      reg.status === 'Approved' && (
                                        <button
                                          onClick={() => handleEditRoomClick(reg)}
                                          className="px-2 py-0.5 bg-gray-950 border border-gray-850 hover:border-eb-yellow text-[9px] text-gray-400 hover:text-eb-yellow font-black uppercase tracking-wider flex items-center gap-1 rounded-sm transition-colors font-semibold"
                                        >
                                          <Key className="w-3 h-3" /> Edit Lobby Key
                                        </button>
                                      )
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Screenshot Expand Modal Dialog */}
      {zoomReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fadeIn">
          <div className="relative max-w-2xl w-full bg-[#12120e] border border-orig-yellow/20 rounded shadow-glow-gold animate-zoomIn">
            {/* Brackets */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-eb-yellow"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-eb-yellow"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-eb-yellow"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-eb-yellow"></div>

            <div className="bg-black/50 p-4 border-b border-gray-950 flex justify-between items-center">
              <span className="text-[10px] font-black text-gold uppercase tracking-widest flex items-center gap-1.5">
                <FileImage className="w-4 h-4" />
                Receipt Verification Slip
              </span>
              <button
                onClick={() => setZoomReceiptUrl(null)}
                className="text-gray-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 bg-black flex items-center justify-center">
              <img 
                src={zoomReceiptUrl} 
                alt="Receipt Full Preview" 
                className="max-h-[60vh] object-contain rounded border border-gray-900 shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
