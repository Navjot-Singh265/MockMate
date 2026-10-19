import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const API_URL =
  'https://mockmate-production-cc4b.up.railway.app';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleGitHubLogin = async () => {
      // Check if GitHub returned a token
      const hash = window.location.hash;

      if (hash.startsWith('#github_token=')) {
        const token = decodeURIComponent(
          hash.replace('#github_token=', '')
        );

        localStorage.setItem('mockmate_token', token);

        // Remove token from browser URL
        window.history.replaceState(
          null,
          '',
          window.location.pathname
        );
      }

      const token = localStorage.getItem('mockmate_token');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Invalid token');
        }

        const data = await response.json();

        setUser(data.user);

        localStorage.setItem(
          'mockmate_user',
          JSON.stringify(data.user)
        );

      } catch (error) {
        console.warn('Authentication failed:', error.message);

        localStorage.removeItem('mockmate_token');
        localStorage.removeItem('mockmate_user');
        setUser(null);

      } finally {
        setLoading(false);
      }
    };

    handleGitHubLogin();
  }, []);

  // Start GitHub OAuth
  const login = () => {
    window.location.href =
      `${API_URL}/auth/github`;
  };

  const logout = () => {
    localStorage.removeItem('mockmate_user');
    localStorage.removeItem('mockmate_token');

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}