import axios from "axios";

export default axios.create({
  // baseURL: 'http://localhost:3000', // Fixed base URL
  baseURL: 'http://192.168.1.3:3000', //Accessing the Server from Device Using Browser
});
