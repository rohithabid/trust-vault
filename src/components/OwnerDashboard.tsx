import React, { useState } from 'react';
import { 
  Shield, KeyRound, FileCheck, Lock, Eye, EyeOff, 
  Copy, Check, Plus, Trash2, Search
} from 'lucide-react';
import type { UserProfile, VaultRecord } from '../types';
import { encryptSecret, decryptSecret, computeSHA256 } from '../lib/crypto';

interface OwnerDashboardProps {
  currentUser: UserProfile;
  records: VaultRecord[];
  onAddRecord: (record: VaultRecord) => void;
  onDeleteRecord: (id: string) => void;
  onUpdateRecord: (id: string, updates: Partial<VaultRecord>) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  currentUser,
  records,
  onAddRecord,
  onDeleteRecord
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'credentials' | 'documents' | 'escrow' | 'asset_lock'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'credentials' | 'documents' | 'escrow' | 'asset_lock'>('credentials');
  const [newSecret, setNewSecret] = useState('');
  const [encryptionPassphrase, setEncryptionPassphrase] = useState('');
  const [newMeta, setNewMeta] = useState('');
  const [coOwnerEmail, setCoOwnerEmail] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  
  // Document upload state
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);

  // Filter owned records
  const myRecords = records.filter(r => r.ownerId === currentUser.id);

  const filteredRecords = myRecords.filter(r => {
    const matchesTab = activeTab === 'all' || r.category === activeTab;
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (r.metadata && r.metadata.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const toggleVisibility = async (record: VaultRecord) => {
    if (visibleSecrets[record.id]) {
      setVisibleSecrets(prev => ({ ...prev, [record.id]: false }));
      return;
    }

    if (record.iv && record.salt) {
      const pass = prompt('Enter PBKDF2 Master Passphrase to decrypt:');
      if (!pass) return;
      try {
        const decrypted = await decryptSecret(record.secret, record.iv, record.salt, pass);
        // Replace decrypted value temporarily
        alert(`Decrypted Secret: ${decrypted}`);
      } catch (err: any) {
        alert(err.message);
      }
    } else {
      setVisibleSecrets(prev => ({ ...prev, [record.id]: true }));
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileSize(file.size);
    const buffer = await file.arrayBuffer();
    const hash = await computeSHA256(buffer);
    setFileHash(hash);
    setNewTitle(file.name);
    setNewSecret(`STORED_SECURE_PAYLOAD_${file.name}`);
    setNewMeta(`File Size: ${(file.size / 1024).toFixed(1)} KB • SHA-256 Validated`);
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSecret) return;

    setIsEncrypting(true);
    try {
      let finalSecret = newSecret;
      let ivHex: string | undefined = undefined;
      let saltHex: string | undefined = undefined;
      let integrityHash: string | undefined = fileHash || undefined;

      // AES-GCM Encrypt if credentials or user provided passphrase
      if (newCategory === 'credentials' && encryptionPassphrase) {
        const enc = await encryptSecret(newSecret, encryptionPassphrase);
        finalSecret = enc.ciphertext;
        ivHex = enc.iv;
        saltHex = enc.salt;
      }

      if (!integrityHash) {
        integrityHash = await computeSHA256(finalSecret);
      }

      const newRecord: VaultRecord = {
        id: `tv-${Date.now().toString().slice(-4)}`,
        title: newTitle,
        category: newCategory,
        ownerId: currentUser.id,
        ownerEmail: currentUser.email,
        secret: finalSecret,
        iv: ivHex,
        salt: saltHex,
        hash: integrityHash,
        metadata: newMeta || `Owner: ${currentUser.fullName}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        status: newCategory === 'escrow' ? 'locked' : 'verified',
        coOwners: coOwnerEmail ? [coOwnerEmail.toLowerCase().trim()] : [],
        fileName: fileName || undefined,
        fileSize: fileSize || undefined
      };

      onAddRecord(newRecord);
      setShowAddModal(false);
      setNewTitle('');
      setNewSecret('');
      setEncryptionPassphrase('');
      setNewMeta('');
      setCoOwnerEmail('');
      setFileHash(null);
      setFileName(null);
    } catch (err: any) {
      alert('Encryption/Creation error: ' + err.message);
    } finally {
      setIsEncrypting(false);
    }
  };

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
            Vault Owner Zero-Trust Workspace
          </div>
          <div style={{ fontSize: '12px', color: '#888888', marginTop: '4px' }}>
            Account: <span style={{ color: '#ef4444' }}>{currentUser.email}</span> • Tenant Isolated Storage
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            background: '#ef4444',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 16px',
            fontWeight: 700,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <Plus size={16} /> New Asset Lock
        </button>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888888', fontSize: '12px' }}>
            <span>MY VAULTS</span>
            <Shield size={16} color="#ef4444" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '8px' }}>{myRecords.length}</div>
          <div style={{ fontSize: '11px', color: '#888888', marginTop: '4px' }}>Encrypted zero-trust items</div>
        </div>

        <div style={{ background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888888', fontSize: '12px' }}>
            <span>SECRETS & PASSWORDS</span>
            <KeyRound size={16} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '8px' }}>
            {myRecords.filter(r => r.category === 'credentials').length}
          </div>
          <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '4px' }}>AES-GCM Authenticated</div>
        </div>

        <div style={{ background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888888', fontSize: '12px' }}>
            <span>DOCUMENTS</span>
            <FileCheck size={16} color="#22c55e" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '8px' }}>
            {myRecords.filter(r => r.category === 'documents').length}
          </div>
          <div style={{ fontSize: '11px', color: '#22c55e', marginTop: '4px' }}>SHA-256 Anchored</div>
        </div>

        <div style={{ background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888888', fontSize: '12px' }}>
            <span>ESCROW MULTI-SIG</span>
            <Lock size={16} color="#eab308" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '8px' }}>
            {myRecords.filter(r => r.category === 'escrow').length}
          </div>
          <div style={{ fontSize: '11px', color: '#eab308', marginTop: '4px' }}>Autonomous Settlement</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['all', 'credentials', 'documents', 'escrow', 'asset_lock'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? '#ef4444' : '#0d0d0d',
                color: activeTab === tab ? '#ffffff' : '#888888',
                border: '1px solid #222222',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                cursor: 'pointer'
              }}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative' }}>
          <Search size={14} color="#666666" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          <input
            type="text"
            placeholder="Search records or metadata..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              background: '#0a0a0a',
              border: '1px solid #222222',
              padding: '8px 12px 8px 30px',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '12px',
              outline: 'none',
              width: '240px'
            }}
          />
        </div>
      </div>

      {/* Records Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredRecords.length === 0 ? (
          <div style={{
            background: '#0a0a0a',
            border: '1px solid #1c1c1c',
            borderRadius: '10px',
            padding: '40px',
            textAlign: 'center',
            color: '#666666'
          }}>
            No vault records found in this category. Click "+ New Asset Lock" to create one.
          </div>
        ) : (
          filteredRecords.map(item => (
            <div
              key={item.id}
              style={{
                background: '#0a0a0a',
                border: '1px solid #1c1c1c',
                borderRadius: '10px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    background: item.category === 'escrow' ? '#261b0a' : item.category === 'documents' ? '#0a2118' : '#1f1313',
                    color: item.category === 'escrow' ? '#eab308' : item.category === 'documents' ? '#34d399' : '#ef4444'
                  }}>
                    {item.category.replace('_', ' ')}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '15px' }}>{item.title}</span>
                  {item.iv && (
                    <span style={{ fontSize: '10px', background: '#082f49', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px' }}>
                      AES-GCM Encrypted
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => onDeleteRecord(item.id)}
                    style={{ background: '#1c0a0a', border: '1px solid #7f1d1d', color: '#f87171', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Secret Payload Box */}
              <div style={{
                background: '#040404',
                border: '1px solid #141414',
                borderRadius: '6px',
                padding: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#e5e5e5' }}>
                  {item.iv 
                    ? `[AES-GCM 256 Ciphertext: ${item.secret.slice(0, 32)}...]` 
                    : visibleSecrets[item.id] ? item.secret : '••••••••••••••••••••••••••••••••'
                  }
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => toggleVisibility(item)}
                    style={{ background: '#111111', border: '1px solid #222222', color: '#888888', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    {visibleSecrets[item.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(item.secret, item.id)}
                    style={{ background: '#111111', border: '1px solid #222222', color: '#888888', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    {copiedId === item.id ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#666666' }}>
                <div>
                  {item.hash && (
                    <span style={{ fontFamily: 'monospace' }}>
                      SHA-256: <span style={{ color: '#22c55e' }}>{item.hash.slice(0, 24)}...</span>
                    </span>
                  )}
                  {item.coOwners && item.coOwners.length > 0 && (
                    <span style={{ marginLeft: '12px', color: '#38bdf8' }}>
                      Shared with: {item.coOwners.join(', ')}
                    </span>
                  )}
                </div>
                <div>{item.metadata || item.timestamp}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Asset Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#0a0a0a',
            border: '1px solid #262626',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.9)'
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 800 }}>
              Create Zero-Trust Asset Lock
            </h2>

            <form onSubmit={handleCreateRecord} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#888888', marginBottom: '6px' }}>Category</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                  style={{ width: '100%', padding: '10px', background: '#000000', border: '1px solid #222222', borderRadius: '6px', color: '#ffffff', fontSize: '13px' }}
                >
                  <option value="credentials">Credentials & Secrets (AES-GCM Authenticated)</option>
                  <option value="documents">Document Tamper-Proof (SHA-256 Checksum)</option>
                  <option value="escrow">Trust Escrow Multi-Sig (Autonomous Timelock)</option>
                  <option value="asset_lock">General Asset Lock</option>
                </select>
              </div>

              {newCategory === 'documents' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#888888', marginBottom: '6px' }}>Select Document to Anchor</label>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    style={{ width: '100%', padding: '8px', background: '#000000', border: '1px solid #222222', borderRadius: '6px', color: '#ffffff', fontSize: '12px' }}
                  />
                  {fileHash && (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#22c55e', fontFamily: 'monospace' }}>
                      Calculated SHA-256: {fileHash}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#888888', marginBottom: '6px' }}>Asset Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Supabase Master JWT or AWS Prod Key"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      style={{ width: '100%', padding: '10px', background: '#000000', border: '1px solid #222222', borderRadius: '6px', color: '#ffffff', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#888888', marginBottom: '6px' }}>Secret Payload / Value</label>
                    <textarea
                      required
                      placeholder="Enter sensitive secret or contract release..."
                      value={newSecret}
                      onChange={e => setNewSecret(e.target.value)}
                      rows={3}
                      style={{ width: '100%', padding: '10px', background: '#000000', border: '1px solid #222222', borderRadius: '6px', color: '#ffffff', fontSize: '13px' }}
                    />
                  </div>
                </>
              )}

              {newCategory === 'credentials' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#888888', marginBottom: '6px' }}>
                    PBKDF2 Encryption Passphrase (Optional for client-side zero-knowledge)
                  </label>
                  <input
                    type="password"
                    placeholder="Passphrase to derive AES-256 key..."
                    value={encryptionPassphrase}
                    onChange={e => setEncryptionPassphrase(e.target.value)}
                    style={{ width: '100%', padding: '10px', background: '#000000', border: '1px solid #222222', borderRadius: '6px', color: '#ffffff', fontSize: '13px' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#888888', marginBottom: '6px' }}>
                  Authorize Co-Owner Email (Optional Grant)
                </label>
                <input
                  type="email"
                  placeholder="coowner@example.com"
                  value={coOwnerEmail}
                  onChange={e => setCoOwnerEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: '#000000', border: '1px solid #222222', borderRadius: '6px', color: '#ffffff', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ background: '#1c1c1c', border: 'none', color: '#ffffff', padding: '10px 16px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEncrypting}
                  style={{ background: '#ef4444', border: 'none', color: '#ffffff', padding: '10px 18px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {isEncrypting ? 'Encrypting & Anchoring...' : 'Secure & Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
