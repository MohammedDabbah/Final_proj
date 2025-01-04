import React, { createContext, useState, useEffect } from "react";
import serverApi from "../api/serverApi";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const updateUser = (updatedUser) => {
    setUser((prevUser) => ({
      ...prevUser,
      ...updatedUser,
    }));
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await serverApi.get("auth/authenticated", {
          withCredentials: true,
        });
        if (response.data.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
