
export const saveToken = (token) => localStorage.setItem('accessToken', token);
export const getToken = () => localStorage.getItem('accessToken');
export const removeToken = () => localStorage.removeItem('accessToken');

export const saveUser = (u) => localStorage.setItem('user', JSON.stringify(u));
export const getUser = () => {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
};
export const removeUser = () => {
  localStorage.removeItem('user');
  removeToken();
};