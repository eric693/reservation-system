'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const TYPE_STYLES: Record<string, { bg: string; dot: string }> = {
  appointment: { bg: 'bg-amber-50', dot: 'var(--primary)' },
  info:        { bg: 'bg-blue-50',  dot: '#3B82F6' },
  promo:       { bg: 'bg-pink-50',  dot: '#EC4899' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [tab, setTab] = useState<'personal' | 'store'>('personal');
  const [unread, setUnread] = useState(0);

  const fetchNotifs = () => {
    fetch('/api/notifications').then(r => r.ok ? r.json() : null).then(d => {
      if (!d) return;
      setNotifications(d.notifications);
      setUnread(d.unread);
    });
  };

  useEffect(() => {
    fetchNotifs();
    fetch('/api/announcements').then(r => r.json()).then(setAnnouncements);
  }, []);

  const markAllRead = async () => {
    await fetch('/api/notifications/all-read', { method: 'POST' });
    fetchNotifs();
  };

  const markRead = async (id: number) => {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    setUnread(u => Math.max(0, u - 1));
  };

  return (
    <div className="pb-20">
      <div className="bg-white px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="font-semibold text-gray-800">消息通知</h1>
          {tab === 'personal' && unread > 0 && (
            <button onClick={markAllRead} className="text-xs text-blue-500 hover:underline">全部已讀</button>
          )}
        </div>
        <div className="flex gap-2 mt-3">
          {(['personal', 'store'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={tab === t ? { background: 'var(--primary)', color: 'white' } : { background: '#F3F0EB', color: '#6B7280' }}>
              {t === 'personal' ? `個人通知${unread > 0 ? ` (${unread})` : ''}` : '店家公告'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-2">
        {tab === 'personal' ? (
          notifications.length === 0 ? (
            <EmptyState />
          ) : notifications.map(n => {
            const style = TYPE_STYLES[n.type] || TYPE_STYLES.info;
            return (
              <div key={n.id}
                onClick={() => { if (!n.is_read) markRead(n.id); }}
                className={`rounded-2xl p-4 shadow-sm flex gap-3 cursor-pointer transition-opacity ${!n.is_read ? style.bg : 'bg-white'}`}>
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.is_read ? '#D1D5DB' : style.dot }} />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${n.is_read ? 'text-gray-500' : 'text-gray-800'}`}>{n.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5 truncate">{n.body}</div>
                  <div className="text-xs text-gray-300 mt-0.5">{n.created_at?.slice(0, 16).replace('T', ' ')}</div>
                </div>
                {n.link && (
                  <Link href={n.link} className="flex-shrink-0 text-xs text-amber-600 self-center hover:underline">查看</Link>
                )}
              </div>
            );
          })
        ) : (
          announcements.length === 0 ? (
            <EmptyState />
          ) : announcements.map(a => (
            <div key={a.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-sm text-gray-800">{a.title}</h3>
                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{a.created_at?.slice(0, 10)}</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">{a.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 text-gray-400">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary-warm)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
      </svg>
      <p>目前沒有通知</p>
    </div>
  );
}
