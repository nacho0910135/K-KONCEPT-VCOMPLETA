import { Image, Maximize2, MessageCircle, Mic, Minus, Send, Smile, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Button from '../common/Button.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { getChatMessages, getChatUsers, getUnreadChatMessages, sendChatMessage } from '../../services/chat.client.service.js';

const storageKey = 'kollab-open-chat-peers';
const emojis = ['👍', '🙏', '✅', '🙌', '🙂'];
const readStored = () => JSON.parse(localStorage.getItem(storageKey) || '[]');
const writeStored = (items) => localStorage.setItem(storageKey, JSON.stringify(items.slice(0, 3)));
const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});
const beep = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.frequency.value = 720;
  gain.gain.value = 0.04;
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start();
  setTimeout(() => { oscillator.stop(); ctx.close(); }, 140);
};

const ChatWindow = ({ peer, messages, unread, onClose, onMinimize, onSend }) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [full, setFull] = useState(false);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  const send = async (payload) => {
    await onSend(peer.id, payload);
    setText('');
  };

  const sendImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    await send({ attachmentUrl: await fileToDataUrl(file), attachmentType: 'IMAGE' });
  };

  const toggleRecord = async () => {
    if (recording) {
      mediaRef.current?.stop();
      setRecording(false);
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (event) => chunksRef.current.push(event.data);
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      await send({ attachmentUrl: await fileToDataUrl(blob), attachmentType: 'AUDIO' });
    };
    mediaRef.current = recorder;
    recorder.start();
    setRecording(true);
  };

  return (
    <div className={`${full ? 'fixed inset-6 w-auto rounded-lg' : 'w-80 rounded-t-lg'} overflow-hidden border border-[#722F37]/25 bg-white shadow-[0_24px_70px_rgba(36,12,18,0.35)]`}>
      <div className="flex items-center justify-between bg-[#722F37] px-3 py-2 text-white">
        <button className="flex min-w-0 items-center gap-2 text-left" type="button" onClick={onMinimize}>
          {peer.avatarUrl ? (
            <img className="h-9 w-9 rounded-full object-cover ring-2 ring-white/40" src={peer.avatarUrl} alt={peer.name} />
          ) : (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/20 text-sm font-bold ring-2 ring-white/30">{peer.name?.[0] || '?'}</span>
          )}
          <span className="min-w-0">
            <p className="truncate text-sm font-semibold">{peer.name}</p>
            <p className="text-xs opacity-80">{peer.online ? 'Online' : 'Disponible'}</p>
          </span>
        </button>
        <div className="flex items-center gap-1">
          {unread > 0 && <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-300" />}
          <button type="button" onClick={() => setFull((value) => !value)} aria-label="Maximizar"><Maximize2 className="h-4 w-4" /></button>
          <button type="button" onClick={onMinimize} aria-label="Minimizar"><Minus className="h-4 w-4" /></button>
          <button type="button" onClick={onClose} aria-label="Cerrar"><X className="h-4 w-4" /></button>
        </div>
      </div>
      <div className={`${full ? 'h-[calc(100vh-210px)]' : 'h-72'} space-y-2 overflow-y-auto bg-neutral-50 p-3`}>
        {messages.map((message) => {
          const mine = message.senderId === user?.id;
          return (
            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${mine ? 'bg-primary-600 text-white' : 'bg-white text-neutral-800 shadow-sm'}`}>
                {message.body && <p>{message.body}</p>}
                {message.attachmentType === 'IMAGE' && <img className="mt-1 max-h-36 rounded-md object-cover" src={message.attachmentUrl} alt="Adjunto" />}
                {message.attachmentType === 'AUDIO' && <audio className="mt-1 max-w-full" controls src={message.attachmentUrl} />}
                {mine && <p className="mt-1 text-right text-[10px] opacity-80">{message.readAt ? '✓✓' : '✓'}</p>}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-neutral-200 p-2">
        <div className="mb-2 flex gap-1">
          {emojis.map((emoji) => <button key={emoji} className="rounded px-1 hover:bg-neutral-100" type="button" onClick={() => setText((value) => `${value}${emoji}`)}>{emoji}</button>)}
        </div>
        <form className="flex items-center gap-1" onSubmit={(event) => { event.preventDefault(); if (text.trim()) send({ body: text.trim() }); }}>
          <input className="min-w-0 flex-1 rounded-md border border-neutral-200 px-2 py-2 text-sm outline-none focus:border-primary-500" value={text} onChange={(event) => setText(event.target.value)} placeholder="Escribe..." />
          <label className="grid h-9 w-9 cursor-pointer place-items-center rounded-md hover:bg-neutral-100" aria-label="Imagen">
            <Image className="h-4 w-4" />
            <input className="sr-only" type="file" accept="image/*" onChange={sendImage} />
          </label>
          <button className={`grid h-9 w-9 place-items-center rounded-md ${recording ? 'bg-[#722F37] text-white' : 'hover:bg-neutral-100'}`} type="button" onClick={toggleRecord} aria-label="Audio"><Mic className="h-4 w-4" /></button>
          <button className="grid h-9 w-9 place-items-center rounded-md bg-[#722F37] text-white shadow-sm hover:bg-[#642731]" type="submit" aria-label="Enviar"><Send className="h-4 w-4" /></button>
        </form>
      </div>
    </div>
  );
};

const EnterpriseChat = () => {
  const { user } = useAuth();
  const enabled = ['ADMIN', 'TECHNICIAN'].includes(user?.role);
  const [users, setUsers] = useState([]);
  const [openPeers, setOpenPeers] = useState([]);
  const [minimized, setMinimized] = useState({});
  const [messages, setMessages] = useState({});
  const [unread, setUnread] = useState({});
  const openPeersRef = useRef(openPeers);
  const unreadIdsRef = useRef(new Set());
  const minimizedRef = useRef(minimized);
  openPeersRef.current = openPeers;
  minimizedRef.current = minimized;

  useEffect(() => {
    if (!enabled) return undefined;
    const storedPeers = readStored();
    setOpenPeers(storedPeers);
    setMinimized(Object.fromEntries(storedPeers.map((id) => [id, true])));
    const refresh = async () => {
      const [nextUsers, unreadMessages] = await Promise.all([getChatUsers(), getUnreadChatMessages()]);
      setUsers(nextUsers);
      const unreadIds = new Set(unreadMessages.map((message) => message.id));
      const hasNewUnread = unreadMessages.some((message) => !unreadIdsRef.current.has(message.id));
      unreadIdsRef.current = unreadIds;
      const grouped = unreadMessages.reduce((acc, message) => ({ ...acc, [message.senderId]: (acc[message.senderId] || 0) + 1 }), {});
      if (unreadMessages.length) {
        const incomingIds = [...new Set(unreadMessages.map((message) => message.senderId))];
        setOpenPeers((peers) => {
          const next = [...incomingIds, ...peers.filter((id) => !incomingIds.includes(id))].slice(0, 3);
          writeStored(next);
          return next;
        });
        setMinimized((state) => ({ ...state, ...Object.fromEntries(incomingIds.map((id) => [id, true])) }));
        if (hasNewUnread) beep();
      }
      setUnread(grouped);
    };
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || openPeers.length === 0) return undefined;
    const load = async () => {
      const visiblePeers = openPeers.filter((id) => !minimizedRef.current[id]);
      const entries = await Promise.all(visiblePeers.map(async (id) => [id, await getChatMessages(id)]));
      setMessages(Object.fromEntries(entries));
      setUnread((state) => ({ ...state, ...Object.fromEntries(visiblePeers.map((id) => [id, 0])) }));
    };
    load();
    const timer = setInterval(load, 3000);
    return () => clearInterval(timer);
  }, [enabled, openPeers, minimized]);

  useEffect(() => { window.openEnterpriseChat = (id) => {
    setOpenPeers((peers) => {
      const next = [id, ...peers.filter((peerId) => peerId !== id)].slice(0, 3);
      writeStored(next);
      return next;
    });
    setMinimized((state) => ({ ...state, [id]: false }));
  }; return () => { delete window.openEnterpriseChat; }; }, []);

  const peers = useMemo(() => openPeers.map((id) => users.find((item) => item.id === id)).filter(Boolean), [openPeers, users]);
  if (!enabled || peers.length === 0) return null;

  const send = async (recipientId, payload) => {
    const message = await sendChatMessage({ recipientId, ...payload });
    setMessages((state) => ({ ...state, [recipientId]: [...(state[recipientId] || []), message] }));
  };

  return (
    <div className="fixed bottom-0 right-4 z-50 flex items-end gap-3">
      {peers.map((peer) => minimized[peer.id] ? (
        <button key={peer.id} className="relative mb-2 flex w-72 items-center gap-2 rounded-t-lg border border-[#722F37]/20 bg-[#f8f4f4] px-4 py-3 text-sm font-semibold text-[#722F37] shadow-[0_18px_45px_rgba(36,12,18,0.35)] ring-1 ring-white/60 transition hover:-translate-y-0.5 hover:bg-white" type="button" onClick={() => setMinimized((state) => ({ ...state, [peer.id]: false }))}>
          {peer.avatarUrl ? <img className="h-7 w-7 rounded-full object-cover ring-2 ring-white" src={peer.avatarUrl} alt={peer.name} /> : <span className="grid h-7 w-7 place-items-center rounded-full bg-[#722F37] text-xs text-white">{peer.name?.[0] || '?'}</span>}
          <span className="min-w-0 flex-1 truncate">{peer.name}</span>
          {(unread[peer.id] || 0) > 0 && (
            <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white ring-2 ring-white">
              {unread[peer.id]}
            </span>
          )}
        </button>
      ) : (
        <ChatWindow
          key={peer.id}
          peer={peer}
          messages={messages[peer.id] || []}
          unread={unread[peer.id] || 0}
          onSend={send}
          onMinimize={() => setMinimized((state) => ({ ...state, [peer.id]: true }))}
          onClose={() => setOpenPeers((items) => {
            const next = items.filter((id) => id !== peer.id);
            writeStored(next);
            return next;
          })}
        />
      ))}
    </div>
  );
};

export default EnterpriseChat;
