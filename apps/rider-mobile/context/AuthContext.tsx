// apps/rider-mobile/context/AuthContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface RiderUser {
  id: string;
  name: string;
  phone: string;
  role: string;
  walletBalance?: number;
}

export interface AuthContextType {
  user: RiderUser | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  tempPhone: string;
  setTempPhone: (phone: string) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
  login: (userData: RiderUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<RiderUser | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [tempPhone, setTempPhone] = useState('+91 90000 00001');

  const login = (userData: RiderUser) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        hasCompletedOnboarding,
        tempPhone,
        setTempPhone,
        setHasCompletedOnboarding,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
