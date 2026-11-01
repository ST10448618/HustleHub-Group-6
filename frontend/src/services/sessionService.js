import axios from 'axios';

export async function revokeSession(token) {
  if (!token) {
    return;
  }

  try {
    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`, null, {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch {
    
  }
}