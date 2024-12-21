import axios from "axios";

export default axios.create({
  // baseURL: 'http://localhost:3000', // Fixed base URL
  baseURL: 'http://10.0.0.12:3000', //Accessing the Server from Device Using Browser
});
