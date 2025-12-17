import axios from "axios";

const clientAxios = axios.create({
  // baseURL: "https://rollingvet-db.vercel.app/",
  baseURL: "http://localhost:8080",
});

const token = JSON.parse(localStorage.getItem("token"));
console.log(token);

export const configHeaders = {
  headers: {
    "content-type": "application/json",
    auth: `${token}`,
  },
};

export default clientAxios;
