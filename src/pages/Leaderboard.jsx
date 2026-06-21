import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Trophy, ListOrdered } from 'lucide-react';

export default function Leaderboard() {
  const { activeEvent, loadingActiveEvent } = useContext(AppContext);

  if (loadingActiveEvent) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
        <h3 className="text-sm font-black uppercase text-white tracking-widest animate-pulse">Syncing Standings...</h3>
      </div>
    );
  }

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

        {/* Standings Grid / HTML Render */}
        <div className="pubg-hud-panel p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-900 pb-3">
            <span className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
              <ListOrdered className="w-4 h-4 text-eb-yellow" />
              {activeEvent ? activeEvent.title : 'Active Standings'}
            </span>
          </div>

          {activeEvent && activeEvent.leaderboardHtml ? (
            <div 
              className="prose prose-invert max-w-none text-xs border border-gray-900 bg-black/60 p-6 rounded overflow-auto"
              dangerouslySetInnerHTML={{ __html: activeEvent.leaderboardHtml }}
            />
          ) : (
            <div className="text-center p-12 bg-black/40 border border-gray-900 rounded space-y-3">
              <Trophy className="w-12 h-12 text-eb-yellow mx-auto" />
              <p className="text-sm text-gray-400 font-semibold">Leaderboard scoresheets have not been posted yet.</p>
              <p className="text-[10px] text-gray-500 uppercase font-mono">Standings sync instantly once matches finish</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
