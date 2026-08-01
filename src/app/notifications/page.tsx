'use client';
import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { Bell, CheckCircle } from 'lucide-react';
import { useTranslationStore } from '@/store/translationStore';
import { useTranslation } from '@/lib/localization';
import { ModuleHandoffPanel } from '@/components/handoff/ModuleHandoffPanel';
import {
  executeFrontendMutation,
  getFrontendModuleBoundary,
} from '@/lib/frontendDataSource';

export default function NotificationsPage() {
  const { currentUser } = useAuthStore();
  const { settings } = useTranslationStore();
  const t = useTranslation(settings.uiLanguage);
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [feedback, setFeedback] = React.useState<{
    kind: 'SIMULATED' | 'SUCCESS' | 'BLOCKED';
    message: string;
  } | null>(null);
  const notificationBoundary = getFrontendModuleBoundary('NOTIFICATION', {
    adapterReady: false,
  });

  if (!currentUser) return <div className="py-10 text-center text-[var(--color-text-sub)]">{t('header.loginRequired')}</div>;

  const myNotifications = notifications.filter(n => n.userId === currentUser.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await executeFrontendMutation(notificationBoundary, {
      simulate: () => markAsRead(notificationId),
    });
    setFeedback({ kind: result.kind, message: result.message });
  };

  const handleMarkAllAsRead = async () => {
    const result = await executeFrontendMutation(notificationBoundary, {
      simulate: () => markAllAsRead(currentUser.id),
    });
    setFeedback({ kind: result.kind, message: result.message });
  };

  return (
    <div className="w-full px-6 mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <ModuleHandoffPanel
        module="NOTIFICATION"
        description={{
          ko: '알림 Event 기록과 사용자별 Delivery·Read State·Preference를 분리해 Backend에 인계합니다.',
          vi: 'Tách Event thông báo khỏi Delivery, trạng thái đã đọc và Preference của từng người dùng.',
          en: 'Separate notification events from per-user delivery, read state, and preferences for Backend handoff.',
        }}
      />
      {feedback && (
        <div
          role="status"
          className={`border px-4 py-3 text-xs font-bold ${
            feedback.kind === 'BLOCKED'
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
        >
          {feedback.message}
        </div>
      )}
      <div className="flex justify-between items-center bg-[var(--color-surface)] p-4 rounded-xl shadow-sm border">
        <h1 className="text-xl font-bold text-[var(--color-text-main)] flex items-center">
          <Bell className="w-6 h-6 mr-2 text-indigo-600" />
          {t('notifications.title')}
        </h1>
        <button 
          onClick={() => void handleMarkAllAsRead()}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] text-sm bg-gray-100 hover:bg-gray-200 text-[var(--color-text-main)] py-2 px-4 rounded-lg flex items-center"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          {t('notifications.readAll')}
        </button>
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl shadow-sm border overflow-hidden">
        {myNotifications.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-text-sub)]">
            {t('notifications.empty')}
          </div>
        ) : (
          <div className="divide-y">
            {myNotifications.map(n => (
              <div 
                key={n.id} 
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !n.isRead) {
                    e.preventDefault();
                    void handleMarkAsRead(n.id);
                  }
                }}
                onClick={() => {
                  if (!n.isRead) void handleMarkAsRead(n.id);
                }}
                className={`p-4 hover:bg-[var(--color-bg)] cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)] text-left ${!n.isRead ? 'bg-indigo-50/30' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    {(n.priority === 'CRITICAL' || n.priority === 'HIGH') && (
                      <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded font-bold border border-red-200">
                        {t('notifications.urgent')}
                      </span>
                    )}
                    <h3 className={`font-semibold ${!n.isRead ? 'text-[var(--color-text-main)]' : 'text-[var(--color-text-sub)]'}`}>
                      {n.title}
                    </h3>
                    {n.count && n.count > 1 ? (
                      <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold border border-indigo-200">
                        {t('notifications.grouped', { count: n.count.toString() })}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-xs text-[var(--color-text-sub)]">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className={`text-sm mt-1 break-words leading-relaxed ${!n.isRead ? 'text-[var(--color-text-main)]' : 'text-[var(--color-text-sub)]'}`}>
                  {n.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
