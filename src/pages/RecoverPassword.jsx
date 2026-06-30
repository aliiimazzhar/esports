import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { ArrowLeft, User, Phone, Key, Lock, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export default function RecoverPassword() {
  const { recoverUserPassword } = useContext(AppContext);
  const navigate = useNavigate();

  const [uid, setUid] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [showRecovery, setShowRecovery] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tempErrors = {};

    if (!uid.trim()) {
      tempErrors.uid = 'Character UID is required';
    }

    if (!phoneNumber.trim()) {
      tempErrors.phoneNumber = 'Phone number is required';
    }

    if (!recoveryPassword.trim()) {
      tempErrors.recoveryPassword = 'Recovery phrase/password is required';
    }

    if (!newPassword) {
      tempErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      tempErrors.newPassword = 'New password must be at least 6 characters';
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await recoverUserPassword(uid.trim(), phoneNumber.trim(), recoveryPassword.trim(), newPassword);
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/signin');
        }, 3000);
      } else {
        setErrors({ submit: res.data.error || 'Password recovery failed. Please verify details.' });
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
        
        <Link to="/signin" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm font-semibold transition-all duration-200 hover:-translate-x-1">
          <ArrowLeft className="w-4 h-4 text-eb-yellow" />
          Back to Sign In
        </Link>

        <div className="pubg-hud-panel p-8 space-y-6 shadow-glow-yellow relative">

          <div className="text-center border-b border-eb-yellow/30 pb-4">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest text-white">
              Password Reset
            </h2>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mt-1">
              Verify credentials and recovery secret to update password
            </p>
          </div>

          {success ? (
            <div className="text-center space-y-4 py-8 animate-fadeIn">
              <div className="w-16 h-16 rounded bg-eb-yellow/10 text-eb-yellow flex items-center justify-center mx-auto border border-eb-yellow/50">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-black uppercase text-white tracking-wider">Password Reset!</h3>
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
                    placeholder="Enter character ID"
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

              {/* Recovery Password Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                  Recovery Password/Phrase
                </label>
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
                    placeholder="Enter recovery secret phrase"
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

              {/* New Password Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errors.newPassword) setErrors(prev => { const n = {...prev}; delete n.newPassword; return n; });
                    }}
                    placeholder="Enter new password (min 6 chars)"
                    className="pubg-input w-full !pl-10 !pr-10 text-sm font-mono"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && <p className="text-tan text-[10px] font-bold">{errors.newPassword}</p>}
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
                {submitting ? 'Resetting Password...' : 'Reset Password'}
              </button>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
