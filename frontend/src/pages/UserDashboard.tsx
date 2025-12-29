import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoImage from '../assets/logo.jpg';
import ProfileMenu from '../components/ProfileMenu';

type ContentItem = {
    _id: string;
    title: string;
    thumbnailUrl?: string;
    description?: string;
    creatorName?: string;
    views?: number;
    category?: string;
    type?: 'video' | 'music' | 'podcast';
};

const UserDashboard: React.FC = () => {
    const [featuredContent, setFeaturedContent] = useState<ContentItem | null>(null);
    const [trending, setTrending] = useState<ContentItem[]>([]);
    const [newReleases, setNewReleases] = useState<ContentItem[]>([]);
    const [music, setMusic] = useState<ContentItem[]>([]);
    const [vlogs, setVlogs] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isScrolled, setIsScrolled] = useState(false);

    const navigate = useNavigate();
    const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';

    // Auth State
    const [user, setUser] = useState<any>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        checkAuth();
        fetchContent();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const res = await fetch(`${BASE_URL}/api/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const userData = await res.json();
                    setUser(userData);
                    setIsAuthenticated(true);
                    // Security check: If student, redirect to Student Dashboard
                    if (userData.role === 'student') navigate('/home');
                }
            } catch (e) {
                console.error("Auth check failed", e);
            }
        }
    };

    const fetchContent = async () => {
        try {
            setLoading(true);
            // Fetch all public content
            // In a real app, you'd have specific endpoints like /api/content/featured, /api/content/trending
            const res = await fetch(`${BASE_URL}/api/content`);
            if (res.ok) {
                const data = await res.json();
                const allContent: ContentItem[] = data.content || [];

                if (allContent.length > 0) {
                    // Mock data distribution for demo
                    setFeaturedContent(allContent[0]);
                    setTrending(allContent.slice(0, 5));
                    setNewReleases(allContent.slice(5, 10));
                    setMusic(allContent.filter(c => c.type === 'music' || c.category === 'Music').slice(0, 10));
                    setVlogs(allContent.filter(c => c.type === 'video').slice(0, 10));
                }
            }
        } catch (error) {
            console.error("Error fetching content:", error);
        } finally {
            setLoading(false);
        }
    };

    const ContentRow = ({ title, items }: { title: string, items: ContentItem[] }) => {
        if (items.length === 0) return null;

        return (
            <div className="mb-8 px-4 md:px-12 group">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors cursor-pointer flex items-center gap-2">
                    {title} <i className="fas fa-chevron-right text-sm opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0"></i>
                </h2>
                <div className="relative group/row">
                    <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x scroll-smooth">
                        {items.map((item) => (
                            <div
                                key={item._id}
                                onClick={() => navigate(`/watch/${item._id}`)}
                                className="flex-none w-[250px] md:w-[300px] aspect-video bg-gray-800 rounded-lg overflow-hidden relative transform transition-all duration-300 hover:scale-105 hover:z-20 cursor-pointer shadow-lg hover:shadow-blue-500/20 snap-start"
                            >
                                {item.thumbnailUrl ? (
                                    <img
                                        src={item.thumbnailUrl}
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                        <i className={`fas ${item.type === 'music' ? 'fa-music' : 'fa-play'} text-3xl text-gray-700`}></i>
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                    <h3 className="text-white font-bold text-lg truncate">{item.title}</h3>
                                    <p className="text-gray-300 text-xs mt-1">{item.creatorName || 'Unknown Creator'}</p>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 font-medium">
                                        <span><i className="fas fa-play mr-1"></i>Watch Now</span>
                                        {item.views && <span>• {item.views} views</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#141414] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#141414] text-white font-sans overflow-x-hidden">

            {/* Navbar - Transparent to Black on Scroll */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-[#141414]/95 backdrop-blur-md shadow-lg' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
                <div className="px-4 md:px-12 h-16 md:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link to="/userhome" className="flex items-center gap-2">
                            <img src={logoImage} alt="Vital" className="w-8 h-8 rounded opacity-90" />
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">Vital</span>
                        </Link>
                        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
                            <Link to="/userhome" className="hover:text-white transition-colors">Home</Link>
                            <Link to="/userhome?cat=video" className="hover:text-white transition-colors">Videos</Link>
                            <Link to="/userhome?cat=music" className="hover:text-white transition-colors">Music</Link>
                            <Link to="/channels" className="hover:text-white transition-colors">Creators</Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search - simplified for now */}
                        <button className="text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                            <i className="fas fa-search text-lg"></i>
                        </button>

                        {isAuthenticated && user ? (
                            <ProfileMenu user={user} />
                        ) : (
                            <Link
                                to="/login"
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded flex items-center gap-2 transition-transform hover:scale-105"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            {featuredContent && (
                <div className="relative h-screen w-full">
                    <div className="absolute inset-0">
                        {featuredContent.thumbnailUrl ? (
                            <img src={featuredContent.thumbnailUrl} className="w-full h-full object-cover" alt="Hero" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-900 via-purple-900 to-black"></div>
                        )}
                        {/* Complex Gradient Overlay for Readability */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/20 to-transparent"></div>
                    </div>

                    <div className="absolute inset-0 flex items-center">
                        <div className="px-6 md:px-16 max-w-2xl mt-32 relative z-20">
                            {/* Animated Badge */}
                            <div className="mb-6 flex items-center gap-2 animate-fade-in-down">
                                <span className="px-3 py-1 bg-gradient-to-r from-red-600 to-pink-600 text-white text-[10px] font-bold tracking-widest uppercase rounded-sm shadow-lg ring-1 ring-white/20">
                                    N Series
                                </span>
                                <span className="text-gray-300 text-sm font-semibold tracking-wide uppercase border-l border-gray-500 pl-2 ml-1">Featured</span>
                            </div>

                            <h1 className="text-4xl md:text-7xl font-black mb-4 md:mb-6 leading-[1.1] md:leading-[0.9] text-white drop-shadow-2xl tracking-tight">
                                {featuredContent.title}
                            </h1>

                            <div className="flex items-center gap-4 text-green-400 font-bold text-sm mb-6">
                                <span>98% Match</span>
                                <span className="text-gray-300 font-normal">2024</span>
                                <span className="px-1.5 py-0.5 border border-gray-500 rounded text-[10px] text-gray-300">HD</span>
                            </div>

                            <p className="text-gray-100 text-base md:text-xl mb-6 md:mb-8 line-clamp-3 font-medium leading-relaxed drop-shadow-md text-shadow">
                                {featuredContent.description || "Experience the best content from our top creators. Watch, listen, and enjoy premium entertainment on Vital."}
                            </p>

                            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                <button
                                    onClick={() => navigate(`/watch/${featuredContent._id}`)}
                                    className="w-full md:w-auto px-8 py-3.5 bg-white text-black font-bold text-xl rounded hover:bg-white/90 transition-all flex items-center justify-center gap-3 hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
                                >
                                    <i className="fas fa-play text-2xl"></i> Play
                                </button>
                                <button className="w-full md:w-auto px-8 py-3.5 bg-gray-500/40 backdrop-blur-md text-white font-bold text-xl rounded hover:bg-gray-500/60 transition-all flex items-center justify-center gap-3 hover:scale-105 active:scale-95 ring-1 ring-white/30">
                                    <i className="fas fa-info-circle text-2xl"></i> More Info
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Rows */}
            <div className="pb-20 -mt-20 relative z-10 space-y-4">
                <ContentRow title="Trending Now" items={trending} />
                <ContentRow title="New Releases" items={newReleases} />
                <ContentRow title="Music & Audio" items={music} />
                <ContentRow title="Vlogs & Lifestyle" items={vlogs} />
            </div>

            {/* Footer Call to Action (Guest only) */}
            {!isAuthenticated && (
                <div className="px-4 md:px-12 py-20 bg-gradient-to-t from-blue-900/20 to-transparent text-center border-t border-gray-800">
                    <h2 className="text-3xl font-bold mb-4">There's even more to watch.</h2>
                    <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                        Sign up for Vital to unlock unlimited access to creator content, create your playlist, and support your favorite channels.
                    </p>
                    <Link to="/register" className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-lg transition-transform hover:scale-105 shadow-xl shadow-blue-900/20">
                        Join Viral Today
                    </Link>
                </div>
            )}

        </div>
    );
};

export default UserDashboard;
