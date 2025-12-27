import React, { useState, useEffect, useRef } from 'react';

type Notification = {
    id: string;
    studentId: string;
    tutorId: string;
    type: 'new_course' | 'new_video' | 'course_update' | 'comment' | 'system_alert';
    title: string;
    message: string;
    contentId: string;
    isRead: boolean;
    createdAt: string;
};

interface NotificationBellProps {
    user: any;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ user }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [loading, setLoading] = useState(false);

    const btnRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';

    const loadNotifications = async () => {
        if (!user) return; // Allow any logged in user to see notifications, not just students

        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/api/notifications/by-student/${user.id || user._id}`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            const res = await fetch(`${BASE_URL}/api/notifications/${notificationId}/read`, {
                method: 'PUT'
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n =>
                    n.id === notificationId ? { ...n, isRead: true } : n
                ));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllRead = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/notifications/mark-all-read/${user.id || user._id}`, {
                method: 'PUT'
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            }
        } catch (error) {
            console.error('Error marking all as read', error);
        }
    };

    const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const res = await fetch(`${BASE_URL}/api/notifications/${notificationId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const toggleNotifications = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!showNotifications) {
            loadNotifications();
        }
        setShowNotifications(!showNotifications);
    };

    // Initial load
    useEffect(() => {
        if (user) {
            loadNotifications();
        }
    }, [user]);

    // Click outside listener
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                !btnRef.current?.contains(event.target as Node)
            ) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="relative">
            <button
                ref={btnRef}
                className={`notification-btn relative p-2 rounded-full hover:bg-gray-100 transition-colors ${showNotifications ? 'bg-gray-100 text-blue-600' : 'text-gray-500'}`}
                aria-label="Notifications"
                onClick={toggleNotifications}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm transform translate-x-1/4 -translate-y-1/4">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {showNotifications && (
                <div
                    ref={dropdownRef}
                    className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[100] origin-top-right transition-all animate-in fade-in zoom-in-95 duration-200"
                >
                    <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-800 text-lg">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                        {loading ? (
                            <div className="p-8 text-center text-gray-400">
                                <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                                Loading...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-6-6 6 6 0 0 0-6 6c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                                </div>
                                <p className="text-gray-500 font-medium">No notifications yet</p>
                                <p className="text-gray-400 text-sm mt-1">We'll let you know when updates arrive</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group relative ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                                    onClick={() => markAsRead(n.id)}
                                >
                                    {/* Unread Indicator */}
                                    {!n.isRead && (
                                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-full bg-blue-500 rounded-r"></div>
                                    )}

                                    <div className="flex gap-4">
                                        {/* Icon based on Type */}
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${n.type === 'new_course' ? 'bg-purple-100 text-purple-600' :
                                            n.type === 'course_update' ? 'bg-amber-100 text-amber-600' :
                                                n.type === 'new_video' ? 'bg-blue-100 text-blue-600' :
                                                    n.type === 'system_alert' ? 'bg-red-100 text-red-600' :
                                                        'bg-gray-100 text-gray-600'
                                            }`}>
                                            {n.type === 'new_course' && <i className="fas fa-graduation-cap"></i>}
                                            {n.type === 'course_update' && <i className="fas fa-sync-alt"></i>}
                                            {n.type === 'new_video' && <i className="fas fa-play"></i>}
                                            {n.type === 'comment' && <i className="fas fa-comment-alt"></i>}
                                            {n.type === 'system_alert' && <i className="fas fa-bullhorn"></i>}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`text-sm font-semibold truncate pr-6 ${!n.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {n.title}
                                                </h4>
                                                <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                                    {new Date(n.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{n.message}</p>
                                        </div>
                                    </div>

                                    {/* Delete Button (visible on hover) */}
                                    <button
                                        className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                        onClick={(e) => deleteNotification(n.id, e)}
                                        title="Remove notification"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                    {notifications.length > 0 && (
                        <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                            <button className="text-xs font-semibold text-gray-500 hover:text-gray-700">View All Notifications</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
