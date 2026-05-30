'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IconFilter, IconX } from '@/components/ui/Icons';

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? '#EC4899' : 'none'} stroke={filled ? '#EC4899' : 'white'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  );
}

export default function CustomerPortfolio() {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [activeStyle, setActiveStyle] = useState('全部');
  const [styles, setStyles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());

  const fetchBookmarks = () => {
    fetch('/api/bookmarks').then(r => r.ok ? r.json() : []).then(data => {
      setBookmarks(new Set(data.map((b: any) => b.portfolio_id)));
    });
  };

  const toggleBookmark = async (e: React.MouseEvent, portfolioId: number) => {
    e.stopPropagation();
    const res = await fetch('/api/bookmarks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ portfolio_id: portfolioId }) });
    const data = await res.json();
    setBookmarks(prev => { const s = new Set(prev); data.bookmarked ? s.add(portfolioId) : s.delete(portfolioId); return s; });
  };

  useEffect(() => {
    setLoading(true);
    fetch('/api/portfolio').then(r => r.json()).then(data => {
      setItems(data);
      const uniqueStyles = Array.from(new Set(data.map((i: any) => i.style).filter(Boolean))) as string[];
      setStyles(uniqueStyles);
      setLoading(false);
    });
    fetchBookmarks();
  }, []);

  const filtered = activeStyle === '全部' ? items : items.filter(i => i.style === activeStyle);

  return (
    <div className="min-h-screen" style={{ background: '#F5F5F5' }}>
      <div className="bg-white px-4 pt-4 pb-3 sticky top-0 z-10">
        <h1 className="font-semibold text-gray-800 text-center text-base">作品集</h1>
      </div>

      <div className="bg-white px-4 pb-3 flex items-center gap-2 overflow-x-auto sticky top-[52px] z-10 border-b border-gray-100" style={{ scrollbarWidth: 'none' }}>
        {['全部', ...styles].map(style => (
          <button key={style} onClick={() => setActiveStyle(style)}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border"
            style={activeStyle === style
              ? { background: '#8B7355', color: 'white', borderColor: '#8B7355' }
              : { background: 'white', color: '#666', borderColor: '#E5E5E5' }}>
            {style}
          </button>
        ))}
        {styles.length > 0 && (
          <button className="flex-shrink-0 w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center ml-auto bg-white">
            <IconFilter size={14} color="#666" />
          </button>
        )}
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: '#8B7355', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">此分類尚無作品</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map(item => (
              <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer active:scale-95 transition-transform"
                onClick={() => setSelected(item)}>
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  {item.style && (
                    <span className="absolute bottom-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium text-white"
                      style={{ background: 'rgba(236,72,153,0.85)' }}>
                      {item.style}
                    </span>
                  )}
                  <button onClick={e => toggleBookmark(e, item.id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: bookmarks.has(item.id) ? 'white' : 'rgba(0,0,0,0.3)' }}>
                    <HeartIcon filled={bookmarks.has(item.id)} />
                  </button>
                </div>
                <div className="p-3 space-y-1.5">
                  <h3 className="font-semibold text-sm text-gray-800">{item.title}</h3>
                  {item.staff_name && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: '#8B7355' }}>
                        {item.staff_username?.[0] || item.staff_name[0]}
                      </div>
                      <span className="text-xs text-gray-500">{item.staff_name}</span>
                    </div>
                  )}
                  {item.service_name && (
                    <span className="inline-block text-xs px-2 py-0.5 rounded-full border border-gray-200 text-gray-500">
                      {item.service_name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative w-full bg-white rounded-t-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="relative">
              <img src={selected.image_url} alt={selected.title} className="w-full object-cover" style={{ maxHeight: '60vw', minHeight: '200px', objectFit: 'cover' }} />
              {selected.style && (
                <span className="absolute bottom-3 left-3 text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ background: 'rgba(236,72,153,0.85)' }}>
                  {selected.style}
                </span>
              )}
              <button onClick={() => setSelected(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
                <IconX size={16} color="white" />
              </button>
            </div>
            <div className="p-5">
              <h3 className="font-bold text-lg text-gray-800">{selected.title}</h3>
              <div className="flex items-center gap-2 mt-2">
                {selected.staff_name && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#8B7355' }}>
                      {selected.staff_username?.[0] || selected.staff_name[0]}
                    </div>
                    <span className="text-sm text-gray-600">{selected.staff_name}</span>
                  </div>
                )}
                {selected.service_name && (
                  <span className="text-xs px-2 py-0.5 rounded-full border border-gray-200 text-gray-500 ml-1">{selected.service_name}</span>
                )}
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setSelected(null)} className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm text-gray-600 font-medium">關閉</button>
                <Link href="/customer/booking" className="flex-1 py-3 text-white rounded-2xl text-sm text-center font-semibold" style={{ background: '#8B7355' }}>預約此款</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
