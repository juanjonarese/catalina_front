import axios from "axios";

const clientAxios = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
});

// Adjuntar el token en cada request si existe
clientAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default clientAxios;
