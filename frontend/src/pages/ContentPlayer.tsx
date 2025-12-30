import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ProfileMenu from '../components/ProfileMenu';
import { useToast } from '../hooks/useToast';

const ContentPlayer: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { showSuccess, showError } = useToast();
    const [content, setContent] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState('');
    const [isPostingComment, setIsPostingComment] = useState(false);
    const [relatedContent, setRelatedContent] = useState<any[]>([]);

    // Placeholder images for fallback
    const PLACEHOLDER_IMAGES = [
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2670&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2670&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1000&auto=format&fit=crop",
    ];

    const getRandomPlaceholder = (id: string) => {
        const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % PLACEHOLDER_IMAGES.length;
        return PLACEHOLDER_IMAGES[index];
    };

    // Get referrer parameter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const referrer = urlParams.get('ref');

    // Determine back URL based on referrer and user role
    const getBackUrl = () => {
        if (referrer === 'creator') return '/CreatorDashboard';
        if (currentUser?.role === 'content_creator') return '/CreatorDashboard';
        if (!isAuthenticated) return '/userhome';
        return '/home'; // Default to home for students
    };

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

                // Fetch related content from same creator
                if (data.creatorId) {
                    const creatorId = typeof data.creatorId === 'object' ? data.creatorId._id : data.creatorId;
                    const resRelated = await fetch(`${BASE_URL}/api/content?creatorId=${creatorId}`);
                    if (resRelated.ok) {
                        const dataRelated = await resRelated.json();
                        // Filter out current video and limit to 5
                        const related = (dataRelated.content || [])
                            .filter((item: any) => item._id !== id)
                            .slice(0, 5);
                        setRelatedContent(related);
                    }
                }

                // Fetch comments
                const resComments = await fetch(`${BASE_URL}/api/comments/content/${id}`);
                if (resComments.ok) {
                    const dataComments = await resComments.json();
                    setComments(dataComments.comments || []);
                }
            } catch (err) {
                console.error(err);
                setError(err instanceof Error ? err.message : 'Failed to load content');
            }
        }
        fetchContent();
    }, [id]);

    const handlePostComment = async () => {
        if (!commentText.trim() || !isAuthenticated) return;
        setIsPostingComment(true);
        try {
            const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');
            const res = await fetch(`${BASE_URL}/api/comments/content/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: commentText })
            });

            if (res.ok) {
                const data = await res.json();
                setComments([data.comment, ...comments]);
                setCommentText('');
            }
        } catch (err) {
            console.error('Failed to post comment', err);
        } finally {
            setIsPostingComment(false);
        }
    };

    const handleLikeComment = async (commentId: string) => {
        if (!isAuthenticated) return;
        try {
            const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');
            const res = await fetch(`${BASE_URL}/api/comments/${commentId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setComments(comments.map(c => {
                    if (c.id === commentId) {
                        return {
                            ...c,
                            likeCount: data.likes,
                            likes: data.isLiked ? [...(c.likes || []), currentUser.id] : (c.likes || []).filter((uid: string) => uid !== currentUser.id)
                        };
                    }
                    return c;
                }));
            }
        } catch (err) {
            console.error('Failed to like comment', err);
        }
    };

    const handleContentLike = async () => {
        if (!isAuthenticated) return showError('Please login to like');
        try {
            const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');
            const res = await fetch(`${BASE_URL}/api/content/${id}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setContent((prev: any) => ({
                    ...prev,
                    likeCount: data.likes,
                    likes: data.isLiked ? [...(prev.likes || []), currentUser.id] : (prev.likes || []).filter((uid: string) => uid !== currentUser.id)
                }));
            }
        } catch (err) {
            console.error('Failed to like content', err);
            showError('Failed to like video');
        }
    };

    const handleShare = async () => {
        const baseUrl = (import.meta as any).env.PUBLIC_FRONTEND_URL || window.location.origin;
        const url = `${baseUrl}/watch/${id}`;

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(url);
            } else {
                // Fallback for non-secure contexts (e.g. http localhost)
                const textArea = document.createElement("textarea");
                textArea.value = url;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                if (!successful) throw new Error('Copy failed');
            }
            showSuccess('Link copied to clipboard!');
        } catch (err) {
            console.error('Share failed:', err);
            showError('Failed to copy link');
        }
    };

    if (error) return (
        <div className="min-h-screen flex items-center justify-center text-white bg-black">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-red-500 mb-2">Error Loading Content</h2>
                <p className="text-gray-300 mb-4">{error}</p>
                <a href="/userhome" className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors">Go Back</a>
            </div>
        </div>
    );

    if (!content) return <div className="min-h-screen flex items-center justify-center text-white bg-black">Loading...</div>;

    const isAudio = content.type === 'audio';
    const meta = content.metadata || {};

    return (
        <div className="h-screen bg-[#0f0f0f] text-white font-sans flex flex-col overflow-hidden">
            {/* Navbar - Simplified for Theater Mode */}
            <div className="h-16 flex items-center justify-between px-6 bg-[#0f0f0f] border-b border-gray-800 shrink-0 z-50">
                <div className="flex items-center space-x-4">
                    <a href={getBackUrl()} className="text-gray-400 hover:text-white"><i className="fas fa-arrow-left"></i></a>
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

            <div className="flex flex-col lg:flex-row max-w-[1800px] mx-auto w-full p-6 gap-6 h-auto lg:h-[calc(100vh-4rem)] lg:overflow-hidden">
                {/* Main Content Area */}
                <div className="w-full lg:w-[70%] space-y-4 h-auto lg:h-full lg:overflow-y-auto custom-scrollbar pr-0 lg:pr-2 pb-10 lg:pb-20">
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
                                    <audio
                                        ref={audioRef}
                                        src={(() => {
                                            if (!content.contentUrl) return '';
                                            if (content.contentUrl.startsWith('http')) return content.contentUrl;
                                            const baseUrl = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';
                                            const path = content.contentUrl.startsWith('/') ? content.contentUrl : `/${content.contentUrl}`;
                                            return `${baseUrl}${path}`;
                                        })()}
                                        controls
                                        className="mt-8 w-96 max-w-full"
                                        autoPlay
                                    />
                                </div>
                            </div>
                        ) : (
                            <video
                                ref={videoRef}
                                src={(() => {
                                    if (!content.contentUrl) return '';
                                    if (content.contentUrl.startsWith('http')) return content.contentUrl;
                                    const baseUrl = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';
                                    let path = content.contentUrl;
                                    // Fix windows path separators if present
                                    path = path.replace(/\\/g, '/');
                                    path = path.startsWith('/') ? path : `/${path}`;
                                    return `${baseUrl}${path}`;
                                })()}
                                crossOrigin="anonymous"
                                poster={(() => {
                                    if (!content.thumbnailUrl) return '';
                                    if (content.thumbnailUrl.startsWith('http')) return content.thumbnailUrl;
                                    const baseUrl = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';
                                    const path = content.thumbnailUrl.startsWith('/') ? content.thumbnailUrl : `/${content.thumbnailUrl}`;
                                    return `${baseUrl}${path}`;
                                })()}
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
                    <div className="bg-[#1f1f1f] rounded-xl p-4 mt-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex gap-2">
                                <button
                                    onClick={handleContentLike}
                                    disabled={!isAuthenticated}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${!isAuthenticated
                                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
                                        : content.likes && Array.isArray(content.likes) && content.likes.includes(currentUser?.id)
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'bg-white/10 hover:bg-white/20 text-white'
                                        }`}
                                >
                                    <i className="fas fa-thumbs-up"></i>
                                    <span>{content.likeCount !== undefined ? content.likeCount : (content.likes || 0)}</span>
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                                >
                                    <i className="fas fa-share"></i>
                                    <span>Share</span>
                                </button>
                            </div>
                        </div>
                        <p className="whitespace-pre-wrap text-sm text-gray-200">{content.description}</p>
                    </div>

                    {/* Comments Section */}
                    <div className="mt-6">
                        <h3 className="text-xl font-bold mb-4">Comments <span className="text-gray-400 text-sm font-normal">({comments.length})</span></h3>

                        {/* Add Comment Input */}
                        {isAuthenticated ? (
                            <div className="flex gap-4 mb-6">
                                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold overflow-hidden">
                                    {currentUser.avatarUrl ? (
                                        <img src={currentUser.avatarUrl.startsWith('http') ? currentUser.avatarUrl : `${(import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000'}/${currentUser.avatarUrl}`} className="w-full h-full object-cover" />
                                    ) : (
                                        currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="Add a comment..."
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        className="w-full bg-transparent border-b border-gray-700 focus:border-white outline-none pb-2 text-sm text-white transition-colors"
                                    />
                                    <div className="flex justify-end mt-2">
                                        <button
                                            onClick={() => setCommentText('')}
                                            className="text-sm font-medium text-gray-400 hover:text-white mr-4"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handlePostComment}
                                            disabled={!commentText.trim() || isPostingComment}
                                            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${!commentText.trim() || isPostingComment ? 'bg-gray-800 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                        >
                                            {isPostingComment ? 'Posting...' : 'Comment'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-6 p-4 bg-gray-800/50 rounded-lg text-center">
                                <p className="text-sm text-gray-400">Please <a href="/login" className="text-blue-400 hover:underline">sign in</a> to post comments.</p>
                            </div>
                        )}

                        {/* Comment List */}
                        <div className="space-y-6">
                            {comments.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No comments yet. Be the first to share your thoughts!</p>
                            ) : (
                                comments.map((comment) => (
                                    <div key={comment.id} className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
                                            {comment.user?.avatarUrl ? (
                                                <img src={comment.user.avatarUrl.startsWith('http') ? comment.user.avatarUrl : `${(import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000'}/${comment.user.avatarUrl}`} className="w-full h-full object-cover" />
                                            ) : (
                                                comment.user?.fullName ? comment.user.fullName.charAt(0).toUpperCase() : '?'
                                            )}
                                        </div>
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold">{comment.user?.fullName || 'Unknown User'}</span>
                                                <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm text-gray-300">{comment.content}</p>
                                            <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                                                <button
                                                    onClick={() => handleLikeComment(comment.id)}
                                                    className={`flex items-center gap-1 hover:text-white transition-colors ${comment.likes?.includes(currentUser?.id) ? 'text-blue-400' : ''}`}
                                                >
                                                    <i className={`fas fa-thumbs-up ${comment.likes?.includes(currentUser?.id) ? '' : 'text-gray-500'}`}></i>
                                                    <span>{comment.likeCount || 0}</span>
                                                </button>
                                                {/* Dislike/Reply buttons can be added later if API supports it */}
                                                {/* <button className="hover:text-white"><i className="fas fa-thumbs-down"></i></button> */}
                                                {/* <button className="hover:text-white font-medium">Reply</button> */}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar: Metadata & Credits */}
                <div className="w-full lg:w-[30%] space-y-6 h-auto lg:h-full lg:overflow-y-auto custom-scrollbar pl-0 lg:pl-2 pb-20">

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

                    {/* Related Content List */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-400 text-sm uppercase">More from this creator</h3>
                        {relatedContent.length > 0 ? (
                            relatedContent.map((item) => (
                                <a href={`/watch/${item._id}`} key={item._id} className="flex gap-3 group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                                    <div className="w-32 h-20 bg-gray-800 rounded-lg overflow-hidden relative shrink-0">
                                        <img
                                            src={item.thumbnailUrl || getRandomPlaceholder(item._id)}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = getRandomPlaceholder(item._id);
                                            }}
                                        />
                                        <div className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[10px] text-white">
                                            {item.type === 'video' ? 'Video' : 'Audio'}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <h4 className="font-bold text-sm text-gray-200 line-clamp-2 leading-tight group-hover:text-white transition-colors">
                                            {item.title}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                            <span>{item.views || 0} views</span>
                                            <span>•</span>
                                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </a>
                            ))
                        ) : (
                            <div className="text-gray-500 text-sm italic">No other content found.</div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default ContentPlayer;
