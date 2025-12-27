import React, { useEffect } from 'react';

const Monetization: React.FC = () => {
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
          <div className="flex items-center space-x-2">
            <img src="/src/assets/logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
          </div>
        </div>
        <div className="topbar-right">
          <a className="text-2xl font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors" href="/Tutordashboard">Dashboard</a>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"><i className="fas fa-bell text-lg"></i><span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></span></button>
            <div className="flex items-center space-x-3">
              <div className="relative" id="profile-menu-container">
                <button id="profile-menu-button" className="flex items-center focus:outline-none">
                  <img id="profile-avatar" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format" alt="Profile" className="w-10 h-10 rounded-full border-2 border-gray-200 cursor-pointer" />
                </button>
                <div id="profile-menu" className="hidden absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-30">
                  <button id="profile-upload-trigger" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile Upload</button>
                  <button id="logout-button" className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Logout</button>
                </div>
                <input type="file" id="profile-upload-input" accept="image/*" className="hidden" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sidebar bg-white flex flex-col">
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li><a className="nav-item w-full flex items-center space-x-3 px-4 py-3 font-medium" href="/CourseUploadPage"><i className="fas fa-upload text-sm"></i><span>Upload Course</span></a></li>
            <li><a className="nav-item w-full flex items-center space-x-3 px-4 py-3 font-medium" href="/analytics"><i className="fas fa-chart-bar text-sm"></i><span>Analytics</span></a></li>
            <li><a className="nav-item active-nav w-full flex items-center space-x-3 px-4 py-3 font-medium" href="/Monetization"><i className="fas fa-dollar-sign text-sm"></i><span>Monetization</span></a></li>
            <li><a className="nav-item w-full flex items-center space-x-3 px-4 py-3 font-medium" href="/EditUploadsPage"><i className="fas fa-edit text-sm"></i><span>Edit Uploads</span></a></li>
          </ul>
        </nav>
        <div className="settings-section p-4"><button className="nav-item w-full flex items-center space-x-3 px-4 py-3 font-medium"><i className="fas fa-cog text-sm"></i><span>Settings</span></button></div>
      </div>

      <div className="t-vertical"></div>

      <div className="main-content flex flex-col">
        <main className="flex-1 p-6 overflow-auto" style={{ backgroundColor: 'var(--bg-light-gray)' }}>
          <div className="max-w-7xl mx-auto">
            {/* Preserve the monetization UI structure (static content) */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="curved-box bg-white border-l-4 border-green-500 p-4"><div className="space-y-2"><div className="flex items-center justify-between"><p className="text-sm text-gray-600">Income</p><div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium flex items-center space-x-1"><i className="fas fa-arrow-up text-xs"></i><span>11.09%</span></div></div><div className="text-2xl font-bold text-gray-900">$128,320</div></div></div>
                <div className="curved-box bg-white border-l-4 border-blue-500 p-4"><div className="space-y-2"><p className="text-sm text-gray-600">My Balance</p><div className="text-2xl font-bold text-gray-900">$128,320</div></div></div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 curved-box bg-white">
                  <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-medium text-black">Revenue Chart</h3><div className="flex items-center space-x-2 text-sm text-gray-500"><i className="fas fa-calendar text-xs"></i><span>2024</span><i className="fas fa-chevron-down text-xs ml-1"></i></div></div>
                  <div className="h-48 relative">
                    <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-4"><span>$100K</span><span>$75K</span><span>$50K</span><span>$25K</span><span>$0</span></div>
                    <div className="ml-12 h-full relative">
                      <svg className="w-full h-full" viewBox="0 0 400 200">
                        <defs>
                          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/></pattern>
                          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" /><stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" /></linearGradient>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                        <path d="M 20 180 L 80 140 L 140 120 L 200 100 L 260 80 L 320 60 L 380 40 L 380 200 L 20 200 Z" fill="url(#areaGradient)" />
                        <path d="M 20 180 L 80 140 L 140 120 L 200 100 L 260 80 L 320 60 L 380 40" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="20" cy="180" r="4" fill="#3b82f6" />
                        <circle cx="80" cy="140" r="4" fill="#3b82f6" />
                        <circle cx="140" cy="120" r="4" fill="#3b82f6" />
                        <circle cx="200" cy="100" r="4" fill="#3b82f6" />
                        <circle cx="260" cy="80" r="4" fill="#3b82f6" />
                        <circle cx="320" cy="60" r="4" fill="#3b82f6" />
                        <circle cx="380" cy="40" r="4" fill="#3b82f6" />
                      </svg>
                    </div>
                    <div className="absolute bottom-0 left-12 right-0 flex justify-between text-xs text-gray-500 mt-2"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span></div>
                  </div>
                </div>
                <div className="lg:col-span-1"><div className="curved-box bg-white"><div className="flex items-center justify-between mb-4"><h3 className="text-lg font-medium text-black">History Transactions</h3><button className="text-sm text-blue-600 hover:text-blue-800 font-medium">View all</button></div><div className="space-y-4"><div className="flex items-center space-x-3"><div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0"><i className="fas fa-dollar-sign text-blue-600 text-xs"></i></div><div className="flex-1 min-w-0"><p className="text-xs font-medium text-gray-900">Ad Revenue</p><p className="text-xs text-gray-500">Apr 21, 24</p></div><div className="text-xs font-medium text-green-600">+$487</div></div><div className="flex items-center space-x-3"><div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0"><i className="fas fa-minus text-red-600 text-xs"></i></div><div className="flex-1 min-w-0"><p className="text-xs font-medium text-gray-900">Withdrawal</p><p className="text-xs text-gray-500">Apr 20, 24</p></div><div className="text-xs font-medium text-red-600">-$2490</div></div><div className="flex items-center space-x-3"><div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0"><i className="fas fa-dollar-sign text-blue-600 text-xs"></i></div><div className="flex-1 min-w-0"><p className="text-xs font-medium text-gray-900">Ad Revenue</p><p className="text-xs text-gray-500">Mar 1, 24</p></div><div className="text-xs font-medium text-green-600">+$128</div></div><div className="flex items-center space-x-3"><div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0"><i className="fas fa-plus text-green-600 text-xs"></i></div><div className="flex-1 min-w-0"><p className="text-xs font-medium text-gray-900">Course Sales</p><p className="text-xs text-gray-500">Feb 28, 24</p></div><div className="text-xs font-medium text-green-600">+$850</div></div></div></div></div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="curved-box bg-white"><div className="space-y-4"><h3 className="text-lg font-medium text-black">Quick Withdraw</h3><button className="btn-primary px-4 py-2 text-white font-medium text-sm input-focus">Transfer Money</button></div></div><div className="curved-box bg-white p-4"><div className="w-full h-32 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-3 text-white relative overflow-hidden"><div className="flex justify-between items-start mb-3"><div><p className="text-xs opacity-80">CARD HOLDER</p><p className="font-medium text-sm">Jonathan</p></div><div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"><i className="fas fa-wifi text-white text-xs"></i></div></div><div className="space-y-1 mb-3"><p className="text-xs opacity-60">CARD NUMBER</p><p className="font-mono text-sm tracking-wider">1234 1234 1234 1234</p></div><div className="flex justify-between items-end"><div className="text-xs opacity-60"><p>VALID THRU</p><p>12/28</p></div><div className="text-right"><div className="w-8 h-5 bg-orange-500 rounded opacity-90"></div></div></div><div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full"></div><div className="absolute -bottom-4 -left-4 w-12 h-12 bg-white/5 rounded-full"></div></div></div><div className="space-y-3"><div className="curved-box bg-gray-100 border-dashed border-2 border-gray-300 hover:border-blue-400 transition-colors cursor-pointer p-3"><div className="flex items-center space-x-3"><div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center"><i className="fas fa-plus text-white text-xs"></i></div><span className="font-medium text-gray-700 text-sm">Add Card</span></div></div><button className="curved-box bg-gray-100 w-full text-left hover:bg-gray-200 transition-colors p-3"><div className="flex items-center space-x-3"><div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center"><i className="fas fa-university text-white text-xs"></i></div><span className="font-medium text-gray-700 text-sm">Add bank account</span></div></button></div></div>
              <div className="flex space-x-4"><div className="curved-box bg-white"><div className="flex items-center space-x-2"><span className="text-sm text-gray-600">Date Range</span><i className="fas fa-chevron-down text-xs text-gray-400"></i></div></div><div className="curved-box bg-white"><div className="flex items-center space-x-2"><span className="text-sm text-gray-600">Views Range</span><i className="fas fa-chevron-down text-xs text-gray-400"></i></div></div></div>
              <div className="curved-box bg-white p-0 overflow-hidden"><table className="w-full"><thead><tr className="bg-gradient-to-r from-blue-800 to-blue-600 text-white"><th className="px-6 py-4 text-left text-sm font-medium">Date</th><th className="px-6 py-4 text-left text-sm font-medium">Video</th><th className="px-6 py-4 text-left text-sm font-medium">Description</th><th className="px-6 py-4 text-left text-sm font-medium">Views</th><th className="px-6 py-4 text-left text-sm font-medium">Earnings</th></tr></thead><tbody className="divide-y divide-gray-200"><tr className="hover:bg-gray-50"><td className="px-6 py-4 text-sm text-gray-700">Apr 21, 24</td><td className="px-6 py-4 text-sm text-gray-700">Course Intro</td><td className="px-6 py-4 text-sm text-gray-700">Introduction to AI</td><td className="px-6 py-4 text-sm text-gray-700">12.5K</td><td className="px-6 py-4 text-sm text-green-600 font-medium">+$487</td></tr><tr className="hover:bg-gray-50"><td className="px-6 py-4 text-sm text-gray-700">Apr 20, 24</td><td className="px-6 py-4 text-sm text-gray-700">Advanced Topics</td><td className="px-6 py-4 text-sm text-gray-700">Deep Learning Concepts</td><td className="px-6 py-4 text-sm text-gray-700">8.3K</td><td className="px-6 py-4 text-sm text-green-600 font-medium">+$325</td></tr><tr className="hover:bg-gray-50"><td className="px-6 py-4 text-sm text-gray-700">Apr 19, 24</td><td className="px-6 py-4 text-sm text-gray-700">Practice Session</td><td className="px-6 py-4 text-sm text-gray-700">Hands-on Coding</td><td className="px-6 py-4 text-sm text-gray-700">5.7K</td><td className="px-6 py-4 text-sm text-green-600 font-medium">+$198</td></tr></tbody></table></div>
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
      .btn-primary { background-color: var(--primary-blue); border-radius: var(--border-radius); transition: background-color .2s ease-in-out; }
      .btn-primary:hover { background-color: var(--dark-blue); }
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

export default Monetization;


