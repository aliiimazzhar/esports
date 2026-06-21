import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Upload, FileImage, CheckCircle, Plus, Trash2, Info, AlertTriangle, Lock } from 'lucide-react';

export default function RegisterModal({ isOpen, onClose }) {
  const { activeEvent, submitRegistration } = useContext(AppContext);

  // Tab: 'solo' | 'team'
  const [activeTab, setActiveTab] = useState('solo');

  // Solo fields
  const [soloCharacterId, setSoloCharacterId] = useState('');
  const [soloInGameName, setSoloInGameName] = useState('');

  // Team fields (Dynamic list of players: characterId, inGameName)
  const [teamPlayers, setTeamPlayers] = useState([
    { characterId: '', inGameName: '' } // Player 1
  ]);

  // Shared fields
  const [contactPhone, setContactPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);

  // Validation / Loading states
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successReg, setSuccessReg] = useState(null);

  if (!isOpen || !activeEvent) return null;

  // Add/remove player slots for team
  const addPlayerSlot = () => {
    setTeamPlayers([...teamPlayers, { characterId: '', inGameName: '' }]);
  };

  const removePlayerSlot = (index) => {
    if (teamPlayers.length > 1) {
      setTeamPlayers(teamPlayers.filter((_, i) => i !== index));
    }
  };

  const handlePlayerChange = (index, field, value) => {
    const updated = [...teamPlayers];
    updated[index][field] = value;
    setTeamPlayers(updated);
    if (errors[`player_${index}_${field}`]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[`player_${index}_${field}`];
        return next;
      });
    }
  };

  // File Upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, file: 'Please upload an image receipt (PNG, JPG, JPEG).' }));
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

  // Form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const tempErrors = {};

    // Validate phone numbers
    if (!contactPhone.trim()) {
      tempErrors.contactPhone = 'Contact phone number is required';
    }
    if (!whatsappNumber.trim()) {
      tempErrors.whatsappNumber = 'WhatsApp number is required';
    }
    if (!transactionId.trim()) {
      tempErrors.transactionId = 'Transaction ID is required';
    }

    // Validate players depending on tab
    let characterIds = [];
    let inGameNames = [];

    if (activeTab === 'solo') {
      if (!soloCharacterId.trim()) {
        tempErrors.soloCharacterId = 'Character ID is required';
      }
      if (!soloInGameName.trim()) {
        tempErrors.soloInGameName = 'In-game Name is required';
      }
      characterIds = [soloCharacterId.trim()];
      inGameNames = [soloInGameName.trim()];
    } else {
      teamPlayers.forEach((player, index) => {
        if (!player.characterId.trim()) {
          tempErrors[`player_${index}_characterId`] = `Character ID for Player ${index + 1} is required`;
        }
        if (!player.inGameName.trim()) {
          tempErrors[`player_${index}_inGameName`] = `In-game Name for Player ${index + 1} is required`;
        }
      });
      characterIds = teamPlayers.map(p => p.characterId.trim());
      inGameNames = teamPlayers.map(p => p.inGameName.trim());
    }

    if (!screenshotFile) {
      tempErrors.file = 'Payment receipt is required';
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append('registrationType', activeTab === 'solo' ? 'Solo' : 'Team');
    formData.append('allCharacterIds', JSON.stringify(characterIds));
    formData.append('allInGameNames', JSON.stringify(inGameNames));
    formData.append('contactPhoneNumber', contactPhone.trim());
    formData.append('whatsappNumber', whatsappNumber.trim());
    formData.append('transactionId', transactionId.trim());
    formData.append('paymentScreenshot', screenshotFile);

    try {
      const res = await submitRegistration(formData);
      if (res.ok) {
        setSuccessReg(res.data.registration);
        setSuccess(true);
      } else {
        setErrors({ submit: res.data.error || 'Failed to submit registration.' });
      }
    } catch (err) {
      setErrors({ submit: 'Connection error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    // Reset states
    setSuccess(false);
    setSuccessReg(null);
    setSoloCharacterId('');
    setSoloInGameName('');
    setTeamPlayers([{ characterId: '', inGameName: '' }]);
    setContactPhone('');
    setWhatsappNumber('');
    setTransactionId('');
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setErrors({});
    onClose();
  };

  const platformFee = 75;
  const entryFee = activeTab === 'solo' ? (activeEvent.soloEntryFee || 0) : (activeEvent.teamEntryFee || 0);
  const totalAmount = entryFee + platformFee;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-md">
      <div className="pubg-hud-panel p-6 max-w-lg w-full bg-[#12120e] relative border-2 border-eb-yellow rounded-none max-h-[90vh] flex flex-col animate-zoomIn">
        
        {/* HUD Corner Brackets */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-eb-yellow !m-0"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-eb-yellow !m-0"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-eb-yellow !m-0"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-eb-yellow !m-0"></div>

        {/* Modal Header */}
        <div className="border-b border-gray-900 pb-3 flex justify-between items-center flex-shrink-0">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">
            Tournament Registration
          </h3>
          <button
            onClick={handleModalClose}
            className="text-gray-500 hover:text-white font-black text-sm p-1"
          >
            ✕
          </button>
        </div>

        <div className="flex-grow overflow-y-auto pr-1 mt-4 space-y-5 text-left">

        {success ? (
          <div className="text-center space-y-6 py-6 animate-fadeIn">
            <div className="w-14 h-14 rounded bg-eb-yellow/10 text-eb-yellow flex items-center justify-center mx-auto border border-eb-yellow/30">
              <CheckCircle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold uppercase text-white tracking-wider">
                Registration Successful!
              </h2>
              <p className="text-gray-400 text-[10px] font-semibold leading-relaxed max-w-xs mx-auto">
                Your receipt has been submitted for validation. You can query your status on the homepage using your Character UID.
              </p>
            </div>

            <div className="bg-black/60 border border-gray-950 p-4 space-y-2 text-xs text-left max-w-md mx-auto font-mono">
              <div className="flex justify-between">
                <span className="text-gray-500">Tracking UID:</span>
                <span className="text-white font-bold">{successReg?.trackingUid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tournament:</span>
                <span className="text-white font-bold">{activeEvent.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="text-gold font-black uppercase">Pending Review</span>
              </div>
            </div>

            <button
              onClick={handleModalClose}
              className="px-8 py-2.5 bg-eb-yellow text-black font-black uppercase text-xs tracking-widest transition-all duration-300 hover:scale-[1.02]"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Tabs Selector */}
            <div className="grid grid-cols-2 gap-2 bg-black p-1 border border-white/5">
              <button
                type="button"
                onClick={() => { setActiveTab('solo'); setErrors({}); }}
                className={`py-2 text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                  activeTab === 'solo' ? 'bg-eb-yellow text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                Solo Registration
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('team'); setErrors({}); }}
                className={`py-2 text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                  activeTab === 'team' ? 'bg-eb-yellow text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                Team Registration
              </button>
            </div>

            {errors.submit && (
              <div className="p-3 bg-tan/10 border border-tan/30 text-gold text-[10px] font-bold rounded-sm flex items-start gap-1">
                <AlertTriangle className="w-4 h-4 text-eb-yellow flex-shrink-0" />
                <span>{errors.submit}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              
              {/* SOLO TAB FORM FIELDS */}
              {activeTab === 'solo' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">In-Game Name</label>
                      <input
                        type="text"
                        value={soloInGameName}
                        onChange={(e) => setSoloInGameName(e.target.value)}
                        placeholder="e.g. OP_GENESIS"
                        className="pubg-input w-full text-xs"
                        required
                      />
                      {errors.soloInGameName && <p className="text-tan text-[9px] font-bold mt-1">{errors.soloInGameName}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">PUBG Character UID</label>
                      <input
                        type="text"
                        value={soloCharacterId}
                        onChange={(e) => setSoloCharacterId(e.target.value)}
                        placeholder="e.g. 51239485"
                        className="pubg-input w-full font-mono text-xs"
                        required
                      />
                      {errors.soloCharacterId && <p className="text-tan text-[9px] font-bold mt-1">{errors.soloCharacterId}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* TEAM TAB FORM FIELDS */}
              {activeTab === 'team' && (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1 border border-white/5 p-3 bg-black/40">
                  <div className="flex justify-between items-center pb-1 border-b border-gray-900">
                    <span className="text-[9px] font-black text-white uppercase tracking-wider">Roster Players</span>
                    <button
                      type="button"
                      onClick={addPlayerSlot}
                      className="px-2 py-0.5 bg-black border border-gray-800 text-[8px] font-black uppercase text-gray-400 hover:text-white hover:border-eb-yellow flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Add Player
                    </button>
                  </div>

                  <div className="space-y-3">
                    {teamPlayers.map((player, idx) => (
                      <div key={idx} className="space-y-2 border-b border-gray-950 pb-2.5 last:border-b-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-bold text-orig-yellow">PLAYER {idx + 1} {idx === 0 && '(Leader)'}</span>
                          {teamPlayers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePlayerSlot(idx)}
                              className="text-[8px] font-bold text-tan hover:text-red-500 uppercase font-mono"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={player.inGameName}
                              onChange={(e) => handlePlayerChange(idx, 'inGameName', e.target.value)}
                              placeholder="In-Game Name"
                              className="pubg-input w-full py-1.5 text-[11px]"
                              required
                            />
                            {errors[`player_${idx}_inGameName`] && (
                              <p className="text-tan text-[8px] font-bold">{errors[`player_${idx}_inGameName`]}</p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={player.characterId}
                              onChange={(e) => handlePlayerChange(idx, 'characterId', e.target.value)}
                              placeholder="Character UID"
                              className="pubg-input w-full py-1.5 text-[11px] font-mono"
                              required
                            />
                            {errors[`player_${idx}_characterId`] && (
                              <p className="text-tan text-[8px] font-bold">{errors[`player_${idx}_characterId`]}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shared Contact details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Contact Phone</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="e.g. 03001234567"
                    className="pubg-input w-full text-xs"
                    required
                  />
                  {errors.contactPhone && <p className="text-tan text-[9px] font-bold mt-1">{errors.contactPhone}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">WhatsApp Number</label>
                  <input
                    type="text"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="e.g. 03001234567"
                    className="pubg-input w-full text-xs"
                    required
                  />
                  {errors.whatsappNumber && <p className="text-tan text-[9px] font-bold mt-1">{errors.whatsappNumber}</p>}
                </div>
              </div>

              {/* Transaction ID & Receipt */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Transaction ID</label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter transaction receipt ID"
                    className="pubg-input w-full text-xs font-mono"
                    required
                  />
                  {errors.transactionId && <p className="text-tan text-[9px] font-bold mt-1">{errors.transactionId}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Registration Fee Due</label>
                  <div className="pubg-input w-full text-xs font-mono font-bold bg-black text-gold flex items-center justify-between border-dashed border border-gray-800">
                    <span>PKR {entryFee.toLocaleString()}</span>
                    <span className="text-[8px] bg-eb-yellow/10 text-eb-yellow px-1 py-0.5 border border-eb-yellow/20 uppercase font-sans">
                      {activeTab === 'solo' ? 'Solo Rate' : 'Team Rate'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Upload Receipt */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Upload Slip Receipt</label>
                
                <div className="border border-dashed border-gray-800 rounded p-4 flex flex-col items-center justify-center cursor-pointer bg-black/60 relative hover:border-eb-yellow/30 transition-all duration-200">
                  <input 
                    type="file" 
                    id="receipt-file-modal"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    required
                  />
                  <label htmlFor="receipt-file-modal" className="cursor-pointer w-full text-center space-y-1">
                    {screenshotPreview ? (
                      <div className="space-y-1">
                        <img 
                          src={screenshotPreview} 
                          alt="Receipt Preview" 
                          className="max-h-24 mx-auto rounded object-contain border border-gray-900"
                        />
                        <p className="text-[8px] text-eb-yellow font-black uppercase tracking-wider animate-pulse flex items-center justify-center gap-0.5">
                          <FileImage className="w-3.5 h-3.5" /> Change Screenshot
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1 text-gray-500">
                        <Upload className="w-5 h-5 text-eb-yellow mx-auto" />
                        <p className="text-[10px] font-black uppercase text-gray-400">Click to Browse Receipt Slip</p>
                        <span className="text-[8px] text-gray-600 block">MAX FILE SIZE 5MB</span>
                      </div>
                    )}
                  </label>
                </div>
                {errors.file && <p className="text-tan text-[9px] font-bold mt-1">{errors.file}</p>}
              </div>

              {/* Payment calculations info */}
              <div className="bg-black/60 p-3 rounded border border-gray-950 text-[10px] text-gray-400 space-y-1 font-semibold">
                <div className="flex justify-between">
                  <span>Entry Rate:</span>
                  <span className="text-white">PKR {entryFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transaction Fee:</span>
                  <span className="text-white">PKR {platformFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-gray-900 pt-1 text-gold font-bold uppercase tracking-wider text-[11px]">
                  <span>Total Due:</span>
                  <span className="text-eb-yellow">PKR {totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-2.5 text-black font-black uppercase text-xs tracking-widest transition-all duration-300 ${
                  submitting ? 'bg-gray-900 text-gray-600 cursor-wait border border-gray-850' : 'bg-eb-yellow hover:scale-[1.01]'
                }`}
              >
                {submitting ? 'Uploading to cloud...' : 'Register & Upload Slip'}
              </button>

            </form>
          </div>
        )}

        </div>
      </div>
    </div>
  );
}
