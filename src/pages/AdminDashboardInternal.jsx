import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { ShieldCheck, Lock, Award, Key, ClipboardCheck, Eye, Check, X, ListOrdered, FileImage, LogOut, ArrowRight, Clipboard, Trash2, Edit } from 'lucide-react';

export default function AdminDashboardInternal() {
  const { 
    events,
    activeEvent, 
    adminPasscode, 
    verifyAdminPasscode, 
    logoutAdmin,
    deployTournament, 
    updateTournament,
    deleteTournament,
    broadcastLobbyDetails, 
    updateLeaderboardHtml,
    fetchPendingRegistrations,
    fetchApprovedRegistrations,
    auditRegistrationStatus,
    fetchMatchProofs,
    getAdminHeaders
  } = useContext(AppContext);

  const navigate = useNavigate();

  // Passcode gate state
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [verifying, setVerifying] = useState(false);
  // Dashboard Tabs: 'registrations' | 'tournaments' | 'leaderboard'
  const [activeTab, setActiveTab] = useState('registrations');
  const [subTabRegistrations, setSubTabRegistrations] = useState('receipts'); // 'receipts' | 'proofs'
  
  // Popup Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // Tab 1: Deployer states
  const [title, setTitle] = useState('');
  const [soloEntryFee, setSoloEntryFee] = useState(1500);
  const [teamEntryFee, setTeamEntryFee] = useState(6000);
  const [numberOfDays, setNumberOfDays] = useState(1);
  const [deadline, setDeadline] = useState('');
  const [startTime, setStartTime] = useState('');
  const [deploySuccess, setDeploySuccess] = useState('');
  const [deployError, setDeployError] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [tourneyStatus, setTourneyStatus] = useState('active');
  const [tourneyType, setTourneyType] = useState('Squad');
  const [map, setMap] = useState('Erangel');
  const [description, setDescription] = useState('');

  // Tab 2: Lobby Broadcaster states
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');

  // Tab 3: Receipts Audit states
  const [pendingRegs, setPendingRegs] = useState([]);
  const [approvedRegs, setApprovedRegs] = useState([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [expandedReceipt, setExpandedReceipt] = useState(null);

  // Tab 4: Proofs states
  const [proofList, setProofList] = useState([]);
  const [loadingProofs, setLoadingProofs] = useState(false);

  // Tab 5: Leaderboard html editor states
  const [leaderHtml, setLeaderHtml] = useState('');
  const [leaderSuccess, setLeaderSuccess] = useState('');
  const [localResults, setLocalResults] = useState({});

  // Local helper to format Date into datetime-local input string
  const toDatetimeLocal = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Synchronize inputs when active event changes
  useEffect(() => {
    if (activeEvent) {
      setRoomId(activeEvent.roomId || '');
      setRoomPassword(activeEvent.roomPassword || '');
      setLeaderHtml(activeEvent.leaderboardHtml || '');
    } else {
      setRoomId('');
      setRoomPassword('');
      setLeaderHtml('');
    }
  }, [activeEvent]);

  // Load pending registrations queue
  const loadPendingRegistrations = useCallback(async () => {
    if (!adminPasscode) return;
    setLoadingRegs(true);
    try {
      const res = await fetchPendingRegistrations();
      if (res.ok) {
        setPendingRegs(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRegs(false);
    }
  }, [adminPasscode, fetchPendingRegistrations]);

  // Load approved registrations list
  const loadApprovedRegistrations = useCallback(async () => {
    if (!adminPasscode) return;
    setLoadingRegs(true);
    try {
      const res = await fetchApprovedRegistrations();
      if (res.ok) {
        setApprovedRegs(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRegs(false);
    }
  }, [adminPasscode, fetchApprovedRegistrations]);

  // Load match proofs
  const loadMatchProofs = useCallback(async () => {
    if (!adminPasscode) return;
    setLoadingProofs(true);
    try {
      const res = await fetchMatchProofs();
      if (res.ok) {
        setProofList(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProofs(false);
    }
  }, [adminPasscode, fetchMatchProofs]);

  // Fetch lists based on tab
  useEffect(() => {
    if (adminPasscode) {
      if (activeTab === 'registrations') {
        if (subTabRegistrations === 'receipts') {
          loadPendingRegistrations();
        } else if (subTabRegistrations === 'approved') {
          loadApprovedRegistrations();
        } else if (subTabRegistrations === 'proofs') {
          loadMatchProofs();
        }
      } else if (activeTab === 'leaderboard') {
        loadApprovedRegistrations();
      }
    }
  }, [activeTab, subTabRegistrations, adminPasscode, loadPendingRegistrations, loadApprovedRegistrations, loadMatchProofs]);

  // Initialize localResults when approvedRegs changes
  useEffect(() => {
    if (approvedRegs) {
      const results = {};
      approvedRegs.forEach(reg => {
        results[reg._id] = {
          rank: reg.rank !== null && reg.rank !== undefined ? reg.rank : '',
          points: reg.points !== null && reg.points !== undefined ? reg.points : '0',
          playerKills: reg.playerKills && reg.playerKills.length > 0
            ? reg.playerKills.map(String)
            : Array(reg.allInGameNames?.length || 1).fill('0')
        };
      });
      setLocalResults(results);
    }
  }, [approvedRegs]);

  // Passcode verification
  const handlePasscodeSubmit = async (e) => {
    e.preventDefault();
    if (!passcodeInput.trim()) return;

    setVerifying(true);
    setPasscodeError('');

    try {
      const res = await verifyAdminPasscode(passcodeInput.trim());
      if (!res.success) {
        setPasscodeError(res.error || 'Access Denied.');
      }
    } catch (err) {
      setPasscodeError('Error validating passcode.');
    } finally {
      setVerifying(false);
    }
  };

  // Action Click Handlers
  const handleAddClick = () => {
    setEditingEvent(null);
    setTitle('');
    setSoloEntryFee(1500);
    setTeamEntryFee(6000);
    setNumberOfDays(1);
    setDeadline('');
    setStartTime('');
    setTourneyStatus('active');
    setTourneyType('Squad');
    setMap('Erangel');
    setDescription('');
    setRoomId('');
    setRoomPassword('');
    setDeploySuccess('');
    setDeployError('');
    setShowModal(true);
  };

  const handleEditClick = (evt) => {
    setEditingEvent(evt);
    setTitle(evt.title || '');
    setSoloEntryFee(evt.soloEntryFee || 0);
    setTeamEntryFee(evt.teamEntryFee || 0);
    setNumberOfDays(evt.numberOfDays || 1);
    setDeadline(toDatetimeLocal(evt.registrationDeadline));
    setStartTime(toDatetimeLocal(evt.matchStartTime));
    setTourneyStatus(evt.status || 'active');
    setTourneyType(evt.type || 'Squad');
    setMap(evt.map || 'Erangel');
    setDescription(evt.description || '');
    setRoomId(evt.roomId || '');
    setRoomPassword(evt.roomPassword || '');
    setDeploySuccess('');
    setDeployError('');
    setShowModal(true);
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tournament?')) return;
    try {
      const res = await deleteTournament(id);
      if (res.ok) {
        alert('Tournament deleted successfully.');
      } else {
        alert(res.error || 'Failed to delete tournament.');
      }
    } catch (err) {
      alert('Connection error.');
    }
  };

  // Tournament Deployment (Save / Create / Edit)
  const handleDeploySubmit = async (e) => {
    e.preventDefault();
    if (!title || soloEntryFee === undefined || teamEntryFee === undefined || !deadline || !startTime) {
      setDeployError('Please enter all tournament parameters.');
      return;
    }

    setDeploying(true);
    setDeployError('');
    setDeploySuccess('');

    const payload = {
      title,
      soloEntryFee: Number(soloEntryFee),
      teamEntryFee: Number(teamEntryFee),
      numberOfDays: Number(numberOfDays),
      registrationDeadline: new Date(deadline).toISOString(),
      matchStartTime: new Date(startTime).toISOString(),
      isActive: true,
      status: tourneyStatus,
      map,
      type: tourneyType,
      description,
      roomId,
      roomPassword
    };

    try {
      let res;
      if (editingEvent) {
        res = await updateTournament(editingEvent._id, payload);
      } else {
        res = await deployTournament(payload);
      }
      if (res.ok) {
        setDeploySuccess(editingEvent ? 'Tournament updated successfully!' : 'Tournament deployed successfully! Old events deactivated.');
        setTitle('');
        setDeadline('');
        setStartTime('');
        setMap('Erangel');
        setDescription('');
        setEditingEvent(null);
        setShowModal(false);
      } else {
        setDeployError(res.error || 'Failed to save tournament.');
      }
    } catch (err) {
      setDeployError('Connection error.');
    } finally {
      setDeploying(false);
    }
  };



  // Receipt Approval / Rejection
  const handleAuditAction = async (id, status) => {
    try {
      const res = await auditRegistrationStatus(id, status);
      if (res.ok) {
        // Refresh queues
        await loadPendingRegistrations();
        await loadApprovedRegistrations();
        if (expandedReceipt && expandedReceipt._id === id) {
          setExpandedReceipt(null);
        }
      } else {
        alert(res.error || 'Audit operation failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Communication error.');
    }
  };

  // Save results (rank and points) for a registered roster
  const handleSaveResults = async (id, rank, points, playerKills) => {
    try {
      const response = await fetch(`/api/admin/registrations/${id}/results`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ 
          rank: rank ? Number(rank) : null, 
          points: points !== undefined ? Number(points) : 0,
          playerKills: playerKills ? playerKills.map(Number) : []
        })
      });
      const data = await response.json();
      if (response.ok) {
        alert('Results updated successfully!');
        loadApprovedRegistrations();
      } else {
        alert(data.error || 'Failed to update results.');
      }
    } catch (err) {
      console.error(err);
      alert('Communication error.');
    }
  };

  // Leaderboard save
  const handleLeaderboardSave = async (e) => {
    e.preventDefault();
    setLeaderSuccess('');
    try {
      const res = await updateLeaderboardHtml(leaderHtml);
      if (res.ok) {
        setLeaderSuccess('Leaderboard HTML updated successfully on Homepage grid!');
      } else {
        alert(res.error || 'Failed to update leaderboard.');
      }
    } catch (err) {
      alert('Connection error.');
    }
  };

  // Gated Access Screen
  if (!adminPasscode) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
        <div className="p-8 max-w-md w-full bg-[#12120e] border border-tan/30 rounded-none relative shadow-lg space-y-6">
          
          {/* Brackets */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-tan !m-0"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-tan !m-0"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-tan !m-0"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-tan !m-0"></div>

          <div className="space-y-2">
            <Lock className="w-12 h-12 text-eb-yellow mx-auto animate-pulse" />
            <h2 className="text-xl font-black uppercase text-white tracking-widest">Admin Panel</h2>
            <p className="text-gray-500 text-[11px] leading-relaxed font-semibold">
              Enter passcode to unlock admin tournament controllers.
            </p>
          </div>

          <form onSubmit={handlePasscodeSubmit} className="space-y-4">
            <input
              type="password"
              value={passcodeInput}
              onChange={(e) => {
                setPasscodeInput(e.target.value);
                if (passcodeError) setPasscodeError('');
              }}
              placeholder="Enter passcode key"
              className="pubg-input w-full text-center"
              disabled={verifying}
              required
            />
            {passcodeError && (
              <p className="text-tan text-[10px] font-black uppercase tracking-wider">{passcodeError}</p>
            )}
            <button
              onClick={handlePasscodeSubmit}
              type="submit"
              disabled={verifying}
              className="pubg-btn-primary w-full text-center"
            >
              {verifying ? 'Decrypting Access...' : 'Unlock Panel'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Admin Dashboard header */}
        <div className="border-b border-gray-900 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold uppercase text-white tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-eb-yellow" />
              Organizer <span className="text-eb-yellow">Dashboard</span>
            </h2>
            <p className="text-gray-500 text-xs font-semibold">Review registrations, audit transaction screenshots, and edit point HTML standings.</p>
          </div>
          <button 
            onClick={() => { logoutAdmin(); navigate('/'); }}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-tan/20 text-gold border border-tan hover:bg-tan/40 text-xs font-black uppercase tracking-widest transition-all rounded-sm self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4 text-eb-yellow" /> Logout Session
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-[#12120e] p-1 border border-white/5">
          <button
            onClick={() => setActiveTab('registrations')}
            className={`flex items-center justify-center gap-2 py-3 font-black text-[10px] uppercase tracking-wider transition-all duration-250 ${
              activeTab === 'registrations'
                ? 'bg-eb-yellow text-black'
                : 'text-gray-400 hover:text-white hover:bg-black/20'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Registrations
          </button>
          
          <button
            onClick={() => setActiveTab('tournaments')}
            className={`flex items-center justify-center gap-2 py-3 font-black text-[10px] uppercase tracking-wider transition-all duration-250 ${
              activeTab === 'tournaments'
                ? 'bg-eb-yellow text-black'
                : 'text-gray-400 hover:text-white hover:bg-black/20'
            }`}
          >
            <Award className="w-4 h-4" />
            Tournaments
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center justify-center gap-2 py-3 font-black text-[10px] uppercase tracking-wider transition-all duration-250 ${
              activeTab === 'leaderboard'
                ? 'bg-eb-yellow text-black'
                : 'text-gray-400 hover:text-white hover:bg-black/20'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            Leaderboard
          </button>
        </div>



        {/* Tab Panels */}
        <div className="mt-4">
          
          {/* TAB 1: REGISTRATIONS */}
          {activeTab === 'registrations' && (
            <div className="space-y-6">
              {/* Sub-tabs header for Registrations */}
              <div className="flex gap-4 border-b border-gray-900 pb-3 overflow-x-auto whitespace-nowrap">
                <button
                  onClick={() => setSubTabRegistrations('receipts')}
                  className={`pb-1 text-xs font-black uppercase tracking-wider transition-colors ${
                    subTabRegistrations === 'receipts'
                      ? 'text-eb-yellow border-b-2 border-eb-yellow'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Receipt clearances ({pendingRegs.length})
                </button>
                <button
                  onClick={() => setSubTabRegistrations('approved')}
                  className={`pb-1 text-xs font-black uppercase tracking-wider transition-colors ${
                    subTabRegistrations === 'approved'
                      ? 'text-eb-yellow border-b-2 border-eb-yellow'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Registered Players ({approvedRegs.length})
                </button>
                <button
                  onClick={() => setSubTabRegistrations('proofs')}
                  className={`pb-1 text-xs font-black uppercase tracking-wider transition-colors ${
                    subTabRegistrations === 'proofs'
                      ? 'text-eb-yellow border-b-2 border-eb-yellow'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Scoreboard Proofs
                </button>
              </div>

              {subTabRegistrations === 'receipts' && (
                <div className="space-y-6 animate-fadeIn">
                  {loadingRegs ? (
                    <div className="text-center py-16 bg-[#12120e] border border-white/5 rounded">
                      <p className="text-gray-500 text-xs font-semibold animate-pulse">Syncing verification queue...</p>
                    </div>
                  ) : pendingRegs.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      
                      {/* Left Column: Chronological list of pending registrations */}
                      <div className="lg:col-span-7 pubg-hud-panel overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-black text-gray-400 font-black uppercase tracking-wider border-b border-gray-900 text-[10px]">
                                <th className="p-4">Tracking UID</th>
                                <th className="p-4">Roster Players</th>
                                <th className="p-4 text-center">Receipt</th>
                                <th className="p-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-950 text-gray-300">
                              {pendingRegs.map((reg) => (
                                <tr 
                                  key={reg._id} 
                                  className={`hover:bg-black/40 transition-colors cursor-pointer ${
                                    expandedReceipt?._id === reg._id ? 'bg-eb-yellow/[0.02] border-l-4 border-l-eb-yellow' : ''
                                  }`}
                                  onClick={() => setExpandedReceipt(reg)}
                                >
                                  <td className="p-4 font-mono font-bold text-white uppercase">{reg.trackingUid}</td>
                                  <td className="p-4">
                                    <span className="font-mono text-gray-400 text-[11px]">
                                      {reg.allCharacterIds.join(', ')}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => setExpandedReceipt(reg)}
                                      className="w-10 h-7 rounded border border-gray-800 bg-black overflow-hidden inline-block"
                                    >
                                      <img src={reg.paymentScreenshot} alt="slip" className="w-full h-full object-cover" />
                                    </button>
                                  </td>
                                  <td className="p-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => handleAuditAction(reg._id, 'Approved')}
                                      className="p-1 px-2 bg-[#10b981] hover:bg-[#059669] text-black font-black uppercase text-[9px] tracking-wider rounded"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleAuditAction(reg._id, 'Rejected')}
                                      className="p-1 px-2 bg-tan hover:bg-[#7e3400] text-white font-black uppercase text-[9px] tracking-wider rounded"
                                    >
                                      Reject
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Right Column: Click-to-expand receipt frame */}
                      <div className="lg:col-span-5">
                        {expandedReceipt ? (
                          <div className="pubg-hud-panel p-6 space-y-4 animate-zoomIn">
                            <div className="border-b border-gray-900 pb-3 flex justify-between items-center">
                              <h4 className="text-xs font-black text-white uppercase tracking-widest">
                                Audit Verification Frame
                              </h4>
                              <button 
                                onClick={() => setExpandedReceipt(null)}
                                className="text-gray-500 hover:text-white font-bold"
                              >
                                ✕
                              </button>
                            </div>

                            <div className="space-y-3">
                              <div className="border border-gray-900 rounded bg-black p-2 text-center">
                                <a href={expandedReceipt.paymentScreenshot} target="_blank" rel="noopener noreferrer" className="block relative group">
                                  <img 
                                    src={expandedReceipt.paymentScreenshot} 
                                    alt="Expanded transaction receipt" 
                                    className="max-h-72 mx-auto rounded object-contain transition-transform group-hover:scale-101"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-black uppercase tracking-wider">
                                    Click to open full size
                                  </div>
                                </a>
                              </div>

                              <div className="bg-black/60 rounded border border-gray-950 p-3 space-y-2 text-xs font-mono">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Reg Type:</span>
                                  <span className="text-white font-bold">{expandedReceipt.registrationType || 'Team'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Tracking UID:</span>
                                  <span className="text-white uppercase font-bold">{expandedReceipt.trackingUid}</span>
                                </div>
                                <div className="flex flex-col border-t border-gray-900 pt-1 mt-1">
                                  <span className="text-gray-500">Roster Details:</span>
                                  <div className="pl-2 space-y-0.5 text-gray-300 mt-0.5">
                                    {expandedReceipt.allCharacterIds.map((uid, index) => (
                                      <div key={index} className="flex justify-between text-[11px]">
                                        <span>{expandedReceipt.allInGameNames?.[index] || 'No Name'}</span>
                                        <span>({uid})</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex justify-between border-t border-gray-900 pt-1">
                                  <span className="text-gray-500">Contact:</span>
                                  <span className="text-white">{expandedReceipt.contactPhoneNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">WhatsApp:</span>
                                  <span className="text-white">{expandedReceipt.whatsappNumber || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Tx ID:</span>
                                  <span className="text-gold font-bold">{expandedReceipt.transactionId || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Submit Time:</span>
                                  <span className="text-white">{new Date(expandedReceipt.createdAt).toLocaleString()}</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                  onClick={() => handleAuditAction(expandedReceipt._id, 'Approved')}
                                  className="py-2.5 bg-[#10b981] hover:bg-[#059669] text-black font-black uppercase text-xs tracking-wider rounded"
                                >
                                  Approve Receipt
                                </button>
                                <button
                                  onClick={() => handleAuditAction(expandedReceipt._id, 'Rejected')}
                                  className="py-2.5 bg-tan hover:bg-[#7e3400] text-white font-black uppercase text-xs tracking-wider rounded"
                                >
                                  Reject Receipt
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-8 border border-dashed border-gray-800 rounded bg-[#12120e]/40 text-center text-xs text-gray-500 font-semibold leading-relaxed">
                            Select a pending registration from the queue table on the left to expand receipt screenshots in this frame.
                          </div>
                        )}
                      </div>

                    </div>
                  ) : (
                    <div className="text-center py-16 bg-[#12120e] border border-white/5 rounded">
                      <p className="text-gray-500 text-xs font-semibold">No pending verification invoice clearances in queue.</p>
                    </div>
                  )}
                </div>
              )}

              {subTabRegistrations === 'approved' && (
                <div className="space-y-6 animate-fadeIn">
                  {loadingRegs ? (
                    <div className="text-center py-16 bg-[#12120e] border border-white/5 rounded">
                      <p className="text-gray-500 text-xs font-semibold animate-pulse">Syncing registered roster list...</p>
                    </div>
                  ) : approvedRegs.length > 0 ? (
                    <div className="pubg-hud-panel overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-black text-gray-400 font-black uppercase tracking-wider border-b border-gray-900 text-[10px]">
                              <th className="p-4">Tracking UID</th>
                              <th className="p-4">Type</th>
                              <th className="p-4">Roster / Players</th>
                              <th className="p-4">WhatsApp</th>
                              <th className="p-4 font-mono">Transaction ID</th>
                              <th className="p-4 text-center">Receipt</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-950 text-gray-300">
                            {approvedRegs.map((reg) => (
                              <tr key={reg._id} className="hover:bg-black/40 transition-colors">
                                <td className="p-4 font-mono font-bold text-white uppercase">{reg.trackingUid}</td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono ${
                                    reg.registrationType === 'Solo' ? 'bg-eb-yellow/10 text-eb-yellow' : 'bg-blue-500/10 text-blue-400'
                                  }`}>
                                    {reg.registrationType || 'Team'}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <div className="space-y-1">
                                    {reg.allCharacterIds.map((uid, index) => (
                                      <div key={index} className="text-[11px] font-mono">
                                        <span className="text-white font-bold">{reg.allInGameNames?.[index] || 'No Name'}</span>
                                        <span className="text-gray-500 ml-1">({uid})</span>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-4 font-mono">{reg.whatsappNumber || 'N/A'}</td>
                                <td className="p-4 font-mono text-gold font-bold">{reg.transactionId || 'N/A'}</td>
                                <td className="p-4 text-center">
                                  <a href={reg.paymentScreenshot} target="_blank" rel="noopener noreferrer" className="w-10 h-7 rounded border border-gray-800 bg-black overflow-hidden inline-block hover:border-eb-yellow transition-colors">
                                    <img src={reg.paymentScreenshot} alt="slip" className="w-full h-full object-cover" />
                                  </a>
                                </td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => handleAuditAction(reg._id, 'Rejected')}
                                    className="p-1 px-2.5 bg-tan hover:bg-[#7e3400] text-white font-black uppercase text-[9px] tracking-wider rounded transition-colors"
                                  >
                                    Revoke
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-[#12120e] border border-white/5 rounded">
                      <p className="text-gray-500 text-xs font-semibold">No approved registered players found.</p>
                    </div>
                  )}
                </div>
              )}

              {subTabRegistrations === 'proofs' && (
                <div className="space-y-6 animate-fadeIn">
                  {loadingProofs ? (
                    <div className="text-center py-16 bg-[#12120e] border border-white/5 rounded">
                      <p className="text-gray-500 text-xs font-semibold animate-pulse">Scanning scoreboard proofs...</p>
                    </div>
                  ) : proofList.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {proofList.map((proof) => (
                        <div key={proof._id} className="pubg-hud-panel cyber-card p-4 space-y-3">
                          <div className="flex justify-between items-start border-b border-gray-900 pb-2">
                            <div>
                              <span className="text-[8px] text-gray-500 uppercase font-black">Roster Tracking UID</span>
                              <h4 className="text-xs font-mono font-bold text-white uppercase truncate max-w-[150px]">{proof.trackingUid}</h4>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-eb-yellow/10 text-eb-yellow border border-eb-yellow/20 text-[8px] font-black uppercase font-mono">
                              Submitted
                            </span>
                          </div>

                          <div className="border border-gray-950 bg-black rounded p-1.5 text-center">
                            <a href={proof.matchProofScreenshot} target="_blank" rel="noopener noreferrer" className="block relative group">
                              <img 
                                src={proof.matchProofScreenshot} 
                                alt="Match proof scoreboard screenshot" 
                                className="max-h-44 mx-auto rounded object-contain"
                              />
                              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[8px] font-black uppercase">
                                Click to expand image
                              </div>
                            </a>
                          </div>

                          <div className="text-[9px] text-gray-500 space-y-0.5 font-mono">
                            <div className="flex justify-between">
                              <span>Phone:</span>
                              <span className="text-gray-305 text-gray-300 font-bold">{proof.contactPhoneNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Roster:</span>
                              <span className="text-gray-350 text-gray-300 truncate max-w-[180px]">{proof.allCharacterIds.join(', ')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Timestamp:</span>
                              <span className="text-gray-300">{new Date(proof.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-[#12120e] border border-white/5 rounded">
                      <p className="text-gray-500 text-xs font-semibold">No match scoreboard screenshots have been submitted yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TOURNAMENTS */}
          {activeTab === 'tournaments' && (
            <div className="space-y-6">
              
              {/* Header Actions */}
              <div className="flex justify-between items-center border-b border-gray-900 pb-4">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">
                    Manage Tournaments
                  </h3>
                  <p className="text-gray-500 text-[10px] font-semibold mt-0.5">
                    Create new campaigns, modify active details, or remove obsolete events.
                  </p>
                </div>
                <button
                  onClick={handleAddClick}
                  className="pubg-btn-primary py-2 px-6 font-black text-xs tracking-wider"
                >
                  Add Tournament
                </button>
              </div>

              {deploySuccess && (
                <div className="p-3 bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 rounded-sm text-xs font-semibold animate-fadeIn">
                  {deploySuccess}
                </div>
              )}

              {/* Tournament List Table */}
              <div className="pubg-hud-panel overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-black text-gray-400 font-black uppercase tracking-wider border-b border-gray-900 text-[10px]">
                        <th className="p-4">Tournament Title</th>
                        <th className="p-4">Map</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Solo / Team Fee</th>
                        <th className="p-4 text-center">Days</th>
                        <th className="p-4">Match Start</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-950 text-gray-300 font-medium">
                      {events && events.length > 0 ? (
                        events.map((evt) => (
                          <tr key={evt._id} className="hover:bg-black/40 transition-colors">
                            <td className="p-4 font-bold text-white uppercase">{evt.title}</td>
                            <td className="p-4 font-mono uppercase text-eb-yellow text-[11px]">{evt.map || 'Erangel'}</td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 rounded-sm bg-black border border-gray-800 text-gold text-[9px] font-black uppercase tracking-wider font-mono">
                                {evt.type || 'Squad'}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-sm font-black text-[9px] uppercase tracking-wider ${
                                evt.status === 'live'
                                  ? 'bg-red-600 text-white animate-pulse'
                                  : evt.status === 'active'
                                  ? 'bg-eb-yellow text-black'
                                  : 'bg-gray-800 text-gray-400'
                              }`}>
                                {evt.status}
                              </span>
                            </td>
                            <td className="p-4 font-mono text-[11px]">
                              S: PKR {evt.soloEntryFee?.toLocaleString()} <br/>
                              T: PKR {evt.teamEntryFee?.toLocaleString()}
                            </td>
                            <td className="p-4 text-center font-mono">{evt.numberOfDays || 1}</td>
                            <td className="p-4 font-mono text-[11px]">
                              {new Date(evt.matchStartTime).toLocaleDateString()} {new Date(evt.matchStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="p-4 text-right space-x-2">
                              <button
                                onClick={() => handleEditClick(evt)}
                                className="p-1.5 bg-eb-yellow hover:scale-[1.05] text-black font-black uppercase text-[10px] rounded inline-flex items-center gap-1 transition-all duration-300"
                                title="Edit Tournament"
                              >
                                <Edit className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteEvent(evt._id)}
                                className="p-1.5 bg-tan hover:scale-[1.05] text-white font-black uppercase text-[10px] rounded inline-flex items-center gap-1 transition-all duration-300"
                                title="Delete Tournament"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center p-12 text-gray-500 font-semibold">
                            No tournaments configured. Click "Add Tournament" to deploy.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add / Edit Popup Modal Backdrop */}
              {showModal && (
                <div className="fixed inset-0 bg-black/80 flex justify-center items-start overflow-y-auto z-[100] p-4 backdrop-blur-sm">
                  <div className="pubg-hud-panel p-6 max-w-lg w-full space-y-5 animate-zoomIn my-8 bg-[#12120e] relative border-2 border-eb-yellow">
                    
                    {/* HUD Corner Brackets */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-eb-yellow"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-eb-yellow"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-eb-yellow"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-eb-yellow"></div>

                    <div className="border-b border-gray-900 pb-3 flex justify-between items-center">
                      <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Award className="w-5 h-5 text-eb-yellow" />
                        {editingEvent ? 'Edit Tournament Event' : 'Add New Tournament Event'}
                      </h3>
                      <button
                        onClick={() => setShowModal(false)}
                        className="text-gray-500 hover:text-white font-black text-sm p-1"
                      >
                        ✕
                      </button>
                    </div>

                    {deployError && (
                      <div className="p-3 bg-tan/10 border border-tan/30 text-gold text-xs font-bold rounded-sm animate-fadeIn">
                        {deployError}
                      </div>
                    )}

                    <form onSubmit={handleDeploySubmit} className="space-y-4">
                      
                      {/* Event Name */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Event Name</label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g. Squad Tactics Arena Showdown"
                          className="pubg-input w-full text-xs"
                          required
                        />
                      </div>

                      {/* Map & Type Selector Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Select Map</label>
                          <select
                            value={map}
                            onChange={(e) => setMap(e.target.value)}
                            className="pubg-input w-full text-xs bg-black cursor-pointer uppercase font-mono"
                          >
                            <option value="Erangel">Erangel</option>
                            <option value="Livik">Livik</option>
                            <option value="Miramar">Miramar</option>
                            <option value="Rondo">Rondo</option>
                            <option value="Sanhok">Sanhok</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Tournament Type</label>
                          <select
                            value={tourneyType}
                            onChange={(e) => setTourneyType(e.target.value)}
                            className="pubg-input w-full text-xs bg-black cursor-pointer uppercase"
                          >
                            <option value="Solo">Solo</option>
                            <option value="Squad">Squad</option>
                          </select>
                        </div>
                      </div>

                      {/* Reg Fee & Status */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Solo Registration Fee (PKR)</label>
                          <input
                            type="number"
                            min="0"
                            value={soloEntryFee}
                            onChange={(e) => setSoloEntryFee(Number(e.target.value))}
                            className="pubg-input w-full font-mono text-xs"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Team Registration Fee (PKR)</label>
                          <input
                            type="number"
                            min="0"
                            value={teamEntryFee}
                            onChange={(e) => setTeamEntryFee(Number(e.target.value))}
                            className="pubg-input w-full font-mono text-xs"
                            required
                          />
                        </div>
                      </div>

                      {/* Number of Days & Status */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Number of Days</label>
                          <input
                            type="number"
                            min="1"
                            value={numberOfDays}
                            onChange={(e) => setNumberOfDays(Number(e.target.value))}
                            className="pubg-input w-full font-mono text-xs"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Status</label>
                          <select
                            value={tourneyStatus}
                            onChange={(e) => setTourneyStatus(e.target.value)}
                            className="pubg-input w-full text-xs bg-black cursor-pointer"
                          >
                            <option value="active">Active (Registration Open)</option>
                            <option value="upcoming">Upcoming (More Events List)</option>
                            <option value="live">Live (Currently Played)</option>
                          </select>
                        </div>
                      </div>

                      {/* Deadline & Match Timing */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Registration Deadline</label>
                          <input
                            type="datetime-local"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            onClick={(e) => e.target.showPicker()}
                            onFocus={(e) => e.target.showPicker()}
                            className="pubg-input w-full text-xs font-mono uppercase cursor-pointer"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Match Timing</label>
                          <input
                            type="datetime-local"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            onClick={(e) => e.target.showPicker()}
                            onFocus={(e) => e.target.showPicker()}
                            className="pubg-input w-full text-xs font-mono uppercase cursor-pointer"
                            required
                          />
                        </div>
                      </div>

                      {/* Lobby Room Credentials */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Lobby Room ID</label>
                          <input
                            type="text"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            placeholder="Enter Room ID"
                            className="pubg-input w-full font-mono text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Lobby Password</label>
                          <input
                            type="text"
                            value={roomPassword}
                            onChange={(e) => setRoomPassword(e.target.value)}
                            placeholder="Enter Password"
                            className="pubg-input w-full font-mono text-xs"
                          />
                        </div>
                      </div>

                      {/* Description / Rules */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Description / Rules</label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Write tournament description, rule sets, maps, coordinates, or guidelines..."
                          className="pubg-input w-full text-xs h-24 font-sans leading-normal"
                        />
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowModal(false)}
                          className="py-2.5 bg-black border border-gray-800 hover:border-tan text-white font-black uppercase text-xs tracking-wider rounded transition-all duration-300 hover:scale-[1.02]"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={deploying}
                          className="py-2.5 bg-eb-yellow text-black font-black uppercase text-xs tracking-wider rounded transition-all duration-300 hover:scale-[1.02]"
                        >
                          {deploying ? 'Saving...' : editingEvent ? 'Update Tournament' : 'Add Tournament'}
                        </button>
                      </div>

                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: LEADERBOARD MANUAL RESULT BUILDER */}
          {activeTab === 'leaderboard' && (
            <div className="pubg-hud-panel p-6 max-w-4xl mx-auto space-y-5 animate-fadeIn">
              <div className="border-b border-gray-900 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <ListOrdered className="w-5 h-5 text-eb-yellow" />
                    Tournament Results Standings Manager
                  </h3>
                  <p className="text-gray-500 text-[10px] font-semibold mt-0.5">
                    Manually assign ranks and points to approved team/solo rosters. Standings sync instantly to the Homepage.
                  </p>
                </div>
              </div>

              {!activeEvent ? (
                <div className="text-center py-12 bg-black/40 border border-gray-900 rounded text-gray-550 text-xs">
                  No active tournament configured. Ranks can only be assigned to approved rosters in active matches.
                </div>
              ) : approvedRegs.length > 0 ? (
                <div className="overflow-x-auto border border-gray-900 rounded bg-black/40">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-black text-gray-400 font-black uppercase tracking-wider border-b border-gray-900 text-[10px]">
                        <th className="p-4">Roster Lead (UID)</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Roster Players</th>
                        <th className="p-4 text-center w-24">Assign Rank</th>
                        <th className="p-4 text-center w-60">{activeEvent.type === 'Squad' ? 'Kills per Player' : 'Assign Points'}</th>
                        <th className="p-4 text-right w-24">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-950 text-gray-300">
                      {approvedRegs.map((reg) => (
                        <tr key={reg._id} className="hover:bg-black/40 transition-colors">
                          <td className="p-4 font-mono font-bold text-white uppercase">{reg.trackingUid}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono ${
                              reg.registrationType === 'Solo' ? 'bg-eb-yellow/10 text-eb-yellow' : 'bg-blue-500/10 text-blue-400'
                            }`}>
                              {reg.registrationType || 'Team'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1 text-[11px]">
                              {reg.allInGameNames?.map((name, pIdx) => (
                                <span key={pIdx} className="inline-block bg-white/[0.02] border border-white/5 px-1.5 py-0.5 rounded-sm mr-1 font-mono">
                                  {name} ({reg.allCharacterIds?.[pIdx]})
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <input
                              type="number"
                              min="1"
                              value={localResults[reg._id]?.rank || ''}
                              onChange={(e) => setLocalResults(prev => ({
                                ...prev,
                                [reg._id]: {
                                  ...prev[reg._id],
                                  rank: e.target.value
                                }
                              }))}
                              placeholder="N/A"
                              className="pubg-input w-20 text-center font-mono py-1 text-xs"
                            />
                          </td>
                          <td className="p-4 text-center">
                            {activeEvent.type === 'Squad' ? (
                              <div className="flex flex-col gap-1.5 min-w-[220px] text-left mx-auto">
                                {reg.allInGameNames?.map((name, pIdx) => (
                                  <div key={pIdx} className="flex items-center justify-between gap-2 text-[10px]">
                                    <span className="text-gray-400 font-mono truncate max-w-[120px]">{name}:</span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={localResults[reg._id]?.playerKills?.[pIdx] || '0'}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setLocalResults(prev => {
                                          const currentKills = [...(prev[reg._id]?.playerKills || [])];
                                          currentKills[pIdx] = val;
                                          return {
                                            ...prev,
                                            [reg._id]: {
                                              ...prev[reg._id],
                                              playerKills: currentKills
                                            }
                                          };
                                        });
                                      }}
                                      className="pubg-input w-16 text-center font-mono py-0.5 text-[10px]"
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                value={localResults[reg._id]?.points || '0'}
                                onChange={(e) => setLocalResults(prev => ({
                                  ...prev,
                                  [reg._id]: {
                                    ...prev[reg._id],
                                    points: e.target.value
                                  }
                                }))}
                                placeholder="0"
                                className="pubg-input w-20 text-center font-mono py-1 text-xs"
                              />
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleSaveResults(
                                reg._id,
                                localResults[reg._id]?.rank,
                                localResults[reg._id]?.points,
                                localResults[reg._id]?.playerKills
                              )}
                              className="px-3 py-1 bg-eb-yellow hover:scale-[1.03] text-black font-black uppercase text-[9px] tracking-wider rounded transition-all duration-200"
                            >
                              Save
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 bg-[#12120e] border border-white/5 rounded text-gray-500 text-xs">
                  No approved registrations found in active tournament to rank.
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
