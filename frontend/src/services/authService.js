import axios from "axios";
import { getAuthToken } from "../utils/authSession";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email, password) => API.post("/auth/login", { email, password }),
  getMe: () => API.get("/auth/me"),
};

export default API;
