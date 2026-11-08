// Production-grade Web Cryptography API implementation
// Authenticated AES-GCM 256-bit encryption + PBKDF2 key derivation & SHA-256 integrity

export async function computeSHA256(data: ArrayBuffer | Uint8Array | string): Promise<string> {
  let source: any;
  if (typeof data === 'string') {
    source = new TextEncoder().encode(data);
  } else {
    source = data;
  }
  const hashBuffer = await crypto.subtle.digest('SHA-256', source);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptSecret(plaintext: string, secretKeyPass: string): Promise<{
  ciphertext: string;
  iv: string;
  salt: string;
}> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(secretKeyPass, salt);
  
  const encoded = new TextEncoder().encode(plaintext);
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as any },
    key,
    encoded
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(cipherBuffer))),
    iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
    salt: Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
  };
}

export async function decryptSecret(
  ciphertextB64: string,
  ivHex: string,
  saltHex: string,
  secretKeyPass: string
): Promise<string> {
  try {
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const key = await deriveKey(secretKeyPass, salt);
    
    const binary = atob(ciphertextB64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as any },
      key,
      bytes
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    throw new Error('Authentication/Decryption tag verification failed. Invalid key or tampered ciphertext.');
  }
}
