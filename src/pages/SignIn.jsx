import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { ArrowLeft, User, Lock, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export default function SignIn() {
  const { signIn } = useContext(AppContext);
  const navigate = useNavigate();

  const [uidOrPhone, setUidOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tempErrors = {};

    if (!uidOrPhone.trim()) {
      tempErrors.uidOrPhone = 'UID or Phone Number is required';
    }

    if (!password) {
      tempErrors.password = 'Password is required';
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await signIn(uidOrPhone.trim(), password);
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setErrors({ submit: res.data.error || 'Invalid credentials.' });
      }
    } catch (err) {
      setErrors({ submit: 'Connection error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black py-12 px-4 md:px-8 flex items-center justify-center">
      <div className="max-w-md w-full space-y-6">
        
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm font-semibold transition-all duration-200 hover:-translate-x-1">
          <ArrowLeft className="w-4 h-4 text-eb-yellow" />
          Back to Homepage
        </Link>

        <div className="pubg-hud-panel p-8 space-y-6 shadow-glow-yellow relative">
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-eb-yellow"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-eb-yellow"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-eb-yellow"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-eb-yellow"></div>

          <div className="text-center border-b border-gray-900 pb-4">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest text-white">
              Roster Login
            </h2>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mt-1">
              Sign in to manage tournament combats
            </p>
          </div>

          {success ? (
            <div className="text-center space-y-4 py-8 animate-fadeIn">
              <div className="w-16 h-16 rounded bg-eb-yellow/10 text-eb-yellow flex items-center justify-center mx-auto border border-eb-yellow/50">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-black uppercase text-white tracking-wider">Access Granted!</h3>
              <p className="text-gray-400 text-xs font-semibold">Redirecting you to dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {errors.submit && (
                <div className="p-3 bg-tan/10 border border-tan/30 text-gold text-xs font-bold rounded-sm flex items-start gap-2">
                  <AlertTriangle className="w-4.5 h-4.5 text-eb-yellow flex-shrink-0" />
                  <span>{errors.submit}</span>
                </div>
              )}

              {/* UID / Phone Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                  Character UID or Phone Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={uidOrPhone}
                    onChange={(e) => {
                      setUidOrPhone(e.target.value);
                      if (errors.uidOrPhone) setErrors(prev => { const n = {...prev}; delete n.uidOrPhone; return n; });
                    }}
                    placeholder="Enter UID or Phone Number"
                    className="pubg-input w-full !pl-10 text-sm font-mono"
                    disabled={submitting}
                  />
                </div>
                {errors.uidOrPhone && <p className="text-tan text-[10px] font-bold">{errors.uidOrPhone}</p>}
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                    Password
                  </label>
                  <Link to="/recover-password" className="text-[10px] text-gray-500 hover:text-eb-yellow hover:underline font-bold uppercase">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors(prev => { const n = {...prev}; delete n.password; return n; });
                    }}
                    placeholder="••••••••"
                    className="pubg-input w-full !pl-10 !pr-10 text-sm font-mono"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-tan text-[10px] font-bold">{errors.password}</p>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3 mt-2 text-black font-black uppercase text-xs tracking-widest transition-all duration-300 ${
                  submitting 
                    ? 'bg-gray-950 text-gray-655 cursor-wait border border-gray-900' 
                    : 'bg-eb-yellow hover:scale-[1.02]'
                }`}
              >
                {submitting ? 'Authenticating...' : 'Sign In Now'}
              </button>

              <div className="text-center pt-2">
                <p className="text-[11px] text-gray-500 font-semibold">
                  New combatant?{' '}
                  <Link to="/signup" className="text-eb-yellow hover:underline uppercase font-bold">
                    Create Account
                  </Link>
                </p>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
