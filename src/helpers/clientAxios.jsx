import axios from "axios";

const clientAxios = axios.create({
  baseURL: "https://catalina-back.vercel.app",
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
