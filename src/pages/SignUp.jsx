import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { ArrowLeft, User, Phone, Lock, Key, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export default function SignUp() {
  const { signUp } = useContext(AppContext);
  const navigate = useNavigate();

  const [uid, setUid] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tempErrors = {};

    if (!uid.trim()) {
      tempErrors.uid = 'Character UID is required';
    } else if (uid.trim().length < 4) {
      tempErrors.uid = 'UID must be at least 4 characters';
    } else if (!/^\d+$/.test(uid.trim())) {
      tempErrors.uid = 'Character UID must contain numbers only';
    }

    if (!phoneNumber.trim()) {
      tempErrors.phoneNumber = 'Phone number is required';
    } else if (phoneNumber.trim().length < 8) {
      tempErrors.phoneNumber = 'Invalid phone number';
    }

    if (!password) {
      tempErrors.password = 'Password is required';
    } else if (password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
    }

    if (!recoveryPassword.trim()) {
      tempErrors.recoveryPassword = 'Recovery phrase/password is required';
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await signUp(uid.trim(), phoneNumber.trim(), password, recoveryPassword.trim());
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/signin');
        }, 2500);
      } else {
        setErrors({ submit: res.data.error || 'Failed to create account.' });
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

          <div className="text-center border-b border-eb-yellow/30 pb-4">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest text-white">
              Create Account
            </h2>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mt-1">
              Join the esports roster combat network
            </p>
          </div>

          {success ? (
            <div className="text-center space-y-4 py-8 animate-fadeIn">
              <div className="w-16 h-16 rounded bg-eb-yellow/10 text-eb-yellow flex items-center justify-center mx-auto border border-eb-yellow/50">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-black uppercase text-white tracking-wider">Account Registered!</h3>
              <p className="text-gray-400 text-xs font-semibold">Redirecting you to sign in page...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {errors.submit && (
                <div className="p-3 bg-tan/10 border border-tan/30 text-gold text-xs font-bold rounded-sm flex items-start gap-2">
                  <AlertTriangle className="w-4.5 h-4.5 text-eb-yellow flex-shrink-0" />
                  <span>{errors.submit}</span>
                </div>
              )}

              {/* UID Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                  Character UID
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={uid}
                    onChange={(e) => {
                      setUid(e.target.value);
                      if (errors.uid) setErrors(prev => { const n = {...prev}; delete n.uid; return n; });
                    }}
                    placeholder="Enter unique character ID"
                    className="pubg-input w-full !pl-10 font-mono text-sm"
                    disabled={submitting}
                  />
                </div>
                {errors.uid && <p className="text-tan text-[10px] font-bold">{errors.uid}</p>}
              </div>

              {/* Phone Number Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      if (errors.phoneNumber) setErrors(prev => { const n = {...prev}; delete n.phoneNumber; return n; });
                    }}
                    placeholder="e.g. 03001234567"
                    className="pubg-input w-full !pl-10 text-sm"
                    disabled={submitting}
                  />
                </div>
                {errors.phoneNumber && <p className="text-tan text-[10px] font-bold">{errors.phoneNumber}</p>}
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                  Password
                </label>
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

              {/* Recovery Password Field */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                    Recovery Password/Phrase
                  </label>
                  <span className="text-[9px] text-orig-yellow/80 font-bold uppercase">For Account Recovery</span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type={showRecovery ? "text" : "password"}
                    value={recoveryPassword}
                    onChange={(e) => {
                      setRecoveryPassword(e.target.value);
                      if (errors.recoveryPassword) setErrors(prev => { const n = {...prev}; delete n.recoveryPassword; return n; });
                    }}
                    placeholder="Secret phrase (e.g. Favorite game)"
                    className="pubg-input w-full !pl-10 !pr-10 text-sm"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRecovery(!showRecovery)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-white"
                  >
                    {showRecovery ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.recoveryPassword && <p className="text-tan text-[10px] font-bold">{errors.recoveryPassword}</p>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3 mt-2 text-black font-black uppercase text-xs tracking-widest transition-all duration-300 ${
                  submitting 
                    ? 'bg-gray-950 text-gray-655 cursor-wait border border-eb-yellow/30' 
                    : 'bg-eb-yellow hover:scale-[1.02]'
                }`}
              >
                {submitting ? 'Registering Account...' : 'Initialize Signup'}
              </button>

              <div className="text-center pt-2">
                <p className="text-[11px] text-gray-500 font-semibold">
                  Already have an account?{' '}
                  <Link to="/signin" className="text-eb-yellow hover:underline uppercase font-bold">
                    Sign In
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
