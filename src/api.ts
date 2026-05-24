import { PlayerokChat, PlayerokChatMessage, PlayerokDealFull, PlayerokProduct, PlayerokUser } from './types';

const API_BASE = '';
const TOKEN_KEY = 'playerok_auth_token';

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function headers() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  };
}

export async function fetchMe(): Promise<PlayerokUser | null> {
  const imported = localStorage.getItem('playerok_imported_viewer');
  if (imported) {
    try {
      const parsed = JSON.parse(imported);
      if (parsed) return parsed;
    } catch {}
  }
  try {
    const res = await fetch(`${API_BASE}/api/me`, { headers: headers() });
    const data = await res.json();
    return data?.data?.viewer || null;
  } catch {
    return null;
  }
}

export async function fetchChats(first = 20): Promise<PlayerokChat[]> {
  const imported = localStorage.getItem('playerok_imported_chats');
  if (imported) {
    try {
      const parsed = JSON.parse(imported);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  try {
    const res = await fetch(`${API_BASE}/api/chats?first=${first}`, { headers: headers() });
    const data = await res.json();
    return data?.data?.chats?.edges?.map((e: any) => e.node) || [];
  } catch {
    return [];
  }
}

export async function fetchChatMessages(chatId: string, first = 30): Promise<PlayerokChatMessage[]> {
  // If we have imported chats, check if there's any lastMessage or simulated message for this chatId
  try {
    const res = await fetch(`${API_BASE}/api/chats/${chatId}/messages?first=${first}`, { headers: headers() });
    const data = await res.json();
    return data?.data?.chatMessages?.edges?.map((e: any) => e.node) || [];
  } catch {
    return [];
  }
}

export async function sendMessage(chatId: string, text: string): Promise<PlayerokChatMessage | null> {
  try {
    const res = await fetch(`${API_BASE}/api/chats/${chatId}/send`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    return data?.data?.sendChatMessage || null;
  } catch {
    // If offline / imported mode, simulate local saved message to maintain conversational feel
    const viewerStr = localStorage.getItem('playerok_imported_viewer');
    const viewer = viewerStr ? JSON.parse(viewerStr) : null;
    return {
      id: `msg_local_${Date.now()}`,
      text: text,
      createdAt: new Date().toISOString(),
      user: {
        id: viewer?.id || 'usr_me',
        username: viewer?.username || 'Вы',
        avatar: viewer?.avatar || null
      }
    };
  }
}

export async function fetchDeals(first = 20, status?: string): Promise<PlayerokDealFull[]> {
  const imported = localStorage.getItem('playerok_imported_deals');
  if (imported) {
    try {
      const parsed = JSON.parse(imported);
      if (Array.isArray(parsed)) {
        if (status) {
          return parsed.filter(d => d.status?.toUpperCase() === status.toUpperCase());
        }
        return parsed;
      }
    } catch {}
  }
  try {
    const url = `${API_BASE}/api/deals?first=${first}${status ? `&status=${status}` : ''}`;
    const res = await fetch(url, { headers: headers() });
    const data = await res.json();
    return data?.data?.deals?.edges?.map((e: any) => e.node) || [];
  } catch {
    return [];
  }
}

export async function fetchProducts(first = 20): Promise<PlayerokProduct[]> {
  const imported = localStorage.getItem('playerok_imported_products');
  if (imported) {
    try {
      const parsed = JSON.parse(imported);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  try {
    const res = await fetch(`${API_BASE}/api/products?first=${first}`, { headers: headers() });
    const data = await res.json();
    return data?.data?.viewer?.products?.edges?.map((e: any) => e.node) || [];
  } catch {
    return [];
  }
}
