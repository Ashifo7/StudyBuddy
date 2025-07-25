import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// --- Utility Functions ---

// AES key generation
async function generateAESKey() {
  return window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// AES encryption
async function encryptWithAESKey(key, plainText) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plainText);
  const cipher = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  return { cipher: btoa(String.fromCharCode(...new Uint8Array(cipher))), iv: btoa(String.fromCharCode(...iv)) };
}

// AES decryption
async function decryptWithAESKey(key, cipherB64, ivB64) {
  const cipher = Uint8Array.from(atob(cipherB64), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
  const plain = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    cipher
  );
  return new TextDecoder().decode(plain);
}

// RSA encryption (JWK public key)
async function encryptAESKeyWithRSA(jwkPub, aesKey) {
  const pubKey = await window.crypto.subtle.importKey(
    'jwk',
    JSON.parse(jwkPub),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['encrypt']
  );
  const rawAES = await window.crypto.subtle.exportKey('raw', aesKey);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    pubKey,
    rawAES
  );
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

// RSA decryption (JWK private key)
async function decryptAESKeyWithRSA(jwkPriv, encryptedB64) {
  const privKey = await window.crypto.subtle.importKey(
    'jwk',
    JSON.parse(jwkPriv),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['decrypt']
  );
  const encrypted = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));
  const rawAES = await window.crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privKey,
    encrypted
  );
  return await window.crypto.subtle.importKey(
    'raw',
    rawAES,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
}

// IndexedDB helpers for private key
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
async function getPrivateKeyJwk() {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get('privateKey');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

// --- Main Matches Component ---
export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [receiverPublicKey, setReceiverPublicKey] = useState(null);
  const [privateKeyJwk, setPrivateKeyJwk] = useState(null);
  const [chatThreads, setChatThreads] = useState({});
  const selectedMatchRef = useRef(null);
  const socketRef = useRef(null);
  const userIdRef = useRef(null);
  
  useEffect(() => {
    selectedMatchRef.current = selectedMatch;
  }, [selectedMatch]);
  
  // Connect to socket.io
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    // Log all socket events for debugging
    socket.on((event, ...args) => {
      console.log('Socket event:', event, args);
    });

    // Emit user_online after connecting
    socket.on('connect', () => {
      const myId = userIdRef.current;
      if (myId) {
        console.log('Emitting user_online:', myId);
        socket.emit('user_online', myId);
      }
    });

    socket.on('receive_e2e_message', async (msg) => {
      const myId = userIdRef.current;
      let encryptedAES = null;
      if (String(msg.receiverId) === String(myId)) encryptedAES = msg.aesKeyForReceiver;
      else if (String(msg.senderId) === String(myId)) encryptedAES = msg.aesKeyForSender;
      const privJwk = privateKeyJwk || await getPrivateKeyJwk();
      if (!encryptedAES || !privJwk) return;
      try {
        const aesKey = await decryptAESKeyWithRSA(privJwk, encryptedAES);
        const text = await decryptWithAESKey(aesKey, msg.encryptedMessage, msg.iv);
        const finalMsg = { ...msg, content: text };
        // Update all threads
        setChatThreads(prev => {
          const current = prev[msg.matchId] || [];
          return { ...prev, [msg.matchId]: [...current, finalMsg] };
        });
        // If current match is open, also update UI
        if (selectedMatchRef.current && selectedMatchRef.current._id === msg.matchId) {
          console.log('Appending to chatMessages for open chat:', msg.matchId, finalMsg);
          setChatMessages(prev => [...prev, finalMsg]);
        } else {
          console.log('Message received for another chat:', msg.matchId, finalMsg);
        }
      } catch (err) {
        console.error('Decryption failed:', err);
      }
    });
    return () => socket.disconnect();
  }, [privateKeyJwk]);

  useEffect(() => {
    const socket = socketRef.current;
    const myId = userIdRef.current;
    if (socket && socket.connected && myId) {
      console.log('Emitting user_online (effect):', myId);
      socket.emit('user_online', myId);
    }
  }, [privateKeyJwk, matches]);

  // Fetch matches and user info
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    fetch(`${API_URL}/api/messages/matches`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(async data => {
        if (data.success && Array.isArray(data.matches)) {
          const userId = JSON.parse(atob(token.split('.')[1])).id;
          userIdRef.current = userId;
          const userRes = await fetch(`${API_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
          const userData = await userRes.json();
          let usersById = {};
          if (userData.success && Array.isArray(userData.users)) {
            userData.users.forEach(u => { usersById[u._id] = u; });
          }
          const matchesWithUser = data.matches.map(m => {
            const otherId = m.userA === userId ? m.userB : m.userA;
            return { ...m, user: usersById[otherId] };
          }).filter(m => m.user);
          setMatches(matchesWithUser);
        } else {
          setMessage(data.error || 'Could not fetch matches');
        }
        setLoading(false);
      })
      .catch(() => {
        setMessage('Could not fetch matches');
        setLoading(false);
      });
    getPrivateKeyJwk().then(setPrivateKeyJwk);
  }, []);

  // Update openChat to use chatThreads if available
  const openChat = async (match) => {
    setSelectedMatch(match);
    setChatInput('');
    setMessage('');
    if (chatThreads[match._id]) {
      setChatMessages(chatThreads[match._id]);
      return;
    }
    const token = localStorage.getItem('token');
    // Fetch E2EE messages
    const msgsRes = await fetch(`${API_URL}/api/e2e/messages/${match._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const msgsData = await msgsRes.json();
    if (!msgsData.success) {
      setMessage('Could not fetch messages');
      return;
    }
    // Fetch receiver's public key
    const otherUserId = match.user._id;
    const userRes = await fetch(`${API_URL}/api/users/${otherUserId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const userData = await userRes.json();
    if (userData.success && userData.user && userData.user.publicKey) {
      setReceiverPublicKey(userData.user.publicKey);
    } else {
      setMessage('Recipient has no public key');
      return;
    }
    // Decrypt all messages
    const privJwk = privateKeyJwk || await getPrivateKeyJwk();
    const myId = userIdRef.current;
    const decryptedMsgs = await Promise.all(
      (msgsData.messages || []).map(async (msg) => {
        let encryptedAES = null;
        if (String(msg.receiverId) === String(myId)) encryptedAES = msg.aesKeyForReceiver;
        else if (String(msg.senderId) === String(myId)) encryptedAES = msg.aesKeyForSender;
        if (!encryptedAES) return { ...msg, content: '[Cannot decrypt]' };
        try {
          const aesKey = await decryptAESKeyWithRSA(privJwk, encryptedAES);
          const text = await decryptWithAESKey(aesKey, msg.encryptedMessage, msg.iv);
          return { ...msg, content: text };
        } catch {
          return { ...msg, content: '[Cannot decrypt]' };
        }
      })
    );
    setChatMessages(decryptedMsgs);
    setChatThreads(prev => ({ ...prev, [match._id]: decryptedMsgs }));
  };

  // Send a message
  const sendMessage = async () => {
    if (!chatInput.trim() || !selectedMatch || !receiverPublicKey) return;
    const privJwk = privateKeyJwk || await getPrivateKeyJwk();
    const token = localStorage.getItem('token');
    // Fetch sender's public key (from backend)
    const myId = userIdRef.current;
    const myUserRes = await fetch(`${API_URL}/api/users/${myId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const myUserData = await myUserRes.json();
    if (!myUserData.success || !myUserData.user || !myUserData.user.publicKey) {
      setMessage('Your public key is missing');
      return;
    }
    // 1. Generate AES key
    const aesKey = await generateAESKey();
    // 2. Encrypt message with AES key
    const { cipher, iv } = await encryptWithAESKey(aesKey, chatInput);
    // 3. Encrypt AES key for both users
    const aesKeyForSender = await encryptAESKeyWithRSA(myUserData.user.publicKey, aesKey);
    const aesKeyForReceiver = await encryptAESKeyWithRSA(receiverPublicKey, aesKey);
    // 4. Emit via socket.io
    const payload = {
      matchId: selectedMatch._id,
      senderId: myId,
      receiverId: selectedMatch.user._id,
      encryptedMessage: cipher,
      aesKeyForSender,
      aesKeyForReceiver,
      iv
    };
    console.log('Emitting send_e2e_message:', payload);
    socketRef.current.emit('send_e2e_message', payload);
    // 5. Optimistically add to chat
    setChatMessages((prev) => [...prev, {
      senderId: myId,
      receiverId: selectedMatch.user._id,
      content: chatInput,
      timestamp: new Date().toISOString()
    }]);
    setChatInput('');
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 24, border: '1px solid #eee', borderRadius: 8, background: '#fafbfc', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24, fontWeight: 400 }}>Your Matches</h2>
      {loading ? (
        <div style={{ textAlign: 'center', marginTop: 40 }}>Loading matches...</div>
      ) : matches.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#888', fontSize: 18, marginTop: 60 }}>No matches yet.</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: 0 }}>
          {matches.map(m => (
            <div key={m._id} style={{ display: 'flex', alignItems: 'center', padding: '16px 12px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => openChat(m)}>
              <img src={m.user.profilePic || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(m.user.name)} alt="Profile" style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover', marginRight: 16, border: '2px solid #007bff' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 18 }}>{m.user.name}</div>
                <div style={{ color: '#888', fontSize: 14 }}>Last message: <span style={{ color: '#bbb' }}>(coming soon)</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedMatch && (
        <div style={{ marginTop: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <img src={selectedMatch.user.profilePic || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(selectedMatch.user.name)} alt="Profile" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', marginRight: 12, border: '2px solid #007bff' }} />
            <div style={{ fontWeight: 500, fontSize: 17 }}>{selectedMatch.user.name}</div>
            <button onClick={() => setSelectedMatch(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#888', fontSize: 20, cursor: 'pointer' }}>&times;</button>
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto', marginBottom: 12, border: '1px solid #eee', borderRadius: 6, padding: 8, background: '#f9f9f9' }}>
            {chatMessages.length === 0 ? <div style={{ color: '#bbb', textAlign: 'center' }}>No messages yet.</div> : chatMessages.map((m, i) => (
              <div key={m._id || i} style={{ marginBottom: 10, textAlign: m.senderId === selectedMatch.user._id ? 'left' : 'right' }}>
                <div style={{ display: 'inline-block', background: m.senderId === selectedMatch.user._id ? '#e6f0ff' : '#d1ffd6', color: '#222', borderRadius: 8, padding: '7px 13px', fontSize: 15, maxWidth: 260, wordBreak: 'break-word' }}>{m.content}</div>
              </div>
            ))}
          </div>
          <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message..." style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc' }} onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }} />
          <button onClick={sendMessage} style={{ padding: '8px 18px', borderRadius: 6, background: '#007bff', color: '#fff', border: 'none', fontWeight: 500, cursor: 'pointer' }} disabled={!chatInput.trim()}>Send</button>
        </div>
      )}
      {message && <div style={{ marginTop: 16, color: 'red', textAlign: 'center' }}>{message}</div>}
    </div>
  );
} 