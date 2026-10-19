import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('mockmate_user');

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('mockmate_user');
      }
    }

    setLoading(false);
  }, []);

  const login = () => {
    alert('GitHub login is not configured yet.');
  };

  const logout = () => {
    localStorage.removeItem('mockmate_user');
    localStorage.removeItem('mockmate_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

window.location.href = 'https://mockmate-production-cc4b.up.railway.app/auth/github';

export function useAuth() {
  return useContext(AuthContext);
}