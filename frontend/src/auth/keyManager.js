// keyManager.js - Minimal E2EE key management for StudyBuddy

const DB_NAME = 'studybuddy-e2ee';
const STORE_NAME = 'keys';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function setKey(name, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(value, name);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function ensureUserKeyPair(token) {
  // Check if private key exists
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const req = store.get('privateKey');
  const privateKeyJwk = await new Promise((resolve) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
  if (privateKeyJwk) return; // Already exists

  // Generate key pair
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );
  // Export and store keys
  const publicKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const privateKeyJwkStr = JSON.stringify(await window.crypto.subtle.exportKey('jwk', keyPair.privateKey));
  await setKey('privateKey', privateKeyJwkStr);
  // Upload public key to backend
  await fetch('/api/users/me/public-key', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ publicKey: JSON.stringify(publicKeyJwk) })
  });
} 