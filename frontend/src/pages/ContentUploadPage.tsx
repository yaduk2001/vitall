import React, { useEffect, useRef, useState } from 'react';
import ProfileMenu from '../components/ProfileMenu';
import TrainingModal from '../components/upload/TrainingModal';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

const ContentUploadPage: React.FC = () => {
    // Refs
    const thumbRef = useRef<HTMLInputElement>(null);
    const contentRef = useRef<HTMLInputElement>(null);
    const [title, setTitle] = useState('');
    const descRef = useRef<HTMLTextAreaElement>(null);

    // Music Metadata Refs
    const singerRef = useRef<HTMLInputElement>(null);
    const composerRef = useRef<HTMLInputElement>(null);
    const castRef = useRef<HTMLInputElement>(null);

    // State
    const [user, setUser] = useState<any>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [contentFile, setContentFile] = useState<File | null>(null);
    const [contentType, setContentType] = useState<'video' | 'audio'>('video');
    const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
    const [trainingStep, setTrainingStep] = useState<number>(0);
    const [trainingPhase, setTrainingPhase] = useState<'progress' | 'graph'>('progress');
    const [progressValue, setProgressValue] = useState<number>(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedContentId, setUploadedContentId] = useState<string>('');

    // Toast notifications
    const { toasts, removeToast, showSuccess, showError, showWarning, showInfo } = useToast();

    // Wizard State
    const [step, setStep] = useState(1); // 1: Details, 2: Video Element, 3: Checks, 4: Visibility

    useEffect(() => {
        const userJson = localStorage.getItem('user');
        let currentUser: any = null;
        try { currentUser = userJson ? JSON.parse(userJson) : null; } catch { }
        if (!currentUser) { window.location.href = '/login'; return; }
        setUser(currentUser);
    }, []);

    const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setThumbnailPreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleContentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setContentFile(file);
            // Auto-fill title if empty
            if (!title) {
                setTitle(file.name.replace(/\.[^/.]+$/, ""));
            }
        }
    };

    async function onPublish() {
        if (isUploading) return;
        const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const currentTitle = title.trim();
        const description = (descRef.current?.value || '').trim();

        if (!currentTitle) { showError('Please enter a title'); return; }
        if (!contentFile) { showError('Please upload content'); return; }

        setIsUploading(true);

        try {
            // 1. Upload Thumbnail
            let thumbnailUrl = '';
            const tf = thumbRef.current?.files?.[0];
            if (tf) {
                const thumbFd = new FormData();
                thumbFd.append('title', `${currentTitle} - Thumbnail`);
                thumbFd.append('thumbnail', tf);
                const tres = await fetch(`${BASE_URL}/api/videos`, { method: 'POST', body: thumbFd });
                if (tres.ok) {
                    const tjson = await tres.json();
                    thumbnailUrl = (tjson.video && tjson.video.thumbnailUrl) || '';
                }
            }

            // 2. Upload Content
            const contentFd = new FormData();
            contentFd.append('title', `${currentTitle} - Content`);
            contentFd.append('video', contentFile);
            const r = await fetch(`${BASE_URL}/api/videos`, { method: 'POST', body: contentFd });
            if (!r.ok) throw new Error('Failed to upload content file');
            const j = await r.json();
            const contentUrl = j.video?.videoUrl || '';

            // 3. Create Content Record
            const metadata = {
                singer: singerRef.current?.value || '',
                composer: composerRef.current?.value || '',
                cast: castRef.current?.value || '',
            };

            const contentPayload = {
                title: currentTitle,
                description,
                type: contentType,
                thumbnailUrl,
                contentUrl,
                metadata,
                tags: [user.creatorType]
            };

            const token = localStorage.getItem('token');
            const contentRes = await fetch(`${BASE_URL}/api/content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(contentPayload)
            });

            if (!contentRes.ok) throw new Error('Failed to publish content');

            const contentData = await contentRes.json();
            setUploadedContentId(contentData.content?._id || contentData.content?.id || '');

            setShowSuccessModal(true);
            setTrainingPhase('progress');
            let progress = 0;
            const interval = setInterval(() => {
                progress += 5;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    setTimeout(() => {
                        setTrainingPhase('graph');
                        setTimeout(() => setTrainingStep(1), 100);
                        setTimeout(() => setTrainingStep(2), 1500);
                    }, 500);
                }
                setProgressValue(progress);
            }, 50);

        } catch (e: any) {
            showError(`Error: ${e.message}`);
            setIsUploading(false);
        }
    }

    const isMusic = user?.creatorType === 'music_company';

    // Generate dynamic video link
    const FRONTEND_URL = window.location.origin; // Gets current frontend URL
    const videoLink = uploadedContentId ? `${FRONTEND_URL}/watch/${uploadedContentId}` : `${FRONTEND_URL}/watch/...`;

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-white to-red-500 z-50 overflow-hidden flex flex-col font-sans text-gray-800">
            {/* Header */}
            <div className="h-14 border-b-4 border-red-500 backdrop-blur-xl bg-white/95 flex items-center justify-between px-6 shrink-0 z-20 shadow-lg">
                <h1 className="text-xl font-bold truncate w-1/4 bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">{title || 'Untitled content'}</h1>



                <div className="w-1/4 flex justify-end">
                    <button onClick={() => window.location.href = '/CreatorDashboard'} className="text-gray-500 hover:text-gray-700">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>
            </div>

            {/* Main Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 relative">
                <div className="max-w-6xl mx-auto h-full flex gap-8">

                    {/* LEFT COLUMN: Inputs */}
                    <div className="flex-1 pb-10">

                        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-blue-200 p-6 md:p-8 space-y-8 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-red-500 to-blue-600"></div>
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl"></div>
                            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                                    <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-red-500 text-white flex items-center justify-center text-sm shadow-lg">
                                        <i className="fas fa-pen-nib"></i>
                                    </span>
                                    Details
                                </h2>
                                <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold uppercase hover:from-blue-700 hover:to-blue-800 px-4 py-2 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95">
                                    Reuse Details
                                </button>
                            </div>

                            {/* Title (Floating Label Style) */}
                            <div className="relative group">
                                <div className="absolute left-4 top-5 text-blue-400 group-focus-within:text-red-500 transition-colors">
                                    <i className="fas fa-heading"></i>
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="peer w-full h-14 pl-12 pr-4 pt-4 pb-1 rounded-xl border-2 border-blue-200 bg-white text-gray-900 focus:bg-white focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all placeholder-transparent font-medium shadow-sm"
                                    placeholder="Title"
                                />
                                <label className="absolute left-12 top-1 text-[10px] uppercase font-bold text-blue-600 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:capitalize peer-placeholder-shown:font-medium peer-focus:top-1 peer-focus:text-[10px] peer-focus:font-bold peer-focus:text-red-600">
                                    Title (required)
                                </label>
                                <p className="text-right text-xs text-gray-400 mt-2 font-medium">{title.length}/100</p>
                            </div>

                            {/* Description */}
                            <div className="relative group">
                                <div className="absolute left-4 top-6 text-blue-400 group-focus-within:text-red-500 transition-colors">
                                    <i className="fas fa-align-left"></i>
                                </div>
                                <textarea
                                    ref={descRef}
                                    className="peer w-full h-40 pl-12 pr-4 pt-6 rounded-xl border-2 border-blue-200 bg-white text-gray-900 focus:bg-white focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all resize-none placeholder-transparent font-medium leading-relaxed shadow-sm"
                                    placeholder="Description"
                                ></textarea>
                                <label className="absolute left-12 top-2 text-[10px] uppercase font-bold text-blue-600 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:capitalize peer-placeholder-shown:font-medium peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-bold peer-focus:text-red-600">
                                    Description
                                </label>
                                <p className="text-right text-xs text-gray-400 mt-2 font-medium">0/5000</p>
                            </div>

                            {/* Thumbnail Section */}
                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-800 text-sm">Thumbnail</h3>
                                <p className="text-xs text-gray-500 max-w-lg mb-4">Set a thumbnail that stands out and draws viewers' attention.</p>

                                <div className="flex gap-6">
                                    {/* Upload Box */}
                                    <div
                                        className="w-56 aspect-video border-3 border-dashed border-blue-400 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-red-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-red-50 transition-all duration-300 overflow-hidden relative group shadow-lg hover:shadow-2xl"
                                        onClick={() => thumbRef.current?.click()}
                                    >
                                        {thumbnailPreview ? (
                                            <div className="relative w-full h-full group-hover:opacity-90 transition-opacity">
                                                <img src={thumbnailPreview} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <i className="fas fa-pen text-white text-xl drop-shadow-lg"></i>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-red-100 flex items-center justify-center mb-3 group-hover:from-blue-500 group-hover:to-red-500 group-hover:scale-110 transition-all duration-300 shadow-md">
                                                    <i className="fas fa-image text-blue-500 text-2xl group-hover:text-white transition-colors"></i>
                                                </div>
                                                <span className="text-xs text-blue-600 group-hover:text-red-600 font-bold uppercase tracking-wide">Upload thumbnail</span>
                                            </>
                                        )}
                                        <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} />
                                    </div>

                                    {/* Auto-generated blanks (Visual Only) */}
                                    {[1, 2].map(i => (
                                        <div key={i} className="w-56 aspect-video bg-gradient-to-br from-blue-50 to-white rounded-xl border-2 border-blue-100 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity cursor-not-allowed">
                                            <i className="fas fa-magic text-blue-300"></i>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Playlist / Metadata / Audience */}
                            <div className="space-y-6 pt-4">

                                {isMusic && (
                                    <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-4">
                                        <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                            <i className="fas fa-music text-blue-600"></i>
                                            Music Metadata
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input ref={singerRef} placeholder="Singer" className="col-span-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm outline-none focus:border-blue-600" />
                                            <input ref={composerRef} placeholder="Composer" className="col-span-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm outline-none focus:border-blue-600" />
                                            <input ref={castRef} placeholder="Cast (Comma separated)" className="col-span-2 px-3 py-2 bg-white border border-gray-300 rounded text-sm outline-none focus:border-blue-600" />
                                        </div>
                                    </div>
                                )}


                            </div>

                        </div>
                    </div>

                    {/* RIGHT COLUMN: Sticky Preview */}
                    <div className="w-96 hidden lg:block shrink-0">
                        <div className="sticky top-6 bg-white rounded-2xl shadow-2xl border-4 border-blue-500 overflow-hidden ring-2 ring-red-500/20">
                            {/* Video Player Placeholder */}
                            <div className="aspect-video bg-black flex items-center justify-center relative cursor-pointer" onClick={() => contentRef.current?.click()}>
                                {contentFile ? (
                                    <video src={URL.createObjectURL(contentFile)} className="w-full h-full object-contain" controls />
                                ) : (
                                    <div className="text-center">
                                        <i className="fas fa-cloud-upload-alt text-gray-500 text-3xl mb-2"></i>
                                        <p className="text-xs text-gray-400">Click to Select Video</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-5 space-y-4 bg-white/50 backdrop-blur-sm">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        <span>Video Link</span>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(videoLink)}
                                            className="text-blue-600 hover:text-blue-700 transition-colors"
                                            title="Copy link"
                                        >
                                            <i className="far fa-copy"></i>
                                        </button>
                                    </div>
                                    <div className="bg-gradient-to-r from-blue-50 to-red-50 p-2 rounded-lg border-2 border-blue-200">
                                        <p className="text-blue-600 text-xs font-mono truncate">{videoLink}</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filename</p>
                                    <p className="text-sm text-gray-700 font-medium truncate">{contentFile?.name || 'No file selected'}</p>
                                </div>
                            </div>
                        </div>
                        <input ref={contentRef} type="file" accept={contentType === 'audio' ? "audio/*" : "video/*"} className="hidden" onChange={handleContentUpload} />
                    </div>
                </div>
            </div>

            {/* Sticky Footer */}
            <div className="h-16 border-t-4 border-blue-500 bg-white/95 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 z-30 shadow-lg">
                {/* Upload Status */}
                <div className="flex items-center gap-2">
                    {!contentFile && <i className="fas fa-exclamation-circle text-gray-400"></i>}
                    {contentFile && <i className="fas fa-check-circle text-blue-500"></i>}
                    <span className="text-xs text-gray-600">{contentFile ? 'Upload complete' : 'Changes saved'}</span>
                </div>

                <div className="flex items-center gap-2">

                    <button
                        onClick={onPublish}
                        className={`px-8 py-3 rounded-xl text-sm font-bold text-white uppercase tracking-wider shadow-lg hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 transition-all duration-200 flex items-center gap-2 ${isUploading || !title || !contentFile ? 'bg-gray-300 cursor-not-allowed shadow-none transform-none' : 'bg-gradient-to-r from-red-600 via-red-500 to-blue-600 hover:from-red-500 hover:via-blue-500 hover:to-red-500'}`}
                    >
                        {isUploading ? <><i className="fas fa-circle-notch fa-spin"></i> Publishing...</> : <><i className="fas fa-rocket"></i> Publish</>}
                    </button>
                </div>
            </div>

            {/* Modals */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
                        <div className="p-6 text-center border-b border-gray-100">
                            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                <i className="fas fa-check"></i>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Video published!</h2>
                            <p className="text-gray-500 mt-1">Your video has been uploaded and processed.</p>
                        </div>
                        <div className="p-6 bg-gray-50 flex gap-4">
                            <div className="w-40 aspect-video bg-black rounded overflow-hidden">
                                {thumbnailPreview && <img src={thumbnailPreview} className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1 space-y-2">
                                <p className="text-sm text-gray-500 uppercase font-bold">Shareable Link</p>
                                <div className="flex items-center bg-white border border-gray-300 rounded px-3 py-2">
                                    <span className="flex-1 text-sm text-blue-600 truncate">{videoLink}</span>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(videoLink)}
                                        className="text-gray-400 hover:text-gray-600"
                                        title="Copy link"
                                    >
                                        <i className="far fa-copy"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-100 flex justify-end">
                            <button onClick={() => window.location.href = '/CreatorDashboard'} className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notifications */}
            <div className="fixed top-6 right-6 z-[100] space-y-3">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default ContentUploadPage;
