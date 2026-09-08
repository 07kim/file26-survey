// Google認証ヘルパー
export function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.warn('JWT Parse error:', e);
    return null;
  }
}

export const GOOGLE_CONFIG = {
  // Google Cloud Consoleで発行したOAuth 2.0 クライアントID
  CLIENT_ID: "19852053187-nv95o94u2sk6rcj2m78o05dpm7khma7k.apps.googleusercontent.com"
};

export function getActiveClientId() {
  return localStorage.getItem('file26_google_client_id') || GOOGLE_CONFIG.CLIENT_ID;
}

export function setActiveClientId(id) {
  if (id) {
    localStorage.setItem('file26_google_client_id', id);
  } else {
    localStorage.removeItem('file26_google_client_id');
  }
}

export function getStoredUser() {
  try {
    const data = localStorage.getItem('file26_google_user');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveGoogleUser(userData) {
  try {
    localStorage.setItem('file26_google_user', JSON.stringify(userData));
  } catch (e) {
    console.warn('Failed to save google user:', e);
  }
}

export function logoutGoogleUser() {
  try {
    localStorage.removeItem('file26_google_user');
    localStorage.removeItem('file26_user_account');
  } catch (e) {
    console.warn('Failed to logout:', e);
  }
}

