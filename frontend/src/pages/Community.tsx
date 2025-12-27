import React from 'react';
import logoImage from '../assets/logo.jpg';
import ProfileMenu from '../components/ProfileMenu';

const Community: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50/50 flex font-sans text-gray-900">
            {/* Sidebar (Desktop) */}
            <aside className="w-20 lg:w-64 bg-white border-r border-gray-100 hidden md:flex flex-col sticky top-0 h-screen z-30">
                <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6">
                    <a href="/home" className="flex items-center space-x-3">
                        <img src={logoImage} alt="Vital" className="w-10 h-10 rounded-xl shadow-sm" />
                        <span className="text-xl font-bold text-gray-800 hidden lg:block">Vital</span>
                    </a>
                </div>
                <nav className="flex-1 py-6 px-3 space-y-2">
                    {[
                        { icon: 'fa-home', label: 'Dashboard', path: '/home' },
                        { icon: 'fa-compass', label: 'Explore', path: '/channels' },
                        { icon: 'fa-book-open', label: 'My Learning', path: '/library' },
                        { icon: 'fa-users', label: 'Community', path: '/community', active: true },
                        { icon: 'fa-robot', label: 'AI Buddy', path: '/buddy' },
                    ].map(item => (
                        <a key={item.label} href={item.path} className={`flex items-center lg:px-4 px-2 py-3.5 rounded-xl transition-all ${item.active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600'}`}>
                            <i className={`fas ${item.icon} w-6 text-center text-lg`}></i>
                            <span className="ml-3 font-medium hidden lg:block">{item.label}</span>
                        </a>
                    ))}
                </nav>
            </aside>

            <main className="flex-1 flex flex-col min-w-0">
                <header className="h-20 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100 px-6 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-800">Community</h1>
                    <div className="flex items-center space-x-5">
                        <ProfileMenu />
                    </div>
                </header>

                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center text-4xl mb-6 animate-bounce">
                        <i className="fas fa-hammer"></i>
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4">Under Construction</h2>
                    <p className="text-gray-500 max-w-md text-lg">
                        We are building an amazing community space for you to connect with other learners and tutors. Stay tuned!
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Community;
