'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function NotificationsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => { fetch('/api/announcements').then(r => r.json()).then(setAnnouncements); }, []);

  return (
    <div>
      <div className="bg-white px-4 py-4 sticky top-0 z-10 shadow-sm">
        <h1 className="font-semibold text-gray-800 text-center">消息通知</h1>
      </div>
      <div className="p-4 space-y-3">
        {announcements.map(a => (
          <div key={a.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-sm text-gray-800">{a.title}</h3>
              <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{a.created_at?.slice(0,10)}</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">{a.content}</p>
          </div>
        ))}
        {announcements.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1C5B5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <p>目前沒有新消息</p>
          </div>
        )}
      </div>
    </div>
  );
}
