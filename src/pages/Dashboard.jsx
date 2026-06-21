import React, { useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Users, Trophy, DoorOpen, Shield, ShieldCheck, Key, Copy, Check, Plus, Trash2, Clipboard, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { 
    currentUser, 
    teams, 
    registrations, 
    tournaments,
    addMembersToTeam, 
    removeMemberFromTeam,
    createTeam 
  } = useContext(AppContext);

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'teams';

  const setActiveTab = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  const [selectedTeamForAdd, setSelectedTeamForAdd] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [memberError, setMemberError] = useState('');
  const [copiedId, setCopiedId] = useState('');

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const userTeams = teams.filter(t => t.captain === currentUser.name);
  const userRegistrations = registrations.filter(r => 
    userTeams.some(ut => ut.id === r.teamId)
  );

  useEffect(() => {
    if (userTeams.length > 0 && !selectedTeamForAdd) {
      setSelectedTeamForAdd(userTeams[0].id);
    }
  }, [userTeams, selectedTeamForAdd]);

  const handleAddMember = (e, teamId) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      setMemberError('Player name is required');
      return;
    }
    if (newMemberName.trim().length < 4) {
      setMemberError('PUBG ID must be at least 4 characters');
      return;
    }

    addMembersToTeam(teamId, [newMemberName]);
    setNewMemberName('');
    setMemberError('');
  };

  return (
    <div className="min-h-screen bg-black py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Dashboard Title - HUD Header */}
        <div className="border-b border-gray-900 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold uppercase text-white tracking-wider">
              Captain <span className="text-eb-yellow">Dashboard</span>
            </h2>
            <p className="text-gray-500 text-xs font-semibold">Manage squad rosters, inspect payment approvals, and retrieve custom keys.</p>
          </div>
          
          <div className="px-4 py-2 bg-[#12120e] border border-white/5 rounded flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center font-bold text-black border border-white/10">
              {currentUser.name.substring(8, 9)}
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-none">{currentUser.name}</p>
              <span className="text-[9px] text-gold font-black uppercase tracking-wider">Captain Account</span>
            </div>
          </div>
        </div>

        {/* Tab Headers - Styled as HUD Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-[#12120e] p-1 border border-white/5">
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex items-center justify-center gap-2 py-3 font-black text-[10px] uppercase tracking-wider transition-all duration-250 ${
              activeTab === 'teams'
                ? 'bg-eb-yellow text-black'
                : 'text-gray-400 hover:text-white hover:bg-black/20'
            }`}
          >
            <Users className="w-4 h-4" />
            My Teams
          </button>

          <button
            onClick={() => setActiveTab('tournaments')}
            className={`flex items-center justify-center gap-2 py-3 font-black text-[10px] uppercase tracking-wider transition-all duration-250 ${
              activeTab === 'tournaments'
                ? 'bg-eb-yellow text-black'
                : 'text-gray-400 hover:text-white hover:bg-black/20'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Registrations
          </button>

          <button
            onClick={() => setActiveTab('lobby')}
            className={`flex items-center justify-center gap-2 py-3 font-black text-[10px] uppercase tracking-wider transition-all duration-250 ${
              activeTab === 'lobby'
                ? 'bg-eb-yellow text-black'
                : 'text-gray-400 hover:text-white hover:bg-black/20'
            }`}
          >
            <DoorOpen className="w-4 h-4" />
            Lobby Info
          </button>
        </div>

        {/* Tab Panels */}
        <div className="mt-6">

          {/* TAB 1: MY TEAMS */}
          {activeTab === 'teams' && (
            <div className="space-y-6 animate-fadeIn">
              {userTeams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userTeams.map((team) => (
                    <div key={team.id} className="pubg-hud-panel cyber-card p-5 flex flex-col justify-between space-y-4">
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="text-base font-extrabold text-white uppercase tracking-wider">{team.name}</h3>
                          <div className="flex items-center gap-1.5 bg-black border border-gray-900 px-2 py-1 rounded-sm text-[9px] text-gray-400 font-mono">
                            <span>INVITE CODE:</span>
                            <span className="font-bold text-gold">{team.inviteCode}</span>
                          </div>
                        </div>
                        <p className="text-[9px] text-gray-500 uppercase font-black tracking-wider">Captain: {team.captain}</p>
                      </div>

                      {/* Members list */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider">Active Roster ({team.members.length} / 4)</span>
                        <div className="bg-black border border-gray-950 divide-y divide-gray-950">
                          {team.members.map((m, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2.5 text-xs">
                              <span className="text-white font-mono font-semibold">{m}</span>
                              <button
                                onClick={() => removeMemberFromTeam(team.id, m)}
                                disabled={team.members.length <= 4}
                                className={`text-gray-500 hover:text-tan transition-colors ${
                                  team.members.length <= 4 ? 'opacity-20 cursor-not-allowed' : ''
                                }`}
                                title={team.members.length <= 4 ? 'Roster size requires 4 players' : 'Remove player'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Add member form */}
                      <form onSubmit={(e) => handleAddMember(e, team.id)} className="pt-3 border-t border-gray-900 flex gap-2 items-end">
                        <div className="flex-1 space-y-1">
                          <input
                            type="text"
                            value={selectedTeamForAdd === team.id ? newMemberName : ''}
                            onChange={(e) => {
                              setSelectedTeamForAdd(team.id);
                              setNewMemberName(e.target.value);
                            }}
                            placeholder="Add Player PUBG character name"
                            className="pubg-input py-1.5 text-xs w-full"
                          />
                        </div>
                        <button
                          type="submit"
                          onClick={() => setSelectedTeamForAdd(team.id)}
                          className="px-3.5 py-2 bg-orig-yellow hover:bg-gold text-black font-black text-[10px] uppercase flex items-center gap-1 transition-all duration-200"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </button>
                      </form>
                      {selectedTeamForAdd === team.id && memberError && (
                        <p className="text-tan text-[10px] font-bold">{memberError}</p>
                      )}

                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-[#12120e] border border-white/5 rounded space-y-4">
                  <Users className="w-12 h-12 text-gray-700 mx-auto" />
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">No Squads Active</h3>
                  <p className="text-gray-500 text-xs max-w-sm mx-auto font-medium">Please initialize a combat roster on the Landing page before registering.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REGISTERED TOURNAMENTS */}
          {activeTab === 'tournaments' && (
            <div className="space-y-6 animate-fadeIn">
              {userRegistrations.length > 0 ? (
                <div className="pubg-hud-panel overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-black text-gray-400 font-black uppercase tracking-wider border-b border-gray-900 text-[10px]">
                          <th className="p-4">Tournament</th>
                          <th className="p-4">Registered Squad</th>
                          <th className="p-4">TxID</th>
                          <th className="p-4 text-center">Status</th>
                          <th className="p-4 text-right font-black">Credentials Link</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-950 text-gray-300">
                        {userRegistrations.map((reg) => {
                          const tourney = tournaments.find(t => t.id === reg.tournamentId) || {};
                          
                          return (
                            <tr key={reg.id} className="hover:bg-black/50 transition-colors">
                              <td className="p-4 font-black text-white uppercase tracking-wide">{tourney.title}</td>
                              <td className="p-4 font-bold">{reg.teamName}</td>
                              <td className="p-4 font-mono text-gray-500">{reg.txId}</td>
                              <td className="p-4 text-center">
                                <span className={`inline-flex px-2.5 py-0.5 rounded-sm text-[9px] font-black uppercase border ${
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
                                <button
                                  onClick={() => setActiveTab('lobby')}
                                  className="px-3 py-1 bg-black border border-gray-850 hover:border-eb-yellow text-gray-400 hover:text-eb-yellow font-black text-[9px] uppercase tracking-wider transition-colors duration-250"
                                >
                                  Open Lobby Info
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 bg-[#12120e] border border-white/5 rounded space-y-4">
                  <Trophy className="w-12 h-12 text-gray-700 mx-auto" />
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">No Registrations Found</h3>
                  <p className="text-gray-500 text-xs max-w-sm mx-auto font-medium">Your registered squads and review statuses will appear here.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LOBBY INFO */}
          {activeTab === 'lobby' && (
            <div className="space-y-6 animate-fadeIn">
              {userRegistrations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userRegistrations.map((reg) => {
                    const tourney = tournaments.find(t => t.id === reg.tournamentId) || {};
                    const isApproved = reg.status === 'Approved';

                    return (
                      <div key={reg.id} className="pubg-hud-panel cyber-card p-5 space-y-4">
                        
                        <div className="flex justify-between items-start border-b border-gray-900 pb-3">
                          <div>
                            <h4 className="font-extrabold text-white uppercase leading-snug text-sm tracking-wide">{tourney.title}</h4>
                            <p className="text-[9px] text-gray-500 uppercase mt-0.5 font-bold">Roster: {reg.teamName}</p>
                          </div>
                          <span className={`inline-flex px-2 py-0.5 rounded-sm text-[9px] font-black uppercase border ${
                            isApproved
                              ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30'
                              : 'bg-harvest/15 text-eb-yellow border-harvest'
                          }`}>
                            {reg.status}
                          </span>
                        </div>

                        {/* Lobby Credentials Lock box */}
                        {isApproved ? (
                          <div className="p-4 rounded border border-eb-yellow/30 bg-eb-yellow/[0.02] space-y-3 relative overflow-hidden shadow-glow-yellow-sm">
                            <div className="absolute top-0 right-0 p-1 bg-eb-yellow/10 border-bl border-eb-yellow/30">
                              <Key className="w-3.5 h-3.5 text-eb-yellow" />
                            </div>
                            
                            <h5 className="text-[10px] font-black text-eb-yellow uppercase tracking-widest">Custom Room Credentials</h5>
                            
                            <div className="space-y-2">
                              {/* Room ID */}
                              <div className="flex items-center justify-between bg-black p-2 rounded border border-gray-950">
                                <div>
                                  <span className="text-[8px] text-gray-500 block uppercase font-bold tracking-wider">Room ID</span>
                                  <span className="text-sm font-black text-white font-mono">{reg.roomInfo.roomId}</span>
                                </div>
                                <button
                                  onClick={() => handleCopy(reg.roomInfo.roomId, `id-${reg.id}`)}
                                  className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded transition-colors"
                                >
                                  {copiedId === `id-${reg.id}` ? <Check className="w-4 h-4 text-eb-yellow" /> : <Copy className="w-4 h-4" />}
                                </button>
                              </div>

                              {/* Password */}
                              <div className="flex items-center justify-between bg-black p-2 rounded border border-gray-950">
                                <div>
                                  <span className="text-[8px] text-gray-500 block uppercase font-bold tracking-wider">Password</span>
                                  <span className="text-sm font-black text-white font-mono">{reg.roomInfo.roomPass}</span>
                                </div>
                                <button
                                  onClick={() => handleCopy(reg.roomInfo.roomPass, `pass-${reg.id}`)}
                                  className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded transition-colors"
                                >
                                  {copiedId === `pass-${reg.id}` ? <Check className="w-4 h-4 text-eb-yellow" /> : <Copy className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>

                            <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
                              * Paste room ID into the manual game client interface. Leaking room codes leads to roster ban.
                            </p>
                          </div>
                        ) : (
                          <div className="p-6 rounded border border-gray-900 bg-black/40 text-center space-y-2.5">
                            <Key className="w-8 h-8 text-gray-700 mx-auto" />
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Credentials Restricted</p>
                            <p className="text-[11px] text-gray-500 leading-relaxed max-w-xs mx-auto font-medium">
                              Room ID keys will unlock immediately once manual transaction TxID clearances are marked <span className="font-bold text-eb-yellow">Approved</span> by the tournament coordinator.
                            </p>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-[#12120e] border border-white/5 rounded space-y-4">
                  <Key className="w-12 h-12 text-gray-700 mx-auto" />
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">Credentials Locked</h3>
                  <p className="text-gray-500 text-xs max-w-sm mx-auto font-medium">Approved room credential listings will show up in this window.</p>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
