import React, { useEffect, useState } from 'react';
import ProfileMenu from '../components/ProfileMenu';

const CreatorDashboard: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [content, setContent] = useState<any[]>([]);

    useEffect(() => {
        const u = JSON.parse(localStorage.getItem('user') || 'null');
        setUser(u);

        if (u && u.id) {
            const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';
            fetch(`${BASE_URL}/api/content?creatorId=${u.id}`)
                .then(res => res.json())
                .then(data => setContent(data.content || []))
                .catch(err => console.error(err));
        }
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
                                <a className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-white bg-red-600 shadow-lg shadow-red-900/20 transition-all border-l-4 border-transparent" href="/CreatorDashboard">
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
                                <a className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all border-l-4 border-transparent hover:border-red-500" href="/analytics">
                                    <i className="fas fa-chart-line text-sm w-5 text-center"></i>
                                    <span>Analytics</span>
                                </a>
                            </li>
                            <li>
                                <a className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all border-l-4 border-transparent hover:border-red-500" href="/settings">
                                    <i className="fas fa-cog text-sm w-5 text-center"></i>
                                    <span>Settings</span>
                                </a>
                            </li>
                        </ul>
                    </nav>

                    {/* Footer Info */}
                    <div className="p-4 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-400">© 2024 Vital Studio</p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 md:ml-64 p-8 overflow-y-auto bg-[#F9F9F9]">
                    <div className="max-w-7xl mx-auto space-y-8 pb-12">

                        {/* Welcome Header */}
                        <div className="flex items-end justify-between border-b border-gray-200 pb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Channel Dashboard</h1>
                                <p className="text-gray-500 text-sm mt-1">Overview of your activity and audience.</p>
                            </div>
                        </div>

                        {/* Analytics Strip */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {/* Key Metric: Views */}
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-red-200 transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <i className="fas fa-play-circle text-6xl text-red-600"></i>
                                </div>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Total Views</p>
                                <h3 className="text-3xl font-bold text-gray-900">0</h3>
                                <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
                                    <i className="fas fa-arrow-up"></i> 12% <span className="text-gray-400 font-normal">vs last 28 days</span>
                                </p>
                            </div>

                            {/* Key Metric: Subs */}
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-red-200 transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <i className="fas fa-user-friends text-6xl text-red-600"></i>
                                </div>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Subscribers</p>
                                <h3 className="text-3xl font-bold text-gray-900">0</h3>
                                <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
                                    <i className="fas fa-arrow-up"></i> 5 new <span className="text-gray-400 font-normal">in last 28 days</span>
                                </p>
                            </div>

                            {/* Key Metric: Watch Time */}
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-red-200 transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <i className="fas fa-clock text-6xl text-red-600"></i>
                                </div>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Watch Time (Hrs)</p>
                                <h3 className="text-3xl font-bold text-gray-900">0.0</h3>
                                <p className="text-xs text-gray-400 mt-2">--</p>
                            </div>

                            {/* Key Metric: Revenue */}
                            <div className="bg-gradient-to-br from-red-600 to-red-700 p-6 rounded-xl shadow-lg relative overflow-hidden text-white">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <i className="fas fa-dollar-sign text-6xl text-white"></i>
                                </div>
                                <p className="text-red-100 text-xs font-bold uppercase tracking-wider mb-2">Est. Revenue</p>
                                <h3 className="text-3xl font-bold">$0.00</h3>
                                <p className="text-xs text-red-200 mt-2 opacity-80">Monetization not active</p>
                            </div>
                        </div>

                        {/* Recent Content */}
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <i className="fas fa-video text-red-600"></i> Recent Uploads
                            </h2>

                            {content.length > 0 ? (
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    {/* Table Header */}
                                    <div className="grid grid-cols-12 bg-gray-50 p-4 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        <div className="col-span-6">Video</div>
                                        <div className="col-span-2 text-center">Visibility</div>
                                        <div className="col-span-2 text-center">Date</div>
                                        <div className="col-span-2 text-center">Views</div>
                                    </div>

                                    {/* Table Body */}
                                    <div className="divide-y divide-gray-100">
                                        {content.map((item: any) => (
                                            <div
                                                key={item._id}
                                                className="grid grid-cols-12 p-4 items-center hover:bg-red-50 transition-colors cursor-pointer group"
                                                onClick={() => window.location.href = `/watch/${item._id}`}
                                            >
                                                <div className="col-span-6 flex items-start gap-4">
                                                    <div className="w-28 aspect-video bg-gray-100 rounded overflow-hidden relative border border-gray-200 flex-shrink-0">
                                                        {item.thumbnailUrl ? (
                                                            <img src={item.thumbnailUrl} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                                                                <i className={`fas ${item.type === 'audio' ? 'fa-music' : 'fa-video'} text-xl`}></i>
                                                            </div>
                                                        )}
                                                        <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">
                                                            {item.type === 'audio' ? 'AUDIO' : 'HD'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-red-600 transition-colors">{item.title}</h3>
                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.description}</p>
                                                    </div>
                                                </div>

                                                <div className="col-span-2 text-center">
                                                    <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold">
                                                        <i className="fas fa-globe"></i> Public
                                                    </span>
                                                </div>

                                                <div className="col-span-2 text-center text-xs text-gray-500">
                                                    {new Date(item.createdAt).toLocaleDateString()}
                                                </div>

                                                <div className="col-span-2 text-center font-medium text-sm text-gray-800">
                                                    {item.views}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center hover:border-red-300 transition-colors group">
                                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                        <i className="fas fa-cloud-upload-alt text-2xl"></i>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Upload your first video</h3>
                                    <p className="text-gray-500 text-sm max-w-md mx-auto mt-2 mb-6">
                                        Share your content with the world. Click the button below to get started.
                                    </p>
                                    <button
                                        onClick={() => window.location.href = '/ContentUploadPage'}
                                        className="px-6 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700 transition-colors"
                                    >
                                        UPLOAD CONTENT
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreatorDashboard;
