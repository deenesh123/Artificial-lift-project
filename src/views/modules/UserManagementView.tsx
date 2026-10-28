import React, { useState } from 'react';
import { Users, Shield, CheckCircle2, Key, Search, UserCheck, ChevronRight } from 'lucide-react';
import { DEMO_USERS } from '../../data/mockData';
import { UserProfile } from '../../types';

interface UserManagementViewProps {
  onSwitchUser?: (user: UserProfile) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ onSwitchUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = DEMO_USERS.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.roleTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImpersonate = (user: UserProfile) => {
    if (onSwitchUser) {
      onSwitchUser(user);
      setNotice(`Active session switched to ${user.name} (${user.roleTitle}).`);
      setTimeout(() => setNotice(null), 3000);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {notice && (
        <div className="bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 px-4 py-2 rounded-lg text-xs flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="font-mono text-xs">✕</button>
        </div>
      )}

      {/* RBAC Governance Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              Role-Based Access Control (RBAC) & Persona Directory
            </h3>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Pre-configured client presentation personas illustrating segmented access across supervisory administration, field engineering, real-time control room operators, and executive ESG viewers.
          </p>
        </div>

        <span className="text-xs font-mono text-cyan-400 bg-cyan-950 border border-cyan-800 px-3 py-1.5 rounded-lg">
          7 Pre-Configured Demo Personas
        </span>
      </div>

      {/* Users Directory Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user name or role..."
              className="w-full bg-slate-950 border border-slate-700 rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">User & Email</th>
                <th className="px-4 py-3">Operational Role</th>
                <th className="px-4 py-3">Department / Division</th>
                <th className="px-4 py-3">Assigned Location</th>
                <th className="px-4 py-3">Authorized Portals</th>
                <th className="px-4 py-3 text-right">Demo Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200 font-mono">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white font-sans">{user.name}</div>
                    <div className="text-[10px] text-slate-400">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-cyan-300 font-sans font-medium">{user.roleTitle}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{user.role.toUpperCase()}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-sans">{user.department}</td>
                  <td className="px-4 py-3 text-slate-400 font-sans">{user.fieldLocation}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {user.allowedPortals.map(p => (
                        <span key={p} className="px-2 py-0.5 rounded text-[10px] font-sans bg-slate-800 text-slate-300 border border-slate-700">
                          {p === 'admin' ? 'Admin' : 'User'}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleImpersonate(user)}
                      className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-sans transition-colors"
                    >
                      Login As
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
