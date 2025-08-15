import React, { createContext, useContext, useState, useEffect } from "react";
import { getSocket } from "../services/api";
import { toast } from "react-toastify";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (storedUser && storedToken) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setToken(storedToken);
      try {
        const socket = getSocket();
        if (!socket.connected) socket.connect();
        socket.emit("join", {
          userId: parsed._id,
          driverUserId: parsed.userType === "driver" ? parsed._id : undefined,
        });
      } catch {}
    }
    setLoading(false);
  }, []);

  // Global realtime notifications for booking status
  useEffect(() => {
    const socket = getSocket();
    const handler = ({ status }) => {
      if (status === "accepted") toast.info("Driver accepted. Please confirm.");
      if (status === "confirmed") toast.success("Your booking is confirmed");
      if (status === "rejected") toast.error("Your booking was rejected");
    };
    socket.on("booking:status", handler);
    return () => {
      socket.off("booking:status", handler);
    };
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    setToken(token);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
    try {
      const socket = getSocket();
      if (!socket.connected) socket.connect();
      // Join user room and driver room if applicable
      socket.emit("join", {
        userId: userData._id,
        driverUserId: userData.userType === "driver" ? userData._id : undefined,
      });
    } catch {}
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    try {
      const socket = getSocket();
      socket.disconnect();
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
