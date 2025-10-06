const STORAGE_KEYS = {
  ACCESS_TOKEN: 'devops_access_token',
  EXPIRY_TIME: 'devops_token_expiry',
  REFRESH_TOKEN: 'devops_refresh_token',
  USER_INFO: 'devops_user_info'
};

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export const DevOpsTokenService = {
  storeToken(tokenData) {
    const { access_token, expires_in = 3600, refresh_token, user_info } = tokenData || {};

    if (!access_token) {
      console.error('[DevOpsTokenService] Missing access token.');
      return false;
    }

    try {
      const expiryTimestamp = Date.now() + expires_in * 1000;

      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
      localStorage.setItem(STORAGE_KEYS.EXPIRY_TIME, expiryTimestamp.toString());

      if (refresh_token) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
      }

      if (user_info) {
        localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user_info));
      }

      return true;
    } catch (error) {
      console.error('[DevOpsTokenService] Failed to store token data:', error);
      return false;
    }
  },

  hasValidToken() {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const expiry = parseInt(localStorage.getItem(STORAGE_KEYS.EXPIRY_TIME) || '', 10);

      if (!token || isNaN(expiry)) return false;

      return Date.now() < (expiry - FIVE_MINUTES_MS); // Buffer window to preempt expiry
    } catch (error) {
      console.error('[DevOpsTokenService] Token validation failed:', error);
      return false;
    }
  },

  getToken() {
    return this.hasValidToken()
      ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      : null;
  },
  clearToken() {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
};
