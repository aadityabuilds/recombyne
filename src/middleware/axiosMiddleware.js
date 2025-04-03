import axios from 'axios';
import secureAxios from '../utils/axiosConfig';

// Replace the global axios instance with our secure instance
const setupSecureAxios = () => {
  // Copy all the secure configurations to the global axios instance
  Object.assign(axios.defaults, secureAxios.defaults);
  
  // Copy interceptors
  axios.interceptors.request.handlers = [...secureAxios.interceptors.request.handlers];
  axios.interceptors.response.handlers = [...secureAxios.interceptors.response.handlers];
  
  // Override the create method to always use secure config
  const originalCreate = axios.create;
  axios.create = (config) => {
    const instance = originalCreate(config);
    // Apply secure defaults
    Object.assign(instance.defaults, secureAxios.defaults, config);
    // Copy interceptors
    instance.interceptors.request.handlers = [...secureAxios.interceptors.request.handlers];
    instance.interceptors.response.handlers = [...secureAxios.interceptors.response.handlers];
    return instance;
  };
};

export default setupSecureAxios; 