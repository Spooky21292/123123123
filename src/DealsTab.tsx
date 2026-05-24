import React, { useState, useEffect } from 'react';
import { ShoppingCart, ExternalLink, CheckCircle, Clock, XCircle, AlertCircle, RefreshCw, CircleDollarSign } from 'lucide-react';
import { PlayerokDealFull } from './types';
import { fetchDeals } from './api';

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  COMPLETED: { label: 'Завершена', color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/60', icon: <CheckCircle className="w-3 h-3" /> },
  PAID: { label: 'Оплачена', color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/60', icon: <Clock className="w-3 h-3" /> },
  CANCELLED: { label: 'Отменена', color: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/60', icon: <XCircle className="w-3 h-3" /> },
  DISPUTE: { label: 'Спор', color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-750 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/60', icon: <AlertCircle className="w-3 h-3" /> },
  CREATED: { label: 'Создана', color: 'bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-800/60', icon: <Clock className="w-3 h-3" /> },
};

export default function DealsTab() {
  const [deals, setDeals] = useState<PlayerokDealFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    setLoading(true);
    const data = await fetchDeals(50);
    setDeals(data);
    setLoading(false);
  };

  const filteredDeals = filterStatus === 'all' 
    ? deals 
    : deals.filter(d => d.status === filterStatus);

  const completedCount = deals.filter(d => d.status === 'COMPLETED').length;
  const paidCount = deals.filter(d => d.status === 'PAID').length;
  const cancelledCount = deals.filter(d => d.status === 'CANCELLED').length;
  const totalRevenue = deals
    .filter(d => d.status === 'COMPLETED')
    .reduce((sum, d) => sum + (d.totalPrice || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Dynamic Summary Micro-Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-[#141412] rounded-xl p-5 border border-slate-200 dark:border-zinc-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Всего заказов</p>
            <h3 className="text-2xl font-extrabold font-mono text-slate-800 dark:text-zinc-100 mt-1">{deals.length}</h3>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-lg">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#141412] rounded-xl p-5 border border-slate-200 dark:border-zinc-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-wider text-emerald-500 uppercase">Завершено с успехом</p>
            <h3 className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{completedCount}</h3>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-lg">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#141412] rounded-xl p-5 border border-slate-200 dark:border-zinc-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-wider text-blue-500 uppercase">Ожидают подтверждения</p>
            <h3 className="text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400 mt-1">{paidCount}</h3>
          </div>
          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/20 text-blue-500 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#141412] rounded-xl p-5 border border-slate-200 dark:border-zinc-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-wider text-indigo-500 uppercase">Чистая выручка</p>
            <h3 className="text-2xl font-extrabold font-mono text-slate-800 dark:text-zinc-100 mt-1">
              {totalRevenue.toLocaleString('ru-RU')} <span className="text-slate-400 text-sm">₽</span>
            </h3>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-lg">
            <CircleDollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Primary Table layout */}
      <div className="bg-white dark:bg-[#141412] rounded-xl border border-slate-200 dark:border-zinc-800 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#181816]/30">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4.5 h-4.5 text-blue-600" />
            <span className="font-bold text-sm text-slate-800 dark:text-zinc-200">Таблица Сделок (Продажи)</span>
            <span className="text-xs bg-slate-100 dark:bg-zinc-800 text-slate-500 px-2 py-0.5 rounded-full font-mono font-bold">{filteredDeals.length}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="h-8 px-2.5 text-xs bg-white dark:bg-[#1a1a16] border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-700 dark:text-zinc-300 cursor-pointer focus:outline-none"
            >
              <option value="all">Все статусы</option>
              <option value="COMPLETED">Завершённые</option>
              <option value="PAID">Оплаченные</option>
              <option value="CANCELLED">Отменённые</option>
              <option value="DISPUTE">Споры</option>
            </select>
            
            <button
              onClick={loadDeals}
              className="p-1.5 rounded-lg bg-white dark:bg-[#1a1a16] border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-amber-300 transition-colors cursor-pointer"
              title="Обновить"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">Синхронизация заказов с сервером Playerok...</div>
        ) : filteredDeals.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <ShoppingCart className="w-10 h-10 mx-auto stroke-1 text-slate-300 dark:text-zinc-700 mb-3" />
            <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">Список заказов пуст</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Покупатели еще не оформили сделки на ваши товары, либо токен авторизации в Настройках неактивен.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#181816]/70 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-850">
                  <th className="px-5 py-3">Товар покупателя</th>
                  <th className="px-4 py-3 text-center">Статус</th>
                  <th className="px-4 py-3 text-center">Покупатель</th>
                  <th className="px-4 py-3 text-center">Сделка</th>
                  <th className="px-4 py-3 text-center">Дата оформления</th>
                  <th className="px-4 py-3 text-center">Покупатель</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 text-xs text-slate-700 dark:text-zinc-300 font-medium">
                {filteredDeals.map(deal => {
                  const statusInfo = STATUS_MAP[deal.status] || STATUS_MAP.CREATED;
                  return (
                    <tr key={deal.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1f1f1b]/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {deal.product?.images?.[0]?.url ? (
                            <img src={deal.product.images[0].url} className="w-9 h-9 rounded-lg object-cover border" alt="" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                              <ShoppingCart className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-800 dark:text-zinc-150 block truncate max-w-xs">{deal.product?.name || 'Без названия'}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">ID: {deal.id}</span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${statusInfo.color}`}>
                          {statusInfo.icon}
                          <strong>{statusInfo.label}</strong>
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex items-center gap-2">
                          {deal.buyer?.avatar?.url ? (
                            <img src={deal.buyer.avatar.url} className="w-5.5 h-5.5 rounded-full object-cover border" alt="" />
                          ) : (
                            <div className="w-5.5 h-5.5 rounded-full bg-slate-150 flex items-center justify-center font-bold text-[10px]">
                              U
                            </div>
                          )}
                          <span className="text-slate-800 dark:text-zinc-350">{deal.buyer?.username || '—'}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-950 dark:text-zinc-100 text-[13px]">
                        {deal.totalPrice ? `${deal.totalPrice.toLocaleString('ru-RU')} ₽` : '—'}
                      </td>

                      <td className="px-4 py-3.5 text-center text-slate-400 font-mono text-[10px]">
                        {deal.createdAt ? new Date(deal.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {deal.product?.slug ? (
                          <a
                            href={`https://playerok.com/products/${deal.product.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Открыть лот
                          </a>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
