import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { ArrowLeft, Upload, FileImage, CheckCircle, Plus, Trash2, Info, AlertTriangle } from 'lucide-react';

export default function Register() {
  const { activeEvent, user, submitRegistration } = useContext(AppContext);
  const navigate = useNavigate();

  const [contactPhone, setContactPhone] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [uids, setUids] = useState(() => {
    if (activeEvent?.type === 'Squad') {
      return [user?.uid || '', '', '', ''];
    }
    return [user?.uid || ''];
  });
  const [inGameNames, setInGameNames] = useState(() => {
    if (activeEvent?.type === 'Squad') {
      return ['', '', '', ''];
    }
    return [''];
  });
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);

  // Validation errors
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successReg, setSuccessReg] = useState(null);

  const isSoloTournament = activeEvent?.type === 'Solo';
  const limit = isSoloTournament ? 100 : 96;
  const isFull = activeEvent && activeEvent.registeredPlayersCount >= limit;

  if (!activeEvent || isFull) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="w-16 h-16 text-eb-yellow mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold uppercase text-white">
          {!activeEvent ? 'Registration Closed' : 'Registration Full'}
        </h2>
        <p className="text-gray-400 text-sm mt-2">
          {!activeEvent 
            ? 'No active tournament is currently open for registration.' 
            : `All slots for "${activeEvent.title}" have been filled (${activeEvent.registeredPlayersCount}/${limit} players registered).`}
        </p>
        <Link to="/" className="mt-6 px-6 py-2.5 rounded bg-eb-yellow text-black font-black uppercase text-xs tracking-wider transition-all duration-300 hover:scale-[1.03]">
          Back to Homepage
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="w-16 h-16 text-eb-yellow mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold uppercase text-white">Sign In Required</h2>
        <p className="text-gray-400 text-sm mt-2">You must be signed in to register for tournaments.</p>
        <div className="flex gap-4 mt-6">
          <Link to="/signin?redirect=register" className="px-6 py-2.5 rounded bg-eb-yellow text-black font-black uppercase text-xs tracking-wider transition-all duration-300 hover:scale-[1.03]">
            Sign In
          </Link>
          <Link to="/signup" className="px-6 py-2.5 rounded bg-black border border-eb-yellow/30 text-white font-black uppercase text-xs tracking-wider transition-all duration-300 hover:scale-[1.03]">
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  // Handle Character UID fields
  const handleUidChange = (index, value) => {
    const updated = [...uids];
    updated[index] = value;
    setUids(updated);
    if (errors[`uid_${index}`]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[`uid_${index}`];
        return next;
      });
    }
  };

  const handleNameChange = (index, value) => {
    const updated = [...inGameNames];
    updated[index] = value;
    setInGameNames(updated);
    if (errors[`name_${index}`]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[`name_${index}`];
        return next;
      });
    }
  };

  const addUidField = () => {
    setUids([...uids, '']);
    setInGameNames([...inGameNames, '']);
  };

  const removeUidField = (index) => {
    if (uids.length > 1) {
      const updatedUids = uids.filter((_, i) => i !== index);
      const updatedNames = inGameNames.filter((_, i) => i !== index);
      setUids(updatedUids);
      setInGameNames(updatedNames);
    }
  };

  // Handle image upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, file: 'Invalid file type. Please upload an image receipt (PNG, JPG, JPEG).' }));
      setScreenshotFile(null);
      setScreenshotPreview(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, file: 'File too large. Maximum size is 5MB.' }));
      setScreenshotFile(null);
      setScreenshotPreview(null);
      return;
    }

    setErrors(prev => { const n = { ...prev }; delete n.file; return n; });
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, file: 'Invalid file. Please upload an image receipt.' }));
      setScreenshotPreview(null);
      return;
    }

    setErrors(prev => { const n = { ...prev }; delete n.file; return n; });
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const tempErrors = {};

    if (!contactPhone.trim()) {
      tempErrors.contactPhone = 'WhatsApp phone number is required';
    } else if (contactPhone.trim().length < 8) {
      tempErrors.contactPhone = 'WhatsApp phone number is too short';
    }

    if (!transactionId.trim()) {
      tempErrors.transactionId = 'Transaction ID (TxID) is required';
    }

    uids.forEach((uid, index) => {
      if (!uid.trim()) {
        tempErrors[`uid_${index}`] = `Character ID ${index + 1} is required`;
      } else if (uid.trim().length < 4) {
        tempErrors[`uid_${index}`] = `PUBG Character ID must be at least 4 characters`;
      }
    });

    inGameNames.forEach((name, index) => {
      if (!name.trim()) {
        tempErrors[`name_${index}`] = `In-game Name ${index + 1} is required`;
      }
    });

    if (!screenshotFile) {
      tempErrors.file = 'Please upload your payment transfer receipt screenshot';
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append('registrationType', activeEvent.type === 'Solo' ? 'Solo' : 'Team');
    formData.append('whatsappNumber', contactPhone.trim());
    formData.append('transactionId', transactionId.trim());
    formData.append('allCharacterIds', JSON.stringify(uids.map(u => u.trim())));
    formData.append('allInGameNames', JSON.stringify(inGameNames.map(n => n.trim())));
    formData.append('paymentScreenshot', screenshotFile);
    formData.append('eventId', activeEvent._id);

    try {
      const res = await submitRegistration(formData);
      if (res.ok) {
        setSuccessReg(res.data.registration);
        setSuccess(true);
      } else {
        setErrors({ submit: res.data.error || 'Failed to submit registration. Please verify details.' });
      }
    } catch (err) {
      setErrors({ submit: 'Connection error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const platformFee = 75;
  const isSolo = uids.filter(Boolean).length <= 1;
  const baseFee = isSolo ? (activeEvent.soloEntryFee || 0) : (activeEvent.teamEntryFee || 0);
  const totalAmount = baseFee + platformFee;

  return (
    <div className="min-h-screen bg-black py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation */}
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm font-semibold transition-all duration-200 hover:-translate-x-1">
          <ArrowLeft className="w-4 h-4 text-eb-yellow" />
          Cancel Registration
        </Link>

        {success ? (
          <div className="pubg-hud-panel p-10 text-center space-y-6 max-w-xl mx-auto shadow-glow-yellow animate-zoomIn">
            <div className="w-16 h-16 rounded bg-eb-yellow/10 text-eb-yellow flex items-center justify-center mx-auto border border-eb-yellow/50">
              <CheckCircle className="w-10 h-10" />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-extrabold uppercase text-white tracking-wider">
                Form Received!
              </h2>
              <p className="text-gray-400 text-xs font-semibold leading-relaxed max-w-sm mx-auto">
                Use any of your entered Character UIDs directly in the search bar on the homepage to access lobby keys later.
              </p>
            </div>

            <div className="bg-black/60 rounded border border-eb-yellow/30 p-4 space-y-2.5 text-xs text-left max-w-md mx-auto">
              <div className="flex justify-between text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <span>Tracking Character ID:</span>
                <span className="font-bold text-white font-mono">{successReg?.trackingUid}</span>
              </div>
              <div className="flex justify-between text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <span>Tournament:</span>
                <span className="font-bold text-white text-right">{activeEvent.title}</span>
              </div>
              <div className="flex justify-between text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <span>Audit Status:</span>
                <span className="px-2 py-0.5 rounded bg-harvest/15 text-gold border border-harvest/30 font-black uppercase text-[9px] tracking-wider animate-pulse">
                  Pending Review
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/"
                className="inline-block px-8 py-3 bg-eb-yellow text-black font-black uppercase text-xs tracking-widest transition-all duration-300 hover:scale-[1.03]"
              >
                Return to Homepage
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Form Details */}
            <div className="lg:col-span-7 pubg-hud-panel p-6 space-y-5">
              <div className="border-b border-eb-yellow/30 pb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">
                  Squad Combat Registration
                </h3>
                <p className="text-gray-500 text-[10px] font-semibold mt-0.5">
                  Fill out your contact details and register player UIDs.
                </p>
              </div>

              {errors.submit && (
                <div className="p-3 bg-tan/10 border border-tan/30 text-gold text-xs font-bold rounded-sm flex items-start gap-2">
                  <AlertTriangle className="w-4.5 h-4.5 text-eb-yellow flex-shrink-0" />
                  <span>{errors.submit}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Contact Phone */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                    WhatsApp Phone Number
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => {
                      setContactPhone(e.target.value);
                      if (errors.contactPhone) setErrors(prev => { const n = {...prev}; delete n.contactPhone; return n; });
                    }}
                    placeholder="e.g. 03001234567"
                    className="pubg-input w-full text-xs font-mono"
                    disabled={submitting}
                  />
                  {errors.contactPhone && <p className="text-tan text-[10px] font-bold mt-1">{errors.contactPhone}</p>}
                </div>

                {/* Transaction ID */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                    Transaction ID (TxID)
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => {
                      setTransactionId(e.target.value);
                      if (errors.transactionId) setErrors(prev => { const n = {...prev}; delete n.transactionId; return n; });
                    }}
                    placeholder="e.g. EasyPaisa or JazzCash TxID"
                    className="pubg-input w-full text-xs font-mono"
                    disabled={submitting}
                  />
                  {errors.transactionId && <p className="text-tan text-[10px] font-bold mt-1">{errors.transactionId}</p>}
                </div>

                {/* Character UIDs */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Registered Roster UIDs
                    </label>
                    {activeEvent?.type !== 'Squad' && (
                      <button
                        type="button"
                        onClick={addUidField}
                        className="px-2.5 py-1 bg-black border border-eb-yellow/20 hover:border-eb-yellow text-[9px] font-bold uppercase tracking-wider text-gray-400 hover:text-white flex items-center gap-1"
                        disabled={submitting}
                      >
                        <Plus className="w-3 h-3" /> Add Slot
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {uids.map((uid, index) => (
                      <div key={index} className="space-y-1 bg-[#12120e]/60 p-2.5 border border-white/5 rounded">
                        <div className="flex items-center gap-1.5 mb-1.5 justify-between">
                          <span className="text-[10px] font-black text-orig-yellow font-mono">
                            {index === 0 ? 'TEAM LEADER (YOU)' : `PLAYER ${index + 1}`}
                          </span>
                          {uids.length > 1 && activeEvent?.type !== 'Squad' && (
                            <button
                              type="button"
                              onClick={() => removeUidField(index)}
                              className="p-1 bg-black border border-eb-yellow/30 text-gray-500 hover:text-tan hover:border-tan rounded"
                              disabled={submitting}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={uid}
                              onChange={(e) => handleUidChange(index, e.target.value)}
                              placeholder="PUBG Character UID"
                              className="pubg-input py-1.5 text-xs w-full font-mono"
                              disabled={submitting || (index === 0 && !!user?.uid)}
                              required
                            />
                            {errors[`uid_${index}`] && (
                              <p className="text-tan text-[9px] font-bold">{errors[`uid_${index}`]}</p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={inGameNames[index] || ''}
                              onChange={(e) => handleNameChange(index, e.target.value)}
                              placeholder="PUBG In-game Name"
                              className="pubg-input py-1.5 text-xs w-full font-sans"
                              disabled={submitting}
                              required
                            />
                            {errors[`name_${index}`] && (
                              <p className="text-tan text-[9px] font-bold">{errors[`name_${index}`]}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-harvest/5 border-l-4 border-harvest p-3 text-[10px] text-gray-400 leading-normal flex gap-2">
                    <Info className="w-4.5 h-4.5 text-eb-yellow flex-shrink-0" />
                    <span>
                      The very first Character ID written down above is designated as the **trackingUid** primary search token. Use this ID to track approval status later.
                    </span>
                  </div>
                </div>

                {/* Drag-and-drop payment slip upload */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                    Transfer Receipt Screenshot
                  </label>
                  
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden ${
                      screenshotPreview 
                        ? 'border-eb-yellow/45 bg-eb-yellow/[0.02]' 
                        : 'border-eb-yellow/20 hover:border-orig-yellow/30 bg-black/40'
                    }`}
                  >
                    <input 
                      type="file" 
                      id="receipt-file"
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                      disabled={submitting}
                    />
                    
                    <label htmlFor="receipt-file" className="cursor-pointer w-full text-center space-y-2">
                      {screenshotPreview ? (
                        <div className="space-y-2">
                          <img 
                            src={screenshotPreview} 
                            alt="Receipt Preview" 
                            className="max-h-36 mx-auto rounded border border-eb-yellow/30 shadow-2xl object-contain"
                          />
                          <p className="text-[10px] text-eb-yellow font-black uppercase tracking-wider flex items-center justify-center gap-1 animate-pulse">
                            <FileImage className="w-4 h-4" />
                            Change Receipt Screenshot
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 text-gray-500">
                          <Upload className="w-8 h-8 text-eb-yellow mx-auto" />
                          <p className="text-xs font-black uppercase tracking-wider text-gray-400">Drag & Drop Slip Here</p>
                          <p className="text-[10px] text-gray-650 uppercase font-semibold">Or click to browse files (max 5MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                  {errors.file && <p className="text-tan text-xs font-bold mt-1">{errors.file}</p>}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-3 text-black font-black uppercase text-xs tracking-widest transition-all duration-300 ${
                    submitting 
                      ? 'bg-gray-950 text-gray-600 cursor-wait border border-eb-yellow/30' 
                      : 'bg-eb-yellow hover:scale-[1.01]'
                  }`}
                >
                  {submitting ? 'Submitting Registration...' : 'Submit Verification Slip'}
                </button>

              </form>
            </div>

            {/* Right Column: Checkout Breakdown */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Payment Details info panel */}
              <div className="pubg-hud-panel p-6 space-y-5">
                <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-eb-yellow/30 pb-3">
                  Transfer Channels
                </h3>
                
                {/* Local Payment Wallet details */}
                <div className="space-y-4">
                  <div className="p-4 bg-black/60 border border-eb-yellow/30 rounded relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-[#ea580c] text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest">
                      EasyPaisa
                    </div>
                    <h4 className="text-xs font-black text-white uppercase">EasyPaisa</h4>
                    <div className="grid grid-cols-2 gap-1 text-[11px] mt-2 text-gray-400">
                      <span>Account Number:</span>
                      <span className="font-mono text-gold text-right font-bold">0300-1234567</span>
                      <span>Account Title:</span>
                      <span className="text-white text-right font-bold">Esports Admin</span>
                    </div>
                  </div>

                  <div className="p-4 bg-black/60 border border-eb-yellow/30 rounded relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-tan text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest">
                      JazzCash
                    </div>
                    <h4 className="text-xs font-black text-white">JazzCash</h4>
                    <div className="grid grid-cols-2 gap-1 text-[11px] mt-2 text-gray-400">
                      <span>Account Number:</span>
                      <span className="font-mono text-gold text-right font-bold">0312-7654321</span>
                      <span>Account Title:</span>
                      <span className="text-white text-right font-bold">Esports Admin</span>
                    </div>
                  </div>
                </div>

                {/* Entry fee calculations */}
                <div className="border-t border-eb-yellow/30 pt-4 space-y-2.5 text-xs text-gray-400 font-semibold">
                  <div className="flex justify-between">
                    <span>{isSolo ? 'Solo Registration Fee' : `Team Registration Fee (${uids.filter(Boolean).length} Players)`}</span>
                    <span className="font-bold text-white">
                      PKR {baseFee.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Transaction Fee</span>
                    <span className="font-bold text-white">PKR {platformFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-eb-yellow/30 pt-3 text-xs text-gold font-black uppercase tracking-wider">
                    <span>Total Amount Due</span>
                    <span className="text-eb-yellow font-black text-sm">PKR {totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
