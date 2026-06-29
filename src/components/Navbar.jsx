import React, { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, Menu, X, Swords, ListOrdered, LogOut, LogIn, UserPlus, User } from 'lucide-react';
import { AppContext } from '../context/AppContext';

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logoutUser } = useContext(AppContext);

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
  if (user) {
    navLinks.push({ label: 'Dashboard', path: '/dashboard', icon: User });
  }

  return (
    <nav className="sticky top-0 z-50 bg-[#090907]/90 backdrop-blur-md border-b border-orig-yellow/20 px-4 py-3 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Title Epix esports */}
        <Link to="/" className="flex items-center group">
          <span className="text-2xl font-black italic tracking-widest text-eb-yellow uppercase">
            Epix esports
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

          {/* User auth links */}
          {user ? (
            <div className="flex items-center gap-4 border-l border-white/10 pl-6">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-eb-yellow/10 border border-eb-yellow/30 rounded-sm">
                <User className="w-3.5 h-3.5 text-eb-yellow" />
                <span className="text-xs font-mono font-bold text-white tracking-wider">
                  {user.uid}
                </span>
              </div>
              <button
                onClick={logoutUser}
                className="flex items-center gap-1 text-xs uppercase tracking-wider font-bold text-gray-400 hover:text-tan transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4 border-l border-white/10 pl-6">
              <Link
                to="/signin"
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white transition-colors"
              >
                <LogIn className="w-4 h-4 text-eb-yellow" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/signup"
                className="px-4 py-1.5 bg-eb-yellow text-black font-black text-xs uppercase tracking-wider hover:scale-105 transition-all duration-300"
              >
                <span>Sign Up</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Menu Toggle */}
        <div className="flex items-center md:hidden">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 text-black"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 bg-black border border-eb-yellow/30 rounded-lg p-4 space-y-4 animate-fadeIn">
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
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile Auth Sections */}
          <div className="border-t border-white/5 pt-3 flex flex-col gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2.5 px-4 py-2 bg-eb-yellow/5 border border-eb-yellow/20 rounded-md">
                  <User className="w-4.5 h-4.5 text-eb-yellow" />
                  <span className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                    {user.uid}
                  </span>
                </div>
                <button
                  onClick={() => {
                    logoutUser();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 text-left w-full"
                >
                  <LogOut className="w-5 h-5 text-tan" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-bold text-gray-300 hover:text-white hover:bg-white/5"
                >
                  <LogIn className="w-5 h-5 text-eb-yellow" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-eb-yellow text-black font-black rounded-md text-sm text-center"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Sign Up</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
