import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  ShoppingBag, 
  CircleDollarSign, 
  LineChart, 
  Plus, 
  Minus, 
  Edit, 
  Trash2, 
  Search, 
  X, 
  ChevronDown, 
  Check, 
  Pause, 
  Play, 
  Download, 
  RotateCcw, 
  Info, 
  Calendar, 
  BadgePercent, 
  ShoppingCart, 
  History, 
  Undo2, 
  TrendingUp,
  SlidersHorizontal,
  PlusCircle,
  MessageCircle,
  LogOut,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProductItem, ItemStatus, SaleRecord, PlayerokUser } from './types';
import { fetchMe, fetchChats, getToken } from './api';

// Tab components
import ChatsTab from './ChatsTab';
import DealsTab from './DealsTab';
import SettingsTab from './SettingsTab';

const STORAGE_KEY = 'playerok_products_v4';
const LOGS_STORAGE_KEY = 'playerok_sales_logs_v4';

const DEFAULT_PRODUCTS: ProductItem[] = [];

export default function App() {
  const [items, setItems] = useState<ProductItem[]>([]);
  const [salesLogs, setSalesLogs] = useState<SaleRecord[]>([]);
  
  // Navigation State
  const [activeMainTab, setActiveMainTab] = useState<'sklad' | 'chats' | 'deals' | 'settings'>('sklad');
  const [viewer, setViewer] = useState<PlayerokUser | null>(null);
  const [unreadChatsCount, setUnreadChatsCount] = useState<number>(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'status' | 'cat'>('status');
  const [filterVal, setFilterVal] = useState<string>('all');
  const [sortKey, setSortKey] = useState<keyof ProductItem | 'margin' | 'spent'>('date');
  const [sortDir, setSortDir] = useState<-1 | 1>(-1);
  
  // Form input states
  const [fName, setFName] = useState('');
  const [fCat, setFCat] = useState('Игровые товары');
  const [fBuy, setFBuy] = useState<number | ''>('');
  const [fSell, setFSell] = useState<number | ''>('');
  const [fComm, setFComm] = useState<number>(20);
  const [fQuantity, setFQuantity] = useState<number>(10);
  const [fStatus, setFStatus] = useState<ItemStatus>('active');
  const [isFormOpen, setIsFormOpen] = useState(true);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<ProductItem | null>(null);

  // Custom Confirm Dialog State
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmText: string;
    isDanger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Toasts state
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' | 'error' }[]>([]);

  // Initial load
  useEffect(() => {
    let loadedItems: ProductItem[] = [];
    let loadedLogs: SaleRecord[] = [];
    
    try {
      const itemsRaw = localStorage.getItem(STORAGE_KEY);
      if (itemsRaw) {
        loadedItems = JSON.parse(itemsRaw);
      } else {
        loadedItems = DEFAULT_PRODUCTS;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
      }
    } catch (e) {
      loadedItems = DEFAULT_PRODUCTS;
    }

    try {
      const logsRaw = localStorage.getItem(LOGS_STORAGE_KEY);
      if (logsRaw) {
        loadedLogs = JSON.parse(logsRaw);
      }
    } catch (e) {
      loadedLogs = [];
    }

    setItems(loadedItems);
    setSalesLogs(loadedLogs);
  }, []);

  // Sync profile details and update unread indicator count periodically or on tab activation
  useEffect(() => {
    const syncProfile = async () => {
      const u = await fetchMe();
      if (u) {
        setViewer(u);
      }
      const chatList = await fetchChats();
      const unread = chatList.filter(c => c.unreadMessagesCount > 0).length;
      setUnreadChatsCount(unread);
    };

    syncProfile();
    
    // React to instant manual import edits
    window.addEventListener('playerok_imported_change', syncProfile);

    const interval = setInterval(syncProfile, 15000); // sync every 15s
    return () => {
      window.removeEventListener('playerok_imported_change', syncProfile);
      clearInterval(interval);
    };
  }, [activeMainTab]);

  // Save changes helper
  const saveItems = (newItems: ProductItem[]) => {
    setItems(newItems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
  };

  const saveLogs = (newLogs: SaleRecord[]) => {
    setSalesLogs(newLogs);
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(newLogs));
  };

  // Toast notifier helper
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Human date helper
  const getTodayDateString = () => {
    return new Date().toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTodayTimeString = () => {
    return new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Math helpers
  const getItemMargin = (it: ProductItem): number => {
    const sell = Number(it.sell) || 0;
    const buy = Number(it.buy) || 0;
    const comm = Number(it.comm) || 0;
    return sell * (1 - comm / 100) - buy;
  };

  const getItemSpent = (it: ProductItem): number => {
    const buy = Number(it.buy) || 0;
    const totalUnitsBought = (it.quantity || 0) + (it.soldCount || 0);
    return buy * totalUnitsBought;
  };

  // Categories list based on current items
  const uniqueCategories = useMemo(() => {
    const defaultCats = ['Игровые товары', 'Telegram', 'Steam', 'SMM', 'FunPay', 'Другое'];
    const storedCats = items.map(i => i.cat);
    return Array.from(new Set([...defaultCats, ...storedCats]));
  }, [items]);

  // Sidebar counters
  const counters = useMemo(() => {
    const allCount = items.length;
    const activeCount = items.filter(i => i.status === 'active').length;
    const pauseCount = items.filter(i => i.status === 'pause').length;
    
    const catCounts = items.reduce((acc, it) => {
      acc[it.cat] = (acc[it.cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { allCount, activeCount, pauseCount, catCounts };
  }, [items]);

  // Global Financial Statistics
  const globalStats = useMemo(() => {
    let totalInvested = 0; 
    let totalNetRevenue = 0; 
    let totalRealizedProfit = 0; 
    let warehouseValue = 0; 
    let warehousePotentialProfit = 0; 

    items.forEach(it => {
      const margin = getItemMargin(it);
      const spentOnItem = getItemSpent(it);
      
      totalInvested += spentOnItem;
      
      const revenueFromItem = it.soldCount * it.sell * (1 - it.comm / 100);
      totalNetRevenue += revenueFromItem;
      
      const profitFromItem = it.soldCount * margin;
      totalRealizedProfit += profitFromItem;

      const inStockValue = it.quantity * it.sell;
      warehouseValue += inStockValue;

      const potentialProfit = it.quantity * margin;
      warehousePotentialProfit += potentialProfit;
    });

    return {
      totalInvested,
      totalNetRevenue,
      totalRealizedProfit,
      warehouseValue,
      warehousePotentialProfit,
      totalStockUnits: items.reduce((acc, i) => acc + i.quantity, 0),
      totalSoldUnits: items.reduce((acc, i) => acc + i.soldCount, 0),
    };
  }, [items]);

  // --- ACTIONS ---

  // Add Item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName.trim()) {
      showToast('Введите название товара!', 'error');
      return;
    }

    const buyPrice = fBuy === '' ? 0 : Number(fBuy);
    const sellPrice = fSell === '' ? 0 : Number(fSell);
    const newId = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;

    const newItem: ProductItem = {
      id: newId,
      name: fName.trim(),
      cat: fCat,
      status: fStatus,
      buy: buyPrice,
      sell: sellPrice,
      comm: Number(fComm) || 0,
      quantity: Number(fQuantity) || 0,
      soldCount: 0,
      date: getTodayDateString()
    };

    const updated = [...items, newItem];
    saveItems(updated);
    
    // Clear form
    setFName('');
    setFBuy('');
    setFSell('');
    setFQuantity(10);
    
    showToast(`Товар "${newItem.name.substring(0, 20)}..." успешно добавлен!`, 'success');
  };

  // Delete Item
  const handleDeleteItem = (id: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    setConfirmModal({
      title: 'Удалить этот товар?',
      message: `Вы действительно хотите безвозвратно удалить товар "${item.name}"? Все накопленные показатели продаж по этой позиции будут потеряны.`,
      confirmText: 'Удалить',
      isDanger: true,
      onConfirm: () => {
        const updated = items.filter(i => i.id !== id);
        saveItems(updated);
        showToast('Товар удален', 'info');
        setConfirmModal(null);
      }
    });
  };

  // Change Status Pill click
  const toggleItemStatus = (id: number) => {
    const updated = items.map(it => {
      if (it.id === id) {
        const nextStatus: ItemStatus = it.status === 'active' ? 'pause' : 'active';
        showToast(`Товар "${it.name.substring(0, 15)}" установлен на статус: ${nextStatus === 'active' ? 'Активен' : 'На паузе'}`, 'info');
        return { ...it, status: nextStatus };
      }
      return it;
    });
    saveItems(updated);
  };

  // Increment and Decrement Stock directly in the row
  const adjustItemQuantity = (id: number, delta: number) => {
    const updated = items.map(it => {
      if (it.id === id) {
        const newQty = Math.max(0, it.quantity + delta);
        return { ...it, quantity: newQty };
      }
      return it;
    });
    saveItems(updated);
  };

  // QUICK SALE BUTTON ACTION: "Я продал данный товар!"
  const handleRecordSale = (id: number) => {
    const targetItem = items.find(i => i.id === id);
    if (!targetItem) return;

    if (targetItem.quantity <= 0) {
      showToast(`Ошибка: "${targetItem.name}" закончился в наличии! Пополните количество.`, 'error');
      return;
    }

    const updatedItems = items.map(it => {
      if (it.id === id) {
        return {
          ...it,
          quantity: it.quantity - 1,
          soldCount: it.soldCount + 1
        };
      }
      return it;
    });

    saveItems(updatedItems);

    // Record Log Entry
    const margin = getItemMargin(targetItem);
    const revenue = targetItem.sell * (1 - targetItem.comm / 100);
    const profit = revenue - targetItem.buy;

    const newLog: SaleRecord = {
      id: Math.random().toString(36).substring(2, 9),
      itemId: targetItem.id,
      itemName: targetItem.name,
      sellPrice: targetItem.sell,
      buyPrice: targetItem.buy,
      commission: targetItem.comm,
      revenue: parseFloat(revenue.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      date: `${getTodayDateString()} в ${getTodayTimeString()}`
    };

    const updatedLogs = [newLog, ...salesLogs].slice(0, 100); 
    saveLogs(updatedLogs);

    showToast(`Продан 1 шт. товара: "${targetItem.name.substring(0, 20)}". Чистая прибыль: +${profit.toFixed(1)} ₽! 💸`, 'success');
  };

  // Cancel/Undo Last Sale Log Entry
  const handleUndoSale = (logId: string) => {
    const log = salesLogs.find(l => l.id === logId);
    if (!log) return;

    const updatedItems = items.map(it => {
      if (it.id === log.itemId) {
        return {
          ...it,
          quantity: it.quantity + 1,
          soldCount: Math.max(0, it.soldCount - 1)
        };
      }
      return it;
    });

    saveItems(updatedItems);
    saveLogs(salesLogs.filter(l => l.id !== logId));
    showToast(`Продажа отменена. Товар вернулся в наличие.`, 'info');
  };

  // Edit Modal Saves
  const handleOpenEditModal = (it: ProductItem) => {
    setEditingItem({ ...it });
  };

  const handleSaveEditedItem = () => {
    if (!editingItem) return;
    if (!editingItem.name.trim()) {
      showToast('Название не должно быть пустым!', 'error');
      return;
    }

    const updated = items.map(it => {
      if (it.id === editingItem.id) {
        return editingItem;
      }
      return it;
    });

    saveItems(updated);
    setEditingItem(null);
    showToast('Параметры товара сохранены', 'success');
  };

  // Reset or clear utilities
  const handleClearAll = () => {
    setConfirmModal({
      title: 'Сбросить все товары?',
      message: 'Вы действительно хотите удалить абсолютно все товары со склада и очистить всю зафиксированную статистику продаж текущего сеанса? Это действие необратимо.',
      confirmText: 'Да, сбросить всё',
      isDanger: true,
      onConfirm: () => {
        saveItems([]);
        saveLogs([]);
        showToast('Таблица товаров и отчетность сброшены', 'info');
        setConfirmModal(null);
      }
    });
  };

  // Export CSV Action
  const handleExportCSV = () => {
    const headers = ['ID', 'Название', 'Категория', 'Статус', 'В наличии (шт)', 'Продано (шт)', 'Закупка за 1 шт (руб)', 'Продажа за 1 шт (руб)', 'Сумма закупки (Потрачено всего)', 'Комиссия Playerok (%)', 'Чистая маржа с 1 шт', 'Общая чистая прибыль', 'Добавлен'];
    const rows = [headers];

    items.forEach(it => {
      const margin = getItemMargin(it);
      const spentTotal = getItemSpent(it);
      const totalProfit = it.soldCount * margin;
      
      rows.push([
        it.id.toString(),
        it.name,
        it.cat,
        it.status === 'active' ? 'Активный' : 'На паузе',
        it.quantity.toString(),
        it.soldCount.toString(),
        it.buy.toString(),
        it.sell.toString(),
        spentTotal.toString(),
        it.comm.toString(),
        margin.toFixed(2),
        totalProfit.toFixed(2),
        it.date
      ]);
    });

    const csvContent = rows.map(r => r.map(v => {
      const s = String(v).replace(/"/g, '""');
      return /[;\n"]/.test(s) ? `"${s}"` : s;
    }).join(';')).join('\r\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `playerok-moj-sklad-${getTodayDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV успешно экспортирован для Excel!', 'success');
  };

  // Search & Filtering processing
  const processedItems = useMemo(() => {
    const filtered = items.filter(it => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = it.name.toLowerCase().includes(q) || it.cat.toLowerCase().includes(q);
      
      if (!matchesSearch) return false;

      if (filterType === 'status') {
        if (filterVal === 'all') return true;
        return it.status === filterVal;
      } else if (filterType === 'cat') {
        return it.cat === filterVal;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (sortKey === 'margin') {
        valA = getItemMargin(a);
        valB = getItemMargin(b);
      } else if (sortKey === 'spent') {
        valA = getItemSpent(a);
        valB = getItemSpent(b);
      } else {
        valA = a[sortKey];
        valB = b[sortKey];
      }

      if (typeof valA === 'string') {
        return valA.localeCompare(valB) * sortDir;
      }
      return ((valA || 0) - (valB || 0)) * sortDir;
    });
  }, [items, searchQuery, filterType, filterVal, sortKey, sortDir]);

  const handleSortClick = (key: keyof ProductItem | 'margin' | 'spent') => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDir(1);
    }
  };

  // Dynamic preview computation for adding form
  const formMarginPreview = useMemo(() => {
    const buyValue = fBuy === '' ? 0 : Number(fBuy);
    const sellValue = fSell === '' ? 0 : Number(fSell);
    const margin = sellValue * (1 - fComm / 100) - buyValue;
    const spentNewBatch = buyValue * fQuantity;
    return {
      margin,
      spentNewBatch,
      revenue: sellValue * (1 - fComm / 100)
    };
  }, [fBuy, fSell, fComm, fQuantity]);

  // Sidebar dynamic filter activation helper
  const handleSbClick = (type: 'status' | 'cat', value: string) => {
    setFilterType(type);
    setFilterVal(value);
  };

  return (
    <div className="shell min-h-screen bg-slate-50 font-sans antialiased text-slate-900 flex flex-col lg:flex-row transition-colors duration-300">
      
      {/* APP TOAST NOTIFICATIONS DRAWER */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
              className={`flex items-center gap-3 p-4 rounded-xl shadow-lg border text-sm pointer-events-auto ${
                t.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-950 border-emerald-200 shadow-emerald-100' 
                  : t.type === 'error'
                  ? 'bg-rose-50 text-rose-950 border-rose-200 shadow-rose-100'
                  : 'bg-slate-100 text-slate-900 border-slate-200'
              }`}
            >
              {t.type === 'success' ? (
                <div className="p-1 rounded-full bg-emerald-100 text-emerald-600">
                  <Check className="w-4 h-4" />
                </div>
              ) : t.type === 'error' ? (
                <div className="p-1 rounded-full bg-rose-100 text-rose-600">
                  <X className="w-4 h-4" />
                </div>
              ) : (
                <div className="p-1 rounded-full bg-slate-200 text-slate-600">
                  <Info className="w-4 h-4" />
                </div>
              )}
              <div className="flex-1 font-semibold">{t.message}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* --- SIDEBAR (Dark Theme - Swiss Minimalist Black Aesthetics from HTML Mockup) --- */}
      <aside className="w-full lg:w-64 flex-shrink-0 bg-slate-900 text-slate-300 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-950">
        
        {/* Header Logo Row */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800 flex-shrink-0">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs">P</div>
          <span className="text-white font-extrabold tracking-tight text-base font-display">Playerok Panel</span>
        </div>

        {/* Dynamic Sidebar Navigation Menu */}
        <nav className="p-4 space-y-2 flex-shrink-0">
          
          <button
            onClick={() => setActiveMainTab('sklad')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
              activeMainTab === 'sklad'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-350 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Package className="w-4.5 h-4.5" />
            <span>Склад</span>
          </button>

          <button
            onClick={() => setActiveMainTab('chats')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left relative cursor-pointer ${
              activeMainTab === 'chats'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-350 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <MessageCircle className="w-4.5 h-4.5" />
            <span>Чаты</span>
            {unreadChatsCount > 0 && (
              <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {unreadChatsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveMainTab('deals')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
              activeMainTab === 'deals'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-350 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShoppingCart className="w-4.5 h-4.5" />
            <span>Заказы</span>
          </button>

          <button
            onClick={() => setActiveMainTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
              activeMainTab === 'settings'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-350 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Settings className="w-4.5 h-4.5" />
            <span>Настройки</span>
          </button>

        </nav>

        {/* Sub-Filters Section inside sidebar ONLY when Sklad (Inventory) is active */}
        {activeMainTab === 'sklad' && (
          <div className="flex-1 px-4 py-2 border-t border-slate-800 space-y-4 overflow-y-auto scrollbar-thin">
            
            {/* Status Filter */}
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase block mb-1.5">Статус лота</span>
              
              <button
                onClick={() => handleSbClick('status', 'all')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  filterType === 'status' && filterVal === 'all'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>Все товары</span>
                </div>
                <span className="text-[10px] font-bold bg-slate-950 px-1.5 py-0.5 rounded text-slate-400 font-mono">{counters.allCount}</span>
              </button>

              <button
                onClick={() => handleSbClick('status', 'active')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  filterType === 'status' && filterVal === 'active'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Продаются</span>
                </div>
                <span className="text-[10px] font-bold bg-slate-950 px-1.5 py-0.5 rounded text-slate-400 font-mono">{counters.activeCount}</span>
              </button>

              <button
                onClick={() => handleSbClick('status', 'pause')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  filterType === 'status' && filterVal === 'pause'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  <span>На паузе</span>
                </div>
                <span className="text-[10px] font-bold bg-slate-950 px-1.5 py-0.5 rounded text-slate-400 font-mono">{counters.pauseCount}</span>
              </button>
            </div>

            {/* Categories filter */}
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase block mb-1.5">Канал / Полки</span>
              <div className="space-y-0.5 max-h-40 overflow-y-auto pr-1 text-slate-400">
                {uniqueCategories.map(cat => {
                  const isActive = filterType === 'cat' && filterVal === cat;
                  const count = counters.catCounts[cat] || 0;
                  return (
                    <button
                      key={cat}
                      onClick={() => handleSbClick('cat', cat)}
                      className={`w-full flex items-center justify-between px-3 py-1 rounded-md text-xs transition-colors cursor-pointer text-left ${
                        isActive
                          ? 'bg-slate-800 text-white font-bold'
                          : 'hover:bg-slate-800/50 hover:text-white'
                      }`}
                    >
                      <span className="truncate mr-1">{cat}</span>
                      <span className="text-[9px] opacity-60 font-mono">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* Token Active indicator at absolute sidebar footer */}
        <div className="p-4 mt-auto border-t border-slate-800 flex-shrink-0 bg-slate-950/20">
          <div className="text-[10px] text-slate-500 uppercase font-extrabold mb-1.5 tracking-wider">Connection Status</div>
          {getToken() ? (
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-bold bg-emerald-500/10 p-2.5 rounded-lg">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Connected (API OK)
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] text-amber-500 font-bold bg-amber-500/10 p-2.5 rounded-lg">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
              Setup Token
            </div>
          )}
        </div>

      </aside>

      {/* --- MASTER CONTROLLER WINDOWS AREA --- */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* TOP COHESIVE WHITE RULER HEADER */}
        <header className="h-16 bg-white border-b border-slate-200/90 flex items-center justify-between px-6 md:px-8 flex-shrink-0 shadow-xs">
          <div className="flex items-center gap-4">
            <h1 className="text-base md:text-lg font-extrabold tracking-tight text-slate-900 leading-none">
              {activeMainTab === 'sklad' ? 'Управление Складом' :
               activeMainTab === 'chats' ? 'Управление Чатами' :
               activeMainTab === 'deals' ? 'Состояние Заказов' :
               'Настройки Интеграции'}
            </h1>
            <div className="h-4 w-[1px] bg-slate-200" />
            <div className="text-xs text-slate-500 font-medium">
              Профиль: <span className="text-slate-900 font-bold">{viewer?.username || 'Синхронизация...'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {viewer?.avatar?.url ? (
              <img src={viewer.avatar.url} className="w-8 h-8 rounded-full border border-slate-200 object-cover shadow-xs" alt="User Profile" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-100 border flex items-center justify-center text-xs font-bold text-slate-500 shadow-xs">
                U
              </div>
            )}
            
            <button 
              onClick={() => {
                localStorage.removeItem('playerok_auth_token');
                window.location.reload();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </header>

        {/* WORKSPACE MIDDLE BODY PANEL */}
        <main className="flex-1 p-5 md:p-8 overflow-y-auto bg-slate-50">
          
          {/* TAB 1: SKLAD (INVENTORY) VIEW */}
          {activeMainTab === 'sklad' && (
            <div className="space-y-6">
              
              {/* Header inside Sklad view grid row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-5">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                    <span>Складской склад</span>
                    <span>/</span>
                    <span className="text-blue-600 font-extrabold">
                      {filterType === 'status' ? (filterVal === 'all' ? 'Все товары' : filterVal === 'active' ? 'Продажи' : 'Пауза') : filterVal}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight mt-1.5">Личный Склад Снабжения</h2>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Искать лот..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-56 h-9.5 pl-9 pr-8 text-xs bg-white border border-slate-250 rounded-lg text-slate-900 outline-none focus:border-blue-500 font-medium transition-colors"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')} 
                        className="absolute right-2.5 top-2.5 p-0.5 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handleExportCSV}
                    className="flex items-center justify-center gap-2 px-3.5 h-9.5 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-250 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                    <span>Экспорт в Excel (CSV)</span>
                  </button>
                </div>
              </div>

              {/* STATS DECOR GRID (Professional Polish Theme) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs relative overflow-hidden flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">Потрачено всего</span>
                    <h3 className="text-2xl font-black font-mono text-slate-900 mt-1">{globalStats.totalInvested.toLocaleString('ru-RU')} <span className="text-slate-350 text-base">₽</span></h3>
                    <div className="text-[9px] text-slate-450 mt-1 uppercase font-medium">Закупка × (Склад + Проданные)</div>
                  </div>
                  <div className="p-3 bg-slate-100 rounded-lg text-slate-650">
                    <CircleDollarSign className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs relative overflow-hidden flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">Выручка Playerok</span>
                    <h3 className="text-2xl font-black font-mono text-blue-600 mt-1">{globalStats.totalNetRevenue.toLocaleString('ru-RU')} <span className="text-blue-400 text-base">₽</span></h3>
                    <div className="text-[9px] text-slate-450 mt-1 uppercase font-medium">{globalStats.totalSoldUnits} шт. успешно продано</div>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs relative overflow-hidden flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">Реальная прибыль</span>
                    <h3 className={`text-2xl font-black font-mono mt-1 ${globalStats.totalRealizedProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {globalStats.totalRealizedProfit >= 0 ? '+' : ''}{globalStats.totalRealizedProfit.toLocaleString('ru-RU')} <span className="text-emerald-500 text-base">₽</span>
                    </h3>
                    <div className="text-[9px] text-slate-450 mt-1 uppercase font-medium">Окупаемость: {globalStats.totalInvested > 0 ? ((globalStats.totalNetRevenue / globalStats.totalInvested) * 100).toFixed(0) : '0'}%</div>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                    <LineChart className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs relative overflow-hidden flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">Остатки (склад)</span>
                    <h3 className="text-2xl font-black font-mono text-amber-600 mt-1">{globalStats.totalStockUnits} <span className="text-amber-500 text-base">шт.</span></h3>
                    <div className="text-[9px] text-slate-450 mt-1 uppercase font-medium">Потенциал прибыли: +{globalStats.warehousePotentialProfit.toLocaleString('ru-RU')} ₽</div>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-500 rounded-lg">
                    <Package className="w-5 h-5" />
                  </div>
                </div>

              </div>

              {/* PRODUCTS SPLIT GRID: TABLE [2/3] + FORM [1/3] */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* 1. Products Table Area */}
                <div className="xl:col-span-2 space-y-6">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    
                    <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">Таблица лотов</span>
                        <span className="text-[11px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono">
                          {processedItems.length} из {items.length} видов
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Сортировка: нажмите на заголовки таблицы</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      {processedItems.length === 0 ? (
                        <div className="p-16 text-center text-slate-400">
                          <Package className="w-10 h-10 mx-auto stroke-1 text-slate-300 mb-2" />
                          <p className="text-sm font-bold text-slate-700">На вашем складе нет лотов</p>
                          <p className="text-xs text-slate-550 mt-1">Добавьте новую карточку товара на склад с помощью формы справа.</p>
                        </div>
                      ) : (
                        <table className="min-w-full text-left border-collapse table-auto md:table-fixed text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-150 select-none text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <th onClick={() => handleSortClick('name')} className="px-4 py-3 cursor-pointer hover:bg-slate-100 align-middle transition-colors w-64">
                                Товар <span className="font-mono">{sortKey === 'name' ? (sortDir === 1 ? '▲' : '▼') : '⬍'}</span>
                              </th>
                              <th onClick={() => handleSortClick('status')} className="px-3 py-3 cursor-pointer hover:bg-slate-100 align-middle text-center transition-colors w-24">
                                Статус <span className="font-mono">{sortKey === 'status' ? (sortDir === 1 ? '▲' : '▼') : '⬍'}</span>
                              </th>
                              <th onClick={() => handleSortClick('quantity')} className="px-3 py-3 cursor-pointer hover:bg-slate-100 align-middle text-center transition-colors w-32">
                                В наличии <span className="font-mono">{sortKey === 'quantity' ? (sortDir === 1 ? '▲' : '▼') : '⬍'}</span>
                              </th>
                              <th onClick={() => handleSortClick('soldCount')} className="px-3 py-3 cursor-pointer hover:bg-slate-100 align-middle text-center transition-colors w-28">
                                Продажи <span className="font-mono">{sortKey === 'soldCount' ? (sortDir === 1 ? '▲' : '▼') : '⬍'}</span>
                              </th>
                              <th onClick={() => handleSortClick('buy')} className="px-3 py-3 cursor-pointer hover:bg-slate-100 align-middle text-center transition-colors w-24">
                                Закупка <span className="font-mono">{sortKey === 'buy' ? (sortDir === 1 ? '▲' : '▼') : '⬍'}</span>
                              </th>
                              <th onClick={() => handleSortClick('sell')} className="px-3 py-3 cursor-pointer hover:bg-slate-100 align-middle text-center transition-colors w-24">
                                Продажа <span className="font-mono">{sortKey === 'sell' ? (sortDir === 1 ? '▲' : '▼') : '⬍'}</span>
                              </th>
                              <th onClick={() => handleSortClick('spent')} className="px-3 py-3 cursor-pointer hover:bg-slate-100 align-middle text-center transition-colors w-28">
                                Потрачено <span className="font-mono">{sortKey === 'spent' ? (sortDir === 1 ? '▲' : '▼') : '⬍'}</span>
                              </th>
                              <th onClick={() => handleSortClick('margin')} className="px-3 py-3 cursor-pointer hover:bg-slate-100 align-middle text-center transition-colors w-24">
                                Маржа <span className="font-mono">{sortKey === 'margin' ? (sortDir === 1 ? '▲' : '▼') : '⬍'}</span>
                              </th>
                              <th className="px-4 py-3 text-right w-36">Действие</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {processedItems.map(it => {
                              const margin = getItemMargin(it);
                              const spendOnItem = getItemSpent(it);
                              const totalProfitRefunded = it.soldCount * margin;
                              const priceAfterComm = it.sell * ((100 - it.comm) / 100);

                              return (
                                <tr key={it.id} className="hover:bg-slate-50/50 transition-colors">
                                  
                                  {/* Name cell */}
                                  <td className="px-4 py-3.5 max-w-xs">
                                    <span className="font-bold text-slate-800 block line-clamp-2 leading-snug">{it.name}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                        {it.cat}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono">ID: {it.id}</span>
                                    </div>
                                  </td>

                                  {/* Status button toggle */}
                                  <td className="px-3 py-3.5 text-center">
                                    <button
                                      type="button"
                                      onClick={() => toggleItemStatus(it.id)}
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer select-none transition-transform active:scale-95 leading-none ${
                                        it.status === 'active'
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
                                          : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                                      }`}
                                    >
                                      <span className={`w-1 h-1 rounded-full ${it.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                                      {it.status === 'active' ? 'Продаётся' : 'Пауза'}
                                    </button>
                                  </td>

                                  {/* Quantity inline micro counter */}
                                  <td className="px-3 py-3.5 text-center">
                                    <div className="inline-flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                                      <button
                                        onClick={() => adjustItemQuantity(it.id, -1)}
                                        className="p-1 rounded bg-white text-slate-500 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                                      >
                                        <Minus className="w-2.5 h-2.5" />
                                      </button>
                                      <span className={`w-7 font-extrabold font-mono text-center text-sm ${it.quantity === 0 ? 'text-rose-500' : 'text-slate-800'}`}>
                                        {it.quantity}
                                      </span>
                                      <button
                                        onClick={() => adjustItemQuantity(it.id, 1)}
                                        className="p-1 rounded bg-white text-slate-500 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                                      >
                                        <Plus className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  </td>

                                  {/* Sales stats columns */}
                                  <td className="px-3 py-3.5 text-center font-mono">
                                    <div className="font-extrabold text-slate-900">{it.soldCount} шт.</div>
                                    <div className="text-[10px] font-bold text-emerald-600">+{totalProfitRefunded.toFixed(0)} ₽</div>
                                  </td>

                                  {/* Retail pricing details */}
                                  <td className="px-3 py-3.5 text-center font-mono text-slate-600">
                                    {it.buy > 0 ? `${it.buy.toLocaleString('ru-RU')} ₽` : '—'}
                                  </td>

                                  <td className="px-3 py-3.5 text-center font-mono font-extrabold text-slate-900">
                                    <div>{it.sell.toLocaleString('ru-RU')} ₽</div>
                                    <div className="text-[9px] text-slate-400 font-normal">Чистыми: {priceAfterComm.toFixed(0)}</div>
                                  </td>

                                  {/* Expenses capital column */}
                                  <td className="px-3 py-3.5 text-center font-mono bg-amber-500/5">
                                    <div className="text-amber-900 font-extrabold">{spendOnItem.toLocaleString('ru-RU')} ₽</div>
                                    <div className="text-[9px] text-slate-400 font-sans mt-0.5">({it.quantity + it.soldCount} шт)</div>
                                  </td>

                                  {/* Margin */}
                                  <td className="px-3 py-3.5 text-center font-mono">
                                    <span className={`font-extrabold ${margin >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                      {margin >= 0 ? '+' : ''}{margin.toFixed(0)} ₽
                                    </span>
                                    <div className="text-[9px] text-slate-400 font-sans mt-0.5">({it.sell > 0 ? `${((margin / it.sell) * 100).toFixed(0)}%` : '0%'})</div>
                                  </td>

                                  {/* Row action operations widget */}
                                  <td className="px-4 py-3.5 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      
                                      <button
                                        onClick={() => handleRecordSale(it.id)}
                                        disabled={it.quantity <= 0}
                                        className={`h-7 px-2.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer shadow-xs border ${
                                          it.quantity > 0
                                            ? 'bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-600'
                                            : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                        }`}
                                      >
                                        ПРОДАТЬ
                                      </button>

                                      <button
                                        onClick={() => handleOpenEditModal(it)}
                                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-250 cursor-pointer"
                                        title="Редактировать параметры"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        onClick={() => handleDeleteItem(it.id)}
                                        className="p-1.5 rounded-lg bg-slate-150 hover:bg-rose-100 hover:text-rose-600 text-slate-500 cursor-pointer border border-transparent transition-colors"
                                        title="Удалить лот"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>

                                    </div>
                                  </td>

                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>

                    <div className="px-5 py-3 border-t bg-slate-50/50 text-slate-400 flex items-center gap-1 text-[10px]">
                      <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Для смены статуса лота "На паузе" / "Продаётся", кликните на его бейдж статуса. Сбросить замеры можно в Настройках.</span>
                    </div>

                  </div>

                  {/* INVENTORY LOGS ROW CONTAINER */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-emerald-500" />
                        <div>
                          <h4 className="font-bold text-sm text-slate-800">Лог Завершённых Выдач</h4>
                          <p className="text-[10px] text-slate-400">Сумма всех выполненных выдач за текущую сессию</p>
                        </div>
                      </div>
                      <span className="text-xs bg-slate-150 px-2 py-0.5 rounded font-mono font-bold text-slate-600">Всего продаж: {salesLogs.length} шт.</span>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {salesLogs.length === 0 ? (
                        <div className="py-6 text-center text-slate-400 text-xs">
                          Выдачи еще не зарегистрированы. Попробуйте нажать кнопку "ПРОДАТЬ" в таблице выше!
                        </div>
                      ) : (
                        salesLogs.map(log => (
                          <div key={log.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-150">
                            <div className="flex items-start gap-2.5">
                              <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] text-white mt-0.5">✓</span>
                              <div>
                                <span className="text-xs font-bold text-slate-800 block line-clamp-1">{log.itemName}</span>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                  <span>Выручка: {log.sellPrice} ₽</span>
                                  <span>•</span>
                                  <span>Закупка: {log.buyPrice} ₽ (Комиссия: {log.commission}%)</span>
                                </div>
                                <span className="text-[9px] text-slate-400 block font-mono mt-0.5 uppercase tracking-wide">{log.date}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                              <div className="text-right font-mono text-xs">
                                <span className="font-bold text-emerald-600 block">+{log.profit.toFixed(1)} ₽</span>
                                <span className="text-[9px] text-slate-400 block">чистыми</span>
                              </div>
                              <button
                                onClick={() => handleUndoSale(log.id)}
                                className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-500 cursor-pointer transition-colors"
                                title="Отменить продажу"
                              >
                                <Undo2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                {/* 2. Products addition card form side (1/3 width) */}
                <div className="space-y-6">
                  
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
                    <div 
                      className="flex items-center justify-between cursor-pointer border-b pb-3 select-none"
                      onClick={() => setIsFormOpen(!isFormOpen)}
                    >
                      <div className="flex items-center gap-2 text-slate-850">
                        <PlusCircle className="w-4.5 h-4.5 text-blue-600" />
                        <h3 className="font-black text-xs uppercase text-slate-800 tracking-wider">Добавить товар на склад</h3>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isFormOpen ? 'rotate-180' : ''}`} />
                    </div>

                    <AnimatePresence>
                      {isFormOpen && (
                        <motion.form
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          onSubmit={handleAddItem}
                          className="space-y-4 text-xs font-semibold text-slate-650"
                        >
                          <div className="space-y-1">
                            <label className="block text-slate-500">Название товара *</label>
                            <input
                              type="text"
                              required
                              placeholder="Например, Minecraft Лицензия Java"
                              value={fName}
                              onChange={e => setFName(e.target.value)}
                              className="w-full h-9.5 px-3 bg-slate-50 border border-slate-250 rounded-lg text-slate-900 outline-none focus:border-blue-500 text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-slate-500">Полка склада</label>
                            <select
                              value={fCat}
                              onChange={e => setFCat(e.target.value)}
                              className="w-full h-9.5 px-2 bg-slate-50 border border-slate-250 rounded-lg text-slate-950 outline-none cursor-pointer text-xs"
                            >
                              <option value="Игровые товары">Игровые товары</option>
                              <option value="Telegram">Telegram</option>
                              <option value="Steam">Steam</option>
                              <option value="SMM">SMM</option>
                              <option value="FunPay">FunPay</option>
                              <option value="Другое">Другое</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="block text-slate-500 text-[11px]">Закупка (₽/ед.)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0"
                                value={fBuy}
                                onChange={e => setFBuy(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                                className="w-full h-9.5 px-3 bg-slate-50 border border-slate-250 rounded-lg text-slate-900 outline-none font-mono text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-slate-500 text-[11px]">Продажа (₽/ед.)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0"
                                value={fSell}
                                onChange={e => setFSell(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                                className="w-full h-9.5 px-3 bg-slate-50 border border-slate-250 rounded-lg text-slate-900 outline-none font-mono text-xs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="block text-slate-500 mb-1">Комиссия</label>
                              <button
                                type="button"
                                onClick={() => setFComm(fComm === 10 ? 20 : 10)}
                                className="w-full h-9.5 px-2.5 bg-slate-50 border border-slate-250 rounded-lg flex items-center justify-between text-xs"
                              >
                                <span className="font-mono text-slate-800 font-bold">{fComm}%</span>
                                <span className="text-[10px] text-blue-600 underline font-bold">Изменить</span>
                              </button>
                            </div>
                            
                            <div className="space-y-1">
                              <label className="block text-amber-600 font-bold">Запас склада (шт)</label>
                              <input
                                type="number"
                                min="0"
                                value={fQuantity}
                                onChange={e => setFQuantity(Math.max(0, parseInt(e.target.value || '0')))}
                                className="w-full h-9.5 px-3 bg-amber-500/5 border border-amber-350 rounded-lg text-slate-950 font-mono font-bold outline-none text-xs"
                              />
                            </div>
                          </div>

                          <div className="p-3.5 bg-slate-50 rounded-xl space-y-2.5 border border-slate-150">
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Финансовая развёртка</div>
                            <div className="flex justify-between items-center text-xs text-slate-500">
                              <span>Ком. сборы (Playerok):</span>
                              <span className="font-mono font-bold text-slate-800">{fComm}%</span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-slate-500">
                              <span>Затраты на всю партию:</span>
                              <span className="font-mono font-bold text-slate-800">{formMarginPreview.spentNewBatch.toLocaleString('ru-RU')} ₽</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 mt-1 border-t text-xs">
                              <span className="font-bold text-slate-800">Маржа чистыми (1 шт):</span>
                              <span className={`font-mono font-black ${formMarginPreview.margin >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {formMarginPreview.margin >= 0 ? '+' : ''}{formMarginPreview.margin.toFixed(0)} ₽
                              </span>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase rounded-lg shadow-sm cursor-pointer transition-colors"
                          >
                            Загрузить на Склад
                          </button>

                        </motion.form>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-500 space-y-2">
                    <p className="font-bold text-slate-700">⚠️ Системное Примечание:</p>
                    <p className="leading-relaxed">
                      Эта таблица синхронизирует и рассчитывает балансы локального склада. Опция "Продать" помогает мгновенно списать единицу со склада и рассчитать заработок, не дожидаясь пока сделка закроется в ручном режиме.
                    </p>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-rose-600 underline text-[10px] font-bold mt-1 inline-block hover:text-rose-700"
                    >
                      Сбросить данные склада и отчетность за сессию
                    </button>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 2: CHATS TAB VIEW */}
          {activeMainTab === 'chats' && <ChatsTab viewer={viewer} />}

          {/* TAB 3: DEALS VIEW */}
          {activeMainTab === 'deals' && <DealsTab />}

          {/* TAB 4: SETTINGS VIEW */}
          {activeMainTab === 'settings' && <SettingsTab />}

        </main>
      </div>

      {/* --- RE-EDIT POPUP PARAMETERS MODAL --- */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingItem(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs" 
            />

            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden relative z-10 text-xs font-semibold"
            >
              <div className="px-5 py-4 border-b flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-blue-600" />
                  <h3 className="font-extrabold text-slate-800">Изменить параметры лота</h3>
                </div>
                <button 
                  onClick={() => setEditingItem(null)}
                  className="p-1.5 rounded-full hover:bg-slate-150 text-slate-400 hover:text-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-slate-500 block">Название товара</label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-500 block">Полка</label>
                    <select
                      value={editingItem.cat}
                      onChange={(e) => setEditingItem({ ...editingItem, cat: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none cursor-pointer"
                    >
                      {uniqueCategories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 block">Статус</label>
                    <select
                      value={editingItem.status}
                      onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as ItemStatus })}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none cursor-pointer"
                    >
                      <option value="active">Продаётся</option>
                      <option value="pause">На паузе</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-amber-600 block font-bold">Остаток на складе (шт.)</label>
                    <input
                      type="number"
                      min="0"
                      value={editingItem.quantity}
                      onChange={(e) => setEditingItem({ ...editingItem, quantity: Math.max(0, parseInt(e.target.value || '0')) })}
                      className="w-full h-10 px-3 bg-amber-500/5 border border-amber-300 rounded-lg text-slate-900 font-bold outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-emerald-600 block font-bold">Продано штук</label>
                    <input
                      type="number"
                      min="0"
                      value={editingItem.soldCount}
                      onChange={(e) => setEditingItem({ ...editingItem, soldCount: Math.max(0, parseInt(e.target.value || '0')) })}
                      className="w-full h-10 px-3 bg-emerald-500/5 border border-emerald-300 rounded-lg text-slate-900 font-bold outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-500 block">Закупка (₽)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingItem.buy}
                      onChange={(e) => setEditingItem({ ...editingItem, buy: Math.max(0, Number(e.target.value || 0)) })}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 block">Продажа (₽)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingItem.sell}
                      onChange={(e) => setEditingItem({ ...editingItem, sell: Math.max(0, Number(e.target.value || 0)) })}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 block">Комиссия Playerok</label>
                  <select
                    value={editingItem.comm}
                    onChange={(e) => setEditingItem({ ...editingItem, comm: Number(e.target.value) })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none cursor-pointer"
                  >
                    <option value={10}>10% (Микрозаказы)</option>
                    <option value={20}>20% (Стандарт)</option>
                  </select>
                </div>

                {/* Financial overview */}
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider leading-none mb-1">ФИНАНСОВЫЙ БАЛАНС</span>
                    <span className="text-slate-500 font-medium">Затраты на этот лот:</span>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-slate-950">
                      {getItemSpent(editingItem).toLocaleString('ru-RU')} ₽
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Маржа с 1 шт.: <strong className="text-emerald-600 font-mono">+{getItemMargin(editingItem).toFixed(0)} ₽</strong>
                    </div>
                  </div>
                </div>

              </div>

              <div className="px-5 py-3.5 bg-slate-50 border-t flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 h-9 text-slate-600 hover:text-slate-950 bg-white border border-slate-250 text-xs rounded-lg font-semibold cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedItem}
                  className="px-4 h-9 bg-slate-950 hover:bg-slate-850 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Сохранить
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- REUSABLE CONFIRM DIALOG MODAL --- */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs" 
            />

            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden relative z-10 text-xs font-semibold"
            >
              <div className="p-5 text-center space-y-4">
                <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${confirmModal.isDanger ? 'bg-rose-50 text-rose-600 border' : 'bg-amber-50 text-amber-600 border'}`}>
                  <Info className="w-6 h-6" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-900">{confirmModal.title}</h3>
                  <p className="text-slate-500 text-[11px] leading-relaxed font-normal">{confirmModal.message}</p>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-slate-50 border-t flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="px-4 h-9 rounded-lg text-slate-600 hover:text-slate-900 bg-white border border-slate-250 text-xs cursor-pointer font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className={`px-4 h-9 rounded-lg text-white text-xs font-bold cursor-pointer transition-opacity duration-150 ${confirmModal.isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                >
                  {confirmModal.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
