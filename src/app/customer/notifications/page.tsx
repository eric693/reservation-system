'use client';
import { useState, useEffect } from 'react';

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
              <h3 className="font-medium">{a.title}</h3>
              <span className="text-xs text-gray-400">{a.created_at?.slice(0,10)}</span>
            </div>
            <p className="text-sm text-gray-500">{a.content}</p>
          </div>
        ))}
        {announcements.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🔔</div>
            <p>目前沒有新消息</p>
          </div>
        )}
      </div>
    </div>
  );
}
