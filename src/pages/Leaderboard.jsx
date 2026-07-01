import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Trophy, ListOrdered, Users, Calendar } from 'lucide-react';

export default function Leaderboard() {
  const { activeEvent, loadingActiveEvent } = useContext(AppContext);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCustom, setIsCustom] = useState(false);

  // Custom Daily Leaderboard filters
  const [selectedTournament, setSelectedTournament] = useState('');
  const [selectedDay, setSelectedDay] = useState('');

  // Group Stage states
  const [viewTab, setViewTab] = useState('overall');
  const [groupStageStandings, setGroupStageStandings] = useState([]);
  const [groupStageSchedule, setGroupStageSchedule] = useState([]);
  const [loadingGS, setLoadingGS] = useState(false);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const customRes = await fetch('/api/leaderboard');
        if (customRes.ok) {
          const customData = await customRes.json();
          if (customData && customData.length > 0) {
            setStandings(customData);
            setIsCustom(true);
            setLoading(false);
            return;
          }
        }

        setIsCustom(false);
        const response = await fetch('/api/events/active/leaderboard');
        if (response.ok) {
          const data = await response.json();
          setStandings(data.standings || []);
        }
      } catch (err) {
        console.error('Error fetching standings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStandings();
  }, [activeEvent]);

  useEffect(() => {
    if (isCustom && standings.length > 0) {
      // Find unique tournaments
      const uniqueTourneys = Array.from(new Set(standings.map(s => s.tournamentName))).filter(Boolean);
      if (uniqueTourneys.length > 0) {
        const first = uniqueTourneys[0];
        setSelectedTournament(first);
        const days = standings
          .filter(s => s.tournamentName === first)
          .map(s => s.dayNumber)
          .sort((a, b) => a - b);
        if (days.length > 0) {
          setSelectedDay(days[0]);
        }
      }
    }
  }, [standings, isCustom]);

  const handleTournamentChange = (tourney) => {
    setSelectedTournament(tourney);
    const days = standings
      .filter(s => s.tournamentName === tourney)
      .map(s => s.dayNumber)
      .sort((a, b) => a - b);
    if (days.length > 0) {
      setSelectedDay(days[0]);
    } else {
      setSelectedDay('');
    }
  };

  useEffect(() => {
    if (activeEvent && (activeEvent.type === 'Squad' || activeEvent.type === 'Solo')) {
      const fetchGroupStageData = async () => {
        setLoadingGS(true);
        try {
          const lRes = await fetch('/api/events/active/group-stage/leaderboard');
          if (lRes.ok) {
            const lData = await lRes.json();
            setGroupStageStandings(lData);
          }
          const sRes = await fetch('/api/events/active/group-stage/schedule');
          if (sRes.ok) {
            const sData = await sRes.json();
            setGroupStageSchedule(sData);
          }
        } catch (err) {
          console.error('Error fetching group stage data:', err);
        } finally {
          setLoadingGS(false);
        }
      };
      fetchGroupStageData();
    }
  }, [activeEvent]);

  if (loadingActiveEvent || loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
        <h3 className="text-sm font-black uppercase text-white tracking-widest animate-pulse">Syncing Standings...</h3>
      </div>
    );
  }

  // Check if we have dynamic standings or manually typed HTML
  const hasLeaderboardHtml = activeEvent && activeEvent.leaderboardHtml;
  const hasDynamicStandings = standings && standings.length > 0;

  return (
    <div className="min-h-screen bg-black py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
        
        {/* Page Header */}
        <div className="border-b border-eb-yellow/30 pb-5">
          <h2 className="text-3xl font-extrabold uppercase text-white tracking-wider flex items-center gap-2">
            <Trophy className="w-8 h-8 text-eb-yellow" />
            Tournament <span className="text-gold">Standings</span>
          </h2>
          <p className="text-gray-500 text-xs font-semibold mt-1">
            Official standings and points aggregation for the active tournament.
          </p>
        </div>

        {/* Standings Grid */}
        <div className="pubg-hud-panel p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-eb-yellow/30 pb-3">
            <span className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
              <ListOrdered className="w-4 h-4 text-eb-yellow" />
              {isCustom ? 'Global Standings' : (activeEvent ? activeEvent.title : 'Active Standings')}
            </span>
            {activeEvent && !isCustom && (
              <span className="px-2.5 py-0.5 rounded-sm bg-black border border-eb-yellow/20 text-gold text-[9px] font-black uppercase tracking-wider font-mono">
                {activeEvent.type || 'Squad'} format
              </span>
            )}
            {isCustom && (
              <span className="px-2.5 py-0.5 rounded-sm bg-black border border-eb-yellow/20 text-gold text-[9px] font-black uppercase tracking-wider font-mono">
                Global Format
              </span>
            )}
          </div>

          {(activeEvent?.type === 'Squad' || activeEvent?.type === 'Solo') && !isCustom && (
            <div className="grid grid-cols-3 gap-2 bg-[#12120e] p-1 border border-white/5 mb-4">
              <button
                type="button"
                onClick={() => setViewTab('overall')}
                className={`py-2 text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  viewTab === 'overall' ? 'bg-eb-yellow text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" /> Standings
              </button>
              <button
                type="button"
                onClick={() => setViewTab('groups')}
                className={`py-2 text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  viewTab === 'groups' ? 'bg-eb-yellow text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Group Rosters
              </button>
              <button
                type="button"
                onClick={() => setViewTab('schedule')}
                className={`py-2 text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  viewTab === 'schedule' ? 'bg-eb-yellow text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" /> Match Rotation
              </button>
            </div>
          )}

          {isCustom ? (
            <div className="space-y-4">
              {/* Custom Standings Filters */}
              <div className="bg-[#12120e] p-4 border border-eb-yellow/30 rounded space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block font-sans">Select Tournament</label>
                    <select
                      value={selectedTournament}
                      onChange={(e) => handleTournamentChange(e.target.value)}
                      className="pubg-input w-full text-xs"
                    >
                      {Array.from(new Set(standings.map(s => s.tournamentName))).filter(Boolean).map((t, idx) => (
                        <option key={idx} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block font-sans">Select Day</label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {standings
                        .filter(s => s.tournamentName === selectedTournament)
                        .map(s => s.dayNumber)
                        .sort((a, b) => a - b)
                        .map((d) => (
                          <button
                            key={d}
                            onClick={() => setSelectedDay(d)}
                            className={`px-3 py-1 text-xs font-black uppercase tracking-wider transition rounded-sm border ${
                              Number(selectedDay) === Number(d)
                                ? 'bg-eb-yellow text-black border-eb-yellow'
                                : 'bg-black text-gray-400 border-eb-yellow/20 hover:text-white'
                            }`}
                          >
                            Day {d}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Roster Leaderboard Table */}
              <div className="overflow-x-auto border border-eb-yellow/30 bg-black/60 rounded">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-black text-gray-400 font-black uppercase tracking-wider border-b border-eb-yellow/30 text-[10px]">
                      <th className="p-4 text-center w-16">Rank</th>
                      <th className="p-4 text-center w-16">Team #</th>
                      <th className="p-4">Team Name</th>
                      <th className="p-4">Squad Roster</th>
                      <th className="p-4 text-center">Placement</th>
                      <th className="p-4 text-right w-32">Total Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-eb-yellow/30 text-gray-300">
                    {(() => {
                      const activeDoc = standings.find(s => s.tournamentName === selectedTournament && s.dayNumber === Number(selectedDay));
                      const teams = activeDoc?.teams || [];
                      if (teams.length === 0) {
                        return (
                          <tr>
                            <td colSpan="6" className="p-8 text-center text-gray-555 font-bold uppercase tracking-wider">
                              No standings published for this day yet.
                            </td>
                          </tr>
                        );
                      }
                      return teams.map((row) => (
                        <tr key={row._id} className="hover:bg-white/[0.01] transition-colors border-b border-white/5">
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-sm font-black text-xs ${
                              row.rank === 1 
                                ? 'bg-eb-yellow text-black font-extrabold' 
                                : row.rank === 2 
                                ? 'bg-gray-300 text-black font-extrabold' 
                                : row.rank === 3 
                                ? 'bg-amber-600 text-white font-extrabold' 
                                : 'bg-gray-900 text-gray-400'
                            }`}>
                              {row.rank}
                            </span>
                          </td>
                          <td className="p-4 text-center font-mono font-bold text-eb-yellow">{row.teamNumber}</td>
                          <td className="p-4 font-bold text-white uppercase">{row.teamName}</td>
                          <td className="p-4 text-[10px] text-gray-500 font-mono">
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                              {row.players?.map((p, pIdx) => (
                                <div key={pIdx} className="truncate">
                                  P{pIdx+1}: <span className="text-gray-300 font-bold">{p.name}</span> <span className="text-gray-600">({p.uid})</span> - <strong className="text-eb-yellow">{p.kills || 0} Kills</strong>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 text-center font-mono">{row.placementPoints}</td>
                          <td className="p-4 text-right font-mono font-extrabold text-eb-yellow text-sm">{row.totalPoints}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (activeEvent?.type === 'Squad' || activeEvent?.type === 'Solo') ? (
            <div>
              {viewTab === 'overall' && (
                <div className="space-y-4">
                  {loadingGS ? (
                    <div className="text-center py-12 text-gray-500 font-black animate-pulse">Syncing Group Leaderboard...</div>
                  ) : groupStageStandings.length > 0 ? (
                    <div className="overflow-x-auto border border-eb-yellow/30 bg-black/60 rounded">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-black text-gray-400 font-black uppercase tracking-wider border-b border-eb-yellow/30 text-[10px]">
                            <th className="p-4 text-center w-16">Rank</th>
                            <th className="p-4">{activeEvent?.type === 'Solo' ? 'Player Name' : 'Squad / Leader'}</th>
                            <th className="p-4">{activeEvent?.type === 'Solo' ? 'Character UID' : 'Roster Character IDs'}</th>
                            <th className="p-4 text-center">Group</th>
                            <th className="p-4 text-center">Matches</th>
                            <th className="p-4 text-center">Kills</th>
                            <th className="p-4 text-right w-24">Points</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-eb-yellow/30 text-gray-300">
                          {groupStageStandings.slice(0, 100).map((row, idx) => {
                            const kills = (row.playerKills || []).reduce((sum, k) => sum + (k || 0), 0);
                            return (
                              <tr key={row._id} className="hover:bg-white/[0.01] transition-colors">
                                <td className="p-4 text-center">
                                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-sm font-black text-xs ${
                                    idx === 0 
                                      ? 'bg-eb-yellow text-black font-extrabold' 
                                      : idx === 1 
                                      ? 'bg-gray-300 text-black font-extrabold' 
                                      : idx === 2 
                                      ? 'bg-amber-600 text-white font-extrabold' 
                                      : 'bg-gray-900 text-gray-400'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                </td>
                                <td className="p-4 font-bold text-white uppercase">{row.allInGameNames?.[0] || 'Unknown'}</td>
                                <td className="p-4 text-[10px] text-gray-500 font-mono">
                                  {activeEvent?.type === 'Solo' ? (
                                    <span className="text-gray-300 font-bold">{row.allCharacterIds?.[0] || 'N/A'}</span>
                                  ) : (
                                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                                      {row.allInGameNames?.map((name, pIdx) => (
                                        <div key={pIdx} className="truncate">
                                          P{pIdx+1}: <span className="text-gray-300 font-bold">{name}</span> <span className="text-gray-600">({row.allCharacterIds?.[pIdx] || 'N/A'})</span> - <strong className="text-eb-yellow">{row.playerKills?.[pIdx] || 0} K</strong>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </td>
                                <td className="p-4 text-center font-mono font-semibold text-eb-yellow">Group {row.groupStageGroup || 'N/A'}</td>
                                <td className="p-4 text-center font-mono">{row.matchesPlayed || 0}</td>
                                <td className="p-4 text-center font-mono">{kills}</td>
                                <td className="p-4 text-right font-mono font-extrabold text-eb-yellow text-sm">{row.points || 0}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-black/40 border border-eb-yellow/30 rounded space-y-3">
                      <Trophy className="w-12 h-12 text-eb-yellow mx-auto animate-pulse" />
                      <p className="text-sm text-gray-455 font-semibold uppercase tracking-wider">Group Stage Leaderboard has not been generated.</p>
                      <p className="text-[10px] text-gray-600 uppercase font-mono">Check back once the daily matches start</p>
                    </div>
                  )}
                </div>
              )}

              {viewTab === 'groups' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['A', 'B', 'C'].map((gLetter) => {
                    const groupRegs = groupStageStandings.filter(r => r.groupStageGroup === gLetter);
                    return (
                      <div key={gLetter} className="p-4 bg-[#12120e] border border-eb-yellow/20 hover:border-eb-yellow/30 rounded space-y-3">
                        <div className="border-b border-eb-yellow/30 pb-2 flex justify-between items-center">
                          <h4 className="text-sm font-black text-white uppercase tracking-wider">Group {gLetter}</h4>
                          <span className="text-[9px] text-gray-500 font-bold uppercase">{groupRegs.length} {activeEvent?.type === 'Solo' ? 'Players' : 'Teams'} Slot</span>
                        </div>
                        {groupRegs.length > 0 ? (
                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {groupRegs.map((reg, rIdx) => (
                              <div key={reg._id} className="p-2.5 bg-black border border-white/5 rounded text-xs space-y-1">
                                <div className="flex justify-between text-white font-bold">
                                  <span>{rIdx + 1}. {reg.allInGameNames?.[0] || 'Unknown'}</span>
                                  {activeEvent?.type !== 'Solo' && <span className="text-[9px] text-eb-yellow font-mono font-medium">#{reg.teamNumber}</span>}
                                </div>
                                {activeEvent?.type === 'Solo' ? (
                                  <div className="text-[9px] text-gray-500 font-mono">
                                    UID: {reg.allCharacterIds?.[0] || 'N/A'}
                                  </div>
                                ) : (
                                  <div className="text-[9px] text-gray-500 font-mono space-y-0.5">
                                    {reg.allInGameNames?.map((name, pIdx) => (
                                      <div key={pIdx} className="truncate">
                                        P{pIdx+1}: {name} ({reg.allCharacterIds?.[pIdx]})
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center py-8 text-gray-600 text-xs">No teams assigned yet.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {viewTab === 'schedule' && (
                <div className="space-y-4">
                  {groupStageSchedule.length > 0 ? (
                    <div className="overflow-x-auto border border-eb-yellow/30 bg-black/60 rounded">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-black text-gray-400 font-black uppercase tracking-wider border-b border-eb-yellow/30 text-[9px]">
                            <th className="p-4 text-center w-16">Match</th>
                            <th className="p-4 text-center w-16">Day</th>
                            <th className="p-4">Matchup</th>
                            <th className="p-4">Map</th>
                            <th className="p-4">Scheduled Date/Time</th>
                            <th className="p-4 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-eb-yellow/30 text-gray-300">
                          {groupStageSchedule.map((m) => {
                            const date = new Date(m.matchDate);
                            const displayDate = date.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                            return (
                              <tr key={m._id} className="hover:bg-white/[0.01] transition-colors">
                                <td className="p-4 text-center font-mono font-bold">#{m.matchNumber}</td>
                                <td className="p-4 text-center font-mono font-semibold">Day {m.dayNumber}</td>
                                <td className="p-4 font-bold text-white uppercase">{m.matchup}</td>
                                <td className="p-4 font-mono font-bold text-eb-yellow">{m.map}</td>
                                <td className="p-4 text-gray-500 font-medium">{displayDate}</td>
                                <td className="p-4 text-right">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                    m.isPlayed ? 'bg-[#10b981]/15 text-[#10b981]' : 'bg-gold/15 text-gold'
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
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-xs">
                      No schedule matches generated.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : hasDynamicStandings ? (
            <div className="overflow-x-auto border border-eb-yellow/30 bg-black/60 rounded">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-black text-gray-400 font-black uppercase tracking-wider border-b border-eb-yellow/30 text-[10px]">
                    <th className="p-4 text-center w-16">Rank</th>
                    <th className="p-4">Roster / Players</th>
                    <th className="p-4 font-mono text-right w-32">{activeEvent?.type === 'Squad' ? 'Total Kills' : 'Total Points'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-eb-yellow/30 text-gray-300">
                  {standings.slice(0, 100).map((row, idx) => {
                    const isSquad = activeEvent?.type === 'Squad';
                    const displayRank = row.rank || idx + 1;
                    return (
                      <tr key={row._id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-sm font-black text-xs ${
                            displayRank === 1 
                              ? 'bg-eb-yellow text-black font-extrabold' 
                              : displayRank === 2 
                              ? 'bg-gray-300 text-black font-extrabold' 
                              : displayRank === 3 
                              ? 'bg-amber-600 text-white font-extrabold' 
                              : 'bg-gray-900 text-gray-400'
                          }`}>
                            {displayRank}
                          </span>
                        </td>
                        <td className="p-4">
                          {isSquad ? (
                            <div className="space-y-1">
                              <span className="font-bold text-white uppercase tracking-wide block">
                                Squad Leader: {row.allInGameNames?.[0] || 'Unknown'} ({row.trackingUid})
                              </span>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-555 font-mono">
                                {row.allInGameNames?.map((name, pIdx) => (
                                  <span key={pIdx} className="bg-white/[0.02] border border-white/5 px-1.5 py-0.5 rounded-sm">
                                    P{pIdx + 1}: {name} ({row.allCharacterIds?.[pIdx]}) - <strong className="text-eb-yellow">{row.playerKills?.[pIdx] || 0} Kills</strong>
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="font-bold text-white uppercase tracking-wide">
                                {row.allInGameNames?.[0] || 'Unknown'}
                              </span>
                              <span className="text-gray-500 font-mono ml-2">({row.trackingUid})</span>
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-eb-yellow text-sm">
                          {isSquad 
                            ? `${(row.playerKills || []).reduce((sum, k) => sum + (k || 0), 0)} kills` 
                            : `${row.points || 0} pts`
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : hasLeaderboardHtml ? (
            <div 
              className="prose prose-invert max-w-none text-xs border border-eb-yellow/30 bg-black/60 p-6 rounded overflow-auto"
              dangerouslySetInnerHTML={{ __html: activeEvent.leaderboardHtml }}
            />
          ) : (
            <div className="text-center p-12 bg-black/40 border border-eb-yellow/30 rounded space-y-3">
              <Trophy className="w-12 h-12 text-eb-yellow mx-auto animate-pulse" />
              <p className="text-sm text-gray-400 font-semibold">Leaderboard scoresheets have not been posted yet.</p>
              <p className="text-[10px] text-gray-500 uppercase font-mono">Standings sync instantly once matches finish</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
