import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Trophy, ListOrdered } from 'lucide-react';

export default function Leaderboard() {
  const { activeEvent, loadingActiveEvent } = useContext(AppContext);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCustom, setIsCustom] = useState(false);

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
        <div className="border-b border-gray-900 pb-5">
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
          <div className="flex items-center justify-between border-b border-gray-900 pb-3">
            <span className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
              <ListOrdered className="w-4 h-4 text-eb-yellow" />
              {isCustom ? 'Global Standings' : (activeEvent ? activeEvent.title : 'Active Standings')}
            </span>
            {activeEvent && !isCustom && (
              <span className="px-2.5 py-0.5 rounded-sm bg-black border border-gray-800 text-gold text-[9px] font-black uppercase tracking-wider font-mono">
                {activeEvent.type || 'Squad'} format
              </span>
            )}
            {isCustom && (
              <span className="px-2.5 py-0.5 rounded-sm bg-black border border-gray-800 text-gold text-[9px] font-black uppercase tracking-wider font-mono">
                Global Format
              </span>
            )}
          </div>

          {hasDynamicStandings ? (
            <div className="overflow-x-auto border border-gray-900 bg-black/60 rounded">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-black text-gray-400 font-black uppercase tracking-wider border-b border-gray-900 text-[10px]">
                    <th className="p-4 text-center w-16">Rank</th>
                    <th className="p-4">Roster / Players</th>
                    <th className="p-4 font-mono text-right w-32">{isCustom ? 'Score Details' : (activeEvent?.type === 'Squad' ? 'Total Kills' : 'Total Points')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-950 text-gray-300">
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
                          {isCustom ? (
                            <div>
                              <span className="font-bold text-white uppercase tracking-wide">{row.name}</span>
                              {row.details && (
                                <p className="text-[10px] text-gray-500 font-mono mt-0.5">{row.details}</p>
                              )}
                            </div>
                          ) : isSquad ? (
                            <div className="space-y-1">
                              <span className="font-bold text-white uppercase tracking-wide block">
                                Squad Leader: {row.allInGameNames?.[0] || 'Unknown'} ({row.trackingUid})
                              </span>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-500 font-mono">
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
                          {isCustom 
                            ? `${row.points || 0} pts / ${row.kills || 0} kills`
                            : (isSquad 
                              ? `${(row.playerKills || []).reduce((sum, k) => sum + (k || 0), 0)} kills` 
                              : `${row.points || 0} pts`
                            )
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
              className="prose prose-invert max-w-none text-xs border border-gray-900 bg-black/60 p-6 rounded overflow-auto"
              dangerouslySetInnerHTML={{ __html: activeEvent.leaderboardHtml }}
            />
          ) : (
            <div className="text-center p-12 bg-black/40 border border-gray-900 rounded space-y-3">
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
