import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// Stateful Mock Fallback Database
interface MockUser {
  id: string;
  username: string;
  email: string;
  balance: number;
  avatar: { url: string };
  role: string;
  isOnline: boolean;
}

interface MockChatMessage {
  id: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatar: { url: string } | null;
  };
  file?: { url: string; name: string } | null;
}

interface MockDeal {
  id: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  completedAt?: string;
  buyer: {
    id: string;
    username: string;
    avatar: { url: string } | null;
  };
  seller: { id: string; username: string };
  product: {
    id: string;
    name: string;
    slug: string;
    images?: { url: string }[];
  };
}

interface MockProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  status: string;
  category: { id: string; name: string };
  images: { url: string }[];
  dealsCount: number;
  viewsCount: number;
  createdAt: string;
}

interface MockChat {
  id: string;
  unreadMessagesCount: number;
  lastMessage: MockChatMessage | null;
  members: {
    id: string;
    username: string;
    avatar: { url: string } | null;
    isOnline?: boolean;
  }[];
  deal: {
    id: string;
    status: string;
    product: {
      id: string;
      name: string;
      slug: string;
    };
  } | null;
}

// In-Memory Instances
const mockUser: MockUser = {
  id: 'usr_777',
  username: 'Spooky21291',
  email: 'spooky21291@gmail.com',
  balance: 24850,
  avatar: { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
  role: 'seller',
  isOnline: true
};

const mockProducts: MockProduct[] = [
  {
    id: 'prod_1',
    name: 'PUBG Mobile UC 325 (Global)',
    slug: 'pubg-mobile-uc-325-global',
    price: 450,
    status: 'ACTIVE',
    category: { id: 'cat_1', name: 'Игровые товары' },
    images: [{ url: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&w=120&q=80' }],
    dealsCount: 42,
    viewsCount: 1205,
    createdAt: '25.04.2026'
  },
  {
    id: 'prod_2',
    name: 'Telegram Premium 1 месяц (Подарком)',
    slug: 'telegram-premium-1m',
    price: 290,
    status: 'ACTIVE',
    category: { id: 'cat_2', name: 'Telegram' },
    images: [{ url: 'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?auto=format&fit=crop&w=120&q=80' }],
    dealsCount: 158,
    viewsCount: 4210,
    createdAt: '18.05.2026'
  },
  {
    id: 'prod_3',
    name: 'Steam Gift Card 10 USD (США)',
    slug: 'steam-gift-card-10-usd',
    price: 980,
    status: 'ACTIVE',
    category: { id: 'cat_3', name: 'Steam' },
    images: [{ url: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=120&q=80' }],
    dealsCount: 19,
    viewsCount: 350,
    createdAt: '22.05.2026'
  }
];

const mockDeals: MockDeal[] = [
  {
    id: 'deal_101',
    status: 'COMPLETED',
    totalPrice: 450,
    createdAt: '2026-05-23T11:20:00Z',
    completedAt: '2026-05-23T11:45:00Z',
    buyer: {
      id: 'buyer_1',
      username: 'Ivan_Gamin',
      avatar: { url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' }
    },
    seller: { id: 'usr_777', username: 'Spooky21291' },
    product: {
      id: 'prod_1',
      name: 'PUBG Mobile UC 325 (Global)',
      slug: 'pubg-mobile-uc-325-global',
      images: [{ url: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&w=120&q=80' }]
    }
  },
  {
    id: 'deal_102',
    status: 'PAID',
    totalPrice: 290,
    createdAt: '2026-05-24T09:12:00Z',
    buyer: {
      id: 'buyer_2',
      username: 'Sanya2009',
      avatar: { url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80' }
    },
    seller: { id: 'usr_777', username: 'Spooky21291' },
    product: {
      id: 'prod_2',
      name: 'Telegram Premium 1 месяц (Подарком)',
      slug: 'telegram-premium-1m',
      images: [{ url: 'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?auto=format&fit=crop&w=120&q=80' }]
    }
  }
];

const mockChats: MockChat[] = [
  {
    id: 'chat_1',
    unreadMessagesCount: 1,
    lastMessage: {
      id: 'msg_1_2',
      text: 'Здравствуйте! Я оплатил Telegram Premium, когда будет выдача?',
      createdAt: '2026-05-24T09:13:00Z',
      user: {
        id: 'buyer_2',
        username: 'Sanya2009',
        avatar: { url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80' }
      }
    },
    members: [
      {
        id: 'buyer_2',
        username: 'Sanya2009',
        avatar: { url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80' },
        isOnline: true
      },
      {
        id: 'usr_777',
        username: 'Spooky21291',
        avatar: { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' }
      }
    ],
    deal: {
      id: 'deal_102',
      status: 'PAID',
      product: {
        id: 'prod_2',
        name: 'Telegram Premium 1 месяц (Подарком)',
        slug: 'telegram-premium-1m'
      }
    }
  },
  {
    id: 'chat_2',
    unreadMessagesCount: 0,
    lastMessage: {
      id: 'msg_2_2',
      text: 'Спасибо большое, всё пришло быстро!',
      createdAt: '2026-05-23T11:46:00Z',
      user: {
        id: 'buyer_1',
        username: 'Ivan_Gamin',
        avatar: { url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' }
      }
    },
    members: [
      {
        id: 'buyer_1',
        username: 'Ivan_Gamin',
        avatar: { url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' },
        isOnline: false
      },
      {
        id: 'usr_777',
        username: 'Spooky21291',
        avatar: { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' }
      }
    ],
    deal: {
      id: 'deal_101',
      status: 'COMPLETED',
      product: {
        id: 'prod_1',
        name: 'PUBG Mobile UC 325 (Global)',
        slug: 'pubg-mobile-uc-325-global'
      }
    }
  }
];

const mockMessagesDb: Record<string, MockChatMessage[]> = {
  chat_1: [
    {
      id: 'msg_1_1',
      text: 'Добрый день!',
      createdAt: '2026-05-24T09:12:30Z',
      user: {
        id: 'buyer_2',
        username: 'Sanya2009',
        avatar: { url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80' }
      }
    },
    {
      id: 'msg_1_2',
      text: 'Здравствуйте! Я оплатил Telegram Premium, когда будет выдача?',
      createdAt: '2026-05-24T09:13:00Z',
      user: {
        id: 'buyer_2',
        username: 'Sanya2009',
        avatar: { url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80' }
      }
    }
  ],
  chat_2: [
    {
      id: 'msg_2_1',
      text: 'Ваш код активации: 6813-9021-V9. Хорошей игры!',
      createdAt: '2026-05-23T11:42:00Z',
      user: {
        id: 'usr_777',
        username: 'Spooky21291',
        avatar: { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' }
      }
    },
    {
      id: 'msg_2_2',
      text: 'Спасибо большое, всё пришло быстро!',
      createdAt: '2026-05-23T11:46:00Z',
      user: {
        id: 'buyer_1',
        username: 'Ivan_Gamin',
        avatar: { url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' }
      }
    }
  ]
};

// Playerok GraphQL Proxy Helper
async function queryPlayerokAPI(token: string, query: string, variables: any = {}) {
  const cleanToken = token.replace('Bearer ', '').trim();
  const response = await fetch('https://playerok.com/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cleanToken}`,
      'Cookie': `token=${cleanToken}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      'Origin': 'https://playerok.com',
      'Referer': 'https://playerok.com/',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Playerok API failed with status ${response.status}`);
  }

  return response.json();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Middleware to detect if we should use Mock fallback
  const isMockToken = (authHeader: string | undefined): boolean => {
    if (!authHeader) return true;
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token || token.length < 15 || token === 'mock_token_placeholder' || token === 'test_token') {
      return true;
    }
    return false;
  };

  // --- API ROUTE: Get Profile (me) ---
  app.get('/api/me', async (req, res) => {
    const auth = req.headers.authorization;
    if (isMockToken(auth)) {
      return res.json({ data: { viewer: mockUser } });
    }

    try {
      const q = `
        query GetViewer {
          viewer {
            id
            username
            email
            balance
            avatar {
              url
            }
            role
            isOnline
          }
        }
      `;
      const result = await queryPlayerokAPI(auth!, q);
      res.json(result);
    } catch (err: any) {
      console.warn('Playerok Proxy Me Failed, falling back to Mock:', err.message);
      res.json({ data: { viewer: mockUser } });
    }
  });

  // --- API ROUTE: Get Chats ---
  app.get('/api/chats', async (req, res) => {
    const auth = req.headers.authorization;
    if (isMockToken(auth)) {
      return res.json({
        data: {
          chats: {
            edges: mockChats.map(node => ({ node }))
          }
        }
      });
    }

    try {
      const q = `
        query GetChats($first: Int) {
          chats(first: $first) {
            edges {
              node {
                id
                unreadMessagesCount
                lastMessage {
                  id
                  text
                  createdAt
                  user {
                    id
                    username
                    avatar {
                      url
                    }
                  }
                }
                members {
                  id
                  username
                  avatar {
                    url
                  }
                  isOnline
                }
                deal {
                  id
                  status
                  product {
                    id
                    name
                    slug
                  }
                }
              }
            }
          }
        }
      `;
      const first = Number(req.query.first) || 20;
      const result = await queryPlayerokAPI(auth!, q, { first });
      res.json(result);
    } catch (err: any) {
      console.warn('Playerok Proxy Chats Failed, falling back to Mock:', err.message);
      res.json({
        data: {
          chats: {
            edges: mockChats.map(node => ({ node }))
          }
        }
      });
    }
  });

  // --- API ROUTE: Get Chat Messages ---
  app.get('/api/chats/:chatId/messages', async (req, res) => {
    const auth = req.headers.authorization;
    const { chatId } = req.params;

    if (isMockToken(auth)) {
      const messages = mockMessagesDb[chatId] || [];
      return res.json({
        data: {
          chatMessages: {
            edges: messages.map(node => ({ node }))
          }
        }
      });
    }

    try {
      const q = `
        query GetChatMessages($chatId: ID!, $first: Int) {
          chatMessages(chatId: $chatId, first: $first) {
            edges {
              node {
                id
                text
                createdAt
                user {
                  id
                  username
                  avatar {
                    url
                  }
                }
                file {
                  url
                  name
                }
              }
            }
          }
        }
      `;
      const first = Number(req.query.first) || 30;
      const result = await queryPlayerokAPI(auth!, q, { chatId, first });
      res.json(result);
    } catch (err: any) {
      console.warn(`Playerok Proxy Messages Failed for ${chatId}, falling back to Mock:`, err.message);
      const messages = mockMessagesDb[chatId] || [];
      res.json({
        data: {
          chatMessages: {
            edges: messages.map(node => ({ node }))
          }
        }
      });
    }
  });

  // --- API ROUTE: Send Chat Message (POST) ---
  app.post('/api/chats/:chatId/send', async (req, res) => {
    const auth = req.headers.authorization;
    const { chatId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is empty' });
    }

    if (isMockToken(auth)) {
      const newMsg: MockChatMessage = {
        id: `msg_${Date.now()}`,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        user: {
          id: mockUser.id,
          username: mockUser.username,
          avatar: { url: mockUser.avatar.url }
        }
      };

      if (!mockMessagesDb[chatId]) {
        mockMessagesDb[chatId] = [];
      }
      mockMessagesDb[chatId].push(newMsg);

      // Update lastMessage and clear counters
      const chat = mockChats.find(c => c.id === chatId);
      if (chat) {
        chat.lastMessage = newMsg;
        chat.unreadMessagesCount = 0;
      }

      // Simulate a realistic delayed response in mock mode
      setTimeout(() => {
        const triggers = [
          { keyword: 'привет', reply: 'Привет! Спасибо за покупку. Код отправил, проверьте.' },
          { keyword: 'код', reply: 'Код активации выдан в деталях заказа. Если не сработал - скину замену!' },
          { keyword: 'купил', reply: 'Отлично! Секунду, проверю оплату и выдам.' },
          { keyword: 'цена', reply: 'Цены окончательные, скидки постоянным покупателям!' },
          { keyword: 'жду', reply: 'Уже отправляю, извините за задержку.' }
        ];

        const lowercaseText = text.toLowerCase();
        let replyText = 'Спасибо! Ожидайте, я скоро вернусь с деталями выдачи.';
        for (const t of triggers) {
          if (lowercaseText.includes(t.keyword)) {
            replyText = t.reply;
            break;
          }
        }

        const systemReply: MockChatMessage = {
          id: `msg_${Date.now() + 1}`,
          text: replyText,
          createdAt: new Date().toISOString(),
          user: {
            id: chat?.members[0].id || 'system_bot',
            username: chat?.members[0].username || 'Клиент',
            avatar: chat?.members[0].avatar || null
          }
        };

        mockMessagesDb[chatId].push(systemReply);
        if (chat) {
          chat.lastMessage = systemReply;
          chat.unreadMessagesCount = 1;
        }
      }, 3500);

      return res.json({ data: { sendChatMessage: newMsg } });
    }

    try {
      const q = `
        mutation SendChatMessage($chatId: ID!, $text: String!) {
          sendChatMessage(chatId: $chatId, text: $text) {
            id
            text
            createdAt
            user {
              id
              username
              avatar {
                url
              }
            }
          }
        }
      `;
      const result = await queryPlayerokAPI(auth!, q, { chatId, text });
      res.json(result);
    } catch (err: any) {
      console.warn(`Proxy Send Message Failed for ${chatId}, falling back to Mock:`, err.message);
      // In-memory mock save
      const newMsg: MockChatMessage = {
        id: `msg_${Date.now()}`,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        user: {
          id: mockUser.id,
          username: mockUser.username,
          avatar: { url: mockUser.avatar.url }
        }
      };
      if (!mockMessagesDb[chatId]) mockMessagesDb[chatId] = [];
      mockMessagesDb[chatId].push(newMsg);
      res.json({ data: { sendChatMessage: newMsg } });
    }
  });

  // --- API ROUTE: Get Deals ---
  app.get('/api/deals', async (req, res) => {
    const auth = req.headers.authorization;
    const statusQuery = req.query.status as string;

    if (isMockToken(auth)) {
      let filteredDeals = mockDeals;
      if (statusQuery) {
        filteredDeals = mockDeals.filter(d => d.status.toUpperCase() === statusQuery.toUpperCase());
      }
      return res.json({
        data: {
          deals: {
            edges: filteredDeals.map(node => ({ node }))
          }
        }
      });
    }

    try {
      const q = `
        query GetDeals($first: Int, $status: [String!]) {
          deals(first: $first, status: $status) {
            edges {
              node {
                id
                status
                totalPrice
                createdAt
                completedAt
                buyer {
                  id
                  username
                  avatar {
                    url
                  }
                }
                seller {
                  id
                  username
                }
                product {
                  id
                  name
                  slug
                  images {
                    url
                  }
                }
              }
            }
          }
        }
      `;
      const first = Number(req.query.first) || 20;
      const status = statusQuery ? [statusQuery.toUpperCase()] : undefined;
      const result = await queryPlayerokAPI(auth!, q, { first, status });
      res.json(result);
    } catch (err: any) {
      console.warn('Playerok Proxy Deals Failed, falling back to Mock:', err.message);
      let filteredDeals = mockDeals;
      if (statusQuery) {
        filteredDeals = mockDeals.filter(d => d.status.toUpperCase() === statusQuery.toUpperCase());
      }
      res.json({
        data: {
          deals: {
            edges: filteredDeals.map(node => ({ node }))
          }
        }
      });
    }
  });

  // --- API ROUTE: Get Products ---
  app.get('/api/products', async (req, res) => {
    const auth = req.headers.authorization;
    if (isMockToken(auth)) {
      return res.json({
        data: {
          viewer: {
            id: mockUser.id,
            products: {
              edges: mockProducts.map(node => ({ node }))
            }
          }
        }
      });
    }

    try {
      const q = `
        query GetViewerProducts($first: Int) {
          viewer {
            id
            products(first: $first) {
              edges {
                node {
                  id
                  name
                  slug
                  price
                  status
                  category {
                    id
                    name
                  }
                  images {
                    url
                  }
                  dealsCount
                  viewsCount
                  createdAt
                }
              }
            }
          }
        }
      `;
      const first = Number(req.query.first) || 20;
      const result = await queryPlayerokAPI(auth!, q, { first });
      res.json(result);
    } catch (err: any) {
      console.warn('Playerok Proxy Products Failed, falling back to Mock:', err.message);
      res.json({
        data: {
          viewer: {
            id: mockUser.id,
            products: {
              edges: mockProducts.map(node => ({ node }))
            }
          }
        }
      });
    }
  });


  // --- VITE DEV SERVER / STATIC ASSET DELIVERY ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.get('/api/*', (req, res) => {
      res.status(404).json({ error: 'API route not found' });
    });
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
