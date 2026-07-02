import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { ShieldCheck, Lock, Award, Key, ClipboardCheck, Eye, Check, X, ListOrdered, FileImage, LogOut, ArrowRight, Clipboard, Trash2, Edit, Users, Gamepad2 } from 'lucide-react';

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
    fetchSignedUpUsers,
    deleteSignedUpUser,
    fetchCustomLeaderboard,
    addCustomLeaderboardEntry,
    updateCustomLeaderboardEntry,
    deleteCustomLeaderboardEntry,
    clearCustomLeaderboard,
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
  const [subTabTournaments, setSubTabTournaments] = useState('solo'); // 'solo' | 'squad'
  
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
  const [tourneyStatus, setTourneyStatus] = useState('open');
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

  // Signed up users states
  const [signedUpUsers, setSignedUpUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Custom Leaderboard states
  const [customStandings, setCustomStandings] = useState([]);
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [leaderboardMode, setLeaderboardMode] = useState('custom');
  const [customTourneyName, setCustomTourneyName] = useState('');
  const [customDayNum, setCustomDayNum] = useState(1);
  const [customTeams, setCustomTeams] = useState([]);
  const [teamRank, setTeamRank] = useState('');
  const [teamNumber, setTeamNumber] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamKills, setTeamKills] = useState('');
  const [teamPlacementPts, setTeamPlacementPts] = useState('');
  const [teamTotalPts, setTeamTotalPts] = useState('');
  const [players, setPlayers] = useState([
    { name: '', uid: '', kills: 0 },
    { name: '', uid: '', kills: 0 },
    { name: '', uid: '', kills: 0 },
    { name: '', uid: '', kills: 0 }
  ]);
  const [editingTeamIndex, setEditingTeamIndex] = useState(null);
  const [editingCustomId, setEditingCustomId] = useState(null);

  // Group Stage states & Custom matches
  const [selectedMatchTournamentId, setSelectedMatchTournamentId] = useState('');
  const [groupStageMatches, setGroupStageMatches] = useState([]);
  const [loadingGroupStageMatches, setLoadingGroupStageMatches] = useState(false);
  const [seedingSuccess, setSeedingSuccess] = useState('');
  const [seedingError, setSeedingError] = useState('');
  
  // Custom Match fields
  const [newMatchNum, setNewMatchNum] = useState('');
  const [newMatchDay, setNewMatchDay] = useState(1);
  const [newMatchDate, setNewMatchDate] = useState('');
  const [newMatchup, setNewMatchup] = useState('A vs B');
  const [newMatchMap, setNewMatchMap] = useState('Erangel');
  const [newMatchRoomId, setNewMatchRoomId] = useState('');
  const [newMatchRoomPass, setNewMatchRoomPass] = useState('');
  const [matchCreateError, setMatchCreateError] = useState('');
  const [matchCreateSuccess, setMatchCreateSuccess] = useState('');

  // Editing Match states
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [editMatchRoomId, setEditMatchRoomId] = useState('');
  const [editMatchRoomPass, setEditMatchRoomPass] = useState('');
  const [editMatchDate, setEditMatchDate] = useState('');
  const [editMatchMap, setEditMatchMap] = useState('Erangel');
  const [editMatchup, setEditMatchup] = useState('A vs B');
  const [editMatchNum, setEditMatchNum] = useState('');
  const [newMatchGroup1, setNewMatchGroup1] = useState('A');
  const [newMatchGroup2, setNewMatchGroup2] = useState('B');
  const [editMatchGroup1, setEditMatchGroup1] = useState('A');
  const [editMatchGroup2, setEditMatchGroup2] = useState('B');

  // Active Seeding / Day tab
  const [activeDayTab, setActiveDayTab] = useState(1);

  const [selectedGroupMatch, setSelectedGroupMatch] = useState(null);
  const [matchScoresInput, setMatchScoresInput] = useState([]);
  const [matchScoringSuccess, setMatchScoringSuccess] = useState('');
  const [matchScoringError, setMatchScoringError] = useState('');

  const currentTourneyId = selectedMatchTournamentId || activeEvent?._id || (events && events[0]?._id);
  const selectedTournament = events?.find(e => e._id === currentTourneyId);

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
      setLeaderboardMode('active');
    } else {
      setRoomId('');
      setRoomPassword('');
      setLeaderHtml('');
      setLeaderboardMode('custom');
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
      if (activeTab === 'matches' && selectedMatchTournamentId) {
        const response = await fetch(`/api/admin/events/${selectedMatchTournamentId}/registrations/approved`, {
          headers: getAdminHeaders()
        });
        if (response.ok) {
          const data = await response.json();
          setApprovedRegs(data);
        }
      } else {
        const res = await fetchApprovedRegistrations();
        if (res.ok) {
          setApprovedRegs(res.data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRegs(false);
    }
  }, [adminPasscode, activeTab, selectedMatchTournamentId, fetchApprovedRegistrations, getAdminHeaders]);

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

  // Load signed-up users list
  const loadSignedUpUsers = useCallback(async () => {
    if (!adminPasscode) return;
    setLoadingUsers(true);
    try {
      const res = await fetchSignedUpUsers();
      if (res.ok) {
        setSignedUpUsers(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  }, [adminPasscode, fetchSignedUpUsers]);

  // Load custom leaderboard list
  const loadCustomLeaderboard = useCallback(async () => {
    if (!adminPasscode) return;
    setLoadingCustom(true);
    try {
      const res = await fetchCustomLeaderboard();
      if (res.ok) {
        setCustomStandings(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCustom(false);
    }
  }, [adminPasscode, fetchCustomLeaderboard]);

  // Load group stage schedule/matches
  const loadGroupStageMatches = useCallback(async () => {
    if (!selectedMatchTournamentId) return;
    setLoadingGroupStageMatches(true);
    try {
      const response = await fetch(`/api/events/${selectedMatchTournamentId}/group-stage/schedule`);
      if (response.ok) {
        const data = await response.json();
        setGroupStageMatches(data);
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setLoadingGroupStageMatches(false);
    }
  }, [selectedMatchTournamentId]);

  const handleAutoGroupSequential = async () => {
    setSeedingSuccess('');
    setSeedingError('');
    try {
      const response = await fetch(`/api/admin/events/${selectedMatchTournamentId}/seeding`, {
        method: 'PUT',
        headers: getAdminHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        setSeedingSuccess('Auto-grouped successfully!');
        loadApprovedRegistrations();
      } else {
        setSeedingError(data.error || 'Failed to auto-group.');
      }
    } catch (err) {
      console.error(err);
      setSeedingError('Connection error.');
    }
  };

  const handleCreateMatchSubmit = async (e) => {
    e.preventDefault();
    setMatchCreateError('');
    setMatchCreateSuccess('');
    if (!newMatchNum || !newMatchDate || !newMatchup || !newMatchMap) {
      setMatchCreateError('Please fill in all required fields.');
      return;
    }

    const isSolo = selectedTournament?.type === 'Solo';
    if (!isSolo && newMatchGroup1 === newMatchGroup2) {
      setMatchCreateError('Matchup groups cannot be the same!');
      return;
    }
    const matchupVal = isSolo ? newMatchup : `${newMatchGroup1} vs ${newMatchGroup2}`;

    try {
      const response = await fetch(`/api/admin/events/${selectedMatchTournamentId}/group-stage/matches`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          matchNumber: Number(newMatchNum),
          dayNumber: Number(newMatchDay),
          matchDate: new Date(newMatchDate).toISOString(),
          matchup: matchupVal,
          map: newMatchMap,
          roomId: newMatchRoomId,
          roomPassword: newMatchRoomPass
        })
      });
      const data = await response.json();
      if (response.ok) {
        setMatchCreateSuccess('Match Added');
        setNewMatchNum('');
        setNewMatchRoomId('');
        setNewMatchRoomPass('');
        loadGroupStageMatches();
      } else {
        setMatchCreateError(data.error || 'Failed to create match.');
      }
    } catch (err) {
      console.error(err);
      setMatchCreateError('Connection error.');
    }
  };

  const handleUpdateMatchDetails = async (e, matchId) => {
    e.preventDefault();
    const isSolo = selectedTournament?.type === 'Solo';
    let matchupVal = editMatchup;
    if (!isSolo) {
      if (editMatchGroup1 === editMatchGroup2) {
        alert('Matchup groups cannot be the same!');
        return;
      }
      matchupVal = `${editMatchGroup1} vs ${editMatchGroup2}`;
    }

    try {
      const payload = {
        roomId: editMatchRoomId,
        roomPassword: editMatchRoomPass
      };
      if (editMatchDate) payload.matchDate = new Date(editMatchDate).toISOString();
      if (editMatchMap) payload.map = editMatchMap;
      if (matchupVal) payload.matchup = matchupVal;
      if (editMatchNum) payload.matchNumber = Number(editMatchNum);

      const response = await fetch(`/api/admin/events/active/group-stage/matches/${matchId}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setEditingMatchId(null);
        loadGroupStageMatches();
      }
    } catch (err) {
      console.error('Error updating match details:', err);
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm('Are you sure you want to delete this match?')) return;
    try {
      const response = await fetch(`/api/admin/events/active/group-stage/matches/${matchId}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      });
      if (response.ok) {
        loadGroupStageMatches();
      }
    } catch (err) {
      console.error('Error deleting match:', err);
    }
  };

  const handleSelectMatchForScoring = (match) => {
    setSelectedGroupMatch(match);
    const matchupStr = match.matchup;
    const groups = matchupStr.split(' vs ').map(g => g.trim());
    const playingTeams = (selectedTournament?.type === 'Solo' || activeEvent?.type === 'Solo')
      ? approvedRegs
      : approvedRegs.filter(reg => groups.includes(reg.groupStageGroup));

    const initializedScores = playingTeams.map(team => {
      const existingScore = match.scores?.find(s => s.registrationId === team._id);
      return {
        registrationId: team._id,
        teamName: team.allInGameNames?.[0] || 'Unknown',
        kills: existingScore ? existingScore.kills : 0,
        placement: existingScore ? existingScore.placement : 16
      };
    });
    setMatchScoresInput(initializedScores);
  };

  const handleSaveGroupMatchScores = async (e) => {
    e.preventDefault();
    setMatchScoringSuccess('');
    setMatchScoringError('');
    try {
      const response = await fetch(`/api/admin/events/active/group-stage/matches/${selectedGroupMatch._id}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ scores: matchScoresInput })
      });
      const data = await response.json();
      if (response.ok) {
        setMatchScoringSuccess('Match scores saved successfully!');
        setSelectedGroupMatch(null);
        loadGroupStageMatches();
      } else {
        setMatchScoringError(data.error || 'Failed to save scores.');
      }
    } catch (err) {
      console.error(err);
      setMatchScoringError('Connection error.');
    }
  };

  // Initialize selectedMatchTournamentId when activeTab becomes 'matches'
  useEffect(() => {
    if (activeTab === 'matches' && !selectedMatchTournamentId) {
      if (activeEvent) {
        setSelectedMatchTournamentId(activeEvent._id);
      } else if (events && events.length > 0) {
        setSelectedMatchTournamentId(events[0]._id);
      }
    }
  }, [activeTab, activeEvent, events, selectedMatchTournamentId]);

  // Set default matchup type based on selected tournament
  useEffect(() => {
    if (selectedTournament) {
      if (selectedTournament.type === 'Solo') {
        setNewMatchup('Solo Lobby');
      } else {
        setNewMatchup('A vs B');
      }
    }
  }, [selectedTournament]);

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
      } else if (activeTab === 'users') {
        loadSignedUpUsers();
      } else if (activeTab === 'leaderboard') {
        loadApprovedRegistrations();
        loadCustomLeaderboard();
      } else if (activeTab === 'matches') {
        loadApprovedRegistrations();
        loadGroupStageMatches();
      }
    }
  }, [activeTab, subTabRegistrations, adminPasscode, selectedMatchTournamentId, loadPendingRegistrations, loadApprovedRegistrations, loadMatchProofs, loadSignedUpUsers, loadCustomLeaderboard, loadGroupStageMatches]);



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
    setSoloEntryFee('');
    setTeamEntryFee('');
    setNumberOfDays(1);
    setDeadline('');
    setStartTime('');
    setTourneyStatus('open');
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
    setTourneyStatus(evt.status || 'open');
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

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user account?')) return;
    try {
      const res = await deleteSignedUpUser(id);
      if (res.ok) {
        alert('User account deleted successfully.');
        loadSignedUpUsers();
      } else {
        alert(res.error || 'Failed to delete user account.');
      }
    } catch (err) {
      alert('Connection error.');
    }
  };

  const resetTeamSubForm = () => {
    setTeamRank('');
    setTeamNumber('');
    setTeamName('');
    setTeamKills('');
    setTeamPlacementPts('');
    setTeamTotalPts('');
    setPlayers([
      { name: '', uid: '', kills: 0 },
      { name: '', uid: '', kills: 0 },
      { name: '', uid: '', kills: 0 },
      { name: '', uid: '', kills: 0 }
    ]);
    setEditingTeamIndex(null);
  };

  const handleAddTeamToList = (e) => {
    e.preventDefault();
    if (!teamRank || !teamNumber || !teamName) {
      alert('Rank, Team Number, and Team Name are required.');
      return;
    }
    for (let i = 0; i < 4; i++) {
      if (!players[i].name || !players[i].uid) {
        alert(`Please fill Player ${i + 1} Name and Character UID.`);
        return;
      }
    }

    const kills = players.reduce((sum, p) => sum + Number(p.kills || 0), 0);
    const placement = Number(teamPlacementPts || 0);
    const total = teamTotalPts !== '' ? Number(teamTotalPts) : (kills + placement);

    const teamEntry = {
      rank: Number(teamRank),
      teamNumber: Number(teamNumber),
      teamName,
      players: players,
      kills,
      placementPoints: placement,
      totalPoints: total
    };

    if (editingTeamIndex !== null) {
      const updated = [...customTeams];
      updated[editingTeamIndex] = teamEntry;
      updated.sort((a, b) => a.rank - b.rank);
      setCustomTeams(updated);
    } else {
      const updated = [...customTeams, teamEntry];
      updated.sort((a, b) => a.rank - b.rank);
      setCustomTeams(updated);
    }

    resetTeamSubForm();
  };

  const handleEditTeamFromList = (idx) => {
    const entry = customTeams[idx];
    setTeamRank(entry.rank);
    setTeamNumber(entry.teamNumber);
    setTeamName(entry.teamName);
    setTeamKills(entry.kills);
    setTeamPlacementPts(entry.placementPoints);
    setTeamTotalPts(entry.totalPoints);
    setPlayers(entry.players);
    setEditingTeamIndex(idx);
  };

  const handleRemoveTeamFromList = (idx) => {
    const updated = customTeams.filter((_, i) => i !== idx);
    setCustomTeams(updated);
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!customTourneyName || !customDayNum) {
      alert('Tournament Name and Day Number are required.');
      return;
    }
    if (customTeams.length === 0) {
      alert('Please add at least one team to the daily leaderboard list.');
      return;
    }
    const payload = {
      tournamentName: customTourneyName,
      dayNumber: Number(customDayNum),
      type: 'Squad',
      teams: customTeams
    };
    try {
      let res;
      if (editingCustomId) {
        res = await updateCustomLeaderboardEntry(editingCustomId, payload);
      } else {
        res = await addCustomLeaderboardEntry(payload);
      }
      if (res.ok) {
        setCustomTourneyName('');
        setCustomDayNum(1);
        setCustomTeams([]);
        setEditingCustomId(null);
        resetTeamSubForm();
        loadCustomLeaderboard();
      } else {
        alert(res.error || 'Failed to save daily leaderboard.');
      }
    } catch (err) {
      alert('Communication error.');
    }
  };

  const handleEditCustomClick = (entry) => {
    setEditingCustomId(entry._id);
    setCustomTourneyName(entry.tournamentName);
    setCustomDayNum(entry.dayNumber);
    setCustomTeams(entry.teams || []);
    resetTeamSubForm();
  };

  const handleDeleteCustom = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      const res = await deleteCustomLeaderboardEntry(id);
      if (res.ok) {
        loadCustomLeaderboard();
      } else {
        alert(res.error || 'Failed to delete entry.');
      }
    } catch (err) {
      alert('Communication error.');
    }
  };

  const handleClearCustom = async () => {
    if (!window.confirm('Clear all entries from the custom leaderboard?')) return;
    try {
      const res = await clearCustomLeaderboard();
      if (res.ok) {
        loadCustomLeaderboard();
      } else {
        alert(res.error || 'Failed to clear leaderboard.');
      }
    } catch (err) {
      alert('Communication error.');
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
        <div className="pubg-hud-panel p-8 max-w-md w-full bg-[#12120e] border border-tan/30 rounded-none relative shadow-lg space-y-6" style={{ '--hud-corner-color': '#9C4100' }}>

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
    <div className="min-h-screen bg-black py-12 px-4 md:px-8 w-full">
      <div className="w-full max-w-full space-y-6">
        
        {/* Admin Dashboard header */}
        <div className="border-b border-eb-yellow/30 pb-5 flex items-center justify-between gap-4">
          <h2 className="text-3xl font-extrabold uppercase text-white tracking-wider">
            Epix Sports
          </h2>
          <button 
            onClick={() => { logoutAdmin(); navigate('/'); }}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-tan/20 text-gold border border-tan hover:bg-tan/40 text-xs font-black uppercase tracking-widest transition-all rounded-sm"
          >
            Logout Session
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 bg-[#12120e] p-1 border border-white/5">
          <button
            onClick={() => setActiveTab('registrations')}
            className={`flex items-center justify-center gap-2 py-3 font-black text-[10px] uppercase tracking-wider transition-all duration-250 ${
              activeTab === 'registrations'
                ? 'bg-eb-yellow text-black'
                : 'text-gray-400 hover:text-white hover:bg-black/20'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Registered Users
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center justify-center gap-2 py-3 font-black text-[10px] uppercase tracking-wider transition-all duration-250 ${
              activeTab === 'users'
                ? 'bg-eb-yellow text-black'
                : 'text-gray-400 hover:text-white hover:bg-black/20'
            }`}
          >
            <Users className="w-4 h-4" />
            Signed In Users
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

          <button
            onClick={() => setActiveTab('matches')}
            className={`flex items-center justify-center gap-2 py-3 font-black text-[10px] uppercase tracking-wider transition-all duration-250 ${
              activeTab === 'matches'
                ? 'bg-eb-yellow text-black'
                : 'text-gray-400 hover:text-white hover:bg-black/20'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            Matches
          </button>
        </div>



        {/* Tab Panels */}
        <div className="mt-4">
          
          {/* TAB 1: REGISTRATIONS */}
          {activeTab === 'registrations' && (
            <div className="space-y-6">
              {/* Sub-tabs header for Registrations */}
              <div className="flex gap-4 border-b border-eb-yellow/30 pb-3 overflow-x-auto whitespace-nowrap">
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
                              <tr className="bg-black text-gray-400 font-black uppercase tracking-wider border-b border-eb-yellow/30 text-[10px]">
                                <th className="p-4">Tracking UID</th>
                                <th className="p-4">Roster Players</th>
                                <th className="p-4 text-center">Receipt</th>
                                <th className="p-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-eb-yellow/30 text-gray-300">
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
                                      className="w-10 h-7 rounded border border-eb-yellow/20 bg-black overflow-hidden inline-block"
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
                            <div className="border-b border-eb-yellow/30 pb-3 flex justify-between items-center">
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
                              <div className="border border-eb-yellow/30 rounded bg-black p-2 text-center">
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

                              <div className="bg-black/60 rounded border border-eb-yellow/30 p-3 space-y-2 text-xs font-mono">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Reg Type:</span>
                                  <span className="text-white font-bold">{expandedReceipt.registrationType || 'Team'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Tracking UID:</span>
                                  <span className="text-white uppercase font-bold">{expandedReceipt.trackingUid}</span>
                                </div>
                                <div className="flex flex-col border-t border-eb-yellow/30 pt-1 mt-1">
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
                                <div className="flex justify-between border-t border-eb-yellow/30 pt-1">
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
                          <div className="p-8 border border-dashed border-eb-yellow/20 rounded bg-[#12120e]/40 text-center text-xs text-gray-500 font-semibold leading-relaxed">
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
                            <tr className="bg-black text-gray-400 font-black uppercase tracking-wider border-b border-eb-yellow/30 text-[10px]">
                              <th className="p-4">Tracking UID</th>
                              <th className="p-4">Type</th>
                              <th className="p-4">Roster / Players</th>
                              <th className="p-4">WhatsApp</th>
                              <th className="p-4 font-mono">Transaction ID</th>
                              <th className="p-4 text-center">Receipt</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-eb-yellow/30 text-gray-300">
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
                                  <a href={reg.paymentScreenshot} target="_blank" rel="noopener noreferrer" className="w-10 h-7 rounded border border-eb-yellow/20 bg-black overflow-hidden inline-block hover:border-eb-yellow transition-colors">
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
                          <div className="flex justify-between items-start border-b border-eb-yellow/30 pb-2">
                            <div>
                              <span className="text-[8px] text-gray-500 uppercase font-black">Roster Tracking UID</span>
                              <h4 className="text-xs font-mono font-bold text-white uppercase truncate max-w-[150px]">{proof.trackingUid}</h4>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-eb-yellow/10 text-eb-yellow border border-eb-yellow/20 text-[8px] font-black uppercase font-mono">
                              Submitted
                            </span>
                          </div>

                          <div className="border border-eb-yellow/30 bg-black rounded p-1.5 text-center">
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
                              <span>WhatsApp:</span>
                              <span className="text-gray-300 font-bold">{proof.whatsappNumber || 'N/A'}</span>
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

          {/* TAB: SIGNED IN USERS */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-eb-yellow/30 pb-4">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">
                  Signed In Users List
                </h3>
                <p className="text-gray-500 text-[10px] font-semibold mt-0.5">
                  Accounts registered in the database. Players must sign up here first to register for tournaments.
                </p>
              </div>

              {loadingUsers ? (
                <div className="text-center py-16 bg-[#12120e] border border-white/5 rounded">
                  <p className="text-gray-500 text-xs font-semibold animate-pulse">Syncing user database...</p>
                </div>
              ) : signedUpUsers.length > 0 ? (
                <div className="pubg-hud-panel overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-black text-gray-400 font-black uppercase tracking-wider border-b border-eb-yellow/30 text-[10px]">
                          <th className="p-4">Character UID</th>
                          <th className="p-4">Phone Number</th>
                          <th className="p-4">Account Created At</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-eb-yellow/30 text-gray-300">
                        {signedUpUsers.map((usr) => (
                          <tr key={usr._id} className="hover:bg-black/40 transition-colors">
                            <td className="p-4 font-mono font-bold text-white uppercase">{usr.uid}</td>
                            <td className="p-4 font-mono text-gray-400">{usr.phoneNumber}</td>
                            <td className="p-4 font-mono text-gray-400">
                              {new Date(usr.createdAt).toLocaleString()}
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleDeleteUser(usr._id)}
                                className="p-1 px-2.5 bg-tan hover:bg-[#7e3400] text-white font-black uppercase text-[9px] tracking-wider rounded transition-colors"
                              >
                                Delete Account
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
                  <p className="text-gray-500 text-xs font-semibold">No user accounts found in database.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TOURNAMENTS */}
          {activeTab === 'tournaments' && (
            <div className="space-y-6">
              
              {/* Header Actions */}
              <div className="flex justify-between items-center border-b border-eb-yellow/30 pb-4">
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

              {/* Sub-tabs header for Tournaments */}
              <div className="flex gap-4 border-b border-eb-yellow/30 pb-3 overflow-x-auto whitespace-nowrap">
                <button
                  onClick={() => setSubTabTournaments('solo')}
                  className={`pb-1 text-xs font-black uppercase tracking-wider transition-colors ${
                    subTabTournaments === 'solo'
                      ? 'text-eb-yellow border-b-2 border-eb-yellow font-black'
                      : 'text-gray-500 hover:text-white'
                  }`}
                >
                  Solo Tournaments
                </button>
                <button
                  onClick={() => setSubTabTournaments('squad')}
                  className={`pb-1 text-xs font-black uppercase tracking-wider transition-colors ${
                    subTabTournaments === 'squad'
                      ? 'text-eb-yellow border-b-2 border-eb-yellow font-black'
                      : 'text-gray-500 hover:text-white'
                  }`}
                >
                  Squad Tournaments
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
                      <tr className="bg-black text-gray-400 font-black uppercase tracking-wider border-b border-eb-yellow/30 text-[10px]">
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
                    <tbody className="divide-y divide-eb-yellow/30 text-gray-300 font-medium">
                      {events && events.length > 0 && events.filter((evt) => (subTabTournaments === 'solo' ? evt.type === 'Solo' : evt.type === 'Squad')).length > 0 ? (
                        events
                          .filter((evt) => (subTabTournaments === 'solo' ? evt.type === 'Solo' : evt.type === 'Squad'))
                          .map((evt) => (
                            <tr key={evt._id} className="hover:bg-black/40 transition-colors">
                              <td className="p-4 font-bold text-white uppercase">{evt.title}</td>
                              <td className="p-4 font-mono uppercase text-eb-yellow text-[11px]">{evt.map || 'Erangel'}</td>
                              <td className="p-4">
                                <span className="px-2 py-0.5 rounded-sm bg-black border border-eb-yellow/20 text-gold text-[9px] font-black uppercase tracking-wider font-mono">
                                  {evt.type || 'Squad'}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded-sm font-black text-[9px] uppercase tracking-wider ${
                                  evt.status === 'ongoing'
                                    ? 'bg-red-600 text-white animate-pulse'
                                    : evt.status === 'open'
                                    ? 'bg-eb-yellow text-black'
                                    : 'bg-gray-800 text-gray-400'
                                }`}>
                                  {evt.status === 'upcomming' ? 'upcoming' : evt.status}
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
                          <td colSpan="8" className="text-center p-12 text-gray-500 font-semibold">
                            No {subTabTournaments === 'solo' ? 'Solo' : 'Squad'} tournaments configured. Click "Add Tournament" to deploy.
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

                    <div className="border-b border-eb-yellow/30 pb-3 flex justify-between items-center">
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

                      {/* Type Selector */}
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

                      {/* Reg Fee & Status */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {tourneyType === 'Solo' ? (
                          <div className="space-y-1 w-full col-span-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Solo Registration Fee (PKR)</label>
                            <input
                              type="number"
                              min="0"
                              value={soloEntryFee}
                              onChange={(e) => setSoloEntryFee(e.target.value === '' ? '' : Number(e.target.value))}
                              className="pubg-input w-full font-mono text-xs"
                              required
                            />
                          </div>
                        ) : (
                          <div className="space-y-1 w-full col-span-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Team Registration Fee (PKR)</label>
                            <input
                              type="number"
                              min="0"
                              value={teamEntryFee}
                              onChange={(e) => setTeamEntryFee(e.target.value === '' ? '' : Number(e.target.value))}
                              className="pubg-input w-full font-mono text-xs"
                              required
                            />
                          </div>
                        )}
                      </div>

                      {/* Number of Days & Status */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Number of Days</label>
                          <input
                            type="number"
                            min="1"
                            value={numberOfDays}
                            onChange={(e) => setNumberOfDays(e.target.value === '' ? '' : Number(e.target.value))}
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
                            <option value="open">Open (Registration Open)</option>
                            <option value="upcomming">Upcoming (More Events List)</option>
                            <option value="ongoing">Ongoing (Currently Played)</option>
                            <option value="ended">Ended (Completed)</option>
                          </select>
                        </div>
                      </div>

                      {/* Deadline & Tournament Start Date */}
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
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Tournament Start Date</label>
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
                          className="py-2.5 bg-black border border-eb-yellow/20 hover:border-tan text-white font-black uppercase text-xs tracking-wider rounded transition-all duration-300 hover:scale-[1.02]"
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

          {activeTab === 'leaderboard' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-eb-yellow/30 pb-3 flex justify-between items-center">
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

              {activeEvent && (
                <div className="flex gap-4 border-b border-eb-yellow/30 pb-2 mb-2 overflow-x-auto whitespace-nowrap">
                  <button
                    onClick={() => setLeaderboardMode('active')}
                    className={`pb-1 text-xs font-black uppercase tracking-wider transition-colors ${
                      leaderboardMode === 'active'
                        ? 'text-eb-yellow border-b-2 border-eb-yellow'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    Active Tournament Standings
                  </button>
                  <button
                    onClick={() => setLeaderboardMode('custom')}
                    className={`pb-1 text-xs font-black uppercase tracking-wider transition-colors ${
                      leaderboardMode === 'custom'
                        ? 'text-eb-yellow border-b-2 border-eb-yellow'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    Custom Standings List (Independent)
                  </button>
                </div>
              )}

              {leaderboardMode === 'active' && activeEvent ? (
                approvedRegs.length > 0 ? (
                <div className="overflow-x-auto border border-eb-yellow/30 rounded bg-black/40">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-black text-gray-400 font-black uppercase tracking-wider border-b border-eb-yellow/30 text-[10px]">
                        <th className="p-4">Roster Lead (UID)</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Roster Players</th>
                        <th className="p-4 text-center w-24">Assign Rank</th>
                        <th className="p-4 text-center w-60">{activeEvent.type === 'Squad' ? 'Kills per Player' : 'Assign Points'}</th>
                        <th className="p-4 text-right w-24">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-eb-yellow/30 text-gray-300">
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
                  <div className="text-center py-16 bg-[#12120e] border border-white/5 rounded text-gray-550 text-xs">
                    No approved registrations found in active tournament to rank.
                  </div>
                )
              ) : (
                 <div className="space-y-6 text-xs font-medium">
                  {/* Daily Leaderboard Metadata Form */}
                  <div className="bg-[#12120e] p-5 border border-eb-yellow/30 rounded space-y-4">
                    <h4 className="text-xs font-black uppercase text-eb-yellow tracking-widest border-b border-eb-yellow/20 pb-2">
                      1. Leaderboard Day Settings
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Tournament Name</label>
                        <input
                          type="text"
                          value={customTourneyName}
                          onChange={(e) => setCustomTourneyName(e.target.value)}
                          placeholder="e.g. PUBG Mobile Season 1"
                          className="pubg-input w-full text-xs"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Day Number</label>
                        <input
                          type="number"
                          min="1"
                          value={customDayNum}
                          onChange={(e) => setCustomDayNum(e.target.value)}
                          placeholder="e.g. 1"
                          className="pubg-input w-full text-xs font-mono"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Add Team to Draft Roster List Form */}
                  <form onSubmit={handleAddTeamToList} className="bg-black/60 p-5 border border-eb-yellow/30 rounded space-y-4">
                    <h4 className="text-xs font-black uppercase text-eb-yellow tracking-widest border-b border-eb-yellow/20 pb-2">
                      2. Add / Edit Team for this Day
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Rank</label>
                        <input
                          type="number"
                          min="1"
                          value={teamRank}
                          onChange={(e) => setTeamRank(e.target.value)}
                          placeholder="e.g. 1"
                          className="pubg-input w-full text-xs font-mono"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Team Number</label>
                        <input
                          type="number"
                          min="1"
                          value={teamNumber}
                          onChange={(e) => setTeamNumber(e.target.value)}
                          placeholder="e.g. 5"
                          className="pubg-input w-full text-xs font-mono"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Team Name</label>
                        <input
                          type="text"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          placeholder="e.g. Alpha Esports"
                          className="pubg-input w-full text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2 bg-[#12120e]/60 p-3 border border-white/5 rounded">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Squad Players (Exactly 4)</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[0, 1, 2, 3].map((idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={players[idx]?.name || ''}
                              onChange={(e) => {
                                const copy = [...players];
                                copy[idx] = { ...copy[idx], name: e.target.value };
                                setPlayers(copy);
                              }}
                              placeholder={`Player ${idx + 1} Name`}
                              className="pubg-input w-full text-[11px] py-1"
                              required
                            />
                            <input
                              type="text"
                              value={players[idx]?.uid || ''}
                              onChange={(e) => {
                                const copy = [...players];
                                copy[idx] = { ...copy[idx], uid: e.target.value };
                                setPlayers(copy);
                              }}
                              placeholder={`Player ${idx + 1} Character UID`}
                              className="pubg-input w-full text-[11px] font-mono py-1"
                              required
                            />
                            <input
                              type="number"
                              min="0"
                              value={players[idx]?.kills || ''}
                              onChange={(e) => {
                                const copy = [...players];
                                copy[idx] = { ...copy[idx], kills: e.target.value !== '' ? Number(e.target.value) : 0 };
                                setPlayers(copy);
                              }}
                              placeholder="Kills"
                              className="pubg-input w-24 text-[11px] font-mono py-1 text-center"
                              required
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Placement Points</label>
                        <input
                          type="number"
                          min="0"
                          value={teamPlacementPts}
                          onChange={(e) => setTeamPlacementPts(e.target.value)}
                          placeholder="0"
                          className="pubg-input w-full text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Total Points (Kills + Placement)</label>
                        <input
                          type="number"
                          min="0"
                          value={teamTotalPts}
                          onChange={(e) => setTeamTotalPts(e.target.value)}
                          placeholder="e.g. 15 (Optional)"
                          className="pubg-input w-full text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1 border-t border-white/5">
                      {editingTeamIndex !== null && (
                        <button
                          type="button"
                          onClick={resetTeamSubForm}
                          className="py-1 px-4 bg-black border border-eb-yellow/20 text-white font-black uppercase text-[9px] tracking-wider rounded"
                        >
                          Cancel Edit
                        </button>
                      )}
                      <button
                        type="submit"
                        className="py-1 px-5 bg-eb-yellow text-black font-black uppercase text-[9px] tracking-wider rounded"
                      >
                        {editingTeamIndex !== null ? 'Update Team in Day' : 'Add Team to Day'}
                      </button>
                    </div>
                  </form>

                  {/* List of Teams Added to current day */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase text-white tracking-widest">
                      3. Teams Draft list for Day {customDayNum}
                    </h4>
                    {customTeams.length > 0 ? (
                      <div className="overflow-x-auto border border-eb-yellow/30 bg-black/60 rounded">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-black text-gray-400 font-black uppercase tracking-wider border-b border-eb-yellow/30 text-[9px]">
                              <th className="p-3 text-center w-12">Rank</th>
                              <th className="p-3 text-center w-16">Team #</th>
                              <th className="p-3">Team Name</th>
                              <th className="p-3">Roster</th>
                              <th className="p-3 text-center">Kills</th>
                              <th className="p-3 text-center">Place Pts</th>
                              <th className="p-3 text-center">Total</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-gray-300">
                            {customTeams.map((team, idx) => (
                              <tr key={idx} className="hover:bg-white/[0.01]">
                                <td className="p-3 text-center font-mono font-bold text-white">{team.rank}</td>
                                <td className="p-3 text-center font-mono font-semibold text-eb-yellow">{team.teamNumber}</td>
                                <td className="p-3 font-bold text-white uppercase">{team.teamName}</td>
                                <td className="p-3 text-[10px] text-gray-500 font-mono">
                                  {team.players?.map((p, pIdx) => (
                                    <div key={pIdx}>
                                      P{pIdx+1}: <span className="text-gray-300 font-bold">{p.name}</span> ({p.uid}) - <strong className="text-eb-yellow">{p.kills || 0} Kills</strong>
                                    </div>
                                  ))}
                                </td>
                                <td className="p-3 text-center font-mono">{team.kills}</td>
                                <td className="p-3 text-center font-mono">{team.placementPoints}</td>
                                <td className="p-3 text-center font-mono font-bold text-eb-yellow">{team.totalPoints}</td>
                                <td className="p-3 text-right space-x-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleEditTeamFromList(idx)}
                                    className="px-2 py-0.5 bg-eb-yellow text-black font-black uppercase text-[8px] tracking-wider rounded"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTeamFromList(idx)}
                                    className="px-2 py-0.5 bg-tan text-white font-black uppercase text-[8px] tracking-wider rounded"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-[#12120e] border border-white/5 text-gray-655 text-xs">
                        No teams added for this day yet. Fill Section 2 above to add teams.
                      </div>
                    )}
                  </div>

                  {/* Submission and Metadata save controls */}
                  <div className="flex items-center gap-2 pt-2 border-t border-eb-yellow/30">
                    <button
                      type="button"
                      onClick={handleCustomSubmit}
                      className="py-2.5 px-8 bg-eb-yellow hover:scale-[1.01] transition-all text-black font-black uppercase text-xs tracking-widest rounded"
                    >
                      {editingCustomId ? 'Save Day Leaderboard Updates' : 'Publish Day Leaderboard'}
                    </button>
                    {editingCustomId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCustomId(null);
                          setCustomTourneyName('');
                          setCustomDayNum(1);
                          setCustomTeams([]);
                          resetTeamSubForm();
                        }}
                        className="py-2.5 px-6 bg-black border border-eb-yellow/30 text-white font-black uppercase text-xs tracking-widest rounded"
                      >
                        Cancel Edit Mode
                      </button>
                    )}
                    {customStandings.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearCustom}
                        className="py-2.5 px-5 bg-tan hover:bg-[#7e3400] text-white font-black uppercase text-xs tracking-widest rounded ml-auto"
                      >
                        Clear All Leaderboards
                      </button>
                    )}
                  </div>

                  {/* Existing Daily Leaderboards list */}
                  <div className="space-y-3 pt-6 border-t border-eb-yellow/30">
                    <h4 className="text-xs font-black uppercase text-white tracking-widest">
                      Saved Daily Standings
                    </h4>
                    {loadingCustom ? (
                      <div className="text-center py-6 text-gray-500 font-black animate-pulse">Loading Leaderboards...</div>
                    ) : customStandings.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {customStandings.map((doc) => (
                          <div key={doc._id} className="p-4 bg-black/40 border border-eb-yellow/20 hover:border-eb-yellow/40 rounded flex flex-col justify-between gap-3 text-xs">
                            <div>
                              <div className="flex justify-between items-start">
                                <h5 className="font-extrabold text-white uppercase text-sm leading-snug">{doc.tournamentName}</h5>
                                <span className="px-2 py-0.5 bg-eb-yellow/10 text-eb-yellow border border-eb-yellow/20 rounded-sm font-black text-[9px] uppercase font-mono">
                                  Day {doc.dayNumber}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-500 font-mono mt-1">
                                Teams Configured: {doc.teams?.length || 0} teams registered in roster standings.
                              </p>
                            </div>
                            <div className="flex justify-end gap-2 border-t border-white/5 pt-2">
                              <button
                                onClick={() => handleEditCustomClick(doc)}
                                className="px-3 py-1 bg-eb-yellow text-black font-black uppercase text-[9px] tracking-wider rounded"
                              >
                                Edit Day
                              </button>
                              <button
                                onClick={() => handleDeleteCustom(doc._id)}
                                className="px-3 py-1 bg-tan hover:bg-[#7e3400] text-white font-black uppercase text-[9px] tracking-wider rounded"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-[#12120e]/60 border border-white/5 text-gray-550 text-xs">
                        No saved leaderboard standings documents found.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'matches' && (
            <div className="space-y-6 animate-fadeIn">
              {/* TOURNAMENT SELECTOR TABS */}
              <div className="border-b border-eb-yellow/30 pb-3">
                <span className="text-[10px] font-bold text-gray-450 uppercase tracking-widest block mb-2">Select Tournament to Manage Matches</span>
                <div className="flex gap-4 overflow-x-auto whitespace-nowrap">
                  {events?.map((evt) => (
                    <button
                      key={evt._id}
                      onClick={() => {
                        setSelectedMatchTournamentId(evt._id);
                        setActiveDayTab(1);
                        setNewMatchDay(1);
                      }}
                      className={`pb-1 text-xs font-black uppercase tracking-wider transition-colors ${
                        currentTourneyId === evt._id
                          ? 'text-eb-yellow border-b-2 border-eb-yellow'
                          : 'text-gray-550 hover:text-gray-300'
                      }`}
                    >
                      {evt.title} ({evt.type})
                    </button>
                  ))}
                </div>
              </div>

              {/* 1. SEQUENTIAL SEEDING & ROSTER GROUP SUMMARY */}
              {(selectedTournament?.type === 'Squad' || selectedTournament?.type === 'Solo') && (
                <div className="pubg-hud-panel p-6 space-y-5">

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-eb-yellow/30 pb-3">
                  <div>
                    <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-eb-yellow" /> Sequential Group Seeding
                    </h4>
                    <p className="text-[9px] text-gray-500 font-bold uppercase mt-0.5">
                      {selectedTournament?.type === 'Solo' ? 'Players' : 'Rosters'} are assigned: first 8 approved to Group A, next 8 to Group B, next 8 to Group C.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoGroupSequential}
                    className="py-2 px-5 bg-eb-yellow text-black font-black uppercase text-[10px] tracking-wider rounded shadow transition-all hover:scale-[1.02]"
                  >
                    {selectedTournament?.type === 'Solo' ? 'Auto-Group Players' : 'Auto-Group Teams'} (Sequential)
                  </button>
                </div>

                {seedingSuccess && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-bold rounded-sm">
                    {seedingSuccess}
                  </div>
                )}
                {seedingError && (
                  <div className="p-3 bg-tan/10 border border-tan/30 text-gold text-[10px] font-bold rounded-sm">
                    {seedingError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['A', 'B', 'C'].map((gName) => {
                    const members = approvedRegs.filter(r => r.groupStageGroup === gName);
                    return (
                      <div key={gName} className="p-3 bg-black/60 border border-eb-yellow/30 rounded">
                        <span className="font-black text-eb-yellow uppercase tracking-wider block border-b border-eb-yellow/30 pb-1.5 mb-2.5 text-[11px]">
                          Group {gName} ({members.length} / 8 {selectedTournament?.type === 'Solo' ? 'Players' : 'Teams'})
                        </span>
                        {members.length > 0 ? (
                          <ul className="space-y-1.5 text-gray-400 font-mono text-[10px]">
                            {members.map((m) => (
                              <li key={m._id} className="flex justify-between border-b border-white/[0.02] pb-0.5">
                                <span className="font-bold text-white">Seed #{m.groupStageSeed}</span>
                                <span className="text-[10px] uppercase text-gray-300 font-sans font-semibold">{m.allInGameNames?.[0]}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-[10px] text-gray-600 font-semibold italic block py-2">No teams assigned yet</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

              {/* 2. MATCH SCHEDULER & DAY TABS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT: DAY TABS & MATCH CREATOR */}
                <div className="lg:col-span-1 space-y-6">
                  {/* DAY SELECTION TABS */}
                  <div className="pubg-hud-panel p-5 space-y-3">
                    <h4 className="text-xs font-black uppercase text-white tracking-wider">Tournament Days</h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: selectedTournament?.numberOfDays || 1 }).map((_, idx) => {
                        const dayNum = idx + 1;
                        return (
                          <button
                            key={dayNum}
                            type="button"
                            onClick={() => {
                              setActiveDayTab(dayNum);
                              setNewMatchDay(dayNum);
                            }}
                            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded transition-colors ${
                              activeDayTab === dayNum
                                ? 'bg-eb-yellow text-black'
                                : 'bg-black border border-eb-yellow/30 text-gray-400 hover:text-white'
                            }`}
                          >
                            Day {dayNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ADD CUSTOM MATCH FORM */}
                  <div className="pubg-hud-panel p-5 space-y-4">
                    <div className="border-b border-eb-yellow/30 pb-2">
                      <h4 className="text-xs font-black uppercase text-white tracking-wider">
                        Add Match to Day {activeDayTab}
                      </h4>
                    </div>

                    {matchCreateSuccess && (
                      <div className="p-2.5 bg-green-500/10 border border-green-500/30 text-green-400 text-[9px] font-bold rounded-sm">
                        {matchCreateSuccess}
                      </div>
                    )}
                    {matchCreateError && (
                      <div className="p-2.5 bg-tan/10 border border-tan/30 text-gold text-[9px] font-bold rounded-sm">
                        {matchCreateError}
                      </div>
                    )}

                    <form onSubmit={handleCreateMatchSubmit} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase block">Match #</label>
                          <input
                            type="number"
                            min="1"
                            value={newMatchNum}
                            onChange={(e) => setNewMatchNum(e.target.value)}
                            placeholder="e.g. 1"
                            className="pubg-input w-full text-xs font-mono"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase block">Map</label>
                          <select
                            value={newMatchMap}
                            onChange={(e) => setNewMatchMap(e.target.value)}
                            className="pubg-input w-full text-xs bg-black font-mono cursor-pointer"
                          >
                            <option value="Erangel">Erangel</option>
                            <option value="Miramar">Miramar</option>
                            <option value="Rondo">Rondo</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase block">Matchup</label>
                          {selectedTournament?.type === 'Solo' ? (
                            <select
                              value={newMatchup}
                              onChange={(e) => setNewMatchup(e.target.value)}
                              className="pubg-input w-full text-xs bg-black font-mono cursor-pointer"
                            >
                              <option value="Solo Lobby">Solo Lobby</option>
                              <option value="Lobby 1">Lobby 1</option>
                              <option value="Lobby 2">Lobby 2</option>
                            </select>
                          ) : (
                            <div className="flex items-center gap-2">
                              <select
                                value={newMatchGroup1}
                                onChange={(e) => setNewMatchGroup1(e.target.value)}
                                className="pubg-input w-full text-xs bg-black font-mono cursor-pointer text-center"
                              >
                                <option value="A">Group A</option>
                                <option value="B">Group B</option>
                                <option value="C">Group C</option>
                              </select>
                              <span className="text-[9px] font-black text-eb-yellow uppercase">VS</span>
                              <select
                                value={newMatchGroup2}
                                onChange={(e) => setNewMatchGroup2(e.target.value)}
                                className="pubg-input w-full text-xs bg-black font-mono cursor-pointer text-center"
                              >
                                <option value="A">Group A</option>
                                <option value="B">Group B</option>
                                <option value="C">Group C</option>
                              </select>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase block">Date & Time</label>
                          <input
                            type="datetime-local"
                            value={newMatchDate}
                            onChange={(e) => setNewMatchDate(e.target.value)}
                            onClick={(e) => e.target.showPicker()}
                            onFocus={(e) => e.target.showPicker()}
                            className="pubg-input w-full text-xs font-mono uppercase cursor-pointer"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase block">Room ID</label>
                          <input
                            type="text"
                            value={newMatchRoomId}
                            onChange={(e) => setNewMatchRoomId(e.target.value)}
                            placeholder="Optional ID"
                            className="pubg-input w-full text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase block">Password</label>
                          <input
                            type="text"
                            value={newMatchRoomPass}
                            onChange={(e) => setNewMatchRoomPass(e.target.value)}
                            placeholder="Optional Password"
                            className="pubg-input w-full text-xs font-mono"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-eb-yellow text-black font-black uppercase text-[9px] tracking-wider rounded"
                      >
                        Create Match
                      </button>
                    </form>
                  </div>
                </div>

                {/* RIGHT: MATCH LISTING & SCORING */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Selected Match Scoring Form */}
                  {selectedGroupMatch && (
                    <div className="pubg-hud-panel p-5 bg-black/80 border border-eb-yellow/30 rounded space-y-4 animate-slideIn">
                      <div className="flex justify-between items-center border-b border-eb-yellow/30 pb-2">
                        <span className="text-xs font-black uppercase text-white">
                          Record Match #{selectedGroupMatch.matchNumber} Scores ({selectedGroupMatch.matchup} - {selectedGroupMatch.map})
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedGroupMatch(null)}
                          className="text-gray-500 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {matchScoringSuccess && (
                        <div className="p-3 bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-bold rounded-sm">
                          {matchScoringSuccess}
                        </div>
                      )}
                      {matchScoringError && (
                        <div className="p-3 bg-tan/10 border border-tan/30 text-gold text-[10px] font-bold rounded-sm">
                          {matchScoringError}
                        </div>
                      )}

                      <form onSubmit={handleSaveGroupMatchScores} className="space-y-4">
                        {matchScoresInput.length > 0 ? (
                          <div className="overflow-x-auto border border-eb-yellow/30 rounded">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-black text-gray-400 font-black uppercase tracking-wider border-b border-eb-yellow/30 text-[10px]">
                                  <th className="p-3">Team Name</th>
                                  <th className="p-3 text-center w-24">Placement Rank</th>
                                  <th className="p-3 text-center w-24">Kills</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-eb-yellow/30 text-gray-300">
                                {matchScoresInput.map((scoreItem, idx) => (
                                  <tr key={scoreItem.registrationId} className="hover:bg-white/[0.01]">
                                    <td className="p-3 font-bold text-white uppercase">{scoreItem.teamName}</td>
                                    <td className="p-3 text-center">
                                      <input
                                        type="number"
                                        min="1"
                                        max="16"
                                        value={scoreItem.placement}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          setMatchScoresInput(prev => {
                                            const copy = [...prev];
                                            copy[idx].placement = val;
                                            return copy;
                                          });
                                        }}
                                        className="pubg-input w-20 text-center font-mono py-1 text-xs"
                                        required
                                      />
                                    </td>
                                    <td className="p-3 text-center">
                                      <input
                                        type="number"
                                        min="0"
                                        value={scoreItem.kills}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          setMatchScoresInput(prev => {
                                            const copy = [...prev];
                                            copy[idx].kills = val;
                                            return copy;
                                          });
                                        }}
                                        className="pubg-input w-20 text-center font-mono py-1 text-xs"
                                        required
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-[11px] text-tan font-bold">
                            {selectedTournament?.type === 'Solo' 
                              ? 'No registered players found in this tournament.' 
                              : `No teams from Group ${selectedGroupMatch.matchup.split(' vs ').join(' or ')} are assigned groups yet.`
                            }
                          </p>
                        )}

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedGroupMatch(null)}
                            className="py-1.5 px-4 bg-black border border-eb-yellow/20 hover:border-tan text-white font-black uppercase text-[9px] tracking-wider rounded"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={matchScoresInput.length === 0}
                            className="py-1.5 px-6 bg-eb-yellow text-black font-black uppercase text-[9px] tracking-wider rounded disabled:opacity-50"
                          >
                            Save Match Result
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* SCHEDULE LIST FOR DAY TAB */}
                  <div className="pubg-hud-panel p-5 space-y-4">
                    <h4 className="text-xs font-black uppercase text-white tracking-wider">
                      Matches Scheduled - Day {activeDayTab}
                    </h4>

                    {loadingGroupStageMatches ? (
                      <div className="text-center py-8 text-gray-550 text-xs font-semibold animate-pulse">
                        Syncing matches...
                      </div>
                    ) : groupStageMatches.filter(m => m.dayNumber === activeDayTab).length > 0 ? (
                      <div className="space-y-4">
                        {groupStageMatches.filter(m => m.dayNumber === activeDayTab).map((m) => {
                          const isEditingThis = editingMatchId === m._id;
                          return (
                            <div key={m._id} className="p-4 bg-black/60 border border-eb-yellow/30 rounded space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-mono text-xs font-bold text-gray-500">Match #{m.matchNumber}</span>
                                  <h5 className="text-sm font-black text-white uppercase mt-0.5">
                                    {m.matchup} - <span className="text-eb-yellow">{m.map}</span>
                                  </h5>
                                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">Time: {new Date(m.matchDate).toLocaleString()}</p>
                                </div>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black font-mono uppercase ${
                                  m.isPlayed ? 'bg-green-500/10 text-green-400' : 'bg-tan/10 text-gold'
                                }`}>
                                  {m.isPlayed ? 'Played' : 'Scheduled'}
                                </span>
                              </div>

                              {/* Credentials displaying or editing */}
                              {isEditingThis ? (
                                <form onSubmit={(e) => handleUpdateMatchDetails(e, m._id)} className="p-3 bg-black/85 border border-eb-yellow/30 rounded space-y-3">
                                  <span className="text-[8px] font-black text-eb-yellow uppercase tracking-widest block border-b border-eb-yellow/30 pb-1">
                                    Edit Match Details
                                  </span>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <label className="text-[8px] text-gray-500 uppercase block font-bold">Match #</label>
                                      <input 
                                        type="number"
                                        value={editMatchNum}
                                        onChange={(e) => setEditMatchNum(e.target.value)}
                                        className="pubg-input w-full font-mono py-1 text-xs"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[8px] text-gray-500 uppercase block font-bold">Map</label>
                                      <select 
                                        value={editMatchMap}
                                        onChange={(e) => setEditMatchMap(e.target.value)}
                                        className="pubg-input w-full font-mono py-1 text-xs bg-black"
                                      >
                                        <option value="Erangel">Erangel</option>
                                        <option value="Miramar">Miramar</option>
                                        <option value="Rondo">Rondo</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <label className="text-[8px] text-gray-500 uppercase block font-bold">Matchup</label>
                                      {selectedTournament?.type === 'Solo' ? (
                                        <select 
                                          value={editMatchup}
                                          onChange={(e) => setEditMatchup(e.target.value)}
                                          className="pubg-input w-full font-mono py-1 text-xs bg-black"
                                        >
                                          <option value="Solo Lobby">Solo Lobby</option>
                                          <option value="Lobby 1">Lobby 1</option>
                                          <option value="Lobby 2">Lobby 2</option>
                                        </select>
                                      ) : (
                                        <div className="flex items-center gap-1.5">
                                          <select
                                            value={editMatchGroup1}
                                            onChange={(e) => setEditMatchGroup1(e.target.value)}
                                            className="pubg-input w-full font-mono py-1 text-xs bg-black text-center"
                                          >
                                            <option value="A">Group A</option>
                                            <option value="B">Group B</option>
                                            <option value="C">Group C</option>
                                          </select>
                                          <span className="text-[8px] font-black text-eb-yellow uppercase">VS</span>
                                          <select
                                            value={editMatchGroup2}
                                            onChange={(e) => setEditMatchGroup2(e.target.value)}
                                            className="pubg-input w-full font-mono py-1 text-xs bg-black text-center"
                                          >
                                            <option value="A">Group A</option>
                                            <option value="B">Group B</option>
                                            <option value="C">Group C</option>
                                          </select>
                                        </div>
                                      )}
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[8px] text-gray-500 uppercase block font-bold">Room ID</label>
                                      <input 
                                        type="text"
                                        value={editMatchRoomId}
                                        onChange={(e) => setEditMatchRoomId(e.target.value)}
                                        className="pubg-input w-full font-mono py-1 text-xs"
                                        placeholder="Room ID"
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <label className="text-[8px] text-gray-500 uppercase block font-bold">Password</label>
                                      <input 
                                        type="text"
                                        value={editMatchRoomPass}
                                        onChange={(e) => setEditMatchRoomPass(e.target.value)}
                                        className="pubg-input w-full font-mono py-1 text-xs"
                                        placeholder="Password"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[8px] text-gray-500 uppercase block font-bold">Date & Time</label>
                                      <input 
                                        type="datetime-local"
                                        value={editMatchDate}
                                        onChange={(e) => setEditMatchDate(e.target.value)}
                                        className="pubg-input w-full font-mono py-1 text-xs"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-1.5 pt-1.5">
                                    <button 
                                      type="button"
                                      onClick={() => setEditingMatchId(null)}
                                      className="py-1 px-3 bg-black border border-eb-yellow/20 text-white font-black uppercase text-[8px] tracking-wider rounded"
                                    >
                                      Cancel
                                    </button>
                                    <button 
                                      type="submit"
                                      className="py-1 px-4 bg-eb-yellow text-black font-black uppercase text-[8px] tracking-wider rounded"
                                    >
                                      Save Details
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <div className="p-2.5 bg-black border border-eb-yellow/30 rounded flex flex-wrap justify-between gap-3 text-[10px] font-mono">
                                  <div>
                                    <span className="text-gray-500 uppercase font-black tracking-wider block text-[7px]">Lobby Room ID</span>
                                    <span className="text-white font-bold">{m.roomId || 'NOT CONFIGURED'}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 uppercase font-black tracking-wider block text-[7px]">Lobby Password</span>
                                    <span className="text-white font-bold">{m.roomPassword || 'NOT CONFIGURED'}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 ml-auto">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingMatchId(m._id);
                                        setEditMatchRoomId(m.roomId || '');
                                        setEditMatchRoomPass(m.roomPassword || '');
                                        setEditMatchDate(toDatetimeLocal(m.matchDate));
                                        setEditMatchMap(m.map);
                                        setEditMatchup(m.matchup);
                                        if (m.matchup && m.matchup.includes(' vs ')) {
                                          const parts = m.matchup.split(' vs ');
                                          setEditMatchGroup1(parts[0] || 'A');
                                          setEditMatchGroup2(parts[1] || 'B');
                                        }
                                        setEditMatchNum(String(m.matchNumber));
                                      }}
                                      className="px-2 py-0.5 bg-black border border-eb-yellow/20 hover:border-eb-yellow/30 text-gray-300 font-bold uppercase text-[8px] tracking-wider rounded"
                                    >
                                      Edit Details
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSelectMatchForScoring(m)}
                                      className="px-2.5 py-0.5 bg-eb-yellow text-black font-black uppercase text-[8px] tracking-wider rounded"
                                    >
                                      {m.isPlayed ? 'Scores' : 'Record'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMatch(m._id)}
                                      className="px-2 py-0.5 bg-tan hover:bg-[#7e3400] text-white font-black uppercase text-[8px] tracking-wider rounded"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 text-xs font-semibold">
                        No matches scheduled for Day {activeDayTab} yet.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
