import React, { useState } from 'react';
import { 
  ShieldCheck, FileText, CheckCircle2, Eye, EyeOff, 
  Copy, Check, Clock, UserCheck
} from 'lucide-react';
import type { UserProfile, VaultRecord } from '../types';

interface CoOwnerDashboardProps {
  currentUser: UserProfile;
  records: VaultRecord[];
  onApproveEscrow: (recordId: string) => void;
  onVerifyDocument: (recordId: string) => void;
}

export const CoOwnerDashboard: React.FC<CoOwnerDashboardProps> = ({
  currentUser,
  records,
  onApproveEscrow,
  onVerifyDocument
}) => {
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Zero-trust filter: Only show records where currentUser is authorized or explicitly in coOwners list
  const permittedRecords = records.filter(r => 
    r.ownerId === currentUser.id || 
    (r.coOwners && r.coOwners.includes(currentUser.email.toLowerCase()))
  );

  const toggleVisibility = (id: string) => {
    setVisibleSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{
        background: '#0a0d14',
        border: '1px solid #1e293b',
        borderLeft: '4px solid #38bdf8',
        borderRadius: '10px',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
            Vault Co-Owner Authorized Portal
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            Logged in as Co-Owner: <span style={{ color: '#38bdf8' }}>{currentUser.email}</span> • Zero-Trust RLS Active
          </div>
        </div>
        <div style={{
          background: '#082f49',
          border: '1px solid #0369a1',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: 700,
          color: '#38bdf8'
        }}>
          AUTHORIZED COLLABORATOR
        </div>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div style={{ background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888888', fontSize: '12px' }}>
            <span>PERMITTED RECORDS</span>
            <ShieldCheck size={16} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '8px' }}>{permittedRecords.length}</div>
          <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '4px' }}>
            Explicitly granted by Vault Owners
          </div>
        </div>

        <div style={{ background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888888', fontSize: '12px' }}>
            <span>PENDING MULTI-SIG</span>
            <Clock size={16} color="#eab308" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '8px' }}>
            {permittedRecords.filter(r => r.category === 'escrow' && r.status === 'locked').length}
          </div>
          <div style={{ fontSize: '11px', color: '#eab308', marginTop: '4px' }}>
            Requires Co-Owner Signature
          </div>
        </div>

        <div style={{ background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888888', fontSize: '12px' }}>
            <span>VERIFIED DOCS</span>
            <FileText size={16} color="#22c55e" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '8px' }}>
            {permittedRecords.filter(r => r.category === 'documents' && r.status === 'verified').length}
          </div>
          <div style={{ fontSize: '11px', color: '#22c55e', marginTop: '4px' }}>
            SHA-256 Tamper Checked
          </div>
        </div>
      </div>

      {/* Shared Records List */}
      <div style={{
        background: '#0a0a0a',
        border: '1px solid #1c1c1c',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Authorized Shared Vault Items</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#888888' }}>
            You can view credentials, verify document integrity hashes, and sign multi-sig escrow settlements.
          </p>
        </div>

        {permittedRecords.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#666666', fontSize: '13px' }}>
            No vault records have been shared with your identity yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {permittedRecords.map(item => (
              <div key={item.id} style={{
                background: '#050505',
                border: '1px solid #1a1a1a',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      background: item.category === 'escrow' ? '#261b0a' : item.category === 'documents' ? '#0a2118' : '#1a1a1a',
                      color: item.category === 'escrow' ? '#eab308' : item.category === 'documents' ? '#34d399' : '#ffffff'
                    }}>
                      {item.category}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>{item.title}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#666666' }}>
                    Owner: <span style={{ color: '#ffffff' }}>{item.ownerEmail}</span>
                  </div>
                </div>

                <div style={{
                  background: '#000000',
                  border: '1px solid #171717',
                  borderRadius: '6px',
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                    {visibleSecrets[item.id] ? item.secret : '••••••••••••••••••••••••••••••••'}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => toggleVisibility(item.id)}
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

                {item.hash && (
                  <div style={{ fontSize: '11px', color: '#666666', fontFamily: 'monospace' }}>
                    SHA-256 Hash: <span style={{ color: '#38bdf8' }}>{item.hash}</span>
                  </div>
                )}

                {/* Co-Owner Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  {item.category === 'documents' && (
                    <button
                      onClick={() => onVerifyDocument(item.id)}
                      style={{
                        background: '#064e3b',
                        border: '1px solid #059669',
                        color: '#6ee7b7',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <CheckCircle2 size={14} /> Verify SHA-256 Checksum
                    </button>
                  )}

                  {item.category === 'escrow' && item.status === 'locked' && (
                    <button
                      onClick={() => onApproveEscrow(item.id)}
                      style={{
                        background: '#713f12',
                        border: '1px solid #ca8a04',
                        color: '#fef08a',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <UserCheck size={14} /> Sign Multi-Sig Approval
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
