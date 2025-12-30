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
    quality?: string;
    isHDR?: boolean;
    contentUrl?: string;
    tags?: string[];
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
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [heroMediaError, setHeroMediaError] = useState(false);

    useEffect(() => {
        setHeroMediaError(false);
    }, [featuredContent]);

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
                    // if (userData.role === 'student') navigate('/home');
                }
            } catch (e) {
                console.error("Auth check failed", e);
            }
        }
    };

    // Placeholder images for when thumbnail is missing
    const PLACEHOLDER_IMAGES = [
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2670&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2670&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1000&auto=format&fit=crop",
    ];

    const getRandomPlaceholder = (id: string) => {
        // Use string id to consistently pick the same random image for the same item to avoid flickering
        const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % PLACEHOLDER_IMAGES.length;
        return PLACEHOLDER_IMAGES[index];
    };

    const fetchContent = async () => {
        try {
            setLoading(true);
            // Fetch all public content
            const res = await fetch(`${BASE_URL}/api/content`);
            if (res.ok) {
                const data = await res.json();
                // Map backend response (nested creatorId) to frontend model (flat creatorName)
                const allContent: ContentItem[] = (data.content || []).map((item: any) => ({
                    ...item,
                    creatorName: item.creatorId?.fullName || item.creatorName || 'Unknown Creator',
                    creatorType: item.creatorId?.creatorType
                }));

                if (allContent.length > 0) {
                    // Randomly select featured content
                    const randomIndex = Math.floor(Math.random() * allContent.length);
                    const randomFeatured = allContent[randomIndex];
                    setFeaturedContent(randomFeatured);

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
                                <img
                                    src={item.thumbnailUrl || getRandomPlaceholder(item._id)}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = getRandomPlaceholder(item._id);
                                    }}
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                                    <h3 className="text-white font-bold text-lg truncate">{item.title}</h3>
                                    <p className="text-gray-300 text-xs mt-1">{item.creatorName || 'Unknown Creator'}</p>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 font-medium">
                                        <span><i className="fas fa-play mr-1"></i>Watch Now</span>
                                        {item.views && <span>• {item.views} views</span>}
                                        {item.quality && <span className="px-1 border border-gray-500 rounded text-[10px] text-gray-300">{item.quality}</span>}
                                        {item.isHDR && <span className="px-1 bg-gray-700 text-white rounded text-[10px] font-bold">HDR</span>}
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
                        {featuredContent.type === 'video' && featuredContent.contentUrl && !heroMediaError ? (
                            <video
                                src={`${featuredContent.contentUrl}#t=2`}
                                className="w-full h-full object-cover"
                                autoPlay
                                loop
                                muted
                                playsInline
                                preload="metadata"
                                poster={featuredContent.thumbnailUrl || getRandomPlaceholder(featuredContent._id)}
                                onError={() => setHeroMediaError(true)}
                            />
                        ) : (
                            <img
                                src={featuredContent.thumbnailUrl || getRandomPlaceholder(featuredContent._id)}
                                className="w-full h-full object-cover"
                                alt="Hero"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = getRandomPlaceholder(featuredContent._id);
                                }}
                            />
                        )}
                        {/* Complex Gradient Overlay for Readability */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent"></div>
                    </div>

                    <div className="absolute inset-0 flex items-center px-4 md:px-12">
                        <div className="max-w-2xl pt-20">
                            <div className="flex items-center gap-3 mb-4 animate-fade-in-up">
                                <span className="text-red-600 font-bold tracking-widest text-sm border-l-4 border-red-600 pl-3">FEATURED</span>
                            </div>
                            <h1 className="text-4xl md:text-7xl font-black text-white mb-6 leading-tight drop-shadow-lg animate-fade-in-up delay-100 line-clamp-2 max-h-[1.2em] md:max-h-[2.5em] overflow-hidden">
                                {featuredContent.title}
                            </h1>

                            <div className="flex items-center gap-4 text-gray-300 mb-8 font-medium animate-fade-in-up delay-200">
                                <span className="text-green-400 font-bold">{new Date().getFullYear()}</span>
                                {featuredContent.quality && (
                                    <span className="px-1.5 py-0.5 border border-gray-500 rounded text-[10px] text-gray-300 uppercase">
                                        {featuredContent.quality}
                                    </span>
                                )}
                                {featuredContent.isHDR && (
                                    <span className="px-1.5 py-0.5 bg-gray-700 text-white rounded text-[10px] font-bold">HDR</span>
                                )}
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
                                <button
                                    onClick={() => setShowInfoModal(true)}
                                    className="w-full md:w-auto px-8 py-3.5 bg-gray-500/40 backdrop-blur-md text-white font-bold text-xl rounded hover:bg-gray-500/60 transition-all flex items-center justify-center gap-3 hover:scale-105 active:scale-95 ring-1 ring-white/30">
                                    <i className="fas fa-info-circle text-2xl"></i> More Info
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* More Info Modal */}
            {showInfoModal && featuredContent && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowInfoModal(false)}></div>
                    <div className="bg-[#181818] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl animate-scale-in">

                        {/* Modal Close Button */}
                        <button
                            onClick={() => setShowInfoModal(false)}
                            className="absolute top-4 right-4 z-20 w-10 h-10 bg-[#181818]/60 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors"
                        >
                            <i className="fas fa-times text-xl"></i>
                        </button>

                        {/* Modal Header Image */}
                        <div className="relative aspect-video w-full">
                            <img
                                src={featuredContent.thumbnailUrl || getRandomPlaceholder(featuredContent._id)}
                                className="w-full h-full object-cover"
                                alt={featuredContent.title}
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = getRandomPlaceholder(featuredContent._id);
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent"></div>

                            <div className="absolute bottom-0 left-0 p-8 w-full">
                                <h2 className="text-3xl md:text-5xl font-black text-white mb-4 drop-shadow-lg">{featuredContent.title}</h2>
                                <div className="flex items-center gap-4 text-green-400 font-bold text-sm">
                                    <span className="text-gray-300 font-normal">{new Date().getFullYear()}</span>
                                    {featuredContent.quality && (
                                        <span className="px-1.5 py-0.5 border border-gray-500 rounded text-[10px] text-gray-300 uppercase">
                                            {featuredContent.quality}
                                        </span>
                                    )}
                                    {featuredContent.views !== undefined && (
                                        <span className="text-white">{featuredContent.views} views</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 grid md:grid-cols-[2fr,1fr] gap-8">
                            <div>
                                <div className="flex items-center gap-4 mb-6">
                                    <button
                                        onClick={() => navigate(`/watch/${featuredContent._id}`)}
                                        className="px-8 py-3 bg-white text-black font-bold text-lg rounded hover:bg-white/90 transition-all flex items-center gap-2 hover:scale-105"
                                    >
                                        <i className="fas fa-play"></i> Play
                                    </button>
                                    <button
                                        className="w-12 h-12 border-2 border-gray-500 rounded-full flex items-center justify-center text-gray-300 hover:border-white hover:text-white transition-colors"
                                        title="Add to My List"
                                    >
                                        <i className="fas fa-plus"></i>
                                    </button>
                                </div>
                                <p className="text-gray-300 text-lg leading-relaxed mb-6">
                                    {featuredContent.description || "No description available."}
                                </p>
                            </div>

                            <div className="text-sm text-gray-400 space-y-2">
                                <div>
                                    <span className="block text-gray-500 font-semibold mb-1">Creator</span>
                                    <span className="text-white hover:underline cursor-pointer">{featuredContent.creatorName}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 font-semibold mb-1">Genres</span>
                                    <span className="text-white">
                                        {featuredContent.category || 'Entertainment'}
                                        {featuredContent.type && `, ${featuredContent.type === 'video' ? 'Video' : 'Music'}`}
                                    </span>
                                </div>
                                {featuredContent.tags && featuredContent.tags.length > 0 && (
                                    <div>
                                        <span className="block text-gray-500 font-semibold mb-1">Tags</span>
                                        <span className="text-white">{featuredContent.tags.join(', ')}</span>
                                    </div>
                                )}
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
