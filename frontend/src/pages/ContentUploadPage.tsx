import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast, ToastItem } from '../hooks/useToast';
import Toast from '../components/Toast';
import ProfileMenu from '../components/ProfileMenu';
import MobileSidebar from '../components/MobileSidebar'; // Assuming this component exists as used in CreatorDashboard

const ContentUploadPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'video' | 'details' | 'preview'>('video');
    const [dragActive, setDragActive] = useState(false);
    const [contentFile, setContentFile] = useState<File | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [videoQuality, setVideoQuality] = useState('1080p');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [uploadedContentId, setUploadedContentId] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const hiddenVideoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);
    const { toasts, showSuccess, showError, removeToast } = useToast();

    // Use environment variable for backend URL
    const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            console.warn('No user found, redirecting to login');
            navigate('/login');
        }
    }, [navigate]);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (file: File) => {
        if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
            setContentFile(file);
            if (!title) {
                // Remove extension for default title
                setTitle(file.name.replace(/\.[^/.]+$/, ""));
            }

            // Auto-detect quality if it's a video
            if (file.type.startsWith('video/') && hiddenVideoRef.current) {
                const url = URL.createObjectURL(file);
                hiddenVideoRef.current.src = url;
            } else {
                setVideoQuality('Audio'); // Set default for audio
            }

            setActiveTab('details');
            showSuccess('File added successfully');
        } else {
            showError('Please select a valid video or audio file');
        }
    };

    const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setThumbnailFile(file);
            const previewUrl = URL.createObjectURL(file);
            setThumbnailPreview(previewUrl);
        }
    };

    const onPublish = async () => {
        if (!title.trim()) {
            showError('Please enter a title');
            setActiveTab('details');
            return;
        }
        if (!contentFile) {
            showError('Please select a video file');
            setActiveTab('video');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('video', contentFile);
            formData.append('title', title); // Required by backend
            formData.append('description', description);
            if (thumbnailFile) formData.append('thumbnail', thumbnailFile);

            // Simulate progress since fetch doesn't support built-in progress events easily
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 500);

            // 1. Upload the file(s)
            console.log(`Uploading to: ${BASE_URL}/api/videos`);
            const uploadRes = await fetch(`${BASE_URL}/api/videos`, {
                method: 'POST',
                body: formData,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            clearInterval(progressInterval);

            const uploadResText = await uploadRes.text();
            let uploadData;
            try {
                uploadData = JSON.parse(uploadResText);
            } catch (e) {
                console.error('Failed to parse upload response:', uploadResText);
                throw new Error(`Server returned invalid response: ${uploadResText.substring(0, 100)}...`);
            }

            if (!uploadRes.ok) {
                throw new Error(uploadData.error || uploadData.message || 'Upload failed');
            }

            setUploadProgress(100);

            // 2. Create the content record
            const contentUrl = uploadData.video.videoUrl;
            const uploadedThumbnailUrl = uploadData.video.thumbnailUrl;

            const metadata = {
                title,
                description,
                contentUrl,
                thumbnailUrl: uploadedThumbnailUrl,
                tags: [user?.creatorType || 'general'],
                quality: videoQuality,
                type: contentFile.type.startsWith('audio/') ? 'audio' : 'video' // Explicitly set type
            };

            const createRes = await fetch(`${BASE_URL}/api/content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(metadata)
            });

            const createResText = await createRes.text();
            let createData;
            try {
                createData = JSON.parse(createResText);
            } catch (e) {
                console.error('Failed to parse create content response:', createResText);
                throw new Error(`Server returned invalid response for content creation: ${createResText.substring(0, 100)}...`);
            }

            if (!createRes.ok) {
                throw new Error(createData.message || 'Failed to create content record');
            }
            setUploadedContentId(createData.content._id);
            showSuccess('Content published successfully!');
            setShowSuccessModal(true);

        } catch (error: any) {
            console.error('Publish Error:', error);
            showError(error.message || 'Something went wrong during upload');
            setUploadProgress(0);
        } finally {
            setIsUploading(false);
        }
    };

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
            {/* Topbar - Studio Pro Style */}
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
                    <span className="text-gray-300 mx-2 text-xl font-light">|</span>
                    <span className="text-gray-600 font-medium">Upload</span>
                </div>
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-4">
                        <button className="relative p-2 text-gray-400 hover:text-red-600 transition-colors">
                            <i className="fas fa-bell text-lg"></i>
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="h-6 w-px bg-gray-200 mx-2"></div>
                        <ProfileMenu />
                    </div>
                </div>
            </div>

            <div className="flex flex-1 pt-0">
                {/* Sidebar - Studio Pro Style */}
                <div className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed h-full z-20 top-16 shadow-none">
                    <div className="p-6">
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-20 h-20 rounded-full border-2 border-red-500 p-1 mb-3">
                                {user?.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="User Avatar" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-3xl">
                                        {user?.fullName?.charAt(0).toUpperCase() || 'C'}
                                    </div>
                                )}
                            </div>
                            <h3 className="font-bold text-lg text-gray-900">{user?.fullName || 'Creator'}</h3>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">{getCreatorLabel()}</p>
                        </div>
                    </div>

                    <nav className="flex-1 px-4">
                        <ul className="space-y-2">
                            <li>
                                <a href="/CreatorDashboard" className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all border-l-4 border-transparent hover:border-red-500">
                                    <i className="fas fa-columns text-sm w-5 text-center"></i>
                                    <span>Dashboard</span>
                                </a>
                            </li>
                            <li>
                                <a href="/ContentUploadPage" className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-white bg-red-600 shadow-lg shadow-red-900/20 transition-all border-l-4 border-transparent">
                                    <i className="fas fa-video text-sm w-5 text-center"></i>
                                    <span>Content</span>
                                </a>
                            </li>
                            <li>
                                <a href="/creator/analytics" className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all border-l-4 border-transparent hover:border-red-500">
                                    <i className="fas fa-chart-line text-sm w-5 text-center"></i>
                                    <span>Analytics</span>
                                </a>
                            </li>
                            <li>
                                <a href="/creator/settings" className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all border-l-4 border-transparent hover:border-red-500">
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

                {/* Main Content Area */}
                <div className="flex-1 md:ml-64 p-8 overflow-y-auto bg-[#F9F9F9]">
                    <div className="max-w-6xl mx-auto pb-12">

                        {/* Page Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Upload Content</h1>
                                <p className="text-gray-500 mt-1">Publish your latest videos or music tracks to your audience.</p>
                            </div>
                            {uploadProgress > 0 && uploadProgress < 100 && (
                                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                                    <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm font-bold text-gray-700">Uploading... {uploadProgress}%</span>
                                </div>
                            )}
                        </div>

                        {/* Main Upload Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Steps / Tabs */}
                            <div className="border-b border-gray-200 bg-gray-50/50">
                                <div className="flex items-center px-6">
                                    <button
                                        onClick={() => setActiveTab('video')}
                                        className={`px-6 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'video'
                                            ? 'border-red-600 text-red-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${activeTab === 'video' ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-600'}`}>1</div>
                                        Upload File
                                    </button>
                                    <button
                                        onClick={() => contentFile && setActiveTab('details')}
                                        disabled={!contentFile}
                                        className={`px-6 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'details'
                                            ? 'border-red-600 text-red-600'
                                            : !contentFile ? 'border-transparent text-gray-300 cursor-not-allowed' : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${activeTab === 'details' ? 'bg-red-100 text-red-600' : (!contentFile ? 'bg-gray-100 text-gray-300' : 'bg-gray-200 text-gray-600')}`}>2</div>
                                        Details & Publish
                                    </button>
                                </div>
                            </div>

                            <div className="p-8">
                                {/* Step 1: Upload */}
                                <div className={`${activeTab === 'video' ? 'block' : 'hidden'}`}>
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">Select your content</h2>

                                    <div
                                        className={`relative border-2 border-dashed rounded-xl p-16 text-center transition-all cursor-pointer group ${dragActive ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-white hover:border-red-300'
                                            }`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                                            accept="video/*,audio/*"
                                        />

                                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                            <i className="fas fa-cloud-upload-alt text-4xl text-red-500"></i>
                                        </div>

                                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Drag & Drop content here</h3>
                                        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                                            Supports MP4, MOV, MP3, WAV and other standard media formats.
                                        </p>

                                        <button className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg hover:shadow-red-500/30 transition-all transform hover:-translate-y-1">
                                            Select Files
                                        </button>
                                    </div>
                                </div>

                                {/* Step 2: Details */}
                                <div className={`${activeTab === 'details' ? 'block' : 'hidden'}`}>
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        <div className="lg:col-span-2 space-y-6">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Title <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    placeholder="Enter a catchy title..."
                                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-medium text-gray-900 placeholder-gray-400"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                                                <textarea
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    placeholder="Tell your viewers about your content..."
                                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-medium text-gray-900 placeholder-gray-400 h-32 resize-none"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-2">Thumbnail</label>
                                                    <div
                                                        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-red-400 hover:bg-gray-50 transition-all"
                                                        onClick={() => thumbnailInputRef.current?.click()}
                                                    >
                                                        <input
                                                            ref={thumbnailInputRef}
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={handleThumbnailSelect}
                                                        />
                                                        {thumbnailPreview ? (
                                                            <div className="relative aspect-video rounded overflow-hidden">
                                                                <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                                    <i className="fas fa-pen text-white text-lg"></i>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="py-6">
                                                                <i className="fas fa-image text-2xl text-gray-400 mb-2"></i>
                                                                <p className="text-xs text-gray-500 font-medium">Upload Image</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-2">Quality</label>
                                                    <div className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg font-medium text-gray-500 cursor-not-allowed flex items-center justify-between">
                                                        <span>{videoQuality}</span>
                                                        <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600">Auto-detected</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="lg:col-span-1">
                                            <div className="sticky top-24 space-y-6">
                                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Preview</h3>

                                                {/* Preview Card Styled like Recent Uploads */}
                                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group">
                                                    <div className="aspect-video bg-gray-100 relative group-hover:brightness-95 transition-all">
                                                        {contentFile ? (
                                                            thumbnailPreview ? (
                                                                <img src={thumbnailPreview} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                                                    <i className={`fas ${contentFile.type.startsWith('audio') ? 'fa-music' : 'fa-video'} text-4xl text-gray-400`}></i>
                                                                </div>
                                                            )
                                                        ) : (
                                                            <div className="w-full h-full bg-gray-100"></div>
                                                        )}
                                                        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded font-bold">
                                                            {videoQuality}
                                                        </div>
                                                    </div>
                                                    <div className="p-4">
                                                        <h4 className="font-bold text-gray-900 line-clamp-1 mb-1">{title || 'Your Title Here'}</h4>
                                                        <p className="text-xs text-gray-500 mb-3">{user?.fullName || 'Channel Name'}</p>
                                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                                            <span><i className="fas fa-clock mr-1"></i> Just now</span>
                                                            <span>•</span>
                                                            <span><i className="fas fa-eye mr-1"></i> 0 views</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={onPublish}
                                                    disabled={isUploading || !title}
                                                    className={`w-full py-4 text-white font-bold rounded-xl shadow-lg transition-all transform flex items-center justify-center gap-2 ${isUploading
                                                        ? 'bg-gray-400 cursor-not-allowed'
                                                        : 'bg-red-600 hover:bg-red-700 hover:shadow-red-500/30 hover:-translate-y-1'
                                                        }`}
                                                >
                                                    {isUploading ? (
                                                        <>
                                                            <i className="fas fa-circle-notch fa-spin"></i>
                                                            Publishing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="fas fa-paper-plane"></i>
                                                            Publish Now
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform scale-100 transition-all text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-check text-4xl text-green-500 animate-bounce-short"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Successful!</h2>
                        <p className="text-gray-600 mb-6">Your content has been published and is now live on your channel.</p>

                        <div className="bg-gray-50 rounded-lg p-3 mb-6 flex items-center justify-between border border-gray-200">
                            <code className="text-xs text-gray-500 font-mono truncate max-w-[200px]">{`${window.location.origin}/watch/${uploadedContentId}`}</code>
                            <button
                                className="text-red-600 font-bold text-xs hover:text-red-700 uppercase"
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/watch/${uploadedContentId}`);
                                    showSuccess('Link copied!');
                                }}
                            >
                                Copy
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/CreatorDashboard')}
                                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors"
                            >
                                Dashboard
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-lg hover:shadow-red-500/30"
                            >
                                Upload Another
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                    { icon: 'fa-video', label: 'Content', path: '/ContentUploadPage', active: true },
                    { icon: 'fa-chart-line', label: 'Analytics', path: '/creator/analytics' },
                    { icon: 'fa-cog', label: 'Settings', path: '/creator/settings' },
                ]}
            />

            {/* Hidden Video Element for Metadata Extraction */}
            <video
                ref={hiddenVideoRef}
                style={{ display: 'none' }}
                onLoadedMetadata={(e) => {
                    const video = e.target as HTMLVideoElement;
                    const height = video.videoHeight;
                    const width = video.videoWidth;

                    let quality = '480p'; // Default fallback
                    if (height >= 2160 || width >= 3840) quality = '4K';
                    else if (height >= 1440 || width >= 2560) quality = '2K';
                    else if (height >= 1080 || width >= 1920) quality = '1080p';
                    else if (height >= 720 || width >= 1280) quality = '720p';

                    setVideoQuality(quality);
                    // Clean up memory
                    URL.revokeObjectURL(video.src);
                }}
            />

            {/* Toast Notifications */}
            <div className="fixed top-6 right-6 z-[120] space-y-3">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </div >
    );
};

export default ContentUploadPage;
