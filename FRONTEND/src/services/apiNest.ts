import axios from 'axios';

const apiNest = axios.create({ baseURL: '/api' });

export default apiNest;