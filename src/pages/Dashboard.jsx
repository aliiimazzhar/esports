import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Trophy, DoorOpen, Key, Copy, Check, Upload, AlertTriangle, Shield, CheckCircle, Crosshair, Target } from 'lucide-react';

export default function Dashboard() {
  const { user, fetchUserRegistrations, submitMatchProof } = useContext(AppContext);
  const navigate = useNavigate();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState('');

  // Match proof upload states
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [proofLoading, setProofLoading] = useState(false);
  const [proofError, setProofError] = useState('');
  const [proofSuccess, setProofSuccess] = useState('');

  // Schedules state per event: { [eventId]: scheduleMatches }
  const [schedules, setSchedules] = useState({});
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  // Live timer tick to keep track of current time and automatically unlock lobby details
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000); // Ticks every 1 second to update countdowns
    return () => clearInterval(timer);
  }, []);

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/signin?redirect=dashboard');
    }
  }, [user, navigate]);

  const loadUserRegistrations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetchUserRegistrations(user.uid);
      if (res.ok) {
        setRegistrations(res.data);
      }
    } catch (err) {
      console.error('Error fetching registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserRegistrations();
  }, [user]);

  // Fetch match schedule rotation for all registered tournaments
  useEffect(() => {
    const fetchAllSchedules = async () => {
      if (registrations.length === 0) return;
      setLoadingSchedules(true);
      const newSchedules = {};
      for (const reg of registrations) {
        if (!reg.eventId?._id) continue;
        if (newSchedules[reg.eventId._id]) continue;
        try {
          const response = await fetch(`/api/events/${reg.eventId._id}/group-stage/schedule`);
          if (response.ok) {
            const data = await response.json();
            newSchedules[reg.eventId._id] = data;
          }
        } catch (err) {
          console.error(`Error fetching schedule for event ${reg.eventId._id}:`, err);
        }
      }
      setSchedules(newSchedules);
      setLoadingSchedules(false);
    };

    fetchAllSchedules();
  }, [registrations]);

  const isLobbyOpen = (matchStartTime) => {
    if (!matchStartTime) return false;
    const matchTime = new Date(matchStartTime);
    return (matchTime - now) <= 15 * 60 * 1000;
  };

  const getCountdownStr = (matchDate) => {
    if (!matchDate) return '';
    const matchTime = new Date(matchDate);
    const diff = matchTime - now;

    if (diff <= 0) {
      return 'MATCH LIVE';
    }

    const secs = Math.floor((diff / 1000) % 60);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    let str = '';
    if (days > 0) str += `${days}d `;
    if (hours > 0 || days > 0) str += `${hours}h `;
    str += `${mins}m ${secs}s`;

    return str;
  };

  const getNextMatch = (reg, eventSchedule) => {
    if (!eventSchedule || eventSchedule.length === 0) return null;
    const myGroup = reg.groupStageGroup;
    if (!myGroup) return null;
    const myMatches = eventSchedule.filter(m => {
      return m.matchup.split(' vs ').map(g => g.trim()).includes(myGroup);
    });
    return myMatches
      .filter(m => !m.isPlayed)
      .sort((a, b) => new Date(a.matchDate) - new Date(b.matchDate))[0];
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const handleProofFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProofError('Please upload an image file.');
      setProofFile(null);
      setProofPreview(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProofError('Maximum file size is 5MB.');
      setProofFile(null);
      setProofPreview(null);
      return;
    }

    setProofError('');
    setProofFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleProofSubmit = async (e, registration) => {
    e.preventDefault();
    if (!proofFile) {
      setProofError('Please select a scoreboard screenshot first.');
      return;
    }

    setProofLoading(true);
    setProofError('');
    setProofSuccess('');

    const formData = new FormData();
    formData.append('registrationId', registration._id);
    formData.append('matchProofScreenshot', proofFile);

    try {
      const res = await submitMatchProof(formData);
      if (res.ok) {
        setProofSuccess('Scoreboard proof uploaded successfully!');
        setProofFile(null);
        setProofPreview(null);
        await loadUserRegistrations();
      } else {
        setProofError(res.data?.error || 'Failed to upload scoreboard proof.');
      }
    } catch (err) {
      setProofError('Connection error. Please try again.');
    } finally {
      setProofLoading(false);
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
        
        {/* Header HUD Banner */}
        <div className="border-b border-eb-yellow/30 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold uppercase text-white tracking-wider">
              Dashboard
            </h2>
          </div>
        </div>

        {/* Dashboard Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Registered Tournaments list (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {loading ? (
              <div className="text-center py-12 text-xs text-gray-500 font-mono">Syncing Registry...</div>
            ) : registrations.length > 0 ? (
              registrations.map((reg) => {
                const event = reg.eventId;
                if (!event) return null;
                const eventSchedule = schedules[event._id] || [];
                const nextMatch = getNextMatch(reg, eventSchedule);
                const myGroup = reg.groupStageGroup;

                return (
                  <div key={reg._id} className="pubg-hud-panel p-6 space-y-5 border border-eb-yellow/30 bg-[#12120e]/60">
                    {/* Tournament Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-eb-yellow/30 pb-3 gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-eb-yellow font-black uppercase tracking-wider block">
                          Format: {event.type || 'Squad'} Tournament
                        </span>
                        <h3 className="text-xl font-extrabold uppercase text-white tracking-wide">
                          {event.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 text-[8px] font-black uppercase border rounded-sm ${
                          reg.paymentStatus === 'Approved'
                            ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30'
                            : reg.paymentStatus === 'Rejected'
                              ? 'bg-red-500/10 text-red-500 border-red-500/20'
                              : 'bg-harvest/15 text-eb-yellow border-harvest/30 animate-pulse'
                        }`}>
                          PAYMENT: {reg.paymentStatus}
                        </span>
                        <span className="px-2.5 py-0.5 text-[8px] font-black uppercase bg-eb-yellow/10 text-eb-yellow border border-eb-yellow/20">
                          {event.status === 'active' ? 'OPEN' : event.status?.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Roster & Group Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/60 p-4 border border-eb-yellow/30 text-xs">
                      <div className="space-y-1">
                        <span className="text-[8px] text-gray-500 uppercase font-black block">ROSTER REGISTRATION STATUS</span>
                        <span className="text-xs text-white font-mono font-bold">Roster Lead UID: {reg.trackingUid}</span>
                        {myGroup && (
                          <span className="block text-[10px] text-eb-yellow font-bold uppercase mt-0.5">
                            Group Stage Assignment: Group {myGroup}
                          </span>
                        )}
                      </div>
                      <div className="text-left sm:text-right space-y-0.5">
                        <span className="text-[8px] text-gray-500 uppercase font-black tracking-wider block">Timing</span>
                        <p className="text-white font-bold">{formatDateTime(event.matchStartTime)}</p>
                      </div>
                    </div>

                    {/* Approved -> Show Room Details & Next Match Countdown */}
                    {reg.paymentStatus === 'Approved' ? (
                      <div className="space-y-4">
                        {/* COUNTDOWN TIMER BOX */}
                        {nextMatch && (
                          <div className="p-4 bg-black/60 border border-eb-yellow/30 text-center space-y-2 rounded">
                            <span className="text-[8px] text-gray-500 uppercase font-black tracking-wider block">Your Next Match</span>
                            <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">
                              Match #{nextMatch.matchNumber} ({nextMatch.matchup}) - {nextMatch.map}
                            </h4>
                            <div className="text-2xl font-black text-eb-yellow font-mono tracking-widest animate-pulse">
                              {getCountdownStr(nextMatch.matchDate)}
                            </div>
                            <span className="text-[9px] text-gray-500 font-bold uppercase block mt-1">
                              Starts at: {formatDateTime(nextMatch.matchDate)}
                            </span>
                          </div>
                        )}

                        {/* Lobby Credentials */}
                        <div className="p-4 bg-eb-yellow/[0.02] border border-eb-yellow/30 rounded space-y-3 relative">
                          <div className="absolute top-0 right-0 p-1.5 bg-eb-yellow/10 border-bl border-eb-yellow/30">
                            <Key className="w-3.5 h-3.5 text-eb-yellow" />
                          </div>
                          <h5 className="text-[10px] font-black text-eb-yellow uppercase tracking-widest">Lobby Access Credentials</h5>
                          
                          {nextMatch ? (
                            isLobbyOpen(nextMatch.matchDate) ? (
                              nextMatch.roomId ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="flex items-center justify-between bg-black p-2.5 border border-eb-yellow/30 rounded">
                                    <div>
                                      <span className="text-[8px] text-gray-500 block uppercase font-bold tracking-wider">Room ID (Match #{nextMatch.matchNumber})</span>
                                      <span className="text-sm font-black text-white font-mono">{nextMatch.roomId}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(nextMatch.roomId, `${reg._id}_roomId`)}
                                      className="p-1.5 text-gray-500 hover:text-white"
                                    >
                                      {copiedId === `${reg._id}_roomId` ? <Check className="w-4 h-4 text-eb-yellow" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                  </div>

                                  <div className="flex items-center justify-between bg-black p-2.5 border border-eb-yellow/30 rounded">
                                    <div>
                                      <span className="text-[8px] text-gray-500 block uppercase font-bold tracking-wider">Password</span>
                                      <span className="text-sm font-black text-white font-mono">{nextMatch.roomPassword}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(nextMatch.roomPassword, `${reg._id}_roomPass`)}
                                      className="p-1.5 text-gray-500 hover:text-white"
                                    >
                                      {copiedId === `${reg._id}_roomPass` ? <Check className="w-4 h-4 text-eb-yellow" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-3 bg-black/40 border border-eb-yellow/30 text-center rounded text-gold text-[10px] font-bold">
                                  Lobby is open, but Room credentials have not been configured by the organizer yet.
                                </div>
                              )
                            ) : (
                              <div className="p-3 bg-black/40 border border-eb-yellow/30 text-center rounded text-gray-500 text-xs">
                                Lobby is not open yet. Credentials for Match #{nextMatch.matchNumber} will unlock automatically 15 minutes before the match start time.
                              </div>
                            )
                          ) : (
                            <div className="p-3 bg-black/40 border border-eb-yellow/30 text-center rounded text-gray-500 text-xs">
                              No upcoming matches found for Group {myGroup || 'N/A'}.
                            </div>
                          )}
                        </div>

                        {/* Scoreboard Upload section */}
                        <div className="border-t border-eb-yellow/30 pt-4 space-y-3">
                          <h5 className="text-[10px] font-black text-white uppercase tracking-widest">Submit Post-Match Proof</h5>
                          
                          {reg.matchProofScreenshot ? (
                            <div className="p-3 bg-black/60 border border-eb-yellow/30 flex items-center justify-between text-xs text-gray-400">
                              <span className="flex items-center gap-1.5 text-eb-yellow">
                                <CheckCircle className="w-4 h-4" /> Scoreboard Proof Uploaded
                              </span>
                              <a 
                                href={reg.matchProofScreenshot} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-gray-500 hover:text-white hover:underline text-[10px] uppercase font-bold"
                              >
                                View Submission
                              </a>
                            </div>
                          ) : (
                            <form onSubmit={(e) => handleProofSubmit(e, reg)} className="space-y-3">
                              {proofSuccess && <p className="text-eb-yellow text-[10px] font-bold">{proofSuccess}</p>}
                              {proofError && <p className="text-tan text-[10px] font-bold">{proofError}</p>}
                              
                              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                <div className="flex-1 w-full relative border border-dashed border-eb-yellow/20 hover:border-eb-yellow/30 bg-black/50 p-4 rounded text-center cursor-pointer">
                                  <input 
                                    type="file" 
                                    id={`proof-upload-${reg._id}`}
                                    onChange={handleProofFileChange}
                                    accept="image/*"
                                    className="hidden"
                                    disabled={proofLoading}
                                  />
                                  <label htmlFor={`proof-upload-${reg._id}`} className="cursor-pointer w-full text-center block space-y-1">
                                    {proofPreview ? (
                                      <div className="space-y-1">
                                        <img src={proofPreview} alt="Proof" className="max-h-20 mx-auto rounded" />
                                        <p className="text-[8px] text-eb-yellow font-black uppercase">Change Scoreboard Screenshot</p>
                                      </div>
                                    ) : (
                                      <div className="text-gray-500 space-y-1">
                                        <Upload className="w-5 h-5 text-eb-yellow mx-auto" />
                                        <p className="text-[10px] font-black uppercase text-gray-400">Click to upload scoreboard screenshot</p>
                                        <span className="text-[8px] block">PNG, JPG, JPEG (Max 5MB)</span>
                                      </div>
                                    )}
                                  </label>
                                </div>
                                <button
                                  type="submit"
                                  disabled={proofLoading || !proofFile}
                                  className={`w-full sm:w-auto px-6 py-4 text-black font-black uppercase text-xs tracking-widest ${
                                    proofLoading || !proofFile
                                      ? 'bg-gray-900 text-gray-655 cursor-not-allowed border border-eb-yellow/30'
                                      : 'bg-eb-yellow hover:scale-[1.01]'
                                  }`}
                                >
                                  {proofLoading ? 'Uploading...' : 'Submit Proof'}
                                </button>
                              </div>
                            </form>
                          )}
                        </div>

                        {/* Match Schedule Display */}
                        {eventSchedule.length > 0 && (
                          <div className="border-t border-eb-yellow/30 pt-5 space-y-4">
                            <h4 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-1.5">
                              <Crosshair className="w-4 h-4 text-eb-yellow" /> Match Schedule Rotation
                            </h4>
                            <div className="overflow-x-auto border border-eb-yellow/30 bg-black/60 rounded">
                              <table className="w-full text-left text-xs border-collapse font-sans">
                                <thead>
                                  <tr className="bg-black text-gray-400 font-black uppercase tracking-wider border-b border-eb-yellow/30 text-[9px]">
                                    <th className="p-3">Match</th>
                                    <th className="p-3">Day</th>
                                    <th className="p-3">Matchup</th>
                                    <th className="p-3">Map</th>
                                    <th className="p-3">Date/Time</th>
                                    <th className="p-3">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-eb-yellow/30 text-gray-300">
                                  {eventSchedule.map((m) => {
                                    const isMyMatch = myGroup && m.matchup.split(' vs ').map(g => g.trim()).includes(myGroup);
                                    return (
                                      <tr key={m._id} className={`hover:bg-white/[0.01] transition-colors ${
                                        isMyMatch ? 'bg-eb-yellow/[0.01] border-l-2 border-eb-yellow' : ''
                                      }`}>
                                        <td className="p-3 font-mono font-bold">#{m.matchNumber}</td>
                                        <td className="p-3 font-mono font-semibold">Day {m.dayNumber}</td>
                                        <td className="p-3 font-bold text-white uppercase">
                                          <div className="flex items-center gap-1.5">
                                            {m.matchup}
                                            {isMyMatch && (
                                              <span className="px-1 py-0.2 rounded-sm bg-eb-yellow/10 border border-eb-yellow/30 text-eb-yellow text-[7px] font-black uppercase font-mono">
                                                Your Match
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="p-3 font-bold font-mono text-eb-yellow">{m.map}</td>
                                        <td className="p-3 text-[11px] font-medium text-gray-400">{formatDateTime(m.matchDate)}</td>
                                        <td className="p-3">
                                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black font-mono uppercase ${
                                            m.isPlayed ? 'bg-green-500/10 text-green-400' : 'bg-tan/10 text-gold'
                                          }`}>
                                            {m.isPlayed ? 'Played' : 'Scheduled'}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : reg.paymentStatus === 'Pending' ? (
                      <div className="p-4 bg-black/20 border border-eb-yellow/30 text-center rounded space-y-1.5 text-xs text-gray-500">
                        <DoorOpen className="w-6 h-6 text-gray-700 mx-auto animate-pulse" />
                        <p className="font-bold text-gray-400 uppercase tracking-widest">Audit Underway</p>
                        <p className="font-medium text-[11px] leading-relaxed max-w-xs mx-auto">
                          Your payment screenshot and Transaction ID are being validated. Lobby codes will unlock immediately upon approval.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 bg-red-950/10 border border-red-950 text-center rounded space-y-1 text-xs text-red-500">
                        <AlertTriangle className="w-6 h-6 text-red-500 mx-auto" />
                        <p className="font-bold uppercase tracking-widest">Registration Rejected</p>
                        <p className="text-[11px]">Please contact support or re-register with valid transaction details.</p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-[#12120e]/60 border border-eb-yellow/30 rounded space-y-4">
                <Shield className="w-12 h-12 text-eb-yellow mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-base font-black text-white uppercase tracking-wider">No Registered Tournaments</h4>
                  <p className="text-gray-500 text-xs leading-relaxed max-w-xs mx-auto">
                    You have not registered for any tournaments yet. Head over to the Homepage to find active/open tournaments and secure your slot!
                  </p>
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="pubg-btn-primary px-8"
                >
                  Find Tournaments
                </button>
              </div>
            )}

          </div>

          {/* Right Column: User Registrations History (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* History Panel */}
            <div className="pubg-hud-panel p-6 space-y-4">

              <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-eb-yellow/30 pb-2.5">
                Player History
              </h3>

              {registrations.length > 0 && (() => {
                const approvedRegs = registrations.filter(r => r.paymentStatus === 'Approved');
                const tournamentsPlayed = approvedRegs.length;
                const rankedRegs = approvedRegs.filter(r => r.rank !== null && r.rank !== undefined);
                const avgRank = rankedRegs.length > 0
                  ? (rankedRegs.reduce((sum, r) => sum + r.rank, 0) / rankedRegs.length).toFixed(1)
                  : 'N/A';
                
                let totalKills = 0;
                approvedRegs.forEach(reg => {
                  if (reg.registrationType === 'Team') {
                    const playerIdx = reg.allCharacterIds.findIndex(id => id.trim() === user?.uid?.trim());
                    if (playerIdx !== -1 && reg.playerKills && reg.playerKills[playerIdx] !== undefined) {
                      totalKills += reg.playerKills[playerIdx];
                    }
                  } else {
                    totalKills += reg.points || 0;
                  }
                });

                return (
                  <div className="grid grid-cols-3 gap-2 bg-[#12120e] p-3 border border-eb-yellow/30 rounded text-center">
                    <div className="space-y-1">
                      <span className="text-[8px] text-gray-500 block uppercase font-bold tracking-wider">Played</span>
                      <div className="flex items-center justify-center gap-1 text-white font-black text-sm">
                        <Target className="w-3.5 h-3.5 text-eb-yellow" />
                        {tournamentsPlayed}
                      </div>
                    </div>
                    <div className="space-y-1 border-x border-eb-yellow/30">
                      <span className="text-[8px] text-gray-500 block uppercase font-bold tracking-wider">Avg Rank</span>
                      <div className="flex items-center justify-center gap-1 text-white font-black text-sm">
                        <Trophy className="w-3.5 h-3.5 text-eb-yellow" />
                        {avgRank}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] text-gray-500 block uppercase font-bold tracking-wider">Total Kills</span>
                      <div className="flex items-center justify-center gap-1 text-white font-black text-sm">
                        <Crosshair className="w-3.5 h-3.5 text-eb-yellow" />
                        {totalKills}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {loading ? (
                <div className="text-center py-8 text-xs text-gray-500 font-mono">Syncing Registry...</div>
              ) : registrations.length > 0 ? (
                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                  {registrations.map((reg) => {
                    const isTeam = reg.registrationType === 'Team';
                    let myKills = 0;
                    if (isTeam) {
                      const pIdx = reg.allCharacterIds.findIndex(id => id.trim() === user?.uid?.trim());
                      if (pIdx !== -1 && reg.playerKills && reg.playerKills[pIdx] !== undefined) {
                        myKills = reg.playerKills[pIdx];
                      }
                    } else {
                      myKills = reg.points || 0;
                    }

                    return (
                      <div key={reg._id} className="p-3 bg-black border border-eb-yellow/30 rounded flex flex-col justify-between gap-2 text-xs animate-fadeIn">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-extrabold text-white uppercase truncate text-[11px] leading-tight">{reg.eventId?.title || 'Unknown Event'}</h4>
                            <span className="text-[8px] text-gray-500 block font-bold font-mono mt-0.5">TxID: {reg.transactionId}</span>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded-sm font-black uppercase text-[8px] border flex-shrink-0 ${
                            reg.paymentStatus === 'Approved'
                              ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20'
                              : reg.paymentStatus === 'Rejected'
                                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                : 'bg-harvest/10 text-gold border-harvest/20'
                          }`}>
                            {reg.paymentStatus}
                          </span>
                        </div>
                        
                        {reg.paymentStatus === 'Approved' && (
                          <div className="flex justify-between items-center border-t border-eb-yellow/30 pt-2 text-[10px] font-mono">
                            <span className="text-gray-400">Rank: <strong className="text-white">{reg.rank ? `#${reg.rank}` : 'TBD'}</strong></span>
                            <span className="text-gray-400">Kills: <strong className="text-eb-yellow">{myKills}</strong></span>
                          </div>
                        )}

                        <div className="flex justify-between items-center border-t border-eb-yellow/30 pt-1.5 text-[9px] text-gray-500 font-semibold">
                          <span>{formatDateTime(reg.createdAt)}</span>
                          <span className="uppercase text-gray-500">{reg.registrationType} Format</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-gray-655 font-medium">
                  No registrations found on file.
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
