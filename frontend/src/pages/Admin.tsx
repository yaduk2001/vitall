
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from '../assets/logo.jpg';
import MobileSidebar from '../components/MobileSidebar';

// Types
interface User {
  _id: string;
  fullName: string;
  email: string;
  role: 'student' | 'user' | 'organization' | 'content_creator' | 'admin';
  creatorType?: string;
  isApproved: boolean;
  isSuspended: boolean;
  isBlocked?: boolean;
  createdAt: string;
}

interface Organization extends User {
  // Add specific organization fields if any, otherwise it's same as user for now
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalContent: number;
  totalRevenue: number;
  recentUsers: User[];
  graphData: { _id: string; count: number }[];
}

interface ContentItem {
  _id: string;
  title: string;
  type: 'course' | 'video';
  isActive: boolean;
  createdAt: string;
  creator: string;
  price?: number;
}

const Admin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<Organization[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'requests' | 'content' | 'settings'>('dashboard');
  const [popup, setPopup] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false, message: '', type: 'success'
  });
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning';
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => { },
    type: 'danger'
  });

  // Content View Modal State
  const [viewModal, setViewModal] = useState<{
    visible: boolean;
    loading: boolean;
    data: any;
    type: 'course' | 'video' | null;
  }>({
    visible: false,
    loading: false,
    data: null,
    type: null
  });

  const navigate = useNavigate();

  const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';

  const showPopup = (message: string, type: 'success' | 'error' = 'success') => {
    setPopup({ visible: true, message, type });
    setTimeout(() => setPopup(prev => ({ ...prev, visible: false })), 3000);
  };

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  useEffect(() => {
    checkAdminAccess();
    loadData();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/me`, { headers: getAuthHeader() as HeadersInit });
      if (!res.ok) throw new Error('Not authenticated');
      const user = await res.json();
      if (user.role !== 'admin') {
        navigate('/login');
      }
    } catch {
      navigate('/login');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, usersRes, orgsRes, contentRes] = await Promise.all([
        fetch(`${BASE_URL}/api/auth/admin/dashboard-stats`, { headers: getAuthHeader() as HeadersInit }),
        fetch(`${BASE_URL}/api/auth/admin/users`, { headers: getAuthHeader() as HeadersInit }),
        fetch(`${BASE_URL}/api/auth/admin/organizations`, { headers: getAuthHeader() as HeadersInit }),
        fetch(`${BASE_URL}/api/auth/admin/content`, { headers: getAuthHeader() as HeadersInit })
      ]);

      if (dashboardRes.ok) {
        setDashboardStats(await dashboardRes.json());
      }

      if (contentRes.ok) {
        const data = await contentRes.json();
        setContent(data.content || []);
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }
      if (orgsRes.ok) {
        const data = await orgsRes.json();
        setRequests(data.organizations || []);
      }
    } catch (e) {
      showPopup('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/admin/approve/${userId}`, {
        method: 'POST',
        headers: getAuthHeader() as HeadersInit
      });
      if (res.ok) {
        showPopup('User approved successfully', 'success');
        loadData();
      } else {
        showPopup('Failed to approve user', 'error');
      }
    } catch {
      showPopup('Failed to approve user', 'error');
    }
  };

  const handleReject = (userId: string) => {
    setConfirmModal({
      visible: true,
      title: 'Reject User Request',
      message: 'Are you sure you want to reject this user? This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`${BASE_URL}/api/auth/admin/reject/${userId}`, {
            method: 'POST',
            headers: getAuthHeader() as HeadersInit
          });
          if (res.ok) {
            showPopup('User rejected', 'success');
            loadData();
          } else {
            showPopup('Failed to reject user', 'error');
          }
        } catch {
          showPopup('Failed to reject user', 'error');
        }
        setConfirmModal(prev => ({ ...prev, visible: false }));
      }
    });
  };


  const handleToggleStatus = (userId: string) => {
    const user = users.find(u => u._id === userId);
    if (!user) return;

    const isSuspending = !user.isSuspended;

    if (isSuspending) {
      setConfirmModal({
        visible: true,
        title: 'Suspend User',
        message: 'Are you sure you want to suspend this user? They will temporarily not be able to log in.',
        type: 'warning',
        onConfirm: async () => {
          await executeToggleStatus(userId);
          setConfirmModal(prev => ({ ...prev, visible: false }));
        }
      });
    } else {
      executeToggleStatus(userId);
    }
  };

  const executeToggleStatus = async (userId: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/admin/toggle-status/${userId}`, {
        method: 'POST',
        headers: getAuthHeader() as HeadersInit
      });
      if (res.ok) {
        const data = await res.json();
        showPopup(data.message, 'success');
        // Optimistic update
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, isSuspended: data.isSuspended } : u));
      } else {
        const err = await res.json();
        showPopup(err.error || 'Failed to toggle status', 'error');
      }
    } catch {
      showPopup('Failed to toggle status', 'error');
    }
  };

  const handleToggleContent = async (item: ContentItem) => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/admin/content/toggle/${item.type}/${item._id}`, {
        method: 'POST',
        headers: getAuthHeader() as HeadersInit
      });
      if (res.ok) {
        const data = await res.json();
        showPopup(data.message, 'success');
        setContent(prev => prev.map(c => c._id === item._id ? { ...c, isActive: data.isActive } : c));
      } else {
        showPopup('Failed to toggle content', 'error');
      }
    } catch {
      showPopup('Failed to toggle content', 'error');
    }
  };

  const handleDeleteContent = (item: ContentItem) => {
    setConfirmModal({
      visible: true,
      title: 'Delete Content',
      message: `Are you sure you want to permanently delete this ${item.type}? This action cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`${BASE_URL}/api/auth/admin/content/${item.type}/${item._id}`, {
            method: 'DELETE',
            headers: getAuthHeader() as HeadersInit
          });
          if (res.ok) {
            showPopup('Content deleted permanently', 'success');
            setContent(prev => prev.filter(c => c._id !== item._id));
          } else {
            showPopup('Failed to delete content', 'error');
          }
        } catch {
          showPopup('Failed to delete content', 'error');
        }
        setConfirmModal(prev => ({ ...prev, visible: false }));
      }
    });
  };

  const handleViewContent = async (item: ContentItem) => {
    setViewModal({ visible: true, loading: true, data: null, type: item.type });
    try {
      const res = await fetch(`${BASE_URL}/api/auth/admin/content/${item.type}/${item._id}/details`, {
        headers: getAuthHeader() as HeadersInit
      });
      if (res.ok) {
        const data = await res.json();
        setViewModal(prev => ({ ...prev, loading: false, data }));
      } else {
        showPopup('Failed to load content details', 'error');
        setViewModal(prev => ({ ...prev, visible: false }));
      }
    } catch {
      showPopup('Failed to load content details', 'error');
      setViewModal(prev => ({ ...prev, visible: false }));
    }
  };

  const handleBlockUser = (userId: string) => {
    setConfirmModal({
      visible: true,
      title: 'Permanently Block User',
      message: 'Are you sure you want to permanently block this user? They will not be able to register again with this email.',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`${BASE_URL}/api/auth/admin/block-user/${userId}`, {
            method: 'POST',
            headers: getAuthHeader() as HeadersInit
          });
          if (res.ok) {
            showPopup('User blocked permanently', 'success');
            // Optimistic update
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBlocked: true, isSuspended: true } : u));
          } else {
            const err = await res.json();
            showPopup(err.error || 'Failed to block user', 'error');
          }
        } catch {
          showPopup('Failed to block user', 'error');
        }
      }
    });
  };


  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    try {
      const res = await fetch(`${BASE_URL}/api/auth/admin/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() } as HeadersInit,
        body: JSON.stringify({ message: broadcastMessage, targetRoles: targetRoles.length > 0 ? targetRoles : undefined })
      });
      if (res.ok) {
        showPopup('Broadcast sent successfully', 'success');
        setShowBroadcastModal(false);
        setBroadcastMessage('');
        setTargetRoles([]);
      } else {
        showPopup('Failed to send broadcast', 'error');
      }
    } catch {
      showPopup('Failed to send broadcast', 'error');
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail && !newPassword) return;
    try {
      const res = await fetch(`${BASE_URL}/api/auth/admin/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() } as HeadersInit,
        body: JSON.stringify({ email: newEmail, password: newPassword }),
      });
      if (res.ok) {
        showPopup('Profile updated successfully', 'success');
        setNewPassword('');
      } else {
        const err = await res.json();
        showPopup(err.error || 'Failed to update profile', 'error');
      }
    } catch {
      showPopup('Failed to update profile', 'error');
    }
  };

  const formatRole = (role: string, creatorType?: string) => {
    if (role === 'organization') return 'Tutor';
    if (role === 'content_creator') {
      return creatorType
        ? creatorType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : 'Creator';
    }
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'student': return 'bg-blue-100 text-blue-700';
      case 'organization': return 'bg-indigo-100 text-indigo-700';
      case 'content_creator': return 'bg-purple-100 text-purple-700';
      case 'admin': return 'bg-yellow-100 text-yellow-700';
      case 'user': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col sticky top-0 h-screen z-30 flex-shrink-0">
        <div className="h-20 flex items-center px-8 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Vital" className="w-8 h-8 rounded-lg" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Vital Admin</span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'dashboard'
              ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-100'
              : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50/50'
              }`}
          >
            <i className="fas fa-chart-line w-5"></i>
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('content')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'content'
              ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-100'
              : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50/50'
              }`}
          >
            <i className="fas fa-video w-5"></i>
            Content
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'users'
              ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-100'
              : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50/50'
              }`}
          >
            <i className="fas fa-users w-5"></i>
            All Users
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'requests'
              ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-100'
              : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50/50'
              }`}
          >
            <div className="relative">
              <i className="fas fa-clipboard-check w-5"></i>
              {requests.filter(r => !r.isApproved).length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
              )}
            </div>
            Verification Requests
          </button>

          <div className="pt-4 mt-4 border-t border-gray-50">
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'settings'
                ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-100'
                : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50/50'
                }`}
            >
              <i className="fas fa-cog w-5"></i>
              Settings
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-50">
          <button
            onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }}
            className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all w-full font-medium"
          >
            <i className="fas fa-sign-out-alt w-5"></i>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <i className="fas fa-bars text-xl"></i>
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 truncate">
              {activeTab === 'dashboard' ? 'Overview' : activeTab === 'content' ? 'Content' : activeTab === 'users' ? 'Users' : activeTab === 'settings' ? 'Settings' : 'Requests'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-medium shadow-md shadow-red-200 hover:shadow-lg transition-all flex items-center gap-2"
            >
              <i className="fas fa-bullhorn"></i>
              <span>Broadcast</span>
            </button>
            <button onClick={loadData} className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="Refresh">
              <i className="fas fa-sync-alt"></i>
            </button>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {activeTab === 'dashboard' ? (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                      <i className="fas fa-users text-xl"></i>
                    </div>
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-lg font-bold">+12%</span>
                  </div>
                  <h3 className="text-gray-500 text-sm font-medium mb-1">Total Users</h3>
                  <p className="text-3xl font-bold text-gray-800">{dashboardStats?.totalUsers || 0}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                      <div className="relative">
                        <i className="fas fa-globe text-xl"></i>
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>
                      </div>
                    </div>
                    <span className="text-xs text-green-600 font-bold">Live Now</span>
                  </div>
                  <h3 className="text-gray-500 text-sm font-medium mb-1">Active Users</h3>
                  <p className="text-3xl font-bold text-gray-800">{dashboardStats?.activeUsers || 0}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-600">
                      <i className="fas fa-dollar-sign text-xl"></i>
                    </div>
                    <span className="bg-yellow-50 text-yellow-700 text-xs px-2 py-1 rounded-lg font-bold">Total</span>
                  </div>
                  <h3 className="text-gray-500 text-sm font-medium mb-1">Revenue</h3>
                  <p className="text-3xl font-bold text-gray-800">${dashboardStats?.totalRevenue || 0}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                      <i className="fas fa-video text-xl"></i>
                    </div>
                    <span className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-lg font-bold">Content</span>
                  </div>
                  <h3 className="text-gray-500 text-sm font-medium mb-1">Total Content</h3>
                  <p className="text-3xl font-bold text-gray-800">{dashboardStats?.totalContent || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Traffic Graph */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-bold text-gray-800">Traffic Overview</h3>
                    <select className="bg-gray-50 border border-gray-200 rounded-lg text-sm px-3 py-1 text-gray-600 outline-none">
                      <option>Last 7 Days</option>
                    </select>
                  </div>
                  <div className="h-64 flex items-end justify-between gap-2 px-2">
                    {/* Simple CSS Bar Chart Implementation */}
                    {dashboardStats?.graphData && dashboardStats.graphData.length > 0 ? (
                      dashboardStats.graphData.map((d, i) => {
                        const max = Math.max(...dashboardStats.graphData.map(dd => dd.count), 5); // Avoid div by zero
                        const height = (d.count / max) * 100;
                        return (
                          <div key={i} className="flex flex-col items-center gap-2 group flex-1">
                            <div
                              className="w-full bg-blue-100 rounded-t-lg relative group-hover:bg-blue-200 transition-all"
                              style={{ height: `${height}%`, minHeight: '4px' }}
                            >
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                {d.count} Users
                              </div>
                            </div>
                            <span className="text-xs text-gray-400 font-medium rotate-45 origin-left translate-y-2">{new Date(d._id).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No recent data
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-800 mb-6">Recent Signups</h3>
                  <div className="space-y-6">
                    {dashboardStats?.recentUsers.map(user => (
                      <div key={user._id} className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
                          {user.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{user.fullName}</div>
                          <div className="text-xs text-gray-500">Joined {new Date(user.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="ml-auto text-xs font-medium px-2 py-1 rounded-lg bg-gray-50 text-gray-600 capitalize">
                          {user.role}
                        </div>
                      </div>
                    ))}
                    {(!dashboardStats?.recentUsers || dashboardStats.recentUsers.length === 0) && (
                      <p className="text-gray-400 text-sm text-center">No recent signups</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'content' ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Content</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Type</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Creator</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Status</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 text-sm text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {content.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">No content found</td>
                      </tr>
                    ) : (
                      content.map((item) => (
                        <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-semibold text-gray-900">{item.title}</div>
                            <div className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${item.type === 'course' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>
                              {item.type === 'course' ? 'Course' : 'Video'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600">
                            {item.creator}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                              {item.isActive ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewContent(item)}
                                className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                                title="View/Play"
                              >
                                <i className="fas fa-play"></i>
                              </button>
                              <button
                                onClick={() => handleToggleContent(item)}
                                className={`p-2 rounded-lg transition-colors ${item.isActive ? 'text-gray-400 hover:text-gray-600' : 'text-green-600 hover:bg-green-50'}`}
                                title={item.isActive ? "Disable" : "Enable"}
                              >
                                <i className={`fas ${item.isActive ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                              </button>
                              <button
                                onClick={() => handleDeleteContent(item)}
                                className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Delete Permanently"
                              >
                                <i className="fas fa-trash-alt"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'settings' ? (
            <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <h2 className="text-xl font-bold mb-6">Update Admin Profile</h2>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="Enter new email"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                  />
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="py-4 px-6 font-semibold text-gray-600 text-sm">User</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Role</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Status</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Joined</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 text-sm text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(activeTab === 'users' ? users : requests).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">No records found</td>
                      </tr>
                    ) : (
                      (activeTab === 'users' ? users : requests).map((user) => (
                        <tr key={user._id} className={`hover:bg-gray-50/50 transition-colors group ${user.isSuspended ? 'opacity-75 bg-red-50/30' : ''}`}>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-lg">
                                {user.role === 'student' ? '🎓' :
                                  user.role === 'organization' ? '👨‍🏫' :
                                    user.role === 'content_creator' ? '📹' : '👤'}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{user.fullName}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                              {formatRole(user.role, user.creatorType)}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isSuspended ? 'bg-red-100 text-red-700' : user.isApproved
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                              }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${user.isSuspended ? 'bg-red-500' : user.isApproved ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                              {user.isSuspended ? 'Suspended' : user.isApproved ? 'Active' : 'Pending'}
                            </span>
                            {user.isBlocked && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-white">
                                Blocked
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6 text-right">
                            {activeTab === 'requests' ? (
                              !user.isApproved ? (
                                <div className="flex items-center justify-end gap-2 transition-opacity">
                                  <button
                                    onClick={() => handleApprove(user._id)}
                                    className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                                    title="Approve"
                                  >
                                    <i className="fas fa-check"></i>
                                  </button>
                                  <button
                                    onClick={() => handleReject(user._id)}
                                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                    title="Reject"
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-green-600 font-medium text-sm">Approved</span>
                              )
                            ) : (
                              // Users Tab Actions
                              user.role !== 'admin' && (
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleToggleStatus(user._id)}
                                    disabled={user.isBlocked}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${user.isSuspended
                                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                                      } ${user.isBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    {user.isSuspended ? 'Activate' : 'Suspend'}
                                  </button>
                                  {!user.isBlocked && (
                                    <button
                                      onClick={() => handleBlockUser(user._id)}
                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                      title="Permanently Block"
                                    >
                                      <i className="fas fa-trash-alt"></i>
                                    </button>
                                  )}
                                </div>
                              )
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>


      {/* Popup Notification */}
      {
        popup.visible && (
          <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 transform transition-all duration-300 ${popup.type === 'success' ? 'bg-white border-l-4 border-green-500' : 'bg-white border-l-4 border-red-500'
            }`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${popup.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
              <i className={`fas ${popup.type === 'success' ? 'fa-check' : 'fa-exclamation'}`}></i>
            </div>
            <span className="font-medium text-gray-800">{popup.message}</span>
          </div>
        )
      }

      {/* Broadcast Modal */}
      {
        showBroadcastModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowBroadcastModal(false)}>
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl scale-100" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <i className="fas fa-bullhorn text-red-500"></i>
                  Broadcast Message
                </h3>
                <button
                  onClick={() => setShowBroadcastModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <i className="fas fa-times text-gray-400"></i>
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  placeholder="Type your message to all users..."
                  className="w-full h-32 px-4 py-3 rounded-xl bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium resize-none"
                ></textarea>
                <p className="text-xs text-gray-500 mt-2">
                  <i className="fas fa-info-circle mr-1"></i>
                  This message will be sent to {targetRoles.length === 0 ? `all ${users.length - 1} users` : `${targetRoles.length} role(s) selected`} immediately.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Roles</label>
                <div className="flex flex-wrap gap-2">
                  {['student', 'user', 'organization', 'content_creator'].map(role => (
                    <button
                      key={role}
                      onClick={() => setTargetRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${targetRoles.includes(role)
                        ? 'bg-blue-100 border-blue-200 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {role === 'organization' ? 'Tutor' : role.replace('_', ' ').charAt(0).toUpperCase() + role.replace('_', ' ').slice(1)}
                    </button>
                  ))}
                  <button
                    onClick={() => setTargetRoles([])}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${targetRoles.length === 0
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    All Users
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBroadcastModal(false)}
                  className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBroadcast}
                  disabled={!broadcastMessage.trim()}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all disabled:opacity-50 disabled:shadow-none"
                >
                  Send Broadcast
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Confirmation Modal */}
      {
        confirmModal.visible && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setConfirmModal(prev => ({ ...prev, visible: false }))}>
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl scale-100 border-2 border-red-50" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600 text-xl">
                <i className="fas fa-exclamation-triangle"></i>
              </div>

              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">{confirmModal.title}</h3>
              <p className="text-gray-500 text-center mb-6">{confirmModal.message}</p>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
                  className="flex-1 py-2.5 text-gray-700 font-bold hover:bg-gray-50 rounded-xl transition-all border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* View Content Modal */}
      {viewModal.visible && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setViewModal(prev => ({ ...prev, visible: false }))}>
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <i className={`fas ${viewModal.type === 'course' ? 'fa-graduation-cap' : 'fa-video'} text-blue-600`}></i>
                {viewModal.loading ? 'Loading...' : viewModal.data?.title}
              </h3>
              <button
                onClick={() => setViewModal(prev => ({ ...prev, visible: false }))}
                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
                title="Close"
              >
                <i className="fas fa-times text-gray-400"></i>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {viewModal.loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : viewModal.data ? (
                <div className="space-y-6">
                  {viewModal.type === 'video' ? (
                    <div>
                      <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4">
                        {viewModal.data.videoData ? (
                          <video
                            src={viewModal.data.videoData}
                            controls
                            className="w-full h-full object-contain"
                          />
                        ) : viewModal.data.videoUrl ? (
                          <video
                            src={viewModal.data.videoUrl}
                            controls
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            No Video Source Available
                          </div>
                        )}
                      </div>
                      <p className="text-gray-600">{viewModal.data.description}</p>
                      <div className="flex gap-2 mt-4">
                        {viewModal.data.tags?.map((tag: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // Course View
                    <div>
                      <div className="flex gap-6 mb-8">
                        {viewModal.data.thumbnailUrl && (
                          <img src={viewModal.data.thumbnailUrl} alt={viewModal.data.title} className="w-48 h-32 object-cover rounded-xl" />
                        )}
                        <div>
                          <p className="text-gray-600 mb-2">{viewModal.data.description}</p>
                          <div className="flex gap-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                              {viewModal.data.isPaid ? `$${viewModal.data.price}` : 'Free'}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              {viewModal.data.modules?.length || 0} Modules
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="border border-gray-100 rounded-xl overflow-hidden">
                        {viewModal.data.modules?.map((module: any, i: number) => (
                          <div key={i} className="border-b border-gray-100 last:border-0">
                            <details className="group">
                              <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                                <span className="font-medium text-gray-800 flex items-center gap-3">
                                  <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">
                                    {i + 1}
                                  </span>
                                  {module.title}
                                </span>
                                <i className="fas fa-chevron-down text-gray-400 group-open:rotate-180 transition-transform"></i>
                              </summary>
                              <div className="p-4 bg-gray-50 border-t border-gray-100 pl-14">
                                {module.type === 'video' ? (
                                  module.videoUrl ? (
                                    <video src={module.videoUrl} controls className="w-full max-w-md rounded-lg" />
                                  ) : <p className="text-sm text-gray-500 italic">No video content</p>
                                ) : (
                                  // Document
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                                      <i className="fas fa-file-pdf"></i>
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">{module.documentName || 'Document'}</p>
                                      {module.documentUrl ? (
                                        <a
                                          href={module.documentUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-sm text-blue-600 hover:underline"
                                        >
                                          View Document <i className="fas fa-external-link-alt text-xs ml-1"></i>
                                        </a>
                                      ) : (
                                        <p className="text-sm text-gray-500 italic">No document file</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </details>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">Failed to load content</div>
              )}
            </div>
          </div>
        </div>
      )}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        title={<span className="text-xl font-bold text-blue-600">Vital Admin</span>}
        links={[
          { icon: 'fa-chart-line', label: 'Dashboard', onClick: () => setActiveTab('dashboard'), active: activeTab === 'dashboard' },
          { icon: 'fa-video', label: 'Content', onClick: () => setActiveTab('content'), active: activeTab === 'content' },
          { icon: 'fa-users', label: 'All Users', onClick: () => setActiveTab('users'), active: activeTab === 'users' },
          { icon: 'fa-clipboard-check', label: 'Requests', onClick: () => setActiveTab('requests'), active: activeTab === 'requests' },
          { icon: 'fa-cog', label: 'Settings', onClick: () => setActiveTab('settings'), active: activeTab === 'settings' },
        ]}
      />
    </div>
  );
};

export default Admin;
