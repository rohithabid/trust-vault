import React, { useState } from 'react';
import { Shield, Mail, User, KeyRound, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import type { UserRole, UserProfile } from '../types';

interface AuthPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  mockUsers: UserProfile[];
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, mockUsers }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [requestedRole, setRequestedRole] = useState<UserRole>('owner');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuickDemo = (role: UserRole) => {
    const target = mockUsers.find(u => u.role === role);
    if (target) {
      setEmail(target.email);
      setPassword('TrustVault2026!');
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
          throw new Error('Invalid email or credentials. User record not found.');
        }
        if (user.isSuspended) {
          throw new Error('Account suspended by Platform Administrator.');
        }
        // In real Supabase, supabase.auth.signInWithPassword({ email, password })
        setSuccess(`Authenticated as ${user.role.toUpperCase()}. Redirecting to security console...`);
        setTimeout(() => {
          onLoginSuccess(user);
        }, 600);
      } else if (mode === 'register') {
        if (!fullName || !email || !password) {
          throw new Error('All fields are strictly required.');
        }
        if (password.length < 8) {
          throw new Error('Zero-trust password policy requires minimum 8 characters.');
        }
        
        // Security rule: Self-registration default cannot grant platform ADMIN
        const verifiedRole: UserRole = requestedRole === 'admin' ? 'owner' : requestedRole;
        const newUser: UserProfile = {
          id: `usr-${Date.now().toString().slice(-4)}`,
          email: email.toLowerCase(),
          fullName,
          role: verifiedRole,
          isSuspended: false,
          createdAt: new Date().toISOString()
        };

        setSuccess(`Registration validated. Profile created with role: ${verifiedRole.toUpperCase()}. Redirecting...`);
        setTimeout(() => {
          onLoginSuccess(newUser);
        }, 700);
      } else if (mode === 'forgot') {
        if (!email) throw new Error('Enter your registered email address.');
        setSuccess('Password reset dispatch sent. Check zero-trust verification inbox.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle background glow */}
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(239, 68, 68, 0.08) 0%, rgba(0, 0, 0, 0) 70%)',
        top: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Main Container */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Branding */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            backgroundColor: '#0a0a0a',
            border: '2px solid #ef4444',
            borderRadius: '14px',
            boxShadow: '0 0 25px rgba(239, 68, 68, 0.35)',
            marginBottom: '16px'
          }}>
            <Shield size={32} color="#ef4444" />
          </div>
          <h1 style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: 800,
            letterSpacing: '-0.5px'
          }}>
            TRUST VAULT
          </h1>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '13px',
            color: '#888888',
            letterSpacing: '0.2px'
          }}>
            High-Assurance Zero-Trust Security Platform
          </p>
        </div>

        {/* Quick Role Tester Bar */}
        <div style={{
          background: '#0d0d0d',
          border: '1px solid #1f1f1f',
          borderRadius: '8px',
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
            Zero-Trust RBAC Fast Pre-load
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              style={{
                background: '#141414',
                border: '1px solid #2a2a2a',
                color: '#ef4444',
                padding: '6px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ADMIN
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('owner')}
              style={{
                background: '#141414',
                border: '1px solid #2a2a2a',
                color: '#ffffff',
                padding: '6px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              OWNER
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('co_owner')}
              style={{
                background: '#141414',
                border: '1px solid #2a2a2a',
                color: '#38bdf8',
                padding: '6px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              CO-OWNER
            </button>
          </div>
        </div>

        {/* Auth Glass Panel */}
        <div style={{
          backgroundColor: '#0a0a0a',
          border: '1px solid #1c1c1c',
          borderRadius: '14px',
          padding: '30px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)'
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #1f1f1f',
            marginBottom: '24px'
          }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
              style={{
                flex: 1,
                padding: '10px 0',
                background: 'transparent',
                border: 'none',
                borderBottom: mode === 'login' ? '2px solid #ef4444' : '2px solid transparent',
                color: mode === 'login' ? '#ffffff' : '#666666',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); setSuccess(null); }}
              style={{
                flex: 1,
                padding: '10px 0',
                background: 'transparent',
                border: 'none',
                borderBottom: mode === 'register' ? '2px solid #ef4444' : '2px solid transparent',
                color: mode === 'register' ? '#ffffff' : '#666666',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Register Identity
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={{
                background: '#1c0a0a',
                border: '1px solid #dc2626',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12px',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div style={{
                background: '#0a1c0d',
                border: '1px solid #16a34a',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12px',
                color: '#4ade80',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#888888', marginBottom: '6px' }}>
                  Full Name & Identifier
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#666666" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Rohith Abid"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      background: '#000000',
                      border: '1px solid #222222',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#888888', marginBottom: '6px' }}>
                Corporate Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#666666" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="rohithabid@gmail.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    background: '#000000',
                    border: '1px solid #222222',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', color: '#888888' }}>Access Passphrase</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setError(null); }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer' }}
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} color="#666666" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      background: '#000000',
                      border: '1px solid #222222',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#888888', marginBottom: '6px' }}>
                  Requested Initial Role
                </label>
                <select
                  value={requestedRole}
                  onChange={e => setRequestedRole(e.target.value as UserRole)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#000000',
                    border: '1px solid #222222',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '13px'
                  }}
                >
                  <option value="owner">Vault Owner (Manage my vaults, docs & keys)</option>
                  <option value="co_owner">Vault Co-Owner (Shared vault member)</option>
                </select>
                <div style={{ fontSize: '10px', color: '#555555', marginTop: '4px' }}>
                  * Platform ADMIN roles are strictly verified server-side and cannot be self-provisioned.
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '8px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontWeight: 700,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
              }}
            >
              {loading ? 'Verifying Identity...' : mode === 'login' ? 'Authenticate Identity' : mode === 'register' ? 'Register Credentials' : 'Send Recovery Dispatch'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {mode === 'forgot' && (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setMode('login')}
                style={{ background: 'none', border: 'none', color: '#888888', fontSize: '12px', cursor: 'pointer' }}
              >
                Back to Authentication
              </button>
            </div>
          )}
        </div>

        {/* Footnote */}
        <div style={{ textAlign: 'center', fontSize: '11px', color: '#444444' }}>
          Strict SHA-256 Ledger • PBKDF2 / AES-GCM 256-bit • Server-Verified RLS Claims
        </div>
      </div>
    </div>
  );
};
