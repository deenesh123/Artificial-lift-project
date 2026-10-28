import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  CheckCircle2, 
  Key, 
  Search, 
  UserCheck, 
  ChevronRight,
  Clock,
  AlertTriangle,
  UserX,
  UserPlus,
  Trash2,
  Lock,
  Unlock,
  Radio,
  Check
} from 'lucide-react';
import { UserProfile, UserRole, PortalType } from '../../types';
import { AuthService } from '../../services/authService';

interface UserManagementViewProps {
  onSwitchUser?: (user: UserProfile) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ onSwitchUser }) => {
  const [users, setUsers] = useState<UserProfile[]>(() => AuthService.getUsers());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending_approval' | 'deactivated'>('all');
  const [notice, setNotice] = useState<string | null>(null);

  // Pending user role selection state
  const [pendingRoleSelection, setPendingRoleSelection] = useState<{ [userId: string]: UserRole }>({});

  const reloadUsers = () => {
    setUsers(AuthService.getUsers());
  };

  useEffect(() => {
    const handleUpdate = () => {
      setUsers(AuthService.getUsers());
    };
    window.addEventListener('auth_users_update', handleUpdate);
    return () => window.removeEventListener('auth_users_update', handleUpdate);
  }, []);

  const showFeedback = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const pendingUsers = users.filter(u => u.status === 'pending_approval');

  const filtered = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.roleTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'pending_approval' ? u.status === 'pending_approval' :
      statusFilter === 'deactivated' ? u.status === 'deactivated' :
      u.status === 'active' || (!u.status);

    return matchesSearch && matchesStatus;
  });

  const handleImpersonate = (user: UserProfile) => {
    if (user.status === 'deactivated') {
      showFeedback(`Cannot impersonate deactivated user account (${user.name}).`);
      return;
    }
    if (onSwitchUser) {
      onSwitchUser(user);
      showFeedback(`Active session switched to ${user.name} (${user.roleTitle}).`);
    }
  };

  const handleApproveUser = (user: UserProfile) => {
    const role: UserRole = pendingRoleSelection[user.id] || 'field_engineer';
    
    let roleTitle = 'Field Operations Engineer';
    let allowedPortals: PortalType[] = ['user'];
    let defaultPortal: PortalType = 'user';

    if (role === 'super_admin') {
      roleTitle = 'System & Asset Administrator';
      allowedPortals = ['admin', 'user'];
      defaultPortal = 'admin';
    } else if (role === 'monitoring_operator') {
      roleTitle = 'Real-Time Surveillance Operator';
      allowedPortals = ['user'];
      defaultPortal = 'user';
    } else if (role === 'viewer') {
      roleTitle = 'Executive & ESG Viewer';
      allowedPortals = ['user'];
      defaultPortal = 'user';
    }

    AuthService.approvePendingUser(user.id, role, roleTitle, allowedPortals, defaultPortal);
    showFeedback(`Approved account for ${user.name} as ${roleTitle}. Access privileges granted.`);
  };

  const handleToggleStatus = (user: UserProfile) => {
    AuthService.toggleUserStatus(user.id);
    const nextStatus = user.status === 'active' ? 'Deactivated' : 'Activated';
    showFeedback(`Account for ${user.name} is now ${nextStatus}.`);
  };

  const handleDeleteUser = (user: UserProfile) => {
    if (window.confirm(`Are you sure you want to remove ${user.name} (${user.email})?`)) {
      AuthService.deleteUser(user.id);
      showFeedback(`Removed user account ${user.name}.`);
    }
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    let roleTitle = 'Field Operations Engineer';
    let allowedPortals: PortalType[] = ['user'];
    let defaultPortal: PortalType = 'user';

    if (newRole === 'super_admin') {
      roleTitle = 'System & Asset Administrator';
      allowedPortals = ['admin', 'user'];
      defaultPortal = 'admin';
    } else if (newRole === 'monitoring_operator') {
      roleTitle = 'Real-Time Surveillance Operator';
      allowedPortals = ['user'];
      defaultPortal = 'user';
    } else if (newRole === 'viewer') {
      roleTitle = 'Executive & ESG Viewer';
      allowedPortals = ['user'];
      defaultPortal = 'user';
    }

    AuthService.updateUserRole(userId, newRole, roleTitle, allowedPortals, defaultPortal);
    showFeedback(`Updated role permissions for user.`);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {notice && (
        <div className="bg-cyan-950/90 border border-cyan-500 text-cyan-200 px-4 py-2.5 rounded-lg text-xs flex items-center justify-between shadow-xl animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="font-mono text-xs hover:text-white">✕</button>
        </div>
      )}

      {/* RBAC Governance Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              Role-Based Access Control (RBAC) & Identity Governance
            </h3>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Enterprise user management governing portal routing, role permissions, active session tokens, and approval gateways for external Google OAuth sign-ins.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-300 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg">
            Total Users: <strong className="text-white">{users.length}</strong>
          </span>
          {pendingUsers.length > 0 && (
            <span className="text-xs font-mono text-amber-300 bg-amber-950/70 border border-amber-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>{pendingUsers.length} Pending Approval</span>
            </span>
          )}
        </div>
      </div>

      {/* Pending Approvals Queue Banner (Slide / System requirement) */}
      {pendingUsers.length > 0 && (
        <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-5 space-y-4 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-amber-950 border border-amber-800/80 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>External Accounts Pending Administrator Approval</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-900/60 text-amber-300 border border-amber-700/60">
                    Action Required
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  New users signing in with Google OAuth are quarantined until an Administrator assigns an operational role.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingUsers.map(pUser => {
              const selectedRole = pendingRoleSelection[pUser.id] || 'field_engineer';
              return (
                <div key={pUser.id} className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">{pUser.name}</div>
                      <div className="text-xs text-cyan-400 font-mono">{pUser.email}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Provider: <span className="text-slate-300 capitalize">{pUser.authProvider || 'google'}</span> • Requested: {new Date(pUser.createdAt || Date.now()).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
                      Pending
                    </span>
                  </div>

                  {/* Role Assignment Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-slate-400 block">
                      Assign Operational Role & Portal Access:
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setPendingRoleSelection({ ...pendingRoleSelection, [pUser.id]: e.target.value as UserRole })}
                      className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-md px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="field_engineer">Field Operations Engineer (User Portal)</option>
                      <option value="monitoring_operator">Real-Time Surveillance Operator (User Portal)</option>
                      <option value="super_admin">System Administrator (Admin & User Portals)</option>
                      <option value="viewer">Executive & ESG Viewer (Read-Only User Portal)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleApproveUser(pUser)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs py-1.5 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-950"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Grant Role</span>
                    </button>
                    <button
                      onClick={() => handleDeleteUser(pUser)}
                      className="p-1.5 rounded-md bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900 transition-colors"
                      title="Reject and remove request"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Users Directory Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {/* Controls Bar */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, role, email, or basin..."
              className="w-full bg-slate-950 border border-slate-700 rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs self-stretch sm:self-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded transition-colors ${statusFilter === 'all' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              All ({users.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded transition-colors ${statusFilter === 'active' ? 'bg-emerald-950 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              Active ({users.filter(u => u.status === 'active' || !u.status).length})
            </button>
            <button
              onClick={() => setStatusFilter('pending_approval')}
              className={`px-3 py-1 rounded transition-colors ${statusFilter === 'pending_approval' ? 'bg-amber-950 text-amber-300 font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              Pending ({pendingUsers.length})
            </button>
            <button
              onClick={() => setStatusFilter('deactivated')}
              className={`px-3 py-1 rounded transition-colors ${statusFilter === 'deactivated' ? 'bg-rose-950 text-rose-300 font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              Deactivated ({users.filter(u => u.status === 'deactivated').length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">User & Identity</th>
                <th className="px-4 py-3">Operational Role</th>
                <th className="px-4 py-3">Account Status</th>
                <th className="px-4 py-3">Department & Location</th>
                <th className="px-4 py-3">Authorized Portals</th>
                <th className="px-4 py-3 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200 font-mono">
              {filtered.map(user => {
                const isActive = user.status === 'active' || (!user.status);
                const isPending = user.status === 'pending_approval';
                const isDeactivated = user.status === 'deactivated';

                return (
                  <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cyan-400 text-xs shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-white font-sans flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {user.authProvider === 'google' && (
                              <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/60 px-1 rounded border border-cyan-800/50">
                                Google
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          disabled={isPending}
                          className="bg-slate-950 border border-slate-700 text-xs text-cyan-300 font-sans rounded px-2 py-1 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                        >
                          <option value="super_admin">System Administrator</option>
                          <option value="field_engineer">Field Operations Engineer</option>
                          <option value="monitoring_operator">Surveillance Operator</option>
                          <option value="viewer">Executive & ESG Viewer</option>
                        </select>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {isActive && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-sans font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>Active</span>
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-sans font-medium bg-amber-950/70 text-amber-300 border border-amber-800">
                          <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                          <span>Pending Approval</span>
                        </span>
                      )}
                      {isDeactivated && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-sans font-medium bg-rose-950/70 text-rose-300 border border-rose-800">
                          <UserX className="w-3 h-3 text-rose-400" />
                          <span>Deactivated</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-sans">
                      <div className="text-slate-300">{user.department}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{user.fieldLocation}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 font-sans">
                        {user.allowedPortals?.includes('admin') && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-950 text-blue-300 border border-blue-800">
                            Admin
                          </span>
                        )}
                        {user.allowedPortals?.includes('user') && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800">
                            User
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 font-sans">
                        {isPending ? (
                          <button
                            onClick={() => handleApproveUser(user)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                          >
                            Approve
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleImpersonate(user)}
                              disabled={isDeactivated}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs transition-colors disabled:opacity-40"
                              title="Switch active session persona to test role permissions"
                            >
                              Login As
                            </button>
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className={`p-1 rounded text-xs transition-colors ${
                                isActive 
                                  ? 'text-slate-400 hover:text-rose-300 bg-slate-800 hover:bg-rose-950' 
                                  : 'text-slate-400 hover:text-emerald-300 bg-slate-800 hover:bg-emerald-950'
                              }`}
                              title={isActive ? 'Deactivate account' : 'Reactivate account'}
                            >
                              {isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
