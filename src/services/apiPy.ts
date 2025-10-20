import axios from 'axios';

const apiPy = axios.create({ baseURL: '/pyapi' });

export default apiPy;