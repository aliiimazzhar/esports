import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const [events, setEvents] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const [loadingActiveEvent, setLoadingActiveEvent] = useState(true);
  const [adminPasscode, setAdminPasscode] = useState(null);

  // Fetch active event on load
  const fetchActiveEvent = async () => {
    setLoadingActiveEvent(true);
    try {
      const response = await fetch('/api/events/upcoming');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
        if (data.length > 0) {
          setActiveEvent(data[0]);
        } else {
          setActiveEvent(null);
        }
      } else {
        setActiveEvent(null);
        setEvents([]);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setActiveEvent(null);
      setEvents([]);
    } finally {
      setLoadingActiveEvent(false);
    }
  };

  useEffect(() => {
    fetchActiveEvent();
  }, []);

  // Helper for admin headers
  const getAdminHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'X-Admin-Passcode': adminPasscode || ''
    };
  };

  /* ==========================================================================
     PLAYER & PUBLIC ACTIONS
     ========================================================================== */

  // Search portal by PUBG UID
  const searchPortal = async (uid) => {
    try {
      const response = await fetch(`/api/registrations/portal/${encodeURIComponent(uid)}`);
      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (err) {
      console.error('Portal lookup error:', err);
      return { ok: false, error: 'Network communication error.' };
    }
  };

  // Submit new registration (FormData includes receipt file + other text fields)
  const submitRegistration = async (formData) => {
    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (err) {
      console.error('Registration submission error:', err);
      return { ok: false, error: 'Network communication error.' };
    }
  };

  // Upload post-match scoreboard proof (FormData includes scoreboard file + uid)
  const submitMatchProof = async (formData) => {
    try {
      const response = await fetch('/api/registrations/submit-proof', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (err) {
      console.error('Proof submission error:', err);
      return { ok: false, error: 'Network communication error.' };
    }
  };

  /* ==========================================================================
     ADMIN PANEL ACTIONS
     ========================================================================== */

  // Verify Admin Passcode
  const verifyAdminPasscode = async (passcode) => {
    try {
      const response = await fetch('/api/admin/verify-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setAdminPasscode(passcode);
        return { success: true };
      }
      return { success: false, error: data.error || 'Verification failed.' };
    } catch (err) {
      console.error('Admin passcode verification error:', err);
      return { success: false, error: 'Network communication error.' };
    }
  };

  // Logout Admin
  const logoutAdmin = () => {
    setAdminPasscode(null);
  };

  // Deploy new tournament event
  const deployTournament = async (eventData) => {
    try {
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(eventData)
      });
      const data = await response.json();
      if (response.ok) {
        // Re-fetch active event
        await fetchActiveEvent();
        return { ok: true, data };
      }
      return { ok: false, error: data.error || 'Failed to deploy tournament.' };
    } catch (err) {
      console.error('Error deploying event:', err);
      return { ok: false, error: 'Network communication error.' };
    }
  };

  // Update tournament event
  const updateTournament = async (id, eventData) => {
    try {
      const response = await fetch(`/api/admin/events/${id}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify(eventData)
      });
      const data = await response.json();
      if (response.ok) {
        await fetchActiveEvent();
        return { ok: true, data };
      }
      return { ok: false, error: data.error || 'Failed to update tournament.' };
    } catch (err) {
      console.error('Error updating event:', err);
      return { ok: false, error: 'Network communication error.' };
    }
  };

  // Delete tournament event
  const deleteTournament = async (id) => {
    try {
      const response = await fetch(`/api/admin/events/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        await fetchActiveEvent();
        return { ok: true, data };
      }
      return { ok: false, error: data.error || 'Failed to delete tournament.' };
    } catch (err) {
      console.error('Error deleting event:', err);
      return { ok: false, error: 'Network communication error.' };
    }
  };

  // Broadcast lobby room details
  const broadcastLobbyDetails = async (roomId, roomPassword) => {
    try {
      const response = await fetch('/api/admin/events/active/lobby', {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ roomId, roomPassword })
      });
      const data = await response.json();
      if (response.ok) {
        await fetchActiveEvent();
        return { ok: true, data };
      }
      return { ok: false, error: data.error || 'Failed to update lobby room details.' };
    } catch (err) {
      console.error('Error updating lobby credentials:', err);
      return { ok: false, error: 'Network communication error.' };
    }
  };

  // Edit leaderboard standings HTML
  const updateLeaderboardHtml = async (leaderboardHtml) => {
    try {
      const response = await fetch('/api/admin/events/active/leaderboard', {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ leaderboardHtml })
      });
      const data = await response.json();
      if (response.ok) {
        await fetchActiveEvent();
        return { ok: true, data };
      }
      return { ok: false, error: data.error || 'Failed to save leaderboard HTML.' };
    } catch (err) {
      console.error('Error saving leaderboard HTML:', err);
      return { ok: false, error: 'Network communication error.' };
    }
  };

  // Get pending registrations chronological queue
  const fetchPendingRegistrations = async () => {
    try {
      const response = await fetch('/api/admin/registrations/pending', {
        headers: getAdminHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        return { ok: true, data };
      }
      return { ok: false, error: data.error || 'Failed to fetch pending list.' };
    } catch (err) {
      console.error('Error fetching pending registrations:', err);
      return { ok: false, error: 'Network communication error.' };
    }
  };

  // Get approved registrations list
  const fetchApprovedRegistrations = async () => {
    try {
      const response = await fetch('/api/admin/registrations/approved', {
        headers: getAdminHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        return { ok: true, data };
      }
      return { ok: false, error: data.error || 'Failed to fetch approved registrations list.' };
    } catch (err) {
      console.error('Error fetching approved registrations:', err);
      return { ok: false, error: 'Network communication error.' };
    }
  };

  // Approve or Reject a registration
  const auditRegistrationStatus = async (id, status) => {
    try {
      const response = await fetch(`/api/admin/registrations/${id}/status`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (response.ok) {
        return { ok: true, data };
      }
      return { ok: false, error: data.error || 'Failed to update registration status.' };
    } catch (err) {
      console.error('Error auditing registration status:', err);
      return { ok: false, error: 'Network communication error.' };
    }
  };

  // Retrieve submitted match proofs list
  const fetchMatchProofs = async () => {
    try {
      const response = await fetch('/api/admin/registrations/proofs', {
        headers: getAdminHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        return { ok: true, data };
      }
      return { ok: false, error: data.error || 'Failed to retrieve match proofs.' };
    } catch (err) {
      console.error('Error fetching match proofs:', err);
      return { ok: false, error: 'Network communication error.' };
    }
  };

  return (
    <AppContext.Provider value={{
      events,
      activeEvent,
      loadingActiveEvent,
      adminPasscode,
      fetchActiveEvent,
      searchPortal,
      submitRegistration,
      submitMatchProof,
      verifyAdminPasscode,
      logoutAdmin,
      deployTournament,
      updateTournament,
      deleteTournament,
      broadcastLobbyDetails,
      updateLeaderboardHtml,
      fetchPendingRegistrations,
      fetchApprovedRegistrations,
      auditRegistrationStatus,
      fetchMatchProofs
    }}>
      {children}
    </AppContext.Provider>
  );
};
