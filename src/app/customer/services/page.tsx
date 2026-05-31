'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('全部');

  useEffect(() => {
    fetch('/api/services').then(r => r.json()).then(data => {
      setServices(data);
      const cats = Array.from(new Set(data.map((s: any) => s.category).filter(Boolean))) as string[];
      setCategories(cats);
    });
  }, []);

  const filtered = activeCategory === '全部' ? services : services.filter(s => s.category === activeCategory);

  return (
    <div>
      <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <Link href="/customer" className="text-gray-500">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <h1 className="font-semibold text-gray-800">服務項目</h1>
      </div>

      <div className="bg-white px-4 pb-3 flex gap-2 overflow-x-auto border-b border-gray-100" style={{ scrollbarWidth: 'none' }}>
        {['全部', ...categories].map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors"
            style={activeCategory === cat
              ? { background: 'var(--primary)', color: 'white', borderColor: 'var(--primary)' }
              : { borderColor: '#E5E5E5', color: '#666', background: 'white' }}>
            {cat}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {filtered.map(s => (
          <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-gray-800">{s.name}</div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{s.category}</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">{s.description}</div>
                <div className="text-xs text-gray-400 mt-2">時長：{s.duration} 分鐘</div>
              </div>
              <div className="font-bold text-base flex-shrink-0 ml-3" style={{ color: 'var(--primary)' }}>NT$ {s.price.toLocaleString()}</div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-gray-400">此分類暫無服務</div>}

        <Link href="/customer/booking" className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white font-semibold mt-2" style={{ background: 'var(--primary)' }}>
          立即預約
        </Link>
      </div>
    </div>
  );
}
