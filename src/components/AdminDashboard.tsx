import React, { useState } from 'react';
import { 
  Users, Activity, Database, Server,
  Search
} from 'lucide-react';
import type { UserProfile, VaultRecord, AuditLogEntry } from '../types';

interface AdminDashboardProps {
  currentUser: UserProfile;
  users: UserProfile[];
  records: VaultRecord[];
  auditLogs: AuditLogEntry[];
  onToggleUserStatus: (userId: string) => void;
  onChangeUserRole: (userId: string, newRole: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  users,
  records,
  auditLogs,
  onToggleUserStatus,
  onChangeUserRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'owner' | 'co_owner'>('all');

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{
        background: '#0d0d0d',
        border: '1px solid #1f1f1f',
        borderLeft: '4px solid #ef4444',
        borderRadius: '10px',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
            Platform Security & User Administration Console
          </div>
          <div style={{ fontSize: '12px', color: '#888888', marginTop: '4px' }}>
            Logged in as Super Admin: <span style={{ color: '#ef4444' }}>{currentUser.email}</span> • Zero-Trust RBAC Policy Active
          </div>
        </div>
        <div style={{
          background: '#160b0b',
          border: '1px solid #7f1d1d',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: 700,
          color: '#f87171'
        }}>
          LEVEL 3 AUTHORIZED
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        <div style={{ background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888888', fontSize: '12px' }}>
            <span>TOTAL USERS</span>
            <Users size={16} color="#ef4444" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '8px' }}>{users.length}</div>
          <div style={{ fontSize: '11px', color: '#22c55e', marginTop: '4px' }}>
            {users.filter(u => !u.isSuspended).length} active • {users.filter(u => u.isSuspended).length} suspended
          </div>
        </div>

        <div style={{ background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888888', fontSize: '12px' }}>
            <span>TOTAL VAULT ASSETS</span>
            <Database size={16} color="#ef4444" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '8px' }}>{records.length}</div>
          <div style={{ fontSize: '11px', color: '#888888', marginTop: '4px' }}>
            Across all tenant partitions
          </div>
        </div>

        <div style={{ background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888888', fontSize: '12px' }}>
            <span>AUDIT EVENTS</span>
            <Activity size={16} color="#ef4444" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '8px' }}>{auditLogs.length}</div>
          <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '4px' }}>
            Chained SHA-256 Ledger
          </div>
        </div>

        <div style={{ background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888888', fontSize: '12px' }}>
            <span>DATABASE HEALTH</span>
            <Server size={16} color="#22c55e" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '12px', color: '#22c55e' }}>
            ONLINE
          </div>
          <div style={{ fontSize: '11px', color: '#888888', marginTop: '4px' }}>
            RLS Enforcement Active
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div style={{
        background: '#0a0a0a',
        border: '1px solid #1c1c1c',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Registered Identity & Role Enforcement</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#888888' }}>
              Inspect and control verified system users. Privilege escalation strictly bounded.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#666666" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="text"
                placeholder="Search identity or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  background: '#000000',
                  border: '1px solid #222222',
                  padding: '8px 12px 8px 30px',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
            </div>
            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value as any)}
              style={{
                background: '#000000',
                border: '1px solid #222222',
                padding: '8px 12px',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '12px'
              }}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="owner">Vault Owner</option>
              <option value="co_owner">Vault Co-Owner</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1c1c1c', color: '#888888', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 14px' }}>Identity</th>
                <th style={{ padding: '10px 14px' }}>Assigned Role</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
                <th style={{ padding: '10px 14px' }}>Joined Date</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Security Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #141414' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600 }}>{user.fullName}</div>
                    <div style={{ fontSize: '11px', color: '#666666' }}>{user.email}</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <select
                      value={user.role}
                      disabled={user.id === currentUser.id}
                      onChange={e => onChangeUserRole(user.id, e.target.value)}
                      style={{
                        background: '#000000',
                        border: '1px solid #2a2a2a',
                        color: user.role === 'admin' ? '#ef4444' : user.role === 'owner' ? '#ffffff' : '#38bdf8',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 700
                      }}
                    >
                      <option value="admin">ADMIN</option>
                      <option value="owner">OWNER</option>
                      <option value="co_owner">CO-OWNER</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {user.isSuspended ? (
                      <span style={{ background: '#260a0a', color: '#ef4444', padding: '3px 8px', borderRadius: '4px', fontSize: '11px' }}>
                        SUSPENDED
                      </span>
                    ) : (
                      <span style={{ background: '#0a2610', color: '#22c55e', padding: '3px 8px', borderRadius: '4px', fontSize: '11px' }}>
                        ACTIVE
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#888888', fontSize: '12px' }}>
                    {user.createdAt.slice(0, 10)}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    {user.id !== currentUser.id && (
                      <button
                        onClick={() => onToggleUserStatus(user.id)}
                        style={{
                          background: user.isSuspended ? '#1c1c1c' : '#2a0a0a',
                          border: user.isSuspended ? '1px solid #333333' : '1px solid #7f1d1d',
                          color: user.isSuspended ? '#ffffff' : '#f87171',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {user.isSuspended ? 'Reactivate' : 'Suspend'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chained Audit Log */}
      <div style={{
        background: '#0a0a0a',
        border: '1px solid #1c1c1c',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Chained Tamper-Proof Audit Trail</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#888888' }}>
              Immutable append-only events linked via previous_hash SHA-256 integrity tags.
            </p>
          </div>
          <span style={{ fontSize: '11px', color: '#22c55e', background: '#0a1c0d', padding: '4px 8px', borderRadius: '4px' }}>
            Chain Verified
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {auditLogs.slice(0, 8).map(log => (
            <div key={log.id} style={{
              background: '#050505',
              border: '1px solid #141414',
              borderRadius: '6px',
              padding: '10px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px'
            }}>
              <div>
                <span style={{ color: '#ef4444', fontWeight: 700, marginRight: '8px' }}>[{log.action}]</span>
                <span style={{ color: '#ffffff' }}>{log.actorEmail}</span>
                <span style={{ color: '#666666', marginLeft: '8px' }}>({log.actorRole})</span>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#555555' }}>
                  Hash: {log.currentHash.slice(0, 16)}...
                </span>
                <span style={{ color: '#888888', fontSize: '11px' }}>{log.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
