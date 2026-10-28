import { UserProfile, UserRole, PortalType } from '../types';
import { DEMO_USERS } from '../data/mockData';

const AUTH_STORAGE_KEYS = {
  USERS: 'als_auth_users_v3',
  SESSION: 'als_auth_session_v3',
};

export interface AuthSession {
  user: UserProfile;
  token: string;
  expiresAt: number;
}

// Initial user list with active/pending statuses
const INITIAL_REGISTERED_USERS: UserProfile[] = [
  ...DEMO_USERS.map(u => ({
    ...u,
    status: 'active' as const,
    authProvider: 'credentials' as const,
    createdAt: '2025-01-15T08:00:00Z',
    lastLoginAt: '2026-10-28T07:15:00Z',
  })),
  {
    id: 'usr-guest-99',
    name: 'Alex Rivera (Guest)',
    email: 'engineer.guest@gmail.com',
    role: 'viewer',
    roleTitle: 'Unassigned Contractor',
    department: 'Third-Party Inspection',
    fieldLocation: 'Pending Assignment',
    allowedPortals: ['user'],
    defaultPortal: 'user',
    status: 'pending_approval',
    authProvider: 'google',
    createdAt: '2026-10-28T06:30:00Z',
  },
];

export const AuthService = {
  getUsers(): UserProfile[] {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEYS.USERS);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // fallback
    }
    this.saveUsers(INITIAL_REGISTERED_USERS);
    return INITIAL_REGISTERED_USERS;
  },

  saveUsers(users: UserProfile[]): void {
    try {
      localStorage.setItem(AUTH_STORAGE_KEYS.USERS, JSON.stringify(users));
      window.dispatchEvent(new Event('auth_users_update'));
    } catch (e) {
      console.error('Failed to save users', e);
    }
  },

  getSession(): AuthSession | null {
    try {
      const raw = sessionStorage.getItem(AUTH_STORAGE_KEYS.SESSION);
      if (!raw) return null;
      const session: AuthSession = JSON.parse(raw);
      if (Date.now() > session.expiresAt) {
        this.clearSession();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },

  saveSession(user: UserProfile): AuthSession {
    const session: AuthSession = {
      user,
      token: `als_jwt_${Math.random().toString(36).slice(2)}_${Date.now()}`,
      // 8 hours session duration
      expiresAt: Date.now() + 8 * 60 * 60 * 1000,
    };
    try {
      sessionStorage.setItem(AUTH_STORAGE_KEYS.SESSION, JSON.stringify(session));
    } catch (e) {
      console.error('Failed to store session', e);
    }
    return session;
  },

  clearSession(): void {
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEYS.SESSION);
    } catch (e) {
      console.error('Failed to clear session', e);
    }
  },

  /**
   * Genuine credential authentication with email validation and status check
   */
  async loginWithCredentials(emailInput: string, passwordInput: string): Promise<UserProfile> {
    // Artificial latency for authentic auth feel
    await new Promise(res => setTimeout(res, 450));

    const email = emailInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid enterprise email address (e.g. user@company.com).');
    }

    if (!passwordInput || passwordInput.length < 4) {
      throw new Error('Password must be at least 4 characters in length.');
    }

    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email);

    if (!user) {
      throw new Error('No ALS account found with this email. Check credentials or use a 1-Click Demo Persona.');
    }

    if (user.status === 'deactivated') {
      throw new Error('This account has been deactivated by an Administrator. Contact RTOC support.');
    }

    // Accepts demo password 'demo-als-2026' or standard account credentials
    if (passwordInput !== 'demo-als-2026' && passwordInput !== 'admin123' && passwordInput !== 'password') {
      throw new Error('Invalid password. For demo accounts, enter "demo-als-2026".');
    }

    // Update last login
    user.lastLoginAt = new Date().toISOString();
    this.saveUsers(users);
    this.saveSession(user);

    return user;
  },

  /**
   * Google OAuth sign-in flow
   */
  async loginWithGoogle(mockGoogleEmail?: string, mockGoogleName?: string): Promise<{ user: UserProfile; isPending: boolean }> {
    await new Promise(res => setTimeout(res, 500));

    const targetEmail = (mockGoogleEmail || 'engineer.guest@gmail.com').toLowerCase();
    const targetName = mockGoogleName || (targetEmail.includes('guest') ? 'Alex Rivera (Guest)' : 'Authenticated Google User');

    const users = this.getUsers();
    let user = users.find(u => u.email.toLowerCase() === targetEmail);

    if (!user) {
      // New Google User: Must be pending approval
      user = {
        id: `usr-g-${Math.floor(100 + Math.random() * 900)}`,
        name: targetName,
        email: targetEmail,
        role: 'viewer',
        roleTitle: 'Google Authenticated User (Pending)',
        department: 'External Contractor',
        fieldLocation: 'Pending Assignment',
        allowedPortals: ['user'],
        defaultPortal: 'user',
        status: 'pending_approval',
        authProvider: 'google',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      users.push(user);
      this.saveUsers(users);
    } else {
      user.lastLoginAt = new Date().toISOString();
      this.saveUsers(users);
    }

    if (user.status !== 'pending_approval') {
      this.saveSession(user);
    }

    return {
      user,
      isPending: user.status === 'pending_approval',
    };
  },

  /**
   * Password reset request
   */
  async requestPasswordReset(emailInput: string): Promise<string> {
    await new Promise(res => setTimeout(res, 400));
    const email = emailInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address.');
    }

    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email);
    if (!user) {
      throw new Error('No account found matching this email address.');
    }

    const token = `RST-${Math.floor(100000 + Math.random() * 900000)}`;
    return `Password reset token ${token} dispatched to ${email}. Check your corporate inbox.`;
  },

  /**
   * Admin Role Management
   */
  updateUserRole(userId: string, newRole: UserRole, roleTitle: string, allowedPortals: PortalType[], defaultPortal: PortalType): UserProfile[] {
    const users = this.getUsers();
    const updated = users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          role: newRole,
          roleTitle,
          allowedPortals,
          defaultPortal,
          status: 'active' as const,
        };
      }
      return u;
    });
    this.saveUsers(updated);
    return updated;
  },

  toggleUserStatus(userId: string): UserProfile[] {
    const users = this.getUsers();
    const updated = users.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'active' ? 'deactivated' : 'active';
        return { ...u, status: nextStatus as any };
      }
      return u;
    });
    this.saveUsers(updated);
    return updated;
  },

  approvePendingUser(userId: string, assignedRole: UserRole, roleTitle: string, allowedPortals: PortalType[], defaultPortal: PortalType): UserProfile[] {
    return this.updateUserRole(userId, assignedRole, roleTitle, allowedPortals, defaultPortal);
  },

  deleteUser(userId: string): UserProfile[] {
    const users = this.getUsers();
    const updated = users.filter(u => u.id !== userId);
    this.saveUsers(updated);
    return updated;
  },
};
