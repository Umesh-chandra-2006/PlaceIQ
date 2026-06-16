/**
 * Axios instance configuration with base URL and interceptors for JWT.
 */
import axios from 'axios';

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Add a request interceptor to include the JWT token and format API URLs
instance.interceptors.request.use(
  (config) => {
    // Ensure baseURL ends with a slash and config.url does not have a leading slash
    if (config.baseURL && !config.baseURL.endsWith('/')) {
      config.baseURL += '/';
    }
    if (config.url && config.url.startsWith('/')) {
      config.url = config.url.substring(1);
    }

    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:logout'));
      if (!window.location.pathname.startsWith('/login') && 
          !window.location.pathname.startsWith('/setup-account')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
