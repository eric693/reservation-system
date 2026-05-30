'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => { fetch('/api/services').then(r => r.json()).then(setServices); }, []);

  return (
    <div>
      <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <Link href="/customer" className="text-gray-600 text-xl">‹</Link>
        <h1 className="font-semibold text-gray-800">服務項目</h1>
      </div>
      <div className="p-4 space-y-3">
        {services.map(s => (
          <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">{s.name}</div>
                <div className="text-sm text-gray-500 mt-1">{s.description}</div>
                <div className="flex gap-3 mt-2 text-xs text-gray-400">
                  <span>⏱ {s.duration} 分鐘</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{s.category}</span>
                </div>
              </div>
              <div className="font-bold text-base" style={{ color: '#8B7355' }}>NT$ {s.price.toLocaleString()}</div>
            </div>
          </div>
        ))}
        <Link href="/customer/booking" className="block w-full py-4 rounded-2xl text-white text-center font-semibold mt-4" style={{ background: '#8B7355' }}>
          立即預約
        </Link>
      </div>
    </div>
  );
}
