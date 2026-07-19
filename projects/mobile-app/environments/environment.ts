export const environment = {
  production: false,

  // Backend API base URL
  apiUrl: 'http://localhost:5166/api/v1',
  // Android emulator reaches the host machine through this special address.
  // Real devices must use a trusted HTTPS staging/production endpoint.
  androidEmulatorApiUrl: 'http://10.0.2.2:5166/api/v1',

  // Mock mode – set to true while backend is not ready
  useMock: false,

  // Local storage key for auth data (Capacitor Storage will use this)
  authStorageKey: 'verixora_auth'
};
