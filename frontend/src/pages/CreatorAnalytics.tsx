import React, { useEffect, useState } from 'react';
import ProfileMenu from '../components/ProfileMenu';
import MobileSidebar from '../components/MobileSidebar';

const CreatorAnalytics: React.FC = () => {

    const [user, setUser] = useState<any>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const u = JSON.parse(localStorage.getItem('user') || 'null');
        setUser(u);
    }, []);

    const getCreatorLabel = () => {
        if (!user) return 'Creator';
        const type = user.creatorType;
        if (type === 'vlogger') return 'Vlogger';
        if (type === 'music_company') return 'Music Company';
        if (type === 'corporate') return 'Corporate';
        if (type === 'medical') return 'Medical';
        return 'Creator';
    };

    return (
        <div className="min-h-screen bg-[#F9F9F9] font-sans flex flex-col">
            {/* Topbar - Red & White Theme */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
                <div className="flex items-center space-x-3">
                    <button
                        className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <i className="fas fa-bars text-xl"></i>
                    </button>
                    <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                        ▶
                    </div>
                    <span className="text-xl font-bold text-gray-800 hidden md:block tracking-tight pointer-events-none">
                        Studio <span className="text-red-600">Pro</span>
                    </span>
                </div>
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-4">
                        <button
                            className="px-5 py-2 bg-red-600 text-white rounded-full font-bold text-sm flex items-center gap-2 hover:bg-red-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                            onClick={() => window.location.href = '/ContentUploadPage'}
                        >
                            <i className="fas fa-plus"></i>
                            <span>CREATE</span>
                        </button>
                        <div className="h-6 w-px bg-gray-200 mx-2"></div>
                        <ProfileMenu />
                    </div>
                </div>
            </div>

            <div className="flex flex-1 pt-0">
                {/* Sidebar - Light Mode */}
                <div className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed h-full z-20 top-16 shadow-none">
                    <div className="p-6">
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-20 h-20 rounded-full border-2 border-red-500 p-1 mb-3">
                                {user?.avatarUrl ? (
                                    <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-3xl">
                                        {user?.fullName?.charAt(0).toUpperCase() || 'C'}
                                    </div>
                                )}
                            </div>
                            <h3 className="font-bold text-lg text-gray-900">{user?.fullName}</h3>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">{getCreatorLabel()}</p>
                        </div>
                    </div>

                    <nav className="flex-1 px-4">
                        <ul className="space-y-2">
                            <li>
                                <a className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all border-l-4 border-transparent hover:border-red-500" href="/CreatorDashboard">
                                    <i className="fas fa-columns text-sm w-5 text-center"></i>
                                    <span>Dashboard</span>
                                </a>
                            </li>
                            <li>
                                <a className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all border-l-4 border-transparent hover:border-red-500" href="/ContentUploadPage">
                                    <i className="fas fa-video text-sm w-5 text-center"></i>
                                    <span>Content</span>
                                </a>
                            </li>
                            <li>
                                <a className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-white bg-red-600 shadow-lg shadow-red-900/20 transition-all border-l-4 border-transparent" href="/creator/analytics">
                                    <i className="fas fa-chart-line text-sm w-5 text-center"></i>
                                    <span>Analytics</span>
                                </a>
                            </li>
                            <li>
                                <a className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all border-l-4 border-transparent hover:border-red-500" href="/creator/settings">
                                    <i className="fas fa-cog text-sm w-5 text-center"></i>
                                    <span>Settings</span>
                                </a>
                            </li>
                        </ul>
                    </nav>

                    <div className="p-4 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-400">© 2024 Vital Studio</p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 md:ml-64 p-8 overflow-y-auto bg-[#F9F9F9]">
                    <div className="max-w-7xl mx-auto space-y-8 pb-12">
                        <div className="flex items-end justify-between border-b border-gray-200 pb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Channel Analytics</h1>
                                <p className="text-gray-500 text-sm mt-1">Deep dive into your performance.</p>
                            </div>
                        </div>

                        {/* Placeholder Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-64 flex flex-col items-center justify-center text-gray-400">
                                <i className="fas fa-chart-area text-4xl mb-4 text-gray-300"></i>
                                <p>Views Over Time (Coming Soon)</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-64 flex flex-col items-center justify-center text-gray-400">
                                <i className="fas fa-chart-pie text-4xl mb-4 text-gray-300"></i>
                                <p>Audience Demographics (Coming Soon)</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <MobileSidebar
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                user={user}
                title={
                    <span className="text-xl font-bold text-gray-800">
                        Studio <span className="text-red-600">Pro</span>
                    </span>
                }
                links={[
                    { icon: 'fa-columns', label: 'Dashboard', path: '/CreatorDashboard' },
                    { icon: 'fa-video', label: 'Content', path: '/ContentUploadPage' },
                    { icon: 'fa-chart-line', label: 'Analytics', path: '/creator/analytics', active: true },
                    { icon: 'fa-cog', label: 'Settings', path: '/creator/settings' },
                ]}
            />
        </div>
    );
};

export default CreatorAnalytics;
