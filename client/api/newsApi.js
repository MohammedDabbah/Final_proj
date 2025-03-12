import axios from "axios";
import { NEWS_API_KEY } from "./config";

const BASE_URL = 'https://newsapi.org/v2/everything';

export default axios.create({
    baseURL: BASE_URL,
    params: {
        q: 'educational platforms OR study techniques OR reading methods OR learning strategies',
        apiKey: NEWS_API_KEY,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 10,
    }
});