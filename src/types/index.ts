export type UserRole = 'admin' | 'owner' | 'co_owner';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isSuspended: boolean;
  createdAt: string;
}

export interface VaultRecord {
  id: string;
  title: string;
  category: 'credentials' | 'documents' | 'escrow' | 'asset_lock';
  ownerId: string;
  ownerEmail: string;
  secret: string;
  iv?: string; // For AES-GCM encrypted payloads
  salt?: string;
  hash?: string; // SHA-256 integrity hash
  metadata?: string;
  timestamp: string;
  status: 'locked' | 'verified' | 'released';
  coOwners?: string[]; // user emails or ids permitted
  fileSize?: number;
  fileName?: string;
  storagePath?: string;
  escrowAmount?: string;
  escrowSigners?: { email: string; approved: boolean; approvedAt?: string }[];
  escrowThreshold?: number;
}

export interface AuditLogEntry {
  id: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  targetId?: string;
  outcome: 'success' | 'denied';
  details: Record<string, any>;
  previousHash: string;
  currentHash: string;
  timestamp: string;
}
