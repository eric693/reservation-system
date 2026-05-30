'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function WishlistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchItems = () => {
    setLoading(true);
    fetch('/api/bookmarks').then(r => r.json()).then(d => { setItems(d); setLoading(false); });
  };
  useEffect(() => { fetchItems(); }, []);

  const removeBookmark = async (portfolioId: number) => {
    await fetch('/api/bookmarks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ portfolio_id: portfolioId }) });
    fetchItems();
  };

  return (
    <div>
      <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <Link href="/customer" className="text-gray-500">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <h1 className="font-semibold text-gray-800">我的靈感板</h1>
        <span className="text-xs text-gray-400 ml-auto">{items.length} 個收藏</span>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: '#8B7355', borderTopColor: 'transparent' }} /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1C5B5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
            <p className="text-gray-400 mb-4 text-sm">還沒有收藏，去作品集收藏喜歡的款式</p>
            <Link href="/customer/portfolio" className="px-6 py-3 text-white rounded-xl inline-block text-sm font-medium" style={{ background: '#8B7355' }}>瀏覽作品集</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {items.map(item => (
                <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer" onClick={() => setSelected(item)}>
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    {item.style && <span className="absolute bottom-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ background: 'rgba(236,72,153,0.85)' }}>{item.style}</span>}
                  </div>
                  <div className="p-3">
                    <div className="font-medium text-sm text-gray-800">{item.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{item.staff_name}</div>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/customer/booking" className="block w-full py-4 text-center text-white font-semibold rounded-2xl" style={{ background: '#8B7355' }}>
              依此靈感板預約
            </Link>
          </>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative w-full bg-white rounded-t-3xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <img src={selected.image_url} alt={selected.title} className="w-full object-cover" style={{ maxHeight: '55vw', objectFit: 'cover' }} />
            <div className="p-5">
              <h3 className="font-bold text-lg">{selected.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{selected.style} · {selected.staff_name}</p>
              <div className="flex gap-3 mt-4">
                <button onClick={() => { removeBookmark(selected.portfolio_id); setSelected(null); }} className="flex-1 py-3 border border-red-200 text-red-500 rounded-2xl text-sm font-medium">移除收藏</button>
                <Link href="/customer/booking" className="flex-1 py-3 text-white rounded-2xl text-sm text-center font-semibold" style={{ background: '#8B7355' }}>預約此款</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
