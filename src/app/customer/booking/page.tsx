'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const STEPS = ['選擇服務', '選擇設計師', '選擇時間', '確認預約'];
const DAY_NAMES = ['日','一','二','三','四','五','六'];

export default function BookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [offDays, setOffDays] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState({ service: null as any, staff: null as any, date: '', time: '' });
  const [form, setForm] = useState({ name: '', phone: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetch('/api/services').then(r => r.json()).then(setServices);
    fetch('/api/staff').then(r => r.json()).then(setStaff);
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d) setForm(f => ({ ...f, name: d.user.name, phone: d.user.phone || '' }));
    });
  }, []);

  // Fetch staff off-days for current month when staff selected
  useEffect(() => {
    if (!selected.staff) return;
    const y = viewMonth.getFullYear();
    const m = String(viewMonth.getMonth() + 1).padStart(2, '0');
    const startDate = `${y}-${m}-01`;
    const lastDay = new Date(y, viewMonth.getMonth() + 1, 0).getDate();
    const endDate = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
    fetch(`/api/staff-schedules?staffId=${selected.staff.id}&startDate=${startDate}&endDate=${endDate}`)
      .then(r => r.json()).then((data: any[]) => {
        const offs = new Set(data.filter(s => s.is_working === 0).map(s => s.date));
        setOffDays(offs);
      });
  }, [selected.staff, viewMonth]);

  // Fetch available slots
  useEffect(() => {
    if (step === 2 && selected.staff && selected.date && selected.service) {
      setSlotsLoading(true);
      setSlots([]);
      fetch(`/api/appointments/available-slots?staffId=${selected.staff.id}&date=${selected.date}&duration=${selected.service.duration}`)
        .then(r => r.json())
        .then(d => { setSlots(Array.isArray(d) ? d : []); })
        .finally(() => setSlotsLoading(false));
    }
  }, [step, selected.staff, selected.date, selected.service]);

  const prevMonth = () => setViewMonth(d => new Date(d.getFullYear(), d.getMonth() - 1));
  const nextMonth = () => setViewMonth(d => new Date(d.getFullYear(), d.getMonth() + 1));

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true); setCouponError(''); setCouponResult(null);
    const res = await fetch('/api/coupons/validate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode.trim(), service_id: selected.service?.id, amount: selected.service?.price }),
    });
    const data = await res.json();
    setCouponLoading(false);
    if (!res.ok) { setCouponError(data.error || '無效優惠碼'); return; }
    setCouponResult(data);
  };

  const removeCoupon = () => { setCouponResult(null); setCouponCode(''); setCouponError(''); };

  const submit = async () => {
    setLoading(true); setError('');
    const res = await fetch('/api/appointments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: form.name, customer_phone: form.phone,
        staff_id: selected.staff.id, service_id: selected.service.id,
        date: selected.date, start_time: selected.time, notes: form.notes,
        coupon_id: couponResult?.coupon_id || null,
        discount_amount: couponResult?.discount || 0,
      })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || '預約失敗'); return; }
    router.push('/customer/my-appointments?success=1');
  };

  // Calendar cells
  const renderCalendar = () => {
    const y = viewMonth.getFullYear();
    const m = viewMonth.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(<div key={`b${i}`} />);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isPast = dateStr < today;
      const isOff = offDays.has(dateStr);
      const isSelected = dateStr === selected.date;
      const isToday = dateStr === today;
      cells.push(
        <button key={d} disabled={isPast || isOff}
          onClick={() => setSelected(v => ({ ...v, date: dateStr, time: '' }))}
          className={`aspect-square rounded-full text-sm flex items-center justify-center relative transition-all
            ${isPast ? 'text-gray-200 cursor-not-allowed' :
              isOff ? 'text-gray-300 cursor-not-allowed line-through' :
              isSelected ? 'text-white font-semibold' :
              'hover:bg-amber-50 text-gray-700'}`}
          style={isSelected ? { background: '#8B7355' } : isToday && !isSelected ? { border: '2px solid #8B7355', color: '#8B7355' } : {}}>
          {d}
          {isOff && !isPast && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] text-gray-300">休</span>}
        </button>
      );
    }
    return cells;
  };

  return (
    <div className="min-h-screen" style={{ background: '#F8F5F0' }}>
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => step > 0 ? setStep(s => s - 1) : router.back()} className="text-gray-600 text-xl">‹</button>
          <h1 className="font-semibold text-gray-800 flex-1">線上預約</h1>
          <span className="text-xs text-gray-400">{step + 1} / {STEPS.length}</span>
        </div>
        <div className="flex gap-1">{STEPS.map((_, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full transition-colors" style={{ background: i <= step ? '#8B7355' : '#E5E7EB' }} />
        ))}</div>
        <div className="text-xs text-center text-gray-400 mt-1">{STEPS[step]}</div>
      </div>

      <div className="p-4">
        {/* Step 0: Service */}
        {step === 0 && (
          <div className="space-y-3">
            {services.map(s => (
              <button key={s.id} onClick={() => { setSelected(v => ({ ...v, service: s })); setStep(1); }}
                className="w-full bg-white rounded-2xl p-4 shadow-sm text-left transition-all hover:shadow-md active:scale-98"
                style={selected.service?.id === s.id ? { outline: `2px solid #8B7355` } : {}}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{s.name}</div>
                    <div className="text-sm text-gray-500 mt-0.5">{s.description}</div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{s.duration} 分鐘</span>
                      <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{s.category}</span>
                    </div>
                  </div>
                  <div className="font-bold text-base flex-shrink-0 ml-3" style={{ color: '#8B7355' }}>NT$ {s.price.toLocaleString()}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 1: Staff */}
        {step === 1 && (
          <div className="space-y-3">
            {staff.map(s => (
              <button key={s.id} onClick={() => { setSelected(v => ({ ...v, staff: s })); setStep(2); }}
                className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-all"
                style={selected.staff?.id === s.id ? { outline: `2px solid #8B7355` } : {}}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0" style={{ background: '#8B7355' }}>
                  {s.name[0].toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-800">{s.name}</div>
                  <div className="text-sm text-gray-400">美甲設計師</div>
                </div>
                <div className="ml-auto text-gray-300">›</div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Date & time */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">‹</button>
                <span className="font-semibold text-gray-800">
                  {viewMonth.getFullYear()} 年 {viewMonth.getMonth() + 1} 月
                </span>
                <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">›</button>
              </div>
              {/* Day labels */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES.map(d => <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>)}
              </div>
              {/* Calendar */}
              <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
              {offDays.size > 0 && <p className="text-xs text-gray-400 mt-2 text-center">劃線日期為設計師休假</p>}
            </div>

            {selected.date && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h2 className="font-semibold text-gray-700 mb-3">
                  可預約時段
                  <span className="text-sm font-normal text-gray-400 ml-2">{selected.date}</span>
                </h2>
                {slotsLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="w-6 h-6 border-4 rounded-full animate-spin" style={{ borderColor: '#8B7355', borderTopColor: 'transparent' }} />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-400 mb-2">此日期無可用時段</p>
                    <button onClick={() => {/* TODO: waitlist */}} className="text-xs text-blue-500 underline">加入候補名單</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map(slot => (
                      <button key={slot} onClick={() => setSelected(v => ({ ...v, time: slot }))}
                        className="py-2.5 rounded-xl text-sm font-medium transition-all border"
                        style={selected.time === slot
                          ? { background: '#8B7355', color: 'white', borderColor: '#8B7355' }
                          : { borderColor: '#E5E7EB', color: '#374151' }}>
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
              <div className="space-y-2.5 text-sm">
                {[
                  ['服務', selected.service?.name],
                  ['設計師', selected.staff?.name],
                  ['日期', selected.date],
                  ['時間', selected.time],
                  ['時長', `${selected.service?.duration} 分鐘`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-400">{label}</span>
                    <span className="font-medium text-gray-700">{value}</span>
                  </div>
                ))}
                {couponResult && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>優惠折抵（{couponResult.name}）</span>
                    <span>- NT$ {couponResult.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <span className="text-gray-400">實付費用</span>
                  <span className="font-bold" style={{ color: '#8B7355' }}>
                    NT$ {(couponResult ? couponResult.final_amount : selected.service?.price).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Coupon */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-3">優惠碼</h2>
              {couponResult ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                  <div>
                    <span className="font-mono font-bold text-green-700">{couponCode.toUpperCase()}</span>
                    <span className="text-green-600 text-sm ml-2">已折抵 NT$ {couponResult.discount.toLocaleString()}</span>
                  </div>
                  <button onClick={removeCoupon} className="text-xs text-gray-400 hover:text-red-400">移除</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono uppercase outline-none focus:border-amber-600"
                    placeholder="輸入優惠碼"
                    value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                  />
                  <button onClick={applyCoupon} disabled={!couponCode.trim() || couponLoading}
                    className="px-4 py-2.5 text-white text-sm rounded-xl transition-opacity"
                    style={{ background: '#8B7355', opacity: !couponCode.trim() ? 0.5 : 1 }}>
                    {couponLoading ? '…' : '套用'}
                  </button>
                </div>
              )}
              {couponError && <p className="text-xs text-red-500 mt-1.5">{couponError}</p>}
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <h2 className="font-semibold text-gray-700">顧客資訊</h2>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-amber-600" placeholder="姓名 *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              <input className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-amber-600" placeholder="電話 *" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
              <textarea className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none" placeholder="備註（選填）" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">{error}</div>}

            <button onClick={submit} disabled={loading || !form.name || !form.phone}
              className="w-full py-4 rounded-2xl text-white font-semibold shadow-lg transition-opacity"
              style={{ background: '#8B7355', opacity: loading || !form.name || !form.phone ? 0.6 : 1 }}>
              {loading ? '預約中...' : '確認預約'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
