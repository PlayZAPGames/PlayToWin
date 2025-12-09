import { writable } from 'svelte/store';
import { getUserFromToken, getToken, clearToken } from '../lib/auth';


export const user = writable(getUserFromToken());
export const isAuthenticated = writable(!!getToken());

export function logout() {
  clearToken();
  user.set(null);
  isAuthenticated.set(false);
}
