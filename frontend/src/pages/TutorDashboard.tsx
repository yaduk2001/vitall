import React, { useEffect } from 'react';
import ProfileMenu from '../components/ProfileMenu';

const TutorDashboard: React.FC = () => {
  useEffect(() => {
    const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';
    async function loadDashboard() {
      try {
        const [videosRes, messagesRes] = await Promise.all([
          fetch(`${BASE_URL}/api/videos`, { credentials: 'include' }),
          fetch(`${BASE_URL}/api/messages`, { credentials: 'include' })
        ]);
        const videosData = await videosRes.json();
        const messagesData = await messagesRes.json().catch(() => ({ messages: [] }));
        const videos = videosData.videos || [];
        const messages = messagesData.messages || [];
        const totalEl = document.getElementById('total-courses-count');
        if (totalEl) totalEl.textContent = String(videos.length);
        const studentsEl = document.getElementById('active-students-count');
        if (studentsEl) studentsEl.textContent = String(messages.length);
        const newMsgEl = document.getElementById('new-messages-count');
        if (newMsgEl) newMsgEl.textContent = String(messages.length);
        document.querySelector('[data-card="revenue"]')?.classList.add('hidden');
        document.querySelector('[data-card="rating"]')?.classList.add('hidden');
        const titles = document.querySelectorAll('.video-title');
        const metas = document.querySelectorAll('.video-meta');
        for (let i = 0; i < titles.length; i++) {
          const v: any = videos[i];
          (titles[i] as HTMLElement).textContent = v ? (v.title || 'Untitled') : 'No course';
          (metas[i] as HTMLElement).textContent = v ? ((v.description || '').slice(0, 60)) : '';
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load dashboard', e);
      }
    }
    loadDashboard();
  }, []);

  return (
    <div className="main-container bg-gray-50 font-sans">
      <div className="topbar">
        <div className="topbar-left logo-effect">
          <a href="/Tutordashboard" className="flex items-center space-x-2">
            <img src="/src/assets/logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
          </a>
        </div>
        <div className="topbar-right">
          <div className="flex items-center space-x-4">
            <a href="/channel" className="text-gray-700 hover:text-blue-600 font-medium">My Channel</a>
            <h1 className="text-2xl font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => (location.href = '/Tutordashboard')}>Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors">
              <i className="fas fa-bell text-lg"></i>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></span>
            </button>
            <div className="flex items-center space-x-3">
              <ProfileMenu />
            </div>
          </div>
        </div>
      </div>

      <div className="sidebar bg-white flex flex-col">
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li><a className="nav-item w-full flex items-center space-x-3 px-4 py-3 font-medium" href="/CourseUploadPage"><i className="fas fa-upload text-sm"></i><span>Upload Course</span></a></li>
            <li><a className="nav-item w-full flex items-center space-x-3 px-4 py-3 font-medium" href="/analytics"><i className="fas fa-chart-bar text-sm"></i><span>Analytics</span></a></li>
            <li><a className="nav-item w-full flex items-center space-x-3 px-4 py-3 font-medium" href="/tutor-comments"><i className="fas fa-comments text-sm"></i><span>Comments</span></a></li>
            <li><a className="nav-item w-full flex items-center space-x-3 px-4 py-3 font-medium" href="/Monetization"><i className="fas fa-dollar-sign text-sm"></i><span>Monetization</span></a></li>
            <li><a className="nav-item w-full flex items-center space-x-3 px-4 py-3 font-medium" href="/EditUploadsPage"><i className="fas fa-edit text-sm"></i><span>Edit Uploads</span></a></li>
          </ul>
        </nav>
        <div className="settings-section p-4">
          <button className="nav-item w-full flex items-center space-x-3 px-4 py-3 font-medium" onClick={() => window.location.href = '/channel-setup'}><i className="fas fa-cog text-sm"></i><span>Channel Setup</span></button>
        </div>
      </div>

      <div className="t-vertical"></div>

      <div className="main-content flex flex-col">
        <main className="flex-1 p-6 overflow-auto" style={{ backgroundColor: 'var(--bg-light-gray)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome back, Tutor!</h2>
              <p className="text-gray-600">Here's what's happening with your courses today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium text-gray-600">Total Courses</p><p className="text-3xl font-bold text-gray-900" id="total-courses-count">0</p></div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><i className="fas fa-book text-blue-600 text-xl"></i></div>
                </div>
                <div className="mt-4 flex items-center"><span className="text-green-500 text-sm font-medium">+2.5%</span><span className="text-gray-500 text-sm ml-2">from last month</span></div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium text-gray-600">Active Students</p><p className="text-3xl font-bold text-gray-900" id="active-students-count">0</p></div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><i className="fas fa-users text-green-600 text-xl"></i></div>
                </div>
                <div className="mt-4 flex items-center"><span className="text-green-500 text-sm font-medium">+12.3%</span><span className="text-gray-500 text-sm ml-2">from last month</span></div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow" data-card="revenue">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium text-gray-600">Monthly Revenue</p><p className="text-3xl font-bold text-gray-900" id="monthly-revenue">$0</p></div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center"><i className="fas fa-dollar-sign text-yellow-600 text-xl"></i></div>
                </div>
                <div className="mt-4 flex items-center"><span className="text-green-500 text-sm font-medium">+8.1%</span><span className="text-gray-500 text-sm ml-2">from last month</span></div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow" data-card="rating">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium text-gray-600">Avg. Rating</p><p className="text-3xl font-bold text-gray-900" id="avg-rating">0.0</p></div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center"><i className="fas fa-star text-purple-600 text-xl"></i></div>
                </div>
                <div className="mt-4 flex items-center"><span className="text-green-500 text-sm font-medium">+0.2</span><span className="text-gray-500 text-sm ml-2">from last month</span></div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-semibold text-gray-800">Recent Courses</h3><button className="text-blue-600 hover:text-blue-700 font-medium text-sm">View All</button></div>
                  <div className="space-y-4">
                    <div className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-4"><i className="fas fa-code text-white text-xl"></i></div>
                      <div className="flex-1"><h4 className="font-semibold text-gray-800 video-title">Loading...</h4><p className="text-sm text-gray-600 video-meta"></p></div>
                      <div className="text-right"><p className="font-semibold text-gray-800">$1,240</p><p className="text-sm text-green-600">+15% this week</p></div>
                    </div>
                    <div className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center mr-4"><i className="fas fa-paint-brush text-white text-xl"></i></div>
                      <div className="flex-1"><h4 className="font-semibold text-gray-800 video-title">Loading...</h4><p className="text-sm text-gray-600 video-meta"></p></div>
                      <div className="text-right"><p className="font-semibold text-gray-800">$980</p><p className="text-sm text-green-600">+8% this week</p></div>
                    </div>
                    <div className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center mr-4"><i className="fas fa-database text-white text-xl"></i></div>
                      <div className="flex-1"><h4 className="font-semibold text-gray-800 video-title">Loading...</h4><p className="text-sm text-gray-600 video-meta"></p></div>
                      <div className="text-right"><p className="font-semibold text-gray-800">$720</p><p className="text-sm text-green-600">+12% this week</p></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left" onClick={() => (location.href = '/CourseUploadPage')}>
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3"><i className="fas fa-plus text-white text-sm"></i></div>
                      <div><p className="font-medium text-gray-800">Create New Course</p><p className="text-sm text-gray-600">Start building your next course</p></div>
                    </button>
                    <button className="w-full flex items-center p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left" onClick={() => (location.href = '/analytics')}>
                      <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-3"><i className="fas fa-chart-line text-white text-sm"></i></div>
                      <div><p className="font-medium text-gray-800">View Analytics</p><p className="text-sm text-gray-600">Check your performance</p></div>
                    </button>
                    <button className="w-full flex items-center p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left" onClick={() => (location.href = '/channel')}>
                      <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3"><i className="fas fa-tv text-white text-sm"></i></div>
                      <div><p className="font-medium text-gray-800">View My Channel</p><p className="text-sm text-gray-600">See how students see your channel</p></div>
                    </button>
                    <button className="w-full flex items-center p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left" onClick={() => (location.href = '/debug-channel')}>
                      <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center mr-3"><i className="fas fa-bug text-white text-sm"></i></div>
                      <div><p className="font-medium text-gray-800">Debug Channel</p><p className="text-sm text-gray-600">Debug channel-course mapping</p></div>
                    </button>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    <div className="flex items-start"><div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></div><div><p className="text-sm font-medium text-gray-800">New student enrolled</p><p className="text-xs text-gray-600">Sarah joined "Advanced JavaScript"</p><p className="text-xs text-gray-500">2 hours ago</p></div></div>
                    <div className="flex items-start"><div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div><div><p className="text-sm font-medium text-gray-800">Course updated</p><p className="text-xs text-gray-600">Added new chapter to UI/UX Design</p><p className="text-xs text-gray-500">5 hours ago</p></div></div>
                    <div className="flex items-start"><div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3"></div><div><p className="text-sm font-medium text-gray-800">New review received</p><p className="text-xs text-gray-600">5-star review on Database Management</p><p className="text-xs text-gray-500">1 day ago</p></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style>{`
      :root { --primary-blue:#2563eb; --dark-blue:#1d4ed8; --border-radius:8px; --border-color:#000000; --hover-bg:#1d4ed8; --text-black:#000000; --text-white:#ffffff; --bg-light-gray:#f9fafb; }
      .nav-item { transition: all .2s ease-in-out; color: var(--text-black); }
      .nav-item:hover { background-color: var(--hover-bg); color: var(--text-white) !important; border-radius: var(--border-radius); margin:2px; }
      .curved-box { border:1px solid var(--border-color); border-radius: var(--border-radius); padding:1.5rem; }
      .settings-section { background-color: white; }
      .main-container { position:relative; height:100vh; }
      .topbar { position:fixed; top:0; left:0; right:0; height:64px; background-color:white; border-bottom:1px solid var(--border-color); z-index:20; display:flex; align-items:center; justify-content:space-between; }
      .topbar-left { width:256px; height:100%; display:flex; align-items:center; padding-left:24px; }
      .topbar-right { flex:1; height:100%; display:flex; align-items:center; justify-content:space-between; padding:0 24px; }
      .sidebar { width:256px; height:calc(100vh - 64px); position:fixed; left:0; top:64px; z-index:10; }
      .main-content { margin-left:257px; height:100vh; padding-top:64px; }
      .t-vertical { position:fixed; top:64px; bottom:0; left:256px; width:1px; background-color: var(--border-color); z-index:15; pointer-events:none; }
      `}</style>
    </div>
  );
};

export default TutorDashboard;


