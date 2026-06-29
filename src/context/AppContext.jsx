import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const [events, setEvents] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const [loadingActiveEvent, setLoadingActiveEvent] = useState(true);
  const [adminPasscode, setAdminPasscode] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Load session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('esports_user');
    const storedToken = localStorage.getItem('esports_token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
  }, []);

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

  // Helper for authenticated user headers (JWT Bearer token)
  const getAuthHeaders = () => {
    return {
      'Authorization': token ? `Bearer ${token}` : ''
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

  // Fetch user registrations by UID
  const fetchUserRegistrations = async (uid) => {
    try {
      const response = await fetch(`/api/registrations/user/${encodeURIComponent(uid)}`);
      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (err) {
      console.error('Fetch user registrations error:', err);
      return { ok: false, error: 'Network communication error.' };
    }
  };

  // Submit new registration (FormData includes receipt file + other text fields + optional eventId)
  const submitRegistration = async (formData) => {
    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        body: formData
        // Note: do NOT set Content-Type header here; browser sets it with multipart boundary
      });
      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (err) {
      console.error('Registration submission error:', err);
      return { ok: false, error: 'Network communication error.' };
    }
  };

  // Upload post-match scoreboard proof (FormData includes scoreboard file + registrationId)
  // Requires JWT auth token in Authorization header
  const submitMatchProof = async (formData) => {
    try {
      const response = await fetch('/api/registrations/submit-proof', {
        method: 'POST',
        headers: getAuthHeaders(), // JWT Bearer token
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

  // Retrieve all signed-up/signed-in users
  const fetchSignedUpUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: getAdminHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        return { ok: true, data };
      }
      return { ok: false, error: data.error || 'Failed to retrieve signed-up users.' };
    } catch (err) {
      console.error('Error fetching signed-up users:', err);
      return { ok: false, error: 'Network communication error.' };
    }
  };

  // Delete user account (admin)
  const deleteSignedUpUser = async (id) => {
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        return { ok: true, data };
      }
      return { ok: false, error: data.error || 'Failed to delete user account.' };
    } catch (err) {
      console.error('Error deleting user account:', err);
      return { ok: false, error: 'Network communication error.' };
    }
  };

  // Fetch tournament report by ID
  const fetchTournamentReport = async (id) => {
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(id)}/report`);
      const data = await response.json();
      if (response.ok) {
        return { ok: true, data };
      }
      return { ok: false, error: data.error || 'Failed to fetch tournament report.' };
    } catch (err) {
      console.error('Error fetching tournament report:', err);
      return { ok: false, error: 'Network communication error.' };
    }
  };

  // Fetch custom leaderboard entries
  const fetchCustomLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard');
      const data = await response.json();
      if (response.ok) {
        return { ok: true, data };
      }
      return { ok: false, error: data.error || 'Failed to fetch custom leaderboard.' };
    } catch (err) {
      console.error('Error fetching custom leaderboard:', err);
      return { ok: false, error: 'Network communication error.' };
    }
  };

  // Add custom leaderboard entry (admin)
  const addCustomLeaderboardEntry = async (entryData) => {
    try {
      const response = await fetch('/api/admin/leaderboard', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(entryData)
      });
      const data = await response.json();
      if (response.ok) {
        return { ok: true, data };
      }
      return { ok: false, error: data.error || 'Failed to add leaderboard entry.' };
    } catch (err) {
      console.error('Error adding leaderboard entry:', err);
      return { ok: false, error: 'Network communication error.' };
    }
  };

  // Update custom leaderboard entry (admin)
  const updateCustomLeaderboardEntry = async (id, entryData) => {
    try {
      const response = await fetch(`/api/admin/leaderboard/${id}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify(entryData)
      });
      const data = await response.json();
      if (response.ok) {
        return { ok: true, data };
      }
      return { ok: false, error: data.error || 'Failed to update leaderboard entry.' };
    } catch (err) {
      console.error('Error updating leaderboard entry:', err);
      return { ok: false, error: 'Network communication error.' };
    }
  };

  // Delete custom leaderboard entry (admin)
  const deleteCustomLeaderboardEntry = async (id) => {
    try {
      const response = await fetch(`/api/admin/leaderboard/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        return { ok: true, data };
      }
      return { ok: false, error: data.error || 'Failed to delete leaderboard entry.' };
    } catch (err) {
      console.error('Error deleting leaderboard entry:', err);
      return { ok: false, error: 'Network communication error.' };
    }
  };

  // Clear all custom leaderboard entries (admin)
  const clearCustomLeaderboard = async () => {
    try {
      const response = await fetch('/api/admin/leaderboard', {
        method: 'DELETE',
        headers: getAdminHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        return { ok: true, data };
      }
      return { ok: false, error: data.error || 'Failed to clear leaderboard entries.' };
    } catch (err) {
      console.error('Error clearing leaderboard:', err);
      return { ok: false, error: 'Network communication error.' };
    }
  };

  // Sign Up User
  const signUp = async (uid, phoneNumber, password, recoveryPassword) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, phoneNumber, password, recoveryPassword })
      });
      const data = await response.json();
      return { ok: response.ok, data };
    } catch (err) {
      console.error('Sign up error:', err);
      return { ok: false, data: { error: 'Network communication error.' } };
    }
  };

  // Sign In User
  const signIn = async (uidOrPhone, password) => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uidOrPhone, password })
      });
      const data = await response.json();
      if (response.ok && data.user) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('esports_user', JSON.stringify(data.user));
        localStorage.setItem('esports_token', data.token);
      }
      return { ok: response.ok, data };
    } catch (err) {
      console.error('Sign in error:', err);
      return { ok: false, data: { error: 'Network communication error.' } };
    }
  };

  // Logout User
  const logoutUser = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('esports_user');
    localStorage.removeItem('esports_token');
  };

  // Recover Password
  const recoverUserPassword = async (uid, phoneNumber, recoveryPassword, newPassword) => {
    try {
      const response = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, phoneNumber, recoveryPassword, newPassword })
      });
      const data = await response.json();
      return { ok: response.ok, data };
    } catch (err) {
      console.error('Password recovery error:', err);
      return { ok: false, data: { error: 'Network communication error.' } };
    }
  };

  return (
    <AppContext.Provider value={{
      events,
      activeEvent,
      loadingActiveEvent,
      adminPasscode,
      user,
      token,
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
      fetchMatchProofs,
      fetchSignedUpUsers,
      deleteSignedUpUser,
      fetchCustomLeaderboard,
      fetchTournamentReport,
      addCustomLeaderboardEntry,
      updateCustomLeaderboardEntry,
      deleteCustomLeaderboardEntry,
      clearCustomLeaderboard,
      signUp,
      signIn,
      logoutUser,
      recoverUserPassword,
      fetchUserRegistrations,
      getAdminHeaders,
      getAuthHeaders
    }}>
      {children}
    </AppContext.Provider>
  );
};
