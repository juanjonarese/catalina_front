import axios from "axios";

const clientAxios = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
});

export default clientAxios;
