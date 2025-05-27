import axios from "axios";
import { AI_API_KEY } from "./config"; // Load AI API key from env


const aiApi = axios.create({
    baseURL: "https://api.openai.com/v1", // OpenAI API base URL
    headers: {
        "Authorization": `Bearer ${AI_API_KEY}`,
        "Content-Type": "application/json",
    },
});

export default aiApi;
