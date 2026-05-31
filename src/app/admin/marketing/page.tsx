'use client';
import { useState, useEffect } from 'react';
import { IconPlus, IconX } from '@/components/ui/Icons';

export default function MarketingPage() {
  const [data, setData] = useState<{ tasks: any[], logs: any[] }>({ tasks: [], logs: [] });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'reactivation', trigger_days: 60, message: '', discount_percent: 0 });
  const [running, setRunning] = useState<number | null>(null);
  const [runResult, setRunResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = () => fetch('/api/marketing').then(r => r.json()).then(setData);
  useEffect(() => { fetchData(); }, []);

  const runTask = async (taskId: number) => {
    setRunning(taskId); setRunResult(null);
    const res = await fetch('/api/marketing/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task_id: taskId }) });
    const result = await res.json();
    setRunning(null); setRunResult(result); fetchData();
  };

  const toggleActive = async (task: any) => {
    await fetch(`/api/marketing/${task.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: task.is_active ? 0 : 1 }) });
    fetchData();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    await fetch('/api/marketing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setLoading(false); setShowForm(false); fetchData();
  };

  const TYPE_LABELS: Record<string, string> = { reactivation: '回流喚醒', birthday: '生日禮遇', custom: '自訂推播' };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">自動行銷</h1>
          <p className="text-sm text-gray-400 mt-0.5">自動偵測沉睡顧客與生日，發送個人化訊息</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm text-white rounded-lg" style={{ background: 'var(--primary)' }}>
          <IconPlus size={16} color="white" /> 新增任務
        </button>
      </div>

      {runResult && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-green-700 font-medium text-sm">發送完成！共觸及 {runResult.sent} 位顧客</p>
          {runResult.targets?.length > 0 && <p className="text-green-600 text-xs mt-1">{runResult.targets.join('、')}</p>}
        </div>
      )}

      {/* Tasks */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.tasks.map(task => (
          <div key={task.id} className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-colors ${task.is_active ? '' : 'opacity-60'}`}
            style={{ borderColor: task.is_active ? 'var(--primary)' : '#E5E7EB' }}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#F3F4F6', color: '#6B7280' }}>{TYPE_LABELS[task.type]}</span>
              <button onClick={() => toggleActive(task)} className={`text-xs px-2 py-0.5 rounded-full font-medium ${task.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                {task.is_active ? '啟用中' : '已停用'}
              </button>
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">{task.name}</h3>
            {task.trigger_days && <p className="text-xs text-gray-400 mb-2">{task.trigger_days} 天未回訪自動觸發</p>}
            {task.discount_percent > 0 && <p className="text-xs text-amber-600 mb-2">折扣：{task.discount_percent}% OFF</p>}
            <p className="text-xs text-gray-500 mb-4 line-clamp-2">{task.message}</p>
            {task.last_run && <p className="text-xs text-gray-400 mb-3">上次執行：{task.last_run?.slice(0,10)}</p>}
            <button onClick={() => runTask(task.id)} disabled={running === task.id || !task.is_active}
              className="w-full py-2 text-sm rounded-xl text-white font-medium transition-opacity"
              style={{ background: 'var(--primary)', opacity: running === task.id || !task.is_active ? 0.5 : 1 }}>
              {running === task.id ? '發送中...' : '立即執行'}
            </button>
          </div>
        ))}
      </div>

      {/* Logs */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">發送記錄（最近 50 筆）</h2>
          <span className="text-sm text-gray-400">{data.logs.length} 筆</span>
        </div>
        {data.logs.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">尚無發送記錄</div>
        ) : (
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {data.logs.map(log => (
              <div key={log.id} className="px-5 py-3 flex justify-between items-start gap-3">
                <div>
                  <span className="font-medium text-sm text-gray-700">{log.customer_name}</span>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{log.message}</p>
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0">{log.sent_at?.slice(0,10)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">新增行銷任務</h3>
              <button onClick={() => setShowForm(false)}><IconX size={20} color="#9CA3AF" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-600" placeholder="任務名稱 *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="reactivation">回流喚醒</option>
                <option value="birthday">生日禮遇</option>
                <option value="custom">自訂推播</option>
              </select>
              {form.type === 'reactivation' && (
                <div><label className="text-xs text-gray-500 block mb-1">多少天未回訪觸發</label>
                  <input type="number" min="7" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={form.trigger_days} onChange={e => setForm(f => ({ ...f, trigger_days: Number(e.target.value) }))} /></div>
              )}
              <div>
                <label className="text-xs text-gray-500 block mb-1">訊息內容（{'{name}'} 自動替換顧客姓名）</label>
                <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" rows={3} placeholder="親愛的 {name}，..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required />
              </div>
              <div><label className="text-xs text-gray-500 block mb-1">折扣（%），0 表示無折扣</label>
                <input type="number" min="0" max="100" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={form.discount_percent} onChange={e => setForm(f => ({ ...f, discount_percent: Number(e.target.value) }))} /></div>
              <button type="submit" disabled={loading} className="w-full py-2.5 text-white rounded-lg text-sm font-medium" style={{ background: 'var(--primary)', opacity: loading ? 0.7 : 1 }}>{loading ? '儲存中...' : '建立任務'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
