// features/dashboard/jira-token-data.js
const JIRA_STORAGE_KEYS = {
  ACCESS_TOKEN: 'jira_access_token',
  EXPIRY_TIME: 'jira_token_expiry',
  REFRESH_TOKEN: 'jira_refresh_token',
  USER_INFO: 'jira_user_info',
  AUTH_SUCCESS: 'jira_auth_success',
  AUTH_TIME: 'jira_auth_time'
};

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export const JiraTokenService = {
  storeToken(tokenData) {
    const { access_token, expires_in = 360000, refresh_token, user_info, auth_message } = tokenData || {};

    if (!access_token) {
      console.error('[JiraTokenService] Missing access token.');
      return false;
    }

    try {
      const expiryTimestamp = Date.now() + expires_in * 1000;

      localStorage.setItem(JIRA_STORAGE_KEYS.ACCESS_TOKEN, access_token);
      localStorage.setItem(JIRA_STORAGE_KEYS.EXPIRY_TIME, expiryTimestamp.toString());
      localStorage.setItem(JIRA_STORAGE_KEYS.AUTH_SUCCESS, 'true');
      localStorage.setItem(JIRA_STORAGE_KEYS.AUTH_TIME, Date.now().toString());

      if (refresh_token) {
        localStorage.setItem(JIRA_STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
      }

      if (user_info) {
        localStorage.setItem(JIRA_STORAGE_KEYS.USER_INFO, JSON.stringify(user_info));
      }

      console.log('[JiraTokenService] Token stored successfully');
      return true;
    } catch (error) {
      console.error('[JiraTokenService] Failed to store token data:', error);
      return false;
    }
  },

  hasValidToken() {
    try {
      const token = localStorage.getItem(JIRA_STORAGE_KEYS.ACCESS_TOKEN);
      const expiry = parseInt(localStorage.getItem(JIRA_STORAGE_KEYS.EXPIRY_TIME) || '', 10);
      const authSuccess = localStorage.getItem(JIRA_STORAGE_KEYS.AUTH_SUCCESS);

      console.log('[JiraTokenService] Checking token validity:', { token, expiry, authSuccess });

      // For mock tokens or when backend doesn't provide real tokens
      if (authSuccess === 'true' && token === 'jira_session_active') {
        if (!isNaN(expiry)) {
          const isValid = Date.now() < (expiry - FIVE_MINUTES_MS);
          console.log('[JiraTokenService] Mock token valid:', isValid);
          return isValid;
        }
      }

      // For real tokens
      if (!token || isNaN(expiry)) {
        console.log('[JiraTokenService] No valid token found');
        return false;
      }
      
      const isValid = Date.now() < (expiry - FIVE_MINUTES_MS);
      console.log('[JiraTokenService] Real token valid:', isValid);
      return isValid;
    } catch (error) {
      console.error('[JiraTokenService] Token validation failed:', error);
      return false;
    }
  },

  getToken() {
    const isValid = this.hasValidToken();
    const token = localStorage.getItem(JIRA_STORAGE_KEYS.ACCESS_TOKEN);
    console.log('[JiraTokenService] Getting token:', { isValid, token });
    return isValid ? token : null;
  },

  clearToken() {
    console.log('[JiraTokenService] Clearing all tokens');
    Object.values(JIRA_STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },

  // Helper method to check if user is authenticated (even without real token)
  isAuthenticated() {
    const authSuccess = localStorage.getItem(JIRA_STORAGE_KEYS.AUTH_SUCCESS);
    const authTime = parseInt(localStorage.getItem(JIRA_STORAGE_KEYS.AUTH_TIME) || '', 10);
    
    console.log('[JiraTokenService] Checking authentication:', { authSuccess, authTime });
    
    if (authSuccess === 'true' && !isNaN(authTime)) {
      // Check if auth is still valid (e.g., within 1 hour)
      const oneHour = 60 * 60 * 1000;
      const isValid = Date.now() - authTime < oneHour;
      console.log('[JiraTokenService] Session authentication valid:', isValid);
      return isValid;
    }
    
    return this.hasValidToken();
  }
};