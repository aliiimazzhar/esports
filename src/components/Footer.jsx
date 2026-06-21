import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Info, HelpCircle, FileText } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-black border-t border-orig-yellow/10 mt-auto py-8 px-4 md:px-8 text-gray-500 text-xs">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Brand & Mission */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black italic tracking-wider text-eb-yellow">ESPORTS</span>
          </div>
          <p className="text-gray-400 max-w-sm leading-relaxed">
            The ultimate tournament arena for local PUBG Mobile and PC squads. Register, host custom matches, track transaction approvals, and dominate local leaderboards.
          </p>
        </div>

        {/* Quick Links & Rules */}
        <div className="space-y-3">
          <span className="text-sm font-bold text-white uppercase tracking-wider">Tournament Rules</span>
          <ul className="space-y-2 text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-eb-yellow font-black">•</span>
              <span>Squad registrations require verified manual transaction slips.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-eb-yellow font-black">•</span>
              <span>Custom room details are revealed 15 minutes before the match start time.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-eb-yellow font-black">•</span>
              <span>Strict anti-cheat protocols. Hacks or glitches result in permanent bans.</span>
            </li>
          </ul>
        </div>

        {/* Disclaimer Area */}
        <div className="space-y-3">
          <span className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-eb-yellow" />
            Legal Notice
          </span>
          <p className="text-gray-400 leading-relaxed">
            This application is an independent tournament hosting platform and is not affiliated with, authorized, sponsored, or endorsed by Krafton Inc., Tencent Games, or PUBG Corporation.
          </p>
          <div className="flex items-center gap-4 text-[10px] text-gray-600 mt-2">
            <span>© 2026 Esports Platform. All Rights Reserved.</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
