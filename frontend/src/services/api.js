import axios from "axios";
import { io } from "socket.io-client";

// Read from Vite env for deployment
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const SOCKET_BASE = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE,
});

// Attach token to requests if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

// Socket singleton
let socketInstance = null;
export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SOCKET_BASE, { autoConnect: false });
  }
  return socketInstance;
}
