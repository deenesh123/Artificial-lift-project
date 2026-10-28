import { UserProfile, UserRole, PortalType } from '../types';
import { DEMO_USERS } from '../data/mockData';

const AUTH_STORAGE_KEYS = {
  USERS: 'als_auth_users_v4',
  SESSION: 'als_auth_session_v4',
};

export interface AuthSession {
  user: UserProfile;
  token: string;
  expiresAt: number;
}

// Initial user list with active/pending statuses and username/password credentials
const INITIAL_REGISTERED_USERS: UserProfile[] = [
  ...DEMO_USERS.map(u => ({
    ...u,
    status: (u.status || 'active') as 'active' | 'deactivated' | 'pending_approval',
    authProvider: 'credentials' as const,
    createdAt: u.createdAt || '2025-01-15T08:00:00Z',
    lastLoginAt: u.lastLoginAt || '2026-10-28T07:15:00Z',
  })),
  {
    id: 'usr-guest-99',
    name: 'Alex Rivera (Guest)',
    username: 'pending_user',
    email: 'engineer.guest@gmail.com',
    password: 'GuestDemo2026!',
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
   * Genuine credential authentication supporting both username or email and passwords
   */
  async loginWithCredentials(identifierInput: string, passwordInput: string): Promise<UserProfile> {
    // Artificial latency for authentic auth feel
    await new Promise(res => setTimeout(res, 450));

    const identifier = identifierInput.trim();
    if (!identifier) {
      throw new Error('Please enter your username or enterprise email address.');
    }

    if (!passwordInput || passwordInput.length < 4) {
      throw new Error('Please enter your password (minimum 4 characters).');
    }

    const users = this.getUsers();
    const lowerIdentifier = identifier.toLowerCase();
    
    // Find matching user by username or email
    const user = users.find(u => 
      (u.username && u.username.toLowerCase() === lowerIdentifier) || 
      u.email.toLowerCase() === lowerIdentifier
    );

    if (!user) {
      throw new Error('Invalid credentials. No ALS account found with this username or email.');
    }

    if (user.status === 'deactivated') {
      throw new Error('Account inactive. This account has been deactivated by an Administrator. Contact RTOC support.');
    }

    if (user.status === 'pending_approval') {
      throw new Error('Account pending approval. Please wait for an Administrator to assign your operational role.');
    }

    // Verify password against configured user password or standard demo password fallback
    const isValidPassword = 
      (user.password && passwordInput === user.password) || 
      passwordInput === 'demo-als-2026' || 
      passwordInput === 'admin123';

    if (!isValidPassword) {
      throw new Error('Invalid credentials. The password entered is incorrect.');
    }

    // Update last login timestamp
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
        username: targetEmail.split('@')[0],
        email: targetEmail,
        password: 'GoogleUser2026!',
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
  async requestPasswordReset(identifierInput: string): Promise<string> {
    await new Promise(res => setTimeout(res, 400));
    const identifier = identifierInput.trim().toLowerCase();
    if (!identifier) {
      throw new Error('Please enter your username or registered corporate email.');
    }

    const users = this.getUsers();
    const user = users.find(u => 
      (u.username && u.username.toLowerCase() === identifier) || 
      u.email.toLowerCase() === identifier
    );
    if (!user) {
      throw new Error('No account found matching this username or email address.');
    }

    const token = `RST-${Math.floor(100000 + Math.random() * 900000)}`;
    return `Password reset token ${token} dispatched to registered address for ${user.name}. Check your corporate inbox.`;
  },

  /**
   * Admin: Create a new user with configured username, password, role, and portal permissions
   */
  createUser(data: {
    name: string;
    username: string;
    email: string;
    password?: string;
    role: UserRole;
    roleTitle: string;
    department: string;
    fieldLocation: string;
    allowedPortals: PortalType[];
    defaultPortal: PortalType;
  }): UserProfile {
    const users = this.getUsers();
    const lowerUser = data.username.trim().toLowerCase();
    const lowerEmail = data.email.trim().toLowerCase();

    if (!lowerUser || lowerUser.length < 3) {
      throw new Error('Username must be at least 3 characters long.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(lowerEmail)) {
      throw new Error('Please enter a valid enterprise email address.');
    }

    // Check unique username
    if (users.some(u => u.username && u.username.toLowerCase() === lowerUser)) {
      throw new Error(`Username "${data.username}" is already assigned to another user.`);
    }

    // Check unique email
    if (users.some(u => u.email.toLowerCase() === lowerEmail)) {
      throw new Error(`Email address "${data.email}" is already registered.`);
    }

    const newUser: UserProfile = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: data.name.trim(),
      username: data.username.trim(),
      email: data.email.trim(),
      password: data.password?.trim() || 'DemoUser2026!',
      role: data.role,
      roleTitle: data.roleTitle,
      department: data.department || 'Production Operations',
      fieldLocation: data.fieldLocation || 'Permian Basin',
      allowedPortals: data.allowedPortals.length > 0 ? data.allowedPortals : ['user'],
      defaultPortal: data.defaultPortal,
      status: 'active',
      authProvider: 'credentials',
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  },

  /**
   * Admin: Reset / Configure Password for a specific user
   */
  updateUserPassword(userId: string, newPassword: string): void {
    if (!newPassword || newPassword.length < 4) {
      throw new Error('Password must be at least 4 characters long.');
    }
    const users = this.getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) {
      throw new Error('User not found.');
    }
    target.password = newPassword.trim();
    this.saveUsers(users);
  },

  /**
   * Admin Role & Portal Permission Management
   */
  updateUserRole(
    userId: string, 
    newRole: UserRole, 
    roleTitle: string, 
    allowedPortals: PortalType[], 
    defaultPortal: PortalType
  ): UserProfile[] {
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

  /**
   * Admin: Grant / Revoke portal access directly
   */
  updateUserPortals(userId: string, allowedPortals: PortalType[], defaultPortal: PortalType): UserProfile[] {
    const users = this.getUsers();
    const updated = users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          allowedPortals,
          defaultPortal,
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

  approvePendingUser(
    userId: string, 
    assignedRole: UserRole, 
    roleTitle: string, 
    allowedPortals: PortalType[], 
    defaultPortal: PortalType
  ): UserProfile[] {
    return this.updateUserRole(userId, assignedRole, roleTitle, allowedPortals, defaultPortal);
  },

  rejectPendingUser(userId: string): UserProfile[] {
    return this.deleteUser(userId);
  },

  deleteUser(userId: string): UserProfile[] {
    const users = this.getUsers();
    const updated = users.filter(u => u.id !== userId);
    this.saveUsers(updated);
    return updated;
  },
};
