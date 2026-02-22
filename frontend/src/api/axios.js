import axios from "axios";

const axiosInstance = axios.create({
  
  baseURL:  "http://localhost:5000/api", // telling my browser to allow this
  withCredentials: true, // This allows the browser to send/receive httpOnly cookies
});

export default axiosInstance;