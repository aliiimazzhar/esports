import React, { useContext, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Upload, CreditCard, ArrowLeft, CheckCircle2, ShieldCheck, HelpCircle, FileImage, AlertCircle } from 'lucide-react';

export default function PaymentPortal() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { tournaments, teams, registerTeamForTournament } = useContext(AppContext);

  const tournamentId = searchParams.get('tournamentId');
  const teamId = searchParams.get('teamId');

  const tournament = tournaments.find(t => t.id === tournamentId);
  const team = teams.find(t => t.id === teamId);

  const [txId, setTxId] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [fileError, setFileError] = useState('');
  const [txIdError, setTxIdError] = useState('');
  const [verificationChecked, setVerificationChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFileError('Invalid file type. Please upload a receipt image (PNG, JPG, JPEG).');
      setImagePreview(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError('File too large. Maximum size is 5MB.');
      setImagePreview(null);
      return;
    }

    setFileError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
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
      setFileError('Invalid file type. Please upload a receipt image (PNG, JPG, JPEG).');
      setImagePreview(null);
      return;
    }

    setFileError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPayment = (e) => {
    e.preventDefault();
    let hasError = false;

    if (!txId.trim()) {
      setTxIdError('Transaction ID (TxID) is required');
      hasError = true;
    } else if (txId.trim().length < 6) {
      setTxIdError('TxID must be at least 6 characters');
      hasError = true;
    } else {
      setTxIdError('');
    }

    if (!imagePreview) {
      setFileError('Please upload a screenshot of your transaction confirmation.');
      hasError = true;
    }

    if (!verificationChecked) {
      alert('Please check the verification check-box confirming payment.');
      hasError = true;
    }

    if (hasError) return;

    setSubmitting(true);

    setTimeout(() => {
      registerTeamForTournament(tournamentId, teamId, txId, imagePreview);
      setSubmitting(false);
      setSuccess(true);

      setTimeout(() => {
        navigate('/dashboard?tab=tournaments');
      }, 2500);
    }, 1500);
  };

  if (!tournament || !team) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="w-16 h-16 text-tan mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold uppercase text-white">Invalid Checkout Parameters</h2>
        <p className="text-gray-400 text-sm mt-2">Could not load checkout data. Please select a squad from the Tournament Detail page first.</p>
        <Link to="/" className="mt-6 px-6 py-2.5 rounded bg-eb-yellow text-black font-black uppercase text-xs tracking-wider hover:bg-gold">
          Back to Home
        </Link>
      </div>
    );
  }

  const platformFee = 75;
  const totalAmount = tournament.entryFee + platformFee;

  return (
    <div className="min-h-screen bg-black py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation */}
        <Link to={`/tournament/${tournament.id}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm font-semibold transition-all duration-200 hover:-translate-x-1">
          <ArrowLeft className="w-4 h-4 text-eb-yellow" />
          Cancel Checkout
        </Link>

        {success ? (
          <div className="pubg-hud-panel p-10 text-center space-y-6 max-w-xl mx-auto shadow-glow-yellow animate-zoomIn">
            <div className="w-16 h-16 rounded bg-eb-yellow/10 text-eb-yellow flex items-center justify-center mx-auto border border-eb-yellow/50">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold uppercase text-white tracking-wider">
                Receipt Submitted!
              </h2>
              <p className="text-gray-400 text-xs font-semibold">
                Your payment slip has been uploaded successfully for <span className="text-white font-bold">{team.name}</span>.
              </p>
            </div>

            <div className="bg-black/60 rounded border border-gray-900 p-4 space-y-2 text-xs text-left max-w-md mx-auto">
              <div className="flex justify-between text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <span>Transaction ID:</span>
                <span className="font-bold text-white font-mono">{txId}</span>
              </div>
              <div className="flex justify-between text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <span>Tournament:</span>
                <span className="font-bold text-white text-right">{tournament.title}</span>
              </div>
              <div className="flex justify-between text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <span>Verification:</span>
                <span className="px-2 py-0.5 rounded bg-harvest/15 text-gold border border-harvest/30 font-black uppercase text-[9px] tracking-wider">
                  Pending Approval
                </span>
              </div>
            </div>

            <p className="text-gray-500 text-[10px] uppercase font-bold animate-pulse">
              Redirecting to Captain Dashboard...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* Left Column: Payment Instructions */}
            <div className="pubg-hud-panel p-6 space-y-6">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gold" />
                  Transfer Channels
                </h3>
                <p className="text-gray-500 text-[10px] font-semibold mt-1">Send entry fees via one of the local accounts below.</p>
              </div>

              {/* Wallet Listings */}
              <div className="space-y-4">
                
                {/* EasyPaisa */}
                <div className="pubg-hud-panel cyber-card p-4 space-y-2.5 relative overflow-hidden animate-zoomIn">
                  <div className="absolute top-0 right-0 bg-[#ea580c] text-white px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest">
                    Mobile Wallet
                  </div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">EasyPaisa</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-gray-500 font-semibold uppercase text-[9px]">Account Number:</span>
                    <span className="font-mono font-bold text-gold text-right">0300-1234567</span>
                    <span className="text-gray-500 font-semibold uppercase text-[9px]">Account Name:</span>
                    <span className="font-bold text-white text-right">Esports Admin</span>
                  </div>
                </div>

                {/* JazzCash */}
                <div className="pubg-hud-panel cyber-card p-4 space-y-2.5 relative overflow-hidden animate-zoomIn animation-delay-100">
                  <div className="absolute top-0 right-0 bg-tan text-white px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest">
                    Mobile Wallet
                  </div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">JazzCash</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-gray-500 font-semibold uppercase text-[9px]">Account Number:</span>
                    <span className="font-mono font-bold text-gold text-right">0312-7654321</span>
                    <span className="text-gray-500 font-semibold uppercase text-[9px]">Account Name:</span>
                    <span className="font-bold text-white text-right">Esports Admin</span>
                  </div>
                </div>

                {/* Bank Alfalah */}
                <div className="pubg-hud-panel cyber-card p-4 space-y-2.5 relative overflow-hidden animate-zoomIn animation-delay-200">
                  <div className="absolute top-0 right-0 bg-gold text-black px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest">
                    Commercial Bank
                  </div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Bank Alfalah</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-gray-500 font-semibold uppercase text-[9px]">IBAN:</span>
                    <span className="font-mono font-bold text-gold text-right text-[10px]">PK23ALFA00003001234567</span>
                    <span className="text-gray-500 font-semibold uppercase text-[9px]">Account Title:</span>
                    <span className="font-bold text-white text-right">Esports Tournament Corp</span>
                  </div>
                </div>

              </div>

              {/* Guidelines */}
              <div className="bg-harvest/5 border-l-4 border-harvest p-4 rounded text-xs text-gray-400 space-y-2 font-medium">
                <h5 className="font-black text-white uppercase tracking-wider text-[10px]">Audit Schedule Notice:</h5>
                <p className="leading-relaxed text-[11px]">
                  organizers inspect files manually. Audits take up to 2 hours. Ensure the screenshot is clear and captures details like timestamp, transaction status, sender, and amount.
                </p>
              </div>
            </div>

            {/* Right Column: Upload Receipt form */}
            <div className="pubg-hud-panel p-6 space-y-5">
              
              <div className="border-b border-gray-900 pb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Upload Receipt slip</h3>
                <p className="text-gray-500 text-[10px] font-semibold mt-0.5">Submit checkout verification fields.</p>
              </div>

              {/* Summary details */}
              <div className="p-3.5 bg-black rounded border border-gray-950 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[9px] text-gray-500 uppercase font-black tracking-wider">Squad Name</span>
                  <p className="font-bold text-white">{team.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-gray-500 uppercase font-black tracking-wider">Grand Total Due</span>
                  <p className="font-black text-eb-yellow text-sm">PKR {totalAmount.toLocaleString()}</p>
                </div>
              </div>

              <form onSubmit={handleSubmitPayment} className="space-y-4">
                
                {/* Drag-and-drop file selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Transfer Receipt Image</label>
                  
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden ${
                      imagePreview 
                        ? 'border-eb-yellow/45 bg-eb-yellow/[0.02]' 
                        : 'border-gray-800 hover:border-orig-yellow/30 bg-black/40'
                    }`}
                  >
                    <input 
                      type="file" 
                      id="receipt-file"
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    
                    <label htmlFor="receipt-file" className="cursor-pointer w-full text-center space-y-2">
                      {imagePreview ? (
                        <div className="space-y-2">
                          <img 
                            src={imagePreview} 
                            alt="Receipt Preview" 
                            className="max-h-36 mx-auto rounded border border-gray-900 shadow-2xl object-contain"
                          />
                          <p className="text-[10px] text-eb-yellow font-black uppercase tracking-wider flex items-center justify-center gap-1 animate-pulse">
                            <FileImage className="w-4 h-4" />
                            Change Receipt Screenshot
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 text-gray-500">
                          <Upload className="w-8 h-8 text-gray-700 mx-auto" />
                          <p className="text-xs font-black uppercase tracking-wider text-gray-400">Drag & Drop Slip Here</p>
                          <p className="text-[10px] text-gray-600 uppercase font-semibold">Or browse from device (max 5MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                  {fileError && <p className="text-tan text-xs font-bold mt-1">{fileError}</p>}
                </div>

                {/* Transaction ID */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                    Transaction ID (TxID)
                  </label>
                  <input
                    type="text"
                    value={txId}
                    onChange={(e) => {
                      setTxId(e.target.value);
                      if (txIdError) setTxIdError('');
                    }}
                    placeholder="Enter manual bank transaction reference TxID"
                    className="pubg-input w-full font-mono text-xs uppercase"
                  />
                  {txIdError && <p className="text-tan text-xs font-bold mt-1">{txIdError}</p>}
                </div>

                {/* Checkbox verification */}
                <div className="flex items-start gap-2.5 pt-2">
                  <input
                    type="checkbox"
                    id="checkbox-verify"
                    checked={verificationChecked}
                    onChange={(e) => setVerificationChecked(e.target.checked)}
                    className="mt-0.5 accent-eb-yellow border-gray-800 rounded bg-black cursor-pointer"
                  />
                  <label htmlFor="checkbox-verify" className="text-[10px] text-gray-500 leading-snug cursor-pointer select-none font-semibold">
                    I confirm that this file is an authentic receipt of <span className="font-bold text-white">PKR {totalAmount.toLocaleString()}</span>. I understand submitting fake documents results in disqualification.
                  </label>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-3 text-black font-black uppercase text-xs tracking-widest transition-all duration-300 ${
                    submitting 
                      ? 'bg-gray-900 text-gray-600 cursor-wait border border-gray-850' 
                      : 'bg-eb-yellow hover:bg-gold hover:scale-[1.01] hover:shadow-glow-yellow'
                  }`}
                >
                  {submitting ? 'Authenticating Slip...' : 'Submit Verification Slip'}
                </button>

              </form>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
