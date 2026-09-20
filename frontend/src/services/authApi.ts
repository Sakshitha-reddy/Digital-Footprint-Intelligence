const API_BASE = '/api/v1/auth';

export interface UserSession {
  fullName: string;
  email: string;
  role: string;
  clearance: string;
  avatarUrl?: string;
  timestamp: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserSession;
}

export interface AuthConfig {
  google_enabled: boolean;
  github_enabled: boolean;
  google_client_id?: string | null;
}

export const authApi = {
  getToken(): string | null {
    try {
      return localStorage.getItem('aporia_auth_token');
    } catch {
      return null;
    }
  },

  setSession(token: string, user: UserSession): void {
    try {
      localStorage.setItem('aporia_auth_token', token);
      localStorage.setItem('aporia_user_session', JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to persist session to localStorage', e);
    }
  },

  clearSession(): void {
    try {
      localStorage.removeItem('aporia_auth_token');
      localStorage.removeItem('aporia_user_session');
    } catch (e) {
      console.warn('Failed to clear session from localStorage', e);
    }
  },

  async getAuthConfig(): Promise<AuthConfig> {
    try {
      const res = await fetch(`${API_BASE}/config`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Could not retrieve auth config', e);
    }
    return { google_enabled: false, github_enabled: false };
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password })
    });

    if (!res.ok) {
      let message = 'Invalid email address or password.';
      try {
        const errorData = await res.json();
        if (errorData.detail) message = errorData.detail;
      } catch {}
      throw new Error(message);
    }

    const data: AuthResponse = await res.json();
    authApi.setSession(data.access_token, data.user);
    return data;
  },

  async register(fullName: string, email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        role: 'Senior Intelligence Analyst',
        clearance: 'LEVEL 3 - OSINT/PUBLIC'
      })
    });

    if (!res.ok) {
      let message = 'Unable to create account. Please try again.';
      try {
        const errorData = await res.json();
        if (errorData.detail) message = errorData.detail;
      } catch {}
      throw new Error(message);
    }

    const data: AuthResponse = await res.json();
    authApi.setSession(data.access_token, data.user);
    return data;
  },

  async logout(): Promise<void> {
    const token = authApi.getToken();
    try {
      if (token) {
        await fetch(`${API_BASE}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (e) {
      console.warn('Logout API error:', e);
    } finally {
      authApi.clearSession();
    }
  },

  async getCurrentUser(): Promise<UserSession | null> {
    const token = authApi.getToken();
    if (!token) return null;

    try {
      const res = await fetch(`${API_BASE}/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        return await res.json();
      }
      // Token expired or invalid
      authApi.clearSession();
      return null;
    } catch {
      return null;
    }
  },

  async requestPasswordReset(email: string): Promise<{ message: string; reset_token?: string }> {
    const res = await fetch(`${API_BASE}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() })
    });

    if (!res.ok) {
      let message = 'Unable to process password reset request.';
      try {
        const errorData = await res.json();
        if (errorData.detail) message = errorData.detail;
      } catch {}
      throw new Error(message);
    }

    return await res.json();
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const res = await fetch(`${API_BASE}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token.trim(), new_password: newPassword })
    });

    if (!res.ok) {
      let message = 'Password reset token invalid or expired.';
      try {
        const errorData = await res.json();
        if (errorData.detail) message = errorData.detail;
      } catch {}
      throw new Error(message);
    }
  }
};
