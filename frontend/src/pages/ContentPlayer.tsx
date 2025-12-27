import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ProfileMenu from '../components/ProfileMenu';

const ContentPlayer: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [content, setContent] = useState<any>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Check auth status
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                setIsAuthenticated(true);
                setCurrentUser(user);
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    useEffect(() => {
        async function fetchContent() {
            if (!id) return;
            try {
                const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';
                const res = await fetch(`${BASE_URL}/api/content/${id}`);
                if (!res.ok) throw new Error('Failed to load content');
                const data = await res.json();
                setContent(data);
            } catch (err) {
                console.error(err);
            }
        }
        fetchContent();
    }, [id]);

    if (!content) return <div className="min-h-screen flex items-center justify-center text-white bg-black">Loading...</div>;

    const isAudio = content.type === 'audio';
    const meta = content.metadata || {};

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-white font-sans flex flex-col">
            {/* Navbar - Simplified for Theater Mode */}
            <div className="h-16 flex items-center justify-between px-6 bg-[#0f0f0f] border-b border-gray-800 sticky top-0 z-50">
                <div className="flex items-center space-x-4">
                    <a href="/home" className="text-gray-400 hover:text-white"><i className="fas fa-arrow-left"></i></a>
                    <span className="font-bold text-lg tracking-tight">Studio Player</span>
                </div>
                <div className="flex items-center space-x-6">
                    {isAuthenticated ? (
                        <ProfileMenu user={currentUser} />
                    ) : (
                        <a href="/login" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors text-sm">
                            Sign In
                        </a>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row max-w-[1800px] mx-auto w-full p-6 gap-6">
                {/* Main Content Area */}
                <div className="lg:w-[70%] space-y-4">
                    {/* Player Container */}
                    <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative group">
                        {isAudio ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 to-black relative">
                                {content.thumbnailUrl && <img src={content.thumbnailUrl} className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm" />}
                                <div className="z-10 relative text-center items-center flex flex-col p-10">
                                    <div className="w-48 h-48 rounded-lg overflow-hidden shadow-2xl mb-6 mx-auto border border-white/10">
                                        <img src={content.thumbnailUrl || '/assets/music-placeholder.png'} className="w-full h-full object-cover" />
                                    </div>
                                    <h2 className="text-3xl font-bold mb-2 text-shadow-lg">{content.title}</h2>
                                    <p className="text-gray-300 font-medium">{meta.singer}</p>
                                    <audio ref={audioRef} src={content.contentUrl} controls className="mt-8 w-96 max-w-full" autoPlay />
                                </div>
                            </div>
                        ) : (
                            <video
                                ref={videoRef}
                                src={content.contentUrl}
                                poster={content.thumbnailUrl}
                                controls
                                autoPlay
                                className="w-full h-full object-contain"
                            />
                        )}
                    </div>

                    {/* Title & Actions */}
                    <div>
                        <h1 className="text-xl font-bold line-clamp-2 leading-snug">{content.title}</h1>
                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-3 text-sm text-gray-400">
                                <span>{content.views} views</span>
                                <span>•</span>
                                <span>{new Date(content.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Description & Channel */}
                    {/* Description & Channel */}
                    <div className="bg-[#1f1f1f] rounded-xl p-4 mt-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex gap-2">
                                <button className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm font-medium transition-colors">
                                    <i className="fas fa-thumbs-up"></i>
                                    <span>{content.likes}</span>
                                </button>
                                <button className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm font-medium transition-colors">
                                    <i className="fas fa-share"></i>
                                    <span>Share</span>
                                </button>
                            </div>
                        </div>
                        <p className="whitespace-pre-wrap text-sm text-gray-200">{content.description}</p>
                    </div>

                    {/* Comments Section */}
                    <div className="mt-6">
                        <h3 className="text-xl font-bold mb-4">Comments <span className="text-gray-400 text-sm font-normal">(12)</span></h3>

                        {/* Add Comment Input */}
                        <div className="flex gap-4 mb-6">
                            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold">
                                ME
                            </div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Add a comment..."
                                    className="w-full bg-transparent border-b border-gray-700 focus:border-white outline-none pb-2 text-sm text-white transition-colors"
                                />
                                <div className="flex justify-end mt-2">
                                    <button className="text-sm font-medium text-gray-400 hover:text-white mr-4">Cancel</button>
                                    <button className="px-4 py-1.5 bg-gray-800 text-gray-400 rounded-full text-sm font-bold hover:bg-blue-600 hover:text-white transition-colors">Comment</button>
                                </div>
                            </div>
                        </div>

                        {/* Comment List */}
                        <div className="space-y-6">
                            {/* Mock Comment 1 */}
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">JD</div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold">John Doe</span>
                                        <span className="text-xs text-gray-500">2 days ago</span>
                                    </div>
                                    <p className="text-sm text-gray-300">This is exactly the vibe I was looking for! Amazing composition. 🔥</p>
                                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                                        <button className="hover:text-white"><i className="fas fa-thumbs-up mr-1"></i> 24</button>
                                        <button className="hover:text-white"><i className="fas fa-thumbs-down"></i></button>
                                        <button className="hover:text-white font-medium">Reply</button>
                                    </div>
                                </div>
                            </div>

                            {/* Mock Comment 2 */}
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs font-bold">AS</div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold">Alice Smith</span>
                                        <span className="text-xs text-gray-500">5 hours ago</span>
                                    </div>
                                    <p className="text-sm text-gray-300">Can't wait for the full album to drop. Great work on the vocals!</p>
                                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                                        <button className="hover:text-white"><i className="fas fa-thumbs-up mr-1"></i> 8</button>
                                        <button className="hover:text-white"><i className="fas fa-thumbs-down"></i></button>
                                        <button className="hover:text-white font-medium">Reply</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar: Metadata & Credits */}
                <div className="lg:w-[30%] space-y-6">

                    {/* Credits Card (Only for Music/Rich Metadata) */}
                    {(meta.singer || meta.composer || meta.cast) && (
                        <div className="bg-[#1f1f1f] rounded-xl p-6 border border-white/5 space-y-4">
                            <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-white/10">
                                <span className="text-xl">🎬</span>
                                <h3 className="font-bold">Credits</h3>
                            </div>

                            <div className="space-y-3 text-sm">
                                {meta.movieName && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Movie</span>
                                        <span className="font-medium text-white">{meta.movieName}</span>
                                    </div>
                                )}
                                {meta.singer && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Singer</span>
                                        <span className="font-medium text-purple-400">{meta.singer}</span>
                                    </div>
                                )}
                                {meta.composer && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Composer</span>
                                        <span className="font-medium text-white">{meta.composer}</span>
                                    </div>
                                )}
                                {meta.musicDirector && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Music Director</span>
                                        <span className="font-medium text-white">{meta.musicDirector}</span>
                                    </div>
                                )}
                                {meta.producer && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Producer</span>
                                        <span className="font-medium text-white">{meta.producer}</span>
                                    </div>
                                )}
                                {meta.director && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Director</span>
                                        <span className="font-medium text-white">{meta.director}</span>
                                    </div>
                                )}
                                {meta.cast && (
                                    <div className="pt-2 border-t border-white/10 mt-2">
                                        <span className="text-gray-400 block mb-1 text-xs uppercase font-bold">Cast</span>
                                        <p className="text-white leading-relaxed">{meta.cast}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Placeholder for related content */}
                    <div className="space-y-2">
                        <h3 className="font-bold text-gray-400 text-sm uppercase">More from this creator</h3>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-2 group cursor-pointer">
                                <div className="w-32 h-16 bg-gray-800 rounded-lg overflow-hidden relative">
                                    {/* Placeholder generic thumb */}
                                </div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-800 rounded w-3/4 mb-1"></div>
                                    <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ContentPlayer;
