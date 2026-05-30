'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const STEPS = ['選擇服務', '選擇設計師', '選擇時間', '確認預約'];

export default function BookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [selected, setSelected] = useState({ service: null as any, staff: null as any, date: '', time: '' });
  const [form, setForm] = useState({ name: '', phone: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/services').then(r => r.json()).then(setServices);
    fetch('/api/staff').then(r => r.json()).then(setStaff);
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d) { setUser(d.user); setForm(f => ({ ...f, name: d.user.name, phone: d.user.phone || '' })); }
    });
  }, []);

  useEffect(() => {
    if (step === 2 && selected.staff && selected.date && selected.service) {
      fetch(`/api/appointments/available-slots?staffId=${selected.staff.id}&date=${selected.date}&duration=${selected.service.duration}`)
        .then(r => r.json()).then(setSlots);
    }
  }, [step, selected.staff, selected.date, selected.service]);

  const today = new Date().toISOString().split('T')[0];
  const calDays = () => {
    const days = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const submit = async () => {
    setLoading(true); setError('');
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: form.name,
        customer_phone: form.phone,
        staff_id: selected.staff.id,
        service_id: selected.service.id,
        date: selected.date,
        start_time: selected.time,
        notes: form.notes
      })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || '預約失敗'); return; }
    router.push('/customer/my-appointments?success=1');
  };

  const progressDots = STEPS.map((_, i) => (
    <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? '' : 'bg-gray-200'}`}
      style={i <= step ? { background: '#8B7355' } : {}} />
  ));

  return (
    <div className="min-h-screen" style={{ background: '#F8F5F0' }}>
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => step > 0 ? setStep(s => s - 1) : router.back()} className="text-gray-600 text-xl">‹</button>
          <h1 className="font-semibold text-gray-800">選擇預約時間</h1>
        </div>
        <div className="flex gap-1">{progressDots}</div>
        <div className="text-xs text-center text-gray-400 mt-1">{STEPS[step]}</div>
      </div>

      <div className="p-4">
        {/* Step 0: Choose service */}
        {step === 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-700">選擇服務</h2>
            {services.map(s => (
              <button key={s.id} onClick={() => { setSelected(v => ({ ...v, service: s })); setStep(1); }}
                className={`w-full bg-white rounded-xl p-4 shadow-sm text-left transition-all hover:shadow ${selected.service?.id === s.id ? 'ring-2' : ''}`}
                style={selected.service?.id === s.id ? { outline: `2px solid #8B7355` } : {}}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-sm text-gray-500 mt-0.5">{s.description}</div>
                    <div className="text-xs text-gray-400 mt-1">時長：{s.duration} 分鐘</div>
                  </div>
                  <div className="font-semibold text-sm" style={{ color: '#8B7355' }}>NT$ {s.price.toLocaleString()}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 1: Choose staff */}
        {step === 1 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-700">選擇設計師</h2>
            {staff.map(s => (
              <button key={s.id} onClick={() => { setSelected(v => ({ ...v, staff: s })); setStep(2); }}
                className={`w-full bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 hover:shadow transition-all ${selected.staff?.id === s.id ? 'outline' : ''}`}
                style={selected.staff?.id === s.id ? { outline: `2px solid #8B7355` } : {}}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: '#8B7355' }}>
                  {s.name[0].toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-sm text-gray-400">@{s.username}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Choose date & time */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-3">選擇日期</h2>
              {/* Quick date buttons */}
              <div className="flex gap-2 mb-3">
                {calDays().slice(0, 3).map(d => (
                  <button key={d} onClick={() => setSelected(v => ({ ...v, date: d, time: '' }))}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${selected.date === d ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
                    style={selected.date === d ? { background: '#8B7355' } : {}}>
                    {d === today ? '今天' : d === calDays()[1] ? '明天' : `週${['日','一','二','三','四','五','六'][new Date(d).getDay()]} ${d.slice(5)}`}
                  </button>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-1">
                {['日','一','二','三','四','五','六'].map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const firstDay = new Date(today);
                  firstDay.setDate(1);
                  const blanks = firstDay.getDay();
                  const daysInMonth = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0).getDate();
                  const cells = [];
                  for (let i = 0; i < blanks; i++) cells.push(<div key={`b${i}`} />);
                  for (let d = 1; d <= daysInMonth; d++) {
                    const dateStr = `${today.slice(0,7)}-${String(d).padStart(2,'0')}`;
                    const isPast = dateStr < today;
                    const isSelected = dateStr === selected.date;
                    cells.push(
                      <button key={d} disabled={isPast} onClick={() => setSelected(v => ({ ...v, date: dateStr, time: '' }))}
                        className={`aspect-square rounded-full text-sm transition-colors flex items-center justify-center ${isPast ? 'text-gray-300 cursor-not-allowed' : isSelected ? 'text-white' : 'hover:bg-gray-100'}`}
                        style={isSelected ? { background: '#8B7355' } : {}}>
                        {d}
                      </button>
                    );
                  }
                  return cells;
                })()}
              </div>
            </div>

            {selected.date && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h2 className="font-semibold text-gray-700 mb-3">可預約時段 ({selected.date})</h2>
                {slots.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">此日期無可用時段</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map(slot => (
                      <button key={slot} onClick={() => setSelected(v => ({ ...v, time: slot }))}
                        className={`py-2.5 rounded-xl text-sm font-medium transition-colors border ${selected.time === slot ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 hover:border-amber-700'}`}
                        style={selected.time === slot ? { background: '#8B7355', borderColor: '#8B7355' } : {}}>
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selected.date && selected.time && (
              <button onClick={() => setStep(3)} className="w-full py-4 rounded-2xl text-white font-semibold shadow-lg" style={{ background: '#8B7355' }}>
                下一步，填寫顧客資訊
              </button>
            )}
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-3">預約摘要</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">服務</span><span className="font-medium">{selected.service?.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">設計師</span><span className="font-medium">{selected.staff?.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">日期</span><span className="font-medium">{selected.date}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">時間</span><span className="font-medium">{selected.time}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">時長</span><span className="font-medium">{selected.service?.duration} 分鐘</span></div>
                <div className="flex justify-between border-t border-gray-100 pt-2 mt-2"><span className="text-gray-500">費用</span><span className="font-semibold" style={{ color: '#8B7355' }}>NT$ {selected.service?.price.toLocaleString()}</span></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <h2 className="font-semibold text-gray-700">顧客資訊</h2>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm" placeholder="姓名 *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              <input className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm" placeholder="電話 *" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
              <textarea className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm" placeholder="備註 (選填)" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button onClick={submit} disabled={loading || !form.name || !form.phone} className="w-full py-4 rounded-2xl text-white font-semibold shadow-lg transition-opacity" style={{ background: '#8B7355', opacity: loading || !form.name || !form.phone ? 0.6 : 1 }}>
              {loading ? '預約中...' : '確認預約'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
