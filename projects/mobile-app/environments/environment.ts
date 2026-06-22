export const environment = {
  production: false,

  // Backend API base URL
  apiUrl: 'https://localhost:5001/api/v1',

  // Mock mode – set to true while backend is not ready
  useMock: true,

  // Local storage key for auth data (Capacitor Storage will use this)
  authStorageKey: 'verixora_auth'
};
