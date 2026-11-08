import React, { useState, useEffect } from 'react';
import { 
  Shield, Plus, Trash2, Eye, EyeOff, 
  Copy, Check, Terminal,
  User, Database, Server
} from 'lucide-react';

interface VaultItem {
  id: string;
  title: string;
  category: 'credentials' | 'documents' | 'escrow';
  secret: string;
  hash?: string;
  metadata?: string;
  timestamp: string;
  status: 'locked' | 'verified' | 'released';
}

const INITIAL_ITEMS: VaultItem[] = [
  {
    id: 'tv-001',
    title: 'Supabase Master JWT Secret',
    category: 'credentials',
    secret: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-vault-rohith-2026',
    metadata: 'rohithabid@gmail.com / Production',
    timestamp: '2026-11-08 09:30',
    status: 'locked'
  },
  {
    id: 'tv-002',
    title: 'Rohith_Final_Report_Audit.pdf',
    category: 'documents',
    secret: 'DOC_PAYLOAD_VALIDATED',
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    metadata: 'SHA-256 Tamper Proof Anchor',
    timestamp: '2026-11-08 09:32',
    status: 'verified'
  },
  {
    id: 'tv-003',
    title: 'Project Escrow Smart Settlement',
    category: 'escrow',
    secret: '$5,000 USDC Timelock Release',
    metadata: 'Signer: Rohith & Snuhith (2-of-2 Multi-Sig)',
    timestamp: '2026-11-08 09:35',
    status: 'locked'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'all' | 'credentials' | 'documents' | 'escrow'>('all');
  const [items, setItems] = useState<VaultItem[]>(() => {
    const saved = localStorage.getItem('trust_vault_items');
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'credentials' | 'documents' | 'escrow'>('credentials');
  const [newSecret, setNewSecret] = useState('');
  const [newMeta, setNewMeta] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    localStorage.setItem('trust_vault_items', JSON.stringify(items));
  }, [items]);

  const toggleVisibility = (id: string) => {
    setVisibleSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSecret) return;

    let hashVal = undefined;
    if (newCategory === 'documents') {
      hashVal = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0')).join('') + '...sha256';
    }

    const newItem: VaultItem = {
      id: `tv-${Date.now().toString().slice(-4)}`,
      title: newTitle,
      category: newCategory,
      secret: newSecret,
      hash: hashVal,
      metadata: newMeta || 'Owner: Rohith',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: newCategory === 'escrow' ? 'locked' : 'verified'
    };

    setItems([newItem, ...items]);
    setNewTitle('');
    setNewSecret('');
    setNewMeta('');
    setShowAddForm(false);
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const unlockEscrow = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, status: 'released' } : item));
  };

  const filteredItems = activeTab === 'all' 
    ? items 
    : items.filter(item => item.category === activeTab);

  return (
    <div style={{ backgroundColor: '#000000', color: '#ffffff', minHeight: '100vh', padding: '24px 32px' }}>
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
                backgroundColor: '#ef4444', 
                color: '#ffffff', 
                fontSize: '11px', 
                fontWeight: 700, 
                padding: '2px 8px', 
                borderRadius: '4px',
                textTransform: 'uppercase'
              }}>
                v1.0 Core
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#888888' }}>
              High-Assurance Security Suite • Rohith & Snuhith Joint Infrastructure
            </p>
          </div>
        </div>

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
            <User size={16} color="#ef4444" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>rohithabid@gmail.com</div>
              <div style={{ fontSize: '10px', color: '#666666' }}>Role: Vault Co-Owner</div>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Plus size={16} /> New Asset Lock
          </button>
        </div>
      </header>

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

      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        borderBottom: '1px solid #1a1a1a', 
        paddingBottom: '12px', 
        marginBottom: '20px' 
      }}>
        {[
          { key: 'all', label: 'All Vault Records', count: items.length },
          { key: 'credentials', label: 'Secrets & Passwords', count: items.filter(i => i.category === 'credentials').length },
          { key: 'documents', label: 'Document Tamper-Proof', count: items.filter(i => i.category === 'documents').length },
          { key: 'escrow', label: 'Trust Escrow Multi-Sig', count: items.filter(i => i.category === 'escrow').length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              background: activeTab === tab.key ? '#ef4444' : '#0d0d0d',
              color: activeTab === tab.key ? '#ffffff' : '#888888',
              border: activeTab === tab.key ? '1px solid #ef4444' : '1px solid #1f1f1f',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {tab.label}
            <span style={{ 
              background: activeTab === tab.key ? 'rgba(0,0,0,0.3)' : '#222222', 
              padding: '2px 6px', 
              borderRadius: '4px',
              fontSize: '11px' 
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredItems.map(item => (
          <div 
            key={item.id}
            style={{
              background: '#0a0a0a',
              border: '1px solid #1c1c1c',
              borderRadius: '8px',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderLeft: item.category === 'credentials' ? '4px solid #ffffff' : item.category === 'documents' ? '4px solid #ef4444' : '4px solid #dc2626'
            }}
          >
            <div style={{ maxWidth: '65%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ 
                  textTransform: 'uppercase', 
                  fontSize: '10px', 
                  fontWeight: 700, 
                  letterSpacing: '0.5px',
                  background: '#161616',
                  color: item.category === 'documents' ? '#ef4444' : '#ffffff',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  {item.category}
                </span>
                <span style={{ fontSize: '11px', color: '#555555' }}>ID: {item.id}</span>
                <span style={{ fontSize: '11px', color: '#555555' }}>• {item.timestamp}</span>
              </div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 600 }}>{item.title}</h3>
              <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#777777' }}>{item.metadata}</p>

              <div style={{ 
                background: '#000000', 
                border: '1px solid #1a1a1a', 
                borderRadius: '6px', 
                padding: '8px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                fontFamily: 'monospace',
                fontSize: '13px'
              }}>
                <span style={{ color: visibleSecrets[item.id] ? '#ffffff' : '#666666' }}>
                  {visibleSecrets[item.id] ? item.secret : '••••••••••••••••••••••••••••••••'}
                </span>
                <button
                  onClick={() => toggleVisibility(item.id)}
                  style={{ background: 'transparent', border: 'none', color: '#888888', padding: 0 }}
                  title={visibleSecrets[item.id] ? "Hide" : "Show"}
                >
                  {visibleSecrets[item.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  onClick={() => copyToClipboard(item.secret, item.id)}
                  style={{ background: 'transparent', border: 'none', color: '#888888', padding: 0 }}
                  title="Copy"
                >
                  {copiedId === item.id ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                </button>
              </div>

              {item.hash && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#555555', fontFamily: 'monospace' }}>
                  Hash: {item.hash}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ 
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background: item.status === 'verified' || item.status === 'released' ? '#0b2612' : '#260a0a',
                  color: item.status === 'verified' || item.status === 'released' ? '#22c55e' : '#ef4444',
                  border: `1px solid ${item.status === 'verified' || item.status === 'released' ? '#166534' : '#991b1b'}`
                }}>
                  {item.status}
                </span>
              </div>

              {item.category === 'escrow' && item.status === 'locked' && (
                <button
                  onClick={() => unlockEscrow(item.id)}
                  style={{
                    background: '#111111',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  Release Escrow
                </button>
              )}

              <button
                onClick={() => deleteItem(item.id)}
                style={{
                  background: 'transparent',
                  border: '1px solid #222222',
                  color: '#555555',
                  padding: '8px',
                  borderRadius: '6px',
                }}
                title="Purge Entry"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <form 
            onSubmit={handleAddItem}
            style={{
              background: '#0a0a0a',
              border: '1px solid #222222',
              borderRadius: '12px',
              padding: '28px',
              width: '460px',
              maxWidth: '90%'
            }}
          >
            <h2 style={{ margin: '0 0 18px 0', fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
              Create Secure Asset Record
            </h2>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#888888', marginBottom: '6px' }}>Vault Category</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as any)}
                style={{
                  width: '100%',
                  background: '#000000',
                  border: '1px solid #222222',
                  borderRadius: '6px',
                  padding: '10px',
                  color: '#ffffff',
                  fontSize: '13px'
                }}
              >
                <option value="credentials">Secrets & Passwords</option>
                <option value="documents">Document Verification (Tamper Proof)</option>
                <option value="escrow">Trust Escrow Multi-Sig</option>
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#888888', marginBottom: '6px' }}>Asset Title</label>
              <input
                type="text"
                placeholder="e.g. Master DB Key / Academic Audit"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: '#000000',
                  border: '1px solid #222222',
                  borderRadius: '6px',
                  padding: '10px',
                  color: '#ffffff',
                  fontSize: '13px'
                }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#888888', marginBottom: '6px' }}>Secret / Content / Amount</label>
              <input
                type="text"
                placeholder="Secure string, key, or token payload"
                value={newSecret}
                onChange={e => setNewSecret(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: '#000000',
                  border: '1px solid #222222',
                  borderRadius: '6px',
                  padding: '10px',
                  color: '#ffffff',
                  fontSize: '13px'
                }}
              />
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#888888', marginBottom: '6px' }}>Metadata / Beneficiary</label>
              <input
                type="text"
                placeholder="e.g. Assigned to rohithabid@gmail.com"
                value={newMeta}
                onChange={e => setNewMeta(e.target.value)}
                style={{
                  width: '100%',
                  background: '#000000',
                  border: '1px solid #222222',
                  borderRadius: '6px',
                  padding: '10px',
                  color: '#ffffff',
                  fontSize: '13px'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                style={{
                  background: '#161616',
                  color: '#888888',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '13px'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: 700
                }}
              >
                Lock Asset
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
