import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { ArrowLeft, Clock, CheckCircle2, XCircle, Key, Copy, Check, Upload, FileImage, ShieldAlert, Award, ChevronRight } from 'lucide-react';

export default function PortalTracker() {
  const { id } = useParams();
  const { searchPortal, submitMatchProof } = useContext(AppContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registration, setRegistration] = useState(null);

  // Proof submission states
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [uploaderUid, setUploaderUid] = useState('');
  const [proofError, setProofError] = useState('');
  const [proofSuccess, setProofSuccess] = useState('');

  const [copiedField, setCopiedField] = useState('');

  // Load registration details
  const loadPortalData = useCallback(async () => {
    try {
      const res = await searchPortal(id);
      if (res.ok) {
        setRegistration(res.data);
        setError('');
        // Pre-select the first UID for uploader list
        if (res.data.allCharacterIds && res.data.allCharacterIds.length > 0) {
          setUploaderUid(res.data.allCharacterIds[0]);
        }
      } else {
        setError(res.data.error || 'Failed to retrieve portal registration records.');
      }
    } catch (err) {
      setError('Connection to backend failed.');
    } finally {
      setLoading(false);
    }
  }, [id, searchPortal]);

  useEffect(() => {
    loadPortalData();
  }, [loadPortalData]);

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  // Handle proof scoreboard file select
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProofError('Only image files (PNG, JPG, JPEG) are allowed.');
      setProofFile(null);
      setProofPreview(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProofError('File size exceeds the 5MB limit.');
      setProofFile(null);
      setProofPreview(null);
      return;
    }

    setProofError('');
    setProofFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Submit match proof
  const handleProofSubmit = async (e) => {
    e.preventDefault();
    if (!uploaderUid) {
      setProofError('Please select the uploader Character ID.');
      return;
    }
    if (!proofFile) {
      setProofError('Please choose a scoreboard image file.');
      return;
    }

    setSubmittingProof(true);
    setProofError('');
    setProofSuccess('');

    const formData = new FormData();
    formData.append('uid', uploaderUid);
    formData.append('matchProofScreenshot', proofFile);

    try {
      const res = await submitMatchProof(formData);
      if (res.ok) {
        setProofSuccess('Scoreboard match proof submitted successfully!');
        setProofFile(null);
        setProofPreview(null);
        // Refresh portal details
        await loadPortalData();
      } else {
        setProofError(res.data.error || 'Failed to upload scoreboard proof.');
      }
    } catch (err) {
      setProofError('Connection error. Upload failed.');
    } finally {
      setSubmittingProof(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
        <Clock className="w-12 h-12 text-eb-yellow animate-pulse mb-4" />
        <h3 className="text-sm font-black uppercase text-white tracking-widest">Retrieving Secure Portal...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
        <ShieldAlert className="w-16 h-16 text-eb-yellow mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold uppercase text-white">Registry Lookup Denied</h2>
        <p className="text-gray-400 text-sm mt-2">{error}</p>
        <Link to="/" className="mt-6 px-6 py-2.5 rounded bg-eb-yellow text-black font-black uppercase text-xs tracking-wider transition-all duration-300 hover:scale-[1.03]">
          Back to Search Hub
        </Link>
      </div>
    );
  }

  const { paymentStatus, allCharacterIds, contactPhoneNumber, paymentScreenshot, matchProofScreenshot, event } = registration;

  return (
    <div className="min-h-screen bg-black py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation */}
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm font-semibold transition-all duration-200 hover:-translate-x-1">
          <ArrowLeft className="w-4 h-4 text-eb-yellow" />
          Back to Search Hub
        </Link>

        {/* Header Block */}
        <div className="pubg-hud-panel p-6">
          <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest block">Lobby Roster Portal</span>
          <h2 className="text-xl md:text-3xl font-extrabold uppercase text-white tracking-wide mt-1">
            {event?.title}
          </h2>
          <p className="text-[10px] text-gray-400 mt-1 font-mono">
            Roster Leader Tracking ID: <span className="text-gold font-bold">{registration.trackingUid}</span>
          </p>
        </div>

        {/* 1. Pipeline Visualization Mapping Validation State */}
        <div className="pubg-hud-panel p-6 space-y-4">
          <h3 className="text-xs font-black text-white uppercase tracking-widest block">
            Verification Pipeline Status
          </h3>

          <div className="grid grid-cols-2 gap-2 max-w-md">
            {/* Step 1: Reviewing */}
            <div className={`p-4 border flex items-center justify-between transition-all ${
              paymentStatus === 'Pending' 
                ? 'border-eb-yellow bg-eb-yellow/[0.02] text-eb-yellow shadow-glow-yellow-sm' 
                : 'border-gray-900 bg-black/60 text-gray-500'
            }`}>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider leading-none">Stage 1</p>
                  <span className="text-[11px] font-extrabold block mt-0.5">Reviewing Receipt</span>
                </div>
              </div>
              {paymentStatus !== 'Pending' && <CheckCircle2 className="w-4 h-4 text-eb-yellow" />}
            </div>

            {/* Step 2: Approved / Rejected */}
            {paymentStatus === 'Rejected' ? (
              <div className="p-4 border border-tan bg-tan/5 text-gold flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider leading-none">Denial Alert</p>
                  <span className="text-[11px] font-extrabold block mt-0.5">Receipt Rejected</span>
                </div>
              </div>
            ) : (
              <div className={`p-4 border flex items-center justify-between transition-all ${
                paymentStatus === 'Approved' 
                  ? 'border-[#10b981] bg-[#10b981]/5 text-[#10b981] shadow-glow-gold' 
                  : 'border-gray-900 bg-black/60 text-gray-500'
              }`}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-eb-yellow" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider leading-none">Stage 2</p>
                    <span className="text-[11px] font-extrabold block mt-0.5">Approved Access</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Conditional Validation status alert banners */}
          {paymentStatus === 'Pending' && (
            <div className="bg-harvest/5 border-l-4 border-harvest p-3.5 text-xs text-gray-400 leading-relaxed font-semibold">
              Your transaction payment receipt is currently in the organizer audit queue. Verification clears within 2 hours. Keep checking this URL. Room keys will unlock immediately.
            </div>
          )}
          {paymentStatus === 'Rejected' && (
            <div className="bg-tan/10 border-l-4 border-tan p-3.5 text-xs text-gold leading-relaxed font-semibold">
              The submitted transaction details could not be verified by our coordinators. Roster entry has been denied. If this was an error, please submit a new registration with the correct screenshot.
            </div>
          )}
        </div>

        {/* Content columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column details */}
          <div className="md:col-span-6 space-y-6">
            
            {/* 2. Room ID / Password reveal block */}
            {paymentStatus === 'Approved' ? (
              <div className="pubg-hud-panel cyber-card p-6 space-y-4 shadow-glow-yellow border-t-2 border-t-eb-yellow">
                <div className="flex items-center justify-between border-b border-gray-900 pb-2">
                  <h4 className="text-xs font-black text-eb-yellow uppercase tracking-widest flex items-center gap-1.5">
                    <Key className="w-4 h-4" />
                    Custom Room Credentials
                  </h4>
                  <span className="px-2 py-0.5 bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 text-[8px] font-black uppercase tracking-widest">
                    Ready
                  </span>
                </div>

                {event?.roomId && event?.roomPassword ? (
                  <div className="space-y-3">
                    {/* Room ID */}
                    <div className="flex items-center justify-between bg-black p-3 border border-gray-950 rounded">
                      <div>
                        <span className="text-[8px] text-gray-500 block uppercase font-black">Room ID</span>
                        <span className="text-sm font-black text-white font-mono">{event.roomId}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(event.roomId, 'roomId')}
                        className="p-1.5 text-gray-500 hover:text-white bg-gray-950 hover:bg-gray-900 border border-gray-900 rounded"
                      >
                        {copiedField === 'roomId' ? <Check className="w-4 h-4 text-eb-yellow" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Room Password */}
                    <div className="flex items-center justify-between bg-black p-3 border border-gray-950 rounded">
                      <div>
                        <span className="text-[8px] text-gray-500 block uppercase font-black">Password</span>
                        <span className="text-sm font-black text-white font-mono">{event.roomPassword}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(event.roomPassword, 'roomPassword')}
                        className="p-1.5 text-gray-500 hover:text-white bg-gray-950 hover:bg-gray-900 border border-gray-900 rounded"
                      >
                        {copiedField === 'roomPassword' ? <Check className="w-4 h-4 text-eb-yellow" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Leaking alert box */}
                    <div className="bg-tan/10 border-l-4 border-tan p-3 text-[10px] text-gold leading-relaxed font-semibold">
                      IMPORTANT: Sharing room details with external players will result in roster bans and score disqualification. Keep this code secure.
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded border border-gray-950 bg-black/60 text-center space-y-2">
                    <Clock className="w-6 h-6 text-eb-yellow mx-auto" />
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Awaiting Broadcast</p>
                    <p className="text-[10px] text-gray-500 leading-normal font-medium">
                      Admin has not broadcasted lobby room codes yet. They are typically posted 15 minutes before the match start time coordinates.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="pubg-hud-panel p-6 text-center space-y-3 bg-[#12120e]/60">
                <Key className="w-10 h-10 text-eb-yellow mx-auto" />
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Credentials Restricted</h4>
                <p className="text-[10px] text-gray-500 leading-normal font-medium max-w-xs mx-auto">
                  Room IDs and passwords will unlock automatically once your transaction verification is marked **Approved** by organizers.
                </p>
              </div>
            )}

            {/* Roster details panel */}
            <div className="pubg-hud-panel p-5 space-y-3 bg-[#12120e]/40">
              <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest block">Registered Combat Roster</span>
              <div className="bg-black border border-gray-950 rounded divide-y divide-gray-950 font-mono text-xs">
                {allCharacterIds?.map((uid, index) => (
                  <div key={index} className="flex justify-between items-center p-3">
                    <span className="text-gray-500 font-bold">Player {index + 1}:</span>
                    <span className="font-bold text-white uppercase">{uid}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 text-gray-500 font-semibold">
                <div>
                  <span>Contact Mobile:</span>
                  <p className="text-gray-300 font-bold font-mono mt-0.5">{contactPhoneNumber}</p>
                </div>
                <div className="text-right">
                  <span>Registered Timestamp:</span>
                  <p className="text-gray-300 font-mono mt-0.5">{new Date(registration.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: 3. Secure Proof Uploader Component */}
          <div className="md:col-span-6 space-y-6 animate-zoomIn">
            
            {paymentStatus === 'Approved' && (
              <div className="pubg-hud-panel p-6 space-y-4">
                <div className="border-b border-gray-900 pb-3 flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-eb-yellow" />
                    Submit Match Proof
                  </h4>
                  <span className="px-2 py-0.5 bg-eb-yellow/10 text-eb-yellow border border-eb-yellow/30 text-[8px] font-black uppercase tracking-widest">
                    Post-Match
                  </span>
                </div>

                {matchProofScreenshot ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 rounded-sm text-[10px] font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4.5 h-4.5 text-eb-yellow" />
                      Scoreboard Proof Submitted!
                    </div>
                    <div className="border border-gray-900 bg-black rounded p-2 text-center">
                      <img 
                        src={matchProofScreenshot} 
                        alt="Scoreboard proof confirmation" 
                        className="max-h-56 mx-auto rounded object-contain"
                      />
                      <span className="text-[9px] text-gray-500 uppercase font-mono block mt-2">
                        Audit reference: {matchProofScreenshot.substring(9)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleProofSubmit} className="space-y-4">
                    <p className="text-[10px] text-gray-500 leading-normal font-medium">
                      Upload your end-game scoreboard results after the match for manual coordinate score compiling.
                    </p>

                    {proofSuccess && (
                      <div className="p-3 bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 rounded-sm text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-eb-yellow" />
                        {proofSuccess}
                      </div>
                    )}

                    {proofError && (
                      <div className="p-3 bg-tan/10 border border-tan/30 text-gold text-xs font-bold rounded-sm flex items-start gap-2">
                        <ShieldAlert className="w-4.5 h-4.5 text-eb-yellow flex-shrink-0" />
                        <span>{proofError}</span>
                      </div>
                    )}

                    {/* Uploader selection */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
                        Select Uploading UID
                      </label>
                      <select
                        value={uploaderUid}
                        onChange={(e) => setUploaderUid(e.target.value)}
                        className="pubg-input cursor-pointer py-1.5 text-xs w-full font-mono uppercase"
                        disabled={submittingProof}
                      >
                        {allCharacterIds?.map(uid => (
                          <option key={uid} value={uid} className="bg-black font-mono">{uid}</option>
                        ))}
                      </select>
                    </div>

                    {/* Proof file upload */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
                        Scoreboard Image File
                      </label>

                      <div className="border border-dashed border-gray-800 hover:border-eb-yellow/30 bg-black/40 rounded p-4 text-center cursor-pointer transition-colors relative overflow-hidden">
                        <input
                          type="file"
                          id="proof-screenshot"
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                          disabled={submittingProof}
                        />
                        <label htmlFor="proof-screenshot" className="cursor-pointer block space-y-1">
                          {proofPreview ? (
                            <div className="space-y-2">
                              <img
                                src={proofPreview}
                                alt="Proof preview uploader"
                                className="max-h-36 mx-auto rounded border border-gray-900 object-contain"
                              />
                              <p className="text-[9px] text-eb-yellow font-black uppercase tracking-wider flex items-center justify-center gap-1 animate-pulse">
                                <FileImage className="w-3.5 h-3.5" /> Change Screenshot
                              </p>
                            </div>
                          ) : (
                            <div className="text-gray-500 space-y-1">
                              <Upload className="w-6 h-6 mx-auto text-eb-yellow" />
                              <p className="text-[10px] font-black uppercase text-gray-400">Select Scoreboard Slip</p>
                              <p className="text-[8px] text-gray-600 uppercase font-bold">JPG, PNG (Max 5MB)</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingProof}
                      className={`w-full py-2.5 text-black font-black uppercase text-xs tracking-widest transition-all duration-300 ${
                        submittingProof
                          ? 'bg-gray-950 text-gray-600 cursor-wait border border-gray-900'
                          : 'bg-eb-yellow hover:scale-[1.01]'
                      }`}
                    >
                      {submittingProof ? 'Uploading Scoreboard...' : 'Submit Scoreboard Proof'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Transfer receipt reference panel */}
            <div className="pubg-hud-panel p-5 space-y-2.5 bg-[#12120e]/30">
              <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest block">Verification Receipt Uploaded</span>
              <button
                onClick={() => handleCopy(paymentScreenshot, 'receipt')}
                className="group relative block w-full h-32 rounded border border-gray-900 overflow-hidden bg-black focus:outline-none"
                title="Click to copy receipt path"
              >
                <img 
                  src={paymentScreenshot} 
                  alt="Invoice payment slip" 
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[9px] font-black uppercase tracking-wider gap-1">
                  <CheckCircle2 className="w-4 h-4 text-eb-yellow" />
                  <span>Copy Receipt URL</span>
                </div>
              </button>
              {copiedField === 'receipt' && (
                <p className="text-[9px] text-[#10b981] font-bold text-center font-mono">Receipt path copied!</p>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
