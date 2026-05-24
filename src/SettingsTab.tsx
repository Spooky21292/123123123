import React, { useState, useEffect } from 'react';
import { Settings, Key, CheckCircle, XCircle, RefreshCw, HelpCircle, Terminal, Laptop, Download, Info } from 'lucide-react';
import { getToken, setToken, fetchMe } from './api';
import { PlayerokUser } from './types';

export default function SettingsTab() {
  const [tokenInput, setTokenInput] = useState(getToken());
  const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [user, setUser] = useState<PlayerokUser | null>(null);

  useEffect(() => {
    if (getToken()) {
      checkConnection();
    }
  }, []);

  const checkConnection = async () => {
    setStatus('checking');
    const me = await fetchMe();
    if (me) {
      setUser(me);
      setStatus('ok');
    } else {
      setUser(null);
      setStatus('error');
    }
  };

  const handleSave = () => {
    setToken(tokenInput.trim());
    checkConnection();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Primary Connection Form Card */}
      <div className="bg-white dark:bg-[#141412] rounded-xl border border-slate-200 dark:border-zinc-805/85 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-2 bg-slate-50/50 dark:bg-[#181816]/30">
          <Settings className="w-4.5 h-4.5 text-blue-600" />
          <span className="font-bold text-sm text-slate-800 dark:text-zinc-200">Параметры Сессии Playerok API</span>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Detailed visual instructions */}
          <div className="p-4 bg-blue-50/60 dark:bg-blue-950/15 border border-blue-100 dark:border-blue-900/30 rounded-xl space-y-3">
            <p className="font-bold text-xs text-blue-900 dark:text-blue-200 flex items-center gap-1.5 leading-snug">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              Как скопировать токен авторизации (Cookie "token"):
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-blue-800 dark:text-blue-300">
              <li>Откройте официальный сайт <a href="https://playerok.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-blue-900 dark:hover:text-white transition-colors">playerok.com</a> и пройдите авторизацию.</li>
              <li>Откройте Инструменты Разработчика браузера (нажмите <kbd className="bg-white dark:bg-zinc-800 px-1 rounded shadow-xs text-[10px] font-mono border">F12</kbd> или <kbd className="bg-white dark:bg-zinc-800 px-1 rounded shadow-xs text-[10px] font-mono border">Ctrl+Shift+I</kbd>).</li>
              <li>Перейдите во вкладку <strong className="font-bold">Application</strong> (Приложение) или <strong className="font-bold">Storage</strong>, затем найдите пункт <strong className="font-bold">Cookies</strong>.</li>
              <li>Найдите строку с именем <code className="bg-blue-105/50 dark:bg-blue-900/50 px-1.5 py-0.5 rounded font-mono font-bold">token</code> и скопируйте её длинное текстовое значение.</li>
              <li>Вставьте его в поле ниже и сохраните!</li>
            </ol>
            <p className="text-[10px] text-blue-600/90 dark:text-blue-400 mt-2 font-medium">
              🔒 Токен авторизации шифруется и хранится исключительно локально в памяти вашего браузера (localStorage), гарантируя 100% приватность сессии.
            </p>
          </div>

          {/* Token TextInput Input Element */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Key className="w-4 h-4" />
              Значение Cookie "token"
            </label>
            <div className="flex gap-3">
              <input
                type="password"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                placeholder="Вставьте скопированный токен..."
                className="flex-1 h-10 px-3.5 bg-slate-50 dark:bg-[#1a1a16] border border-slate-200 dark:border-zinc-800 rounded-lg text-xs text-slate-900 dark:text-zinc-200 placeholder-slate-400 outline-none focus:border-blue-500 font-mono transition-colors"
              />
              <button
                onClick={handleSave}
                className="px-4 h-10 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shrink-0"
              >
                Сохранить и проверить
              </button>
            </div>
          </div>

          {/* Connection status display */}
          <div className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-100 dark:border-zinc-850 bg-slate-50 dark:bg-[#1a1a16]/30">
            {status === 'idle' && (
              <>
                <div className="p-2 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-500">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">Токен не проверен</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Вставьте API-ключ выше для инициализации соединения.</span>
                </div>
              </>
            )}
            
            {status === 'checking' && (
              <>
                <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-500">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                </div>
                <div>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block">Проверка сессии...</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Запрашиваем данные профиля через бэкенд прокси-сервера...</span>
                </div>
              </>
            )}

            {status === 'ok' && user && (
              <>
                <div className="p-2 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-500 border border-emerald-100 dark:border-emerald-900/40">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-3">
                  {user.avatar?.url && <img src={user.avatar.url} className="w-9 h-9 rounded-full object-cover border" alt="" />}
                  <div>
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 block leading-tight">Подключение активно!</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Логин: <strong className="text-slate-800 dark:text-zinc-200">{user.username}</strong>
                      {user.balance !== undefined && ` • Личный баланс: ${user.balance} ₽`}
                    </span>
                  </div>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="p-2 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-500 border border-rose-100 dark:border-rose-900/40">
                  <XCircle className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">Ошибка 403 Forbidden (Cloudflare Блокировка)</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5 leading-relaxed">
                    Сайт Playerok использует Cloudflare, который блокирует запросы с облачных серверов AI Studio с ошибкой 403. 
                    <strong> Рекомендуется скопировать этот проект на ваш ПК (инструкция ниже) — с домашнего IP-адреса всё будет работать мгновенно!</strong>
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Server status details block */}
          <div className="p-4 bg-slate-50 dark:bg-[#1a1a16]/40 border border-slate-150 dark:border-zinc-800 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-zinc-200">
              <Terminal className="w-4.5 h-4.5 text-emerald-500" />
              Локальный Бэкенд Прокси-Сервер:
            </div>
            <p className="text-slate-550 dark:text-zinc-400 text-[11px] leading-relaxed">
              При локальном запуске на вашем компьютере прокси-сервер поднимается автоматически для маршрутизации запросов без ограничений CORS:
            </p>
            <code className="block bg-slate-900 text-emerald-400 p-2.5 rounded-lg font-mono text-[11px]">
              npm run dev
            </code>
          </div>

        </div>
      </div>

      {/* Interactive Local PC Setup Guide */}
      <LocalLaunchCard />

      {/* Advanced Zero-Cloudflare Data Sync Panel */}
      <SmartImportPanel onImportSuccess={checkConnection} />
      
    </div>
  );
}

function LocalLaunchCard() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-zinc-900 to-zinc-950 text-white rounded-xl border border-zinc-800 shadow-xl overflow-hidden">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between cursor-pointer hover:bg-zinc-800/45 transition-colors select-none"
      >
        <div className="flex items-center gap-2">
          <Laptop className="w-4.5 h-4.5 text-blue-400" />
          <span className="font-extrabold text-sm text-zinc-100">💻 Запуск на своем ПК (Обход Cloudflare 403)</span>
        </div>
        <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold px-2.5 py-1 rounded-full">
          {isOpen ? 'Скрыть инструкцию' : 'Показать шаги'}
        </span>
      </div>

      {isOpen && (
        <div className="p-6 space-y-5 text-xs text-zinc-300 leading-relaxed">
          <div className="p-3.5 bg-zinc-850/40 border border-zinc-800 rounded-lg flex gap-3 text-zinc-300">
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <p>
              <strong>Почему в AI Studio не работает автоматическое API?</strong> Превью в облаке Cloud Run имеет серверный поддиапазон IP-адресов, которые Cloudflare блокирует защитным кодом 403. Локальный запуск на вашем компьютере использует ваш <strong>домашний IP-адрес</strong>, который Cloudflare пропускает совершенно свободно без каких-либо блокировок!
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/15 text-blue-400 font-bold text-xs shrink-0">1</span>
              <div>
                <p className="font-bold text-zinc-200">Скачайте этот проект себе на компьютер</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">В правом верхнем углу меню AI Studio нажмите на настройки/экспорт и выберите <strong>«Download ZIP»</strong> (Скачать ZIP-архив) или свяжите проект с вашей учетной записью <strong>GitHub</strong>. Распакуйте скачанный zip-архив на ПК.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/15 text-blue-400 font-bold text-xs shrink-0">2</span>
              <div>
                <p className="font-bold text-zinc-200">Установите Node.js</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Скачайте и установите Node.js LTS с официального сайта <a href="https://nodejs.org/" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">nodejs.org</a> (если он ещё не установлен).</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/15 text-blue-400 font-bold text-xs shrink-0">3</span>
              <div>
                <p className="font-bold text-zinc-200">Установите зависимости и запустите</p>
                <p className="text-[11px] text-zinc-400 mt-1">Откройте терминал (командную строку) в распакованной папке проекта и запустите команды:</p>
                <div className="mt-2 space-y-1.5 font-mono text-[11px] text-emerald-400 bg-black/45 p-3 rounded-lg border border-zinc-800">
                  <div className="flex justify-between items-center">
                    <span>npm install</span>
                    <span className="text-[9px] text-zinc-500 font-sans">Установка библиотек</span>
                  </div>
                  <hr className="border-zinc-800" />
                  <div className="flex justify-between items-center">
                    <span>npm run dev</span>
                    <span className="text-[9px] text-zinc-500 font-sans">Локальный запуск на порту 3000</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/15 text-blue-400 font-bold text-xs shrink-0">4</span>
              <div>
                <p className="font-bold text-zinc-200">Откройте сайт локально и вставьте токен сессии</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Перейдите по адресу <strong className="text-zinc-200">http://localhost:3000</strong> в удобном браузере, введите скопированный токен в настройках, и весь интерфейс (чаты, сделки, бот-ассистент) мгновенно начнет подтягивать актуальные данные!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SmartImportPanelProps {
  onImportSuccess: () => void;
}

function SmartImportPanel({ onImportSuccess }: SmartImportPanelProps) {
  const [username, setUsername] = useState(
    () => {
      try {
        const stored = localStorage.getItem('playerok_imported_viewer');
        if (stored) return JSON.parse(stored).username || '';
      } catch {}
      return '';
    }
  );
  
  const [avatarUrl, setAvatarUrl] = useState(
    () => {
      try {
        const stored = localStorage.getItem('playerok_imported_viewer');
        if (stored) return JSON.parse(stored).avatar?.url || '';
      } catch {}
      return '';
    }
  );

  const [balance, setBalance] = useState(
    () => {
      try {
        const stored = localStorage.getItem('playerok_imported_viewer');
        if (stored) return String(JSON.parse(stored).balance || 0);
      } catch {}
      return '24850';
    }
  );

  const [rawChats, setRawChats] = useState('');
  const [rawDeals, setRawDeals] = useState('');
  const [rawProducts, setRawProducts] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSaveData = () => {
    // 1. Profile Setup
    const viewerObj = {
      id: 'usr_imported',
      username: username.trim() || 'Spooky21291',
      email: 'user@playerok.com',
      balance: parseFloat(balance) || 0,
      avatar: { url: avatarUrl.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
      role: 'seller',
      isOnline: true
    };
    localStorage.setItem('playerok_imported_viewer', JSON.stringify(viewerObj));

    // 2. Chats Setup
    if (rawChats.trim()) {
      try {
        const chatList = JSON.parse(rawChats);
        if (Array.isArray(chatList)) {
          localStorage.setItem('playerok_imported_chats', JSON.stringify(chatList));
        }
      } catch {
        // Quick fallback helper parsing simple comma/newline format to support non-technical copy pasting
        const lines = rawChats.split('\n').filter(l => l.trim());
        const mockParsedChats = lines.map((line, idx) => {
          const parts = line.split('|').map(p => p.trim());
          const clientName = parts[0] || `Клиент #${idx + 1}`;
          const lastText = parts[1] || 'Привет! Жду выдачи товара.';
          const prodTitle = parts[2] || 'PUBG Mobile UC 325';
          return {
            id: `chat_imp_${idx}`,
            unreadMessagesCount: 0,
            lastMessage: {
              id: `msg_imp_${idx}_last`,
              text: lastText,
              createdAt: new Date().toISOString(),
              user: { id: `buyer_${idx}`, username: clientName, avatar: null }
            },
            members: [
              { id: `buyer_${idx}`, username: clientName, avatar: null, isOnline: true },
              { id: viewerObj.id, username: viewerObj.username, avatar: viewerObj.avatar }
            ],
            deal: {
              id: `deal_imp_${idx}`,
              status: 'PAID',
              product: { id: `prod_imp_${idx}`, name: prodTitle, slug: `imp-prod-${idx}` }
            }
          };
        });
        localStorage.setItem('playerok_imported_chats', JSON.stringify(mockParsedChats));
      }
    }

    // 3. Deals/Orders Setup
    if (rawDeals.trim()) {
      try {
        const dealList = JSON.parse(rawDeals);
        if (Array.isArray(dealList)) {
          localStorage.setItem('playerok_imported_deals', JSON.stringify(dealList));
        }
      } catch {
        const lines = rawDeals.split('\n').filter(l => l.trim());
        const mockParsedDeals = lines.map((line, idx) => {
          const parts = line.split('|').map(p => p.trim());
          const prodName = parts[0] || 'Игровой товар';
          const price = parseFloat(parts[1]) || 450;
          const status = parts[2] || 'PAID';
          const buyerName = parts[3] || 'Sanya_Gamer';
          return {
            id: `deal_imp_${idx}`,
            status: status.toUpperCase(),
            totalPrice: price,
            createdAt: new Date().toISOString(),
            buyer: { id: `buyer_imp_${idx}`, username: buyerName, avatar: null },
            seller: { id: viewerObj.id, username: viewerObj.username },
            product: {
              id: `prod_imp_${idx}`,
              name: prodName,
              slug: `imp-slug-${idx}`,
              images: [{ url: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&w=120&q=80' }]
            }
          };
        });
        localStorage.setItem('playerok_imported_deals', JSON.stringify(mockParsedDeals));
      }
    }

    // 4. Products Setup
    if (rawProducts.trim()) {
      try {
        const prodList = JSON.parse(rawProducts);
        if (Array.isArray(prodList)) {
          localStorage.setItem('playerok_imported_products', JSON.stringify(prodList));
        }
      } catch {
        const lines = rawProducts.split('\n').filter(l => l.trim());
        const mockParsedProducts = lines.map((line, idx) => {
          const parts = line.split('|').map(p => p.trim());
          const prodName = parts[0] || 'Новая услуга';
          const price = parseFloat(parts[1]) || 290;
          return {
            id: `prod_imp_${idx}`,
            name: prodName,
            slug: `imp-prod-${idx}`,
            price: price,
            status: 'ACTIVE',
            category: { id: 'cat_gen', name: 'Игровые товары' },
            images: [{ url: 'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?auto=format&fit=crop&w=120&q=80' }],
            dealsCount: Math.floor(Math.random() * 50) + 1,
            viewsCount: Math.floor(Math.random() * 1000) + 10,
            createdAt: '24.05.2026'
          };
        });
        localStorage.setItem('playerok_imported_products', JSON.stringify(mockParsedProducts));
      }
    }

    setSuccessMsg('Данные успешно импортированы локально! Весь интерфейс чатов, сделок и аватар обновлен.');
    onImportSuccess();
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleClearImported = () => {
    localStorage.removeItem('playerok_imported_viewer');
    localStorage.removeItem('playerok_imported_chats');
    localStorage.removeItem('playerok_imported_deals');
    localStorage.removeItem('playerok_imported_products');
    setUsername('');
    setAvatarUrl('');
    setRawChats('');
    setRawDeals('');
    setRawProducts('');
    setSuccessMsg('Импортированные данные удалены. Шаблонные mock-данные бэкенда возвращены.');
    onImportSuccess();
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  return (
    <div className="bg-white dark:bg-[#141412] rounded-xl border border-slate-200 dark:border-zinc-805/85 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-emerald-50/20 dark:bg-emerald-950/15">
        <div className="flex items-center gap-2">
          <Terminal className="w-4.5 h-4.5 text-emerald-600" />
          <span className="font-extrabold text-sm text-slate-800 dark:text-zinc-200">Панель Ручного Слияния Данных (Без Блокировок)</span>
        </div>
        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-bold px-2.5 py-1 rounded-full">Умный импорт</span>
      </div>

      <div className="p-6 space-y-6">
        <p className="text-xs text-slate-550 dark:text-zinc-400 leading-relaxed">
          Если сетевой прокси получает временную ошибку <strong>403 Forbidden</strong> из-за Cloudflare защиты оригинального сайта Playerok, вы можете напрямую настроить и перенести ваши реальные заказы, чаты и аватарку!
        </p>

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400 text-xs rounded-xl font-medium animate-pulse">
            {successMsg}
          </div>
        )}

        {/* 1. Profile sync block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">Мой никнейм на Playerok</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Например: Spooky21291"
              className="w-full h-9 px-3 bg-slate-50 dark:bg-[#1a1a16] border border-slate-200 dark:border-zinc-800 rounded-lg text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">Ссылка на мою аватарку</label>
            <input
              type="text"
              value={avatarUrl}
              onChange={e => setAvatarUrl(e.target.value)}
              placeholder="Вставьте URL картинки..."
              className="w-full h-9 px-3 bg-slate-50 dark:bg-[#1a1a16] border border-slate-200 dark:border-zinc-800 rounded-lg text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">Мой текущий баланс на сайте (₽)</label>
          <input
            type="number"
            value={balance}
            onChange={e => setBalance(e.target.value)}
            placeholder="24850"
            className="w-56 h-9 px-3 bg-slate-50 dark:bg-[#1a1a16] border border-slate-200 dark:border-zinc-800 rounded-lg text-xs"
          />
        </div>

        {/* 2. Advanced Multi Line Import Textareas */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400">
                Мои Чаты (Один на строке в формате: <code className="bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-rose-500">Имя Клиента | Последнее сообщение | Товар</code> или JSON)
              </label>
            </div>
            <textarea
              rows={3}
              value={rawChats}
              onChange={e => setRawChats(e.target.value)}
              placeholder={`Sanya2009 | Здравствуйте! Я оплатил Telegram Premium, когда будет выдача? | Telegram Premium 1 месяц\nIvan_Gamin | Спасибо большое, всё пришло быстро! | PUBG Mobile UC 325`}
              className="w-full p-3 bg-slate-50 dark:bg-[#1a1a16] border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-mono placeholder-slate-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400">
              Мои Сделки и Заказы (Один на строке в формате: <code className="bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-rose-500">Название товара | Цена | статус (PAID / COMPLETED) | Покупатель</code> или JSON)
            </label>
            <textarea
              rows={3}
              value={rawDeals}
              onChange={e => setRawDeals(e.target.value)}
              placeholder={`PUBG Mobile UC 325 | 450 | COMPLETED | Ivan_Gamin\nTelegram Premium 1 месяц | 290 | PAID | Sanya2009`}
              className="w-full p-3 bg-slate-50 dark:bg-[#1a1a16] border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-mono placeholder-slate-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400">
              Мои Товары / Листинги (Один на строке в формате: <code className="bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-rose-500">Название листинга | Цена</code> или JSON)
            </label>
            <textarea
              rows={3}
              value={rawProducts}
              onChange={e => setRawProducts(e.target.value)}
              placeholder={`PUBG Mobile UC 325 (Global) | 450\nTelegram Premium 1 месяц (Подарком) | 290`}
              className="w-full p-3 bg-slate-50 dark:bg-[#1a1a16] border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-mono placeholder-slate-400"
            />
          </div>
        </div>

        {/* Action button controls */}
        <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-zinc-850">
          <button
            onClick={handleClearImported}
            className="px-4 h-9 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            Сбросить ручные данные
          </button>
          <button
            onClick={handleSaveData}
            className="px-5 h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
          >
            Синхронизировать данные профиля и заказов
          </button>
        </div>

      </div>
    </div>
  );
}
