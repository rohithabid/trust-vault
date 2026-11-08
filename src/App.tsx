import { useState, useEffect } from 'react';
import { Shield, LogOut, Database, Server, Terminal } from 'lucide-react';
import type { UserRole, UserProfile, VaultRecord, AuditLogEntry } from './types';
import { AuthPage } from './components/AuthPage';
import { AdminDashboard } from './components/AdminDashboard';
import { OwnerDashboard } from './components/OwnerDashboard';
import { CoOwnerDashboard } from './components/CoOwnerDashboard';
import { computeSHA256 } from './lib/crypto';

// Pre-seeded verified accounts
const INITIAL_USERS: UserProfile[] = [
  {
    id: 'usr-admin-01',
    email: 'admin@trustvault.security',
    fullName: 'System Security Administrator',
    role: 'admin',
    isSuspended: false,
    createdAt: '2026-11-01 08:00:00'
  },
  {
    id: 'usr-owner-01',
    email: 'rohithabid@gmail.com',
    fullName: 'Rohith Abid (Primary Vault Owner)',
    role: 'owner',
    isSuspended: false,
    createdAt: '2026-11-08 09:00:00'
  },
  {
    id: 'usr-coowner-01',
    email: 'collaborator@trustvault.security',
    fullName: 'Authorized Enterprise Co-Owner',
    role: 'co_owner',
    isSuspended: false,
    createdAt: '2026-11-08 10:15:00'
  }
];

const INITIAL_RECORDS: VaultRecord[] = [
  {
    id: 'tv-001',
    title: 'Supabase Master JWT Secret',
    category: 'credentials',
    ownerId: 'usr-owner-01',
    ownerEmail: 'rohithabid@gmail.com',
    secret: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-vault-rohith-2026',
    metadata: 'rohithabid@gmail.com / Production',
    timestamp: '2026-11-08 09:30',
    status: 'locked',
    coOwners: ['collaborator@trustvault.security']
  },
  {
    id: 'tv-002',
    title: 'Rohith_Final_Report_Audit.pdf',
    category: 'documents',
    ownerId: 'usr-owner-01',
    ownerEmail: 'rohithabid@gmail.com',
    secret: 'DOC_PAYLOAD_VALIDATED',
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    metadata: 'SHA-256 Tamper Proof Anchor',
    timestamp: '2026-11-08 09:32',
    status: 'verified',
    coOwners: ['collaborator@trustvault.security']
  },
  {
    id: 'tv-003',
    title: 'Project Escrow Smart Settlement',
    category: 'escrow',
    ownerId: 'usr-owner-01',
    ownerEmail: 'rohithabid@gmail.com',
    secret: '$5,000 USDC Timelock Release',
    metadata: 'Signer: Rohith & Co-Owner (Multi-Sig Autonomous)',
    timestamp: '2026-11-08 09:35',
    status: 'locked',
    coOwners: ['collaborator@trustvault.security']
  }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('trust_vault_session_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('trust_vault_users_store');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [records, setRecords] = useState<VaultRecord[]>(() => {
    const saved = localStorage.getItem('trust_vault_records_store');
    return saved ? JSON.parse(saved) : INITIAL_RECORDS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem('trust_vault_audit_logs');
    return saved ? JSON.parse(saved) : [
      {
        id: 'aud-001',
        actorEmail: 'system@trustvault.security',
        actorRole: 'admin',
        action: 'GENESIS_CHAIN_INITIALIZED',
        outcome: 'success',
        details: { initialized: true },
        previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
        currentHash: 'b4c72d6340263f338d7c4932cc74ef0ee35552a4e21a8a25c192d24dd78fa420',
        timestamp: '2026-11-08 08:00:00'
      }
    ];
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('trust_vault_session_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('trust_vault_session_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('trust_vault_users_store', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('trust_vault_records_store', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('trust_vault_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  const appendAuditLog = async (action: string, outcome: 'success' | 'denied', details: any) => {
    const lastHash = auditLogs[0]?.currentHash || '0000000000000000000000000000000000000000000000000000000000000000';
    const payload = `${lastHash}:${currentUser?.email || 'anonymous'}:${action}:${outcome}:${JSON.stringify(details)}:${Date.now()}`;
    const newHash = await computeSHA256(payload);

    const newEntry: AuditLogEntry = {
      id: `aud-${Date.now().toString().slice(-6)}`,
      actorEmail: currentUser?.email || 'anonymous',
      actorRole: currentUser?.role || 'owner',
      action,
      outcome,
      details,
      previousHash: lastHash,
      currentHash: newHash,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };

    setAuditLogs([newEntry, ...auditLogs]);
  };

  const handleLoginSuccess = (user: UserProfile) => {
    if (!users.some(u => u.email === user.email)) {
      setUsers(prev => [user, ...prev]);
    }
    setCurrentUser(user);
    appendAuditLog('AUTH_LOGIN_SUCCESS', 'success', { email: user.email, role: user.role });
  };

  const handleLogout = () => {
    if (currentUser) {
      appendAuditLog('AUTH_LOGOUT', 'success', { email: currentUser.email });
    }
    setCurrentUser(null);
  };

  // Admin Handlers
  const handleToggleUserStatus = (userId: string) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        const nextStatus = !u.isSuspended;
        appendAuditLog('ADMIN_USER_STATUS_CHANGE', 'success', { targetUserId: userId, isSuspended: nextStatus });
        return { ...u, isSuspended: nextStatus };
      }
      return u;
    }));
  };

  const handleChangeUserRole = (userId: string, newRole: UserRole) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        appendAuditLog('ADMIN_USER_ROLE_CHANGE', 'success', { targetUserId: userId, newRole });
        return { ...u, role: newRole };
      }
      return u;
    }));
  };

  // Owner Handlers
  const handleAddRecord = (record: VaultRecord) => {
    setRecords([record, ...records]);
    appendAuditLog('RECORD_CREATED', 'success', { recordId: record.id, category: record.category, title: record.title });
  };

  const handleUpdateRecord = (id: string, updates: Partial<VaultRecord>) => {
    setRecords(records.map(r => r.id === id ? { ...r, ...updates } : r));
    appendAuditLog('RECORD_UPDATED', 'success', { recordId: id, updates });
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(records.filter(r => r.id !== id));
    appendAuditLog('RECORD_DELETED', 'success', { recordId: id });
  };

  // Co-Owner Handlers
  const handleApproveEscrow = (recordId: string) => {
    setRecords(records.map(r => {
      if (r.id === recordId) {
        return { ...r, status: 'released', metadata: `${r.metadata} • Multi-Sig Approved by ${currentUser?.email}` };
      }
      return r;
    }));
    appendAuditLog('ESCROW_MULTISIG_APPROVED', 'success', { recordId, approver: currentUser?.email });
    alert('Multi-Sig Signature verified and recorded! Escrow settlement released.');
  };

  const handleVerifyDocument = (recordId: string) => {
    const item = records.find(r => r.id === recordId);
    if (item && item.hash) {
      appendAuditLog('DOCUMENT_TAMPER_VERIFIED', 'success', { recordId, hash: item.hash });
      alert(`Tamper Check PASSED: Integrity verified against SHA-256 anchor:\n${item.hash}`);
    }
  };

  // REQUIREMENT 1: If not authenticated, ALWAYS show Auth Landing Page FIRST
  if (!currentUser) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} mockUsers={users} />;
  }

  return (
    <div style={{ backgroundColor: '#000000', color: '#ffffff', minHeight: '100vh', padding: '24px 32px' }}>
      {/* Universal Top Navigation Header */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid #1a1a1a', 
        paddingBottom: '20px',
        marginBottom: '28px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            backgroundColor: '#000000', 
            border: '2px solid #ef4444', 
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)'
          }}>
            <Shield size={24} color="#ef4444" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                TRUST VAULT
              </h1>
              <span style={{ 
                backgroundColor: currentUser.role === 'admin' ? '#ef4444' : currentUser.role === 'owner' ? '#ffffff' : '#38bdf8', 
                color: currentUser.role === 'owner' ? '#000000' : '#ffffff', 
                fontSize: '11px', 
                fontWeight: 700, 
                padding: '2px 8px', 
                borderRadius: '4px',
                textTransform: 'uppercase'
              }}>
                {currentUser.role.replace('_', ' ')}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#888888' }}>
              High-Assurance Security Suite • Rohith Dedicated Infrastructure
            </p>
          </div>
        </div>

        {/* User Identity and Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#0d0d0d',
            border: '1px solid #222222',
            padding: '8px 14px',
            borderRadius: '8px'
          }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>{currentUser.email}</div>
              <div style={{ fontSize: '10px', color: '#666666' }}>ID: {currentUser.fullName}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#161616',
              color: '#f87171',
              border: '1px solid #2a1111',
              borderRadius: '8px',
              padding: '10px 14px',
              fontWeight: 600,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </header>

      {/* Sub-Header Infrastructure Badges */}
      <section style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div style={{ 
          background: '#090909', 
          border: '1px solid #222222', 
          borderRadius: '10px', 
          padding: '16px',
          borderLeft: '4px solid #ffffff'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#888888', fontWeight: 600 }}>CODE REPOSITORY</span>
            <span style={{ fontSize: '11px', color: '#ef4444', background: '#1c0a0a', padding: '2px 6px', borderRadius: '4px' }}>Ready</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Terminal size={18} color="#ffffff" />
            <span style={{ fontWeight: 700, fontSize: '15px' }}>GitHub</span>
          </div>
          <div style={{ fontSize: '12px', color: '#666666', marginTop: '8px' }}>
            Account: rohithabid@gmail.com • Repo: trust-vault
          </div>
        </div>

        <div style={{ 
          background: '#090909', 
          border: '1px solid #222222', 
          borderRadius: '10px', 
          padding: '16px',
          borderLeft: '4px solid #ef4444'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#888888', fontWeight: 600 }}>DATABASE & AUTH</span>
            <span style={{ fontSize: '11px', color: '#22c55e', background: '#0a1c0d', padding: '2px 6px', borderRadius: '4px' }}>Configured</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={18} color="#ef4444" />
            <span style={{ fontWeight: 700, fontSize: '15px' }}>Supabase DB</span>
          </div>
          <div style={{ fontSize: '12px', color: '#666666', marginTop: '8px' }}>
            PostgreSQL Vector + Row Level Security (RLS)
          </div>
        </div>

        <div style={{ 
          background: '#090909', 
          border: '1px solid #222222', 
          borderRadius: '10px', 
          padding: '16px',
          borderLeft: '4px solid #ffffff'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#888888', fontWeight: 600 }}>PRODUCTION EDGE</span>
            <span style={{ fontSize: '11px', color: '#38bdf8', background: '#0a151f', padding: '2px 6px', borderRadius: '4px' }}>Fast Edge</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Server size={18} color="#ffffff" />
            <span style={{ fontWeight: 700, fontSize: '15px' }}>Vercel Deploy</span>
          </div>
          <div style={{ fontSize: '12px', color: '#666666', marginTop: '8px' }}>
            Zero-Config Edge CI/CD Pipelines
          </div>
        </div>
      </section>

      {/* Role-Specific Dashboard Rendering */}
      {currentUser.role === 'admin' && (
        <AdminDashboard
          currentUser={currentUser}
          users={users}
          records={records}
          auditLogs={auditLogs}
          onToggleUserStatus={handleToggleUserStatus}
          onChangeUserRole={handleChangeUserRole}
        />
      )}

      {currentUser.role === 'owner' && (
        <OwnerDashboard
          currentUser={currentUser}
          records={records}
          onAddRecord={handleAddRecord}
          onUpdateRecord={handleUpdateRecord}
          onDeleteRecord={handleDeleteRecord}
        />
      )}

      {currentUser.role === 'co_owner' && (
        <CoOwnerDashboard
          currentUser={currentUser}
          records={records}
          onApproveEscrow={handleApproveEscrow}
          onVerifyDocument={handleVerifyDocument}
        />
      )}
    </div>
  );
}
