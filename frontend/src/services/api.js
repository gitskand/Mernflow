import axios from 'axios';
import { getToken, saveToken, removeToken } from './auth';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  withCredentials: true,
});


API.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


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
    if (!response) return Promise.reject(error); // network error

    if (response.status === 401 && !config._retry) {
      config._retry = true;
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const rv = await API.post('/auth/refresh'); 
          const newToken = rv.data?.accessToken;
          if (newToken) saveToken(newToken);
          isRefreshing = false;
          onRefreshed(newToken);
        } catch (e) {
          isRefreshing = false;
          removeToken();
          return Promise.reject(e);
        }
      }
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(async (token) => {
          try {
            if (token) {
              config.headers = config.headers || {};
              config.headers.Authorization = `Bearer ${token}`;
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