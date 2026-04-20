'use client';

import { useState, useEffect } from 'react';
import { Bell, Trash2, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications, type Notification } from '@/lib/useNotifications';
import { formatDistanceToNow } from 'date-fns';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const getNotificationTypeColor = (type: string): string => {
    switch (type) {
      case 'application':
        return 'bg-blue-50 text-blue-700';
      case 'job_update':
        return 'bg-emerald-50 text-emerald-700';
      case 'payment':
        return 'bg-purple-50 text-purple-700';
      case 'message':
        return 'bg-amber-50 text-amber-700';
      default:
        return 'bg-slate-50 text-slate-700';
    }
  };

  const getNotificationTypeLabel = (type: string): string => {
    switch (type) {
      case 'application':
        return '📋 Application';
      case 'job_update':
        return '💼 Job Update';
      case 'payment':
        return '💰 Payment';
      case 'message':
        return '💬 Message';
      default:
        return '🔔 Notification';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    setSelectedNotification(notification);
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="relative h-9 w-9 rounded-full p-0"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-0" align="end">
          <div className="space-y-1 border-b bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => markAllAsRead()}
                >
                  <CheckCheck className="mr-1 h-3 w-3" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                <Bell className="mx-auto mb-2 h-8 w-8 opacity-30" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`cursor-pointer border-l-4 p-3 transition-colors hover:bg-slate-50 ${
                      notification.read ? 'border-l-transparent bg-white' : 'border-l-blue-500 bg-blue-50'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 text-sm">
                        <p className="font-medium text-slate-900">{notification.title}</p>
                        <p className="mt-0.5 text-xs text-slate-600">{notification.message}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-slate-400 hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification._id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Notification Detail Dialog */}
      <Dialog open={Boolean(selectedNotification)} onOpenChange={(open) => !open && setSelectedNotification(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedNotification?.title}</DialogTitle>
            <DialogDescription>
              {getNotificationTypeLabel(selectedNotification?.type || 'notification')}
            </DialogDescription>
          </DialogHeader>

          {selectedNotification && (
            <div className="space-y-4">
              <div className={`rounded-lg p-3 ${getNotificationTypeColor(selectedNotification.type)}`}>
                <p className="text-sm font-medium">{selectedNotification.message}</p>
              </div>

              {selectedNotification.data && Object.keys(selectedNotification.data).length > 0 && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="mb-2 text-xs font-semibold text-slate-600">Details</p>
                  <div className="space-y-1 text-xs text-slate-700">
                    {Object.entries(selectedNotification.data).map(([key, value]) => (
                      <p key={key}>
                        <span className="font-medium capitalize">{key}:</span> {String(value)}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-500">
                {new Date(selectedNotification.createdAt).toLocaleString()}
              </p>

              <Button variant="outline" className="w-full" onClick={() => setSelectedNotification(null)}>
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
