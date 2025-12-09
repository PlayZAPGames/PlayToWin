import { getToken } from './auth';

import baseUrl from '../config';
// console.log("baseUrl", baseUrl);


export async function loginUser(payload) {
  const res = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function setup2FA(payload) {
  const res = await fetch(`${baseUrl}/api/admin/setup-2fa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function fetchProtectedData() {
  const res = await fetch(`${baseUrl}/api/admin-data`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  return res.json();
}
