import axios from 'axios';
import { getToken, saveToken, removeToken } from './auth';


function stripTrailingSlash(url = '') {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}


const apiOrigin = stripTrailingSlash(import.meta.env.VITE_API_URL || 'http://localhost:5001');
const baseURL = `${apiOrigin}/api`;

const API = axios.create({
  baseURL,
  withCredentials: true,
});

// attach token if present
API.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// refresh-token machinery
let isRefreshing = false;
let subscribers = [];

function onRefreshed(token) {
  subscribers.forEach(cb => cb(token));
  subscribers = [];
}

function subscribeTokenRefresh(cb) {
  subscribers.push(cb);
}

API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    if (!response) return Promise.reject(error); // network error / no response

    // handle 401 - unauthorized token expired
    if (response.status === 401 && config && !config._retry) {
      config._retry = true;
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          // NOTE: refresh endpoint path expects baseURL + '/auth/refresh'
          const rv = await API.post('/auth/refresh');
          const newToken = rv.data?.accessToken;
          if (newToken) saveToken(newToken);
          isRefreshing = false;
          onRefreshed(newToken);
        } catch (e) {
          isRefreshing = false;
          // clear tokens and let app handle redirect to login
          removeToken();
          return Promise.reject(e);
        }
      }

      // queue the original request until refresh finishes
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(async (token) => {
          try {
            // attach new token if available
            if (token) {
              config.headers = config.headers || {};
              config.headers.Authorization = `Bearer ${token}`;
            } else {
              // no token -> reject so caller can redirect to login
              return reject(new Error('No token after refresh'));
            }
            const resp = await API(config);
            resolve(resp);
          } catch (err) {
            reject(err);
          }
        });
      });
    }

    return Promise.reject(error);
  }
);

export default API;
