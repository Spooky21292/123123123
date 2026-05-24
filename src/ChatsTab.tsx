import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, ArrowLeft, User, Circle, ShieldCheck, ExternalLink, ShoppingBag } from 'lucide-react';
import { PlayerokChat, PlayerokChatMessage } from './types';
import { fetchChats, fetchChatMessages, sendMessage } from './api';

interface ChatsTabProps {
  viewer?: {
    id: string;
    username: string;
    avatar?: { url: string } | null;
  } | null;
}

export default function ChatsTab({ viewer }: ChatsTabProps) {
  const sellerUsername = viewer?.username || 'Spooky21291';
  const [chats, setChats] = useState<PlayerokChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<PlayerokChat | null>(null);
  const [messages, setMessages] = useState<PlayerokChatMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChats();
    const interval = setInterval(loadChatsSilent, 10000); // refresh chats silent every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChats = async () => {
    setLoading(true);
    const data = await fetchChats();
    setChats(data);
    setLoading(false);
  };

  const loadChatsSilent = async () => {
    const data = await fetchChats();
    setChats(data);
  };

  const openChat = async (chat: PlayerokChat) => {
    setSelectedChat(chat);
    setMsgLoading(true);
    const msgs = await fetchChatMessages(chat.id);
    setMessages(msgs.reverse());
    setMsgLoading(false);
  };

  const handleSend = async () => {
    if (!newMsg.trim() || !selectedChat || sending) return;
    setSending(true);
    const textToSend = newMsg.trim();
    setNewMsg(''); // Clear input early for rapid typing feel
    
    // Optimistic message update
    const tempMsg: PlayerokChatMessage = {
      id: `optimistic_${Date.now()}`,
      text: textToSend,
      createdAt: new Date().toISOString(),
      user: {
        id: viewer?.id || 'usr_777',
        username: sellerUsername,
        avatar: viewer?.avatar || { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' }
      }
    };
    setMessages(prev => [...prev, tempMsg]);

    const sent = await sendMessage(selectedChat.id, textToSend);
    if (sent) {
      // Replace optimistic message with actual server message
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? sent : m));
      // Refresh chats thread list to capture actual state change
      loadChatsSilent();
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getOtherMember = (chat: PlayerokChat) => {
    return chat.members?.find(m => m.username !== sellerUsername) || chat.members?.[0];
  };

  // Filter threads by search query
  const filteredChats = chats.filter(c => {
    const other = getOtherMember(c);
    const searchLow = searchQuery.toLowerCase();
    return (
      (other?.username || '').toLowerCase().includes(searchLow) ||
      (c.deal?.product?.name || '').toLowerCase().includes(searchLow) ||
      (c.lastMessage?.text || '').toLowerCase().includes(searchLow)
    );
  });

  return (
    <div className="flex bg-white dark:bg-[#11110f] border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden h-[calc(100vh-170px)] shadow-md">
      
      {/* 1. THREAD LIST SECTION (Left Column) */}
      <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 bg-white dark:bg-[#141412] border-r border-slate-200 dark:border-zinc-800 flex-col overflow-hidden flex-shrink-0`}>
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800/80">
          <input
            type="text"
            placeholder="Поиск чатов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#1a1a16] border border-slate-200 dark:border-zinc-800 rounded-lg text-sm outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-550 transition-colors"
          />
        </div>
        
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-850/60">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">Загрузка диалогов...</div>
          ) : filteredChats.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <MessageCircle className="w-8 h-8 mx-auto stroke-1 text-slate-300 dark:text-zinc-700 mb-2" />
              <p className="text-xs font-medium">Диалоги не найдены</p>
            </div>
          ) : (
            filteredChats.map(chat => {
              const other = getOtherMember(chat);
              const isActive = selectedChat?.id === chat.id;
              return (
                <button
                  key={chat.id}
                  onClick={() => openChat(chat)}
                  className={`w-full flex items-center gap-3 px-4 py-3 cursor-pointer text-left transition-all ${
                    isActive 
                      ? 'bg-blue-50/70 dark:bg-blue-950/20 border-l-4 border-l-blue-600' 
                      : 'hover:bg-slate-50/75 dark:hover:bg-[#1e1e1a]/40 bg-white dark:bg-[#141412]'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    {other?.avatar?.url ? (
                      <img src={other.avatar.url} className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-zinc-800" alt="" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                    {other?.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#141412]" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className={`text-sm font-bold truncate block ${isActive ? 'text-blue-950 dark:text-blue-300' : 'text-slate-800 dark:text-zinc-100'}`}>
                        {other?.username || 'Пользователь'}
                      </span>
                      {chat.lastMessage && (
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono flex-shrink-0">
                          {new Date(chat.lastMessage.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    
                    {chat.lastMessage && (
                      <p className={`text-xs truncate ${chat.unreadMessagesCount > 0 ? 'text-blue-650 dark:text-blue-450 font-semibold' : 'text-slate-500 dark:text-zinc-450'}`}>
                        {chat.lastMessage.text}
                      </p>
                    )}
                    
                    {chat.deal?.product && (
                      <span className="text-[10px] text-blue-600/80 dark:text-blue-400/80 truncate block mt-1 font-medium bg-blue-50 dark:bg-blue-950/20 px-1.5 py-0.5 rounded w-max">
                        {chat.deal.product.name}
                      </span>
                    )}
                  </div>

                  {chat.unreadMessagesCount > 0 && (
                    <span className="flex-shrink-0 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                      {chat.unreadMessagesCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. CHAT PANEL (Center Column) */}
      <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-slate-50 dark:bg-[#11110f] overflow-hidden`}>
        {selectedChat ? (
          <>
            {/* Header top row of conversation channel */}
            <div className="p-4 bg-white dark:bg-[#141412] border-b border-slate-200 dark:border-zinc-800 flex items-center gap-3">
              <button 
                onClick={() => setSelectedChat(null)} 
                className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-850 text-slate-500 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="w-10 h-10 rounded-full bg-blue-105 flex-shrink-0 flex items-center justify-center font-bold text-blue-650 dark:text-blue-300 bg-blue-100/40 relative">
                {getOtherMember(selectedChat)?.avatar?.url ? (
                  <img src={getOtherMember(selectedChat)?.avatar?.url} className="w-10 h-10 rounded-full object-cover" alt="" />
                ) : (
                  getOtherMember(selectedChat)?.username?.substring(0, 1).toUpperCase() || 'A'
                )}
                {getOtherMember(selectedChat)?.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#141412]" />
                )}
              </div>
              
              <div>
                <div className="font-bold text-sm text-slate-800 dark:text-zinc-100">{getOtherMember(selectedChat)?.username || 'Пользователь'}</div>
                <div className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${getOtherMember(selectedChat)?.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {getOtherMember(selectedChat)?.isOnline ? 'В сети' : 'Не в сети'}
                </div>
              </div>

              {/* Verified status or other small decor badge */}
              <div className="ml-auto flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-zinc-550 border border-slate-200 dark:border-zinc-800 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  Сделка защищена
                </span>
              </div>
            </div>

            {/* Message streams area container */}
            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
              {msgLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-slate-400 text-xs font-semibold">Загрузка сообщений беседы...</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                  <MessageCircle className="w-10 h-10 stroke-1 text-slate-350 mb-2" />
                  <p className="text-xs font-medium">Нет сообщений. Отправьте приветствие, чтобы начать беседу.</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.user?.username === sellerUsername;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`shadow-xs p-3 rounded-2xl max-w-sm md:max-w-md ${
                        isMe 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-white dark:bg-[#1a1a16] border border-slate-200/50 dark:border-zinc-800/60 text-slate-900 dark:text-zinc-100 rounded-tl-none'
                      }`}>
                        <p className="text-xs md:text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                      </div>
                      <span className="text-[9px] text-slate-400 dark:text-zinc-500 mt-1.5 px-1 font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area of active window */}
            <div className="p-4 bg-white dark:bg-[#141412] border-t border-slate-200 dark:border-zinc-800 flex items-center gap-2">
              <input
                type="text"
                placeholder="Напишите сообщение..."
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-[#1a1a16] text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none border border-slate-200 dark:border-zinc-800 rounded-lg focus:border-blue-300 dark:focus:border-blue-900 transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={!newMsg.trim() || sending}
                className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-40 shadow-xs cursor-pointer transition-colors flex-shrink-0"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <MessageCircle className="w-14 h-14 stroke-1 text-slate-300 dark:text-zinc-800 mb-3" />
            <span className="font-bold text-sm text-slate-700 dark:text-zinc-300">Выберите диалог</span>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Выберите чат из левой панели с активным покупателем, чтобы посмотреть историю беседы и предложить выдачу.
            </p>
          </div>
        )}
      </div>

      {/* 3. ORDER SIDEBAR INFO (Right Column) */}
      <div className="hidden lg:flex w-72 bg-white dark:bg-[#141412] border-l border-slate-200 dark:border-zinc-800 p-5 flex-col flex-shrink-0 justify-between overflow-y-auto">
        <div>
          <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-wider mb-4">Связанный заказ</h3>
          {selectedChat?.deal ? (
            <div className="bg-slate-50 dark:bg-[#1a1a16] rounded-xl p-4 border border-blue-100 dark:border-blue-950/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full translate-x-4 -translate-y-4 pointer-events-none" />
              
              <div className={`text-[10px] px-2 py-0.5 rounded-full w-max font-bold mb-2.5 tracking-wide ${
                selectedChat.deal.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400' :
                selectedChat.deal.status === 'PAID' ? 'bg-blue-105 text-blue-750 bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-400' :
                'bg-zinc-100 text-zinc-650 dark:bg-zinc-805 dark:text-zinc-400'
              }`}>
                {selectedChat.deal.status === 'COMPLETED' ? 'ОПЛАЧЕНО' :
                 selectedChat.deal.status === 'PAID' ? 'ОПЛАЧЕНО' : selectedChat.deal.status}
              </div>

              <div className="font-bold text-sm text-slate-900 dark:text-zinc-100 mb-1 leading-snug line-clamp-2">
                {selectedChat.deal.product?.name || 'Игровой Товар'}
              </div>

              <div className="text-blue-600 dark:text-blue-400 font-bold text-base mt-2 mb-4 font-mono">
                {selectedChat.deal.totalPrice ? `${selectedChat.deal.totalPrice.toLocaleString('ru-RU')} ₽` : 'Договорная'}
              </div>

              <div className="space-y-2 border-t border-slate-200/50 dark:border-zinc-800/80 pt-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">ID Сделки:</span>
                  <span className="font-mono text-slate-800 dark:text-zinc-100">#{selectedChat.deal.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Платформа:</span>
                  <span className="text-slate-900 dark:text-zinc-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    Playerok
                  </span>
                </div>
              </div>

              {selectedChat.deal.product?.slug && (
                <a
                  href={`https://playerok.com/products/${selectedChat.deal.product.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Перейти к заказу
                </a>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-[#1a1a16] rounded-xl p-6 border-2 border-dashed border-slate-200 dark:border-zinc-800/60 text-center text-slate-400">
              <ShoppingBag className="w-8 h-8 stroke-1 text-slate-350 dark:text-zinc-750 mx-auto mb-2" />
              <p className="text-xs font-medium">Нет активной сделки в диалоге</p>
            </div>
          )}
        </div>

        {/* Supplementary tips panel */}
        <div className="mt-6 border-t border-slate-100 dark:border-zinc-805 pt-4 text-[11px] text-slate-400 space-y-2">
          <p className="font-bold text-slate-500 dark:text-zinc-450">💡 Правила безопасной выдачи:</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Никогда не выдавайте данные до статуса "Оплачено".</li>
            <li>Делайте скриншоты момента передачи товара.</li>
            <li>Просите подтвердить и оставить отзыв!</li>
          </ul>
        </div>
      </div>
      
    </div>
  );
}
