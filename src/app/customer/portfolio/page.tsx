'use client';
import { useState, useEffect } from 'react';

export default function CustomerPortfolio() {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => { fetch('/api/portfolio').then(r => r.json()).then(setItems); }, []);

  return (
    <div>
      <div className="bg-white px-4 py-4 sticky top-0 z-10 shadow-sm">
        <h1 className="font-semibold text-gray-800 text-center">作品集</h1>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {items.map(item => (
            <div key={item.id} className="rounded-2xl overflow-hidden shadow-sm cursor-pointer" onClick={() => setSelected(item)}>
              <div className="aspect-square overflow-hidden bg-gray-100">
                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover transition-transform hover:scale-105"
                  onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=400&fit=crop'; }} />
              </div>
              <div className="bg-white p-3">
                <div className="font-medium text-sm">{item.title}</div>
                <div className="text-xs text-gray-400 mt-0.5">{item.style} · {item.staff_name}</div>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="col-span-2 py-12 text-center text-gray-400">尚無作品集</div>}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60" onClick={() => setSelected(null)}>
          <div className="w-full bg-white rounded-t-3xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <img src={selected.image_url} alt={selected.title} className="w-full aspect-square object-cover"
              onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=800&fit=crop'; }} />
            <div className="p-5">
              <h3 className="font-semibold text-lg">{selected.title}</h3>
              <div className="text-sm text-gray-500 mt-1">{selected.style} · 設計師：{selected.staff_name}</div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setSelected(null)} className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm">關閉</button>
                <a href="/customer/booking" className="flex-1 py-3 text-white rounded-2xl text-sm text-center font-medium" style={{ background: '#8B7355' }}>預約此款</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
