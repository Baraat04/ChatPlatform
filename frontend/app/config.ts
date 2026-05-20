export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://72.62.117.32:3001';

console.log('🔥 API_BASE from env:', process.env.NEXT_PUBLIC_API_URL);
console.log('🔥 Final API_BASE used:', API_BASE);

export const API_URL = `${API_BASE}/api`;
export const SOCKET_URL = API_BASE;