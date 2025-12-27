import React, { useEffect, useState } from 'react';
import ProfileMenu from '../components/ProfileMenu';

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState({
    subscribers: 0,
    courses: 0,
    enrollments: 0,
    views: 0,
    revenueUsd: 0
  });

  useEffect(() => {
    (async function loadAnalytics() {
      try {
        const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        if (!user) return;
        
        const res = await fetch(`${BASE_URL}/api/analytics/tutor/${user.id || user._id}`);
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (e) {
        console.error('Failed to load analytics', e);
      }
    })();
  }, []);

  useEffect(() => {
    const handleNavHover = () => {
      const navItems = document.querySelectorAll('.nav-item');
      const activeItem = document.querySelector('.nav-item.active-nav');
      
      navItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
          if (!item.classList.contains('active-nav')) {
            // Remove active styling from currently active item
            if (activeItem) {
              activeItem.classList.remove('temp-active');
              activeItem.classList.add('temp-inactive');
            }
            // Add hover styling to current item
            item.classList.add('temp-hover');
          }
        });
        
        item.addEventListener('mouseleave', () => {
          if (!item.classList.contains('active-nav')) {
            // Remove hover styling
            item.classList.remove('temp-hover');
            // Restore active styling to originally active item
            if (activeItem) {
              activeItem.classList.remove('temp-inactive');
              activeItem.classList.add('temp-active');
            }
          }
        });
      });
    };

    handleNavHover();
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
          <a className="text-2xl font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors" href="/Tutordashboard">Dashboard</a>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"><i className="fas fa-bell text-lg"></i><span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></span></button>
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
            <li><a className="nav-item active-nav w-full flex items-center space-x-3 px-4 py-3 font-medium" href="/analytics"><i className="fas fa-chart-bar text-sm"></i><span>Analytics</span></a></li>
            <li><a className="nav-item w-full flex items-center space-x-3 px-4 py-3 font-medium" href="/Monetization"><i className="fas fa-dollar-sign text-sm"></i><span>Monetization</span></a></li>
            <li><a className="nav-item w-full flex items-center space-x-3 px-4 py-3 font-medium" href="/EditUploadsPage"><i className="fas fa-edit text-sm"></i><span>Edit Uploads</span></a></li>
          </ul>
        </nav>
        <div className="settings-section p-4"><button className="nav-item w-full flex items-center space-x-3 px-4 py-3 font-medium"><i className="fas fa-cog text-sm"></i><span>Settings</span></button></div>
      </div>

      <div className="t-vertical"></div>

      <div className="main-content flex flex-col">
        <main className="flex-1 p-6 overflow-auto" style={{ backgroundColor: 'var(--bg-light-gray)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <h2 className="text-lg font-medium text-black mb-4">Total Subscribers</h2>
                <div className="curved-box bg-white">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-users text-blue-600 text-2xl"></i>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-blue-600 mb-2">{analytics.subscribers}</div>
                      <p className="text-sm text-gray-600">Total subscribers to your channel</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-1">
                <h3 className="text-lg font-medium text-black mb-4">Total Courses</h3>
                <div className="curved-box bg-white">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-book text-green-600 text-2xl"></i>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-green-600 mb-2">{analytics.courses}</div>
                      <p className="text-sm text-gray-600">Active courses in your channel</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-1">
                <h3 className="text-lg font-medium text-black mb-4">Total Enrollments</h3>
                <div className="curved-box bg-white">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-graduation-cap text-purple-600 text-2xl"></i>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-purple-600 mb-2">{analytics.enrollments}</div>
                      <p className="text-sm text-gray-600">Students enrolled in your courses</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="text-lg font-medium text-black mb-4">Total Views</h3>
                <div className="curved-box bg-white">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-eye text-orange-600 text-2xl"></i>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-orange-600 mb-2">{analytics.views}</div>
                      <p className="text-sm text-gray-600">Total views across all your content</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-black mb-4">Revenue</h3>
                <div className="curved-box bg-white">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-dollar-sign text-green-600 text-2xl"></i>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-green-600 mb-2">${analytics.revenueUsd}</div>
                      <p className="text-sm text-gray-600">Total revenue from enrollments</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style>{`
      :root { --primary-blue:#2563eb; --dark-blue:#1d4ed8; --border-radius:8px; --border-color:#000000; --hover-bg:#1d4ed8; --text-black:#000000; --text-white:#ffffff; --bg-light-gray:#f9fafb; }
      .nav-item { transition: all .2s ease-in-out; color: var(--text-black); border-radius: var(--border-radius); }
      .nav-item.active-nav, .nav-item.temp-active { background-color: var(--dark-blue) !important; color: var(--text-white) !important; }
      .nav-item.temp-hover { background-color: var(--dark-blue) !important; color: var(--text-white) !important; margin:2px; }
      .nav-item.temp-inactive { background-color: transparent !important; color: var(--text-black) !important; }
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

export default Analytics;


