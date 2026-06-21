import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, Menu, X, Swords, ListOrdered } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) => 
    `relative px-5 py-2 transform -skew-x-12 transition-all duration-300 border border-eb-yellow/30 hover:border-eb-yellow hover:scale-105 ${
      isActive(path) 
        ? 'bg-eb-yellow text-black font-black' 
        : 'bg-[#12120e] text-gray-300 hover:text-white font-semibold'
    }`;

  const navLinks = [
    { label: 'Home', path: '/', icon: Trophy },
    { label: 'Leader board', path: '/leaderboard', icon: ListOrdered },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#090907]/90 backdrop-blur-md border-b border-orig-yellow/20 px-4 py-3 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-eb-yellow p-1.5 rounded-tr-lg rounded-bl-lg transform skew-x-12 group-hover:scale-105 transition-all duration-300">
            <Swords className="w-6 h-6 text-black -skew-x-12" />
          </div>
          <span className="text-2xl font-black italic tracking-widest text-eb-yellow">
            ESPORTS
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.path} to={link.path} className={linkClass(link.path)}>
                <span className="transform skew-x-12 flex items-center gap-2 text-xs uppercase tracking-wider font-mono">
                  <Icon className="w-4 h-4" />
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Mobile Hamburger Menu Toggle */}
        <div className="flex items-center md:hidden">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 text-gray-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 bg-black border border-orig-yellow/20 rounded-lg p-4 space-y-3 animate-fadeIn">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link 
                  key={link.path} 
                  to={link.path} 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-bold transition-all ${
                    isActive(link.path) 
                      ? 'text-black bg-eb-yellow' 
                      : 'text-gray-400 hover:text-white hover:bg-card-bg/30'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
