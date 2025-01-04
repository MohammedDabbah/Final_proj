import axios from "axios";
import { MERRIAM_WEBSTER_LEARNER_KEY } from "./config";

export default axios.create({
    baseURL:'https://www.dictionaryapi.com/api/v3/references/learners/json',
    params:{
        key :MERRIAM_WEBSTER_LEARNER_KEY
    }
})