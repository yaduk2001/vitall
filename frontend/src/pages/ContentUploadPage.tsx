import React, { useEffect, useRef, useState } from 'react';
import ProfileMenu from '../components/ProfileMenu';
import TrainingModal from '../components/upload/TrainingModal';

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

        if (!currentTitle) { alert('Please enter a title'); return; }
        if (!contentFile) { alert('Please upload content'); return; }

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
            alert(`Error: ${e.message}`);
            setIsUploading(false);
        }
    }

    const isMusic = user?.creatorType === 'music_company';

    return (
        <div className="fixed inset-0 bg-white z-50 overflow-hidden flex flex-col font-sans text-gray-800">
            {/* Header / Stepper */}
            <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
                <h1 className="text-xl font-bold truncate w-1/4">{title || 'Untitled content'}</h1>

                {/* Stepper */}
                <div className="flex-1 flex items-center justify-center space-x-0">
                    <div className="flex flex-col items-center w-24 relative">
                        <div className={`w-3 h-3 rounded-full mb-1 ${step >= 1 ? 'bg-red-600' : 'bg-gray-300'}`}></div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>Details</span>
                        {step > 1 && <div className="absolute top-1.5 left-[50%] w-full h-px bg-red-600 -z-10"></div>}
                        {step === 1 && <div className="absolute top-1.5 left-[50%] w-full h-px bg-gray-200 -z-10"></div>}
                    </div>
                    <div className="flex flex-col items-center w-24 relative">
                        <div className={`w-3 h-3 rounded-full mb-1 ${step >= 2 ? 'bg-red-600' : 'bg-gray-300'}`}></div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>Elements</span>
                        {step > 2 && <div className="absolute top-1.5 left-[50%] w-full h-px bg-red-600 -z-10"></div>}
                        {step <= 2 && <div className="absolute top-1.5 left-[50%] w-full h-px bg-gray-200 -z-10"></div>}
                    </div>
                    <div className="flex flex-col items-center w-24 relative">
                        <div className={`w-3 h-3 rounded-full mb-1 ${step >= 3 ? 'bg-red-600' : 'bg-gray-300'}`}></div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= 3 ? 'text-gray-900' : 'text-gray-400'}`}>Checks</span>
                        {step > 3 && <div className="absolute top-1.5 left-[50%] w-full h-px bg-red-600 -z-10"></div>}
                        {step <= 3 && <div className="absolute top-1.5 left-[50%] w-full h-px bg-gray-200 -z-10"></div>}
                    </div>
                    <div className="flex flex-col items-center w-24">
                        <div className={`w-3 h-3 rounded-full mb-1 ${step >= 4 ? 'bg-red-600' : 'bg-gray-300'}`}></div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= 4 ? 'text-gray-900' : 'text-gray-400'}`}>Visibility</span>
                    </div>
                </div>

                <div className="w-1/4 flex justify-end">
                    <button onClick={() => window.location.href = '/CreatorDashboard'} className="text-gray-500 hover:text-gray-700">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>
            </div>

            {/* Main Scrollable Content */}
            <div className="flex-1 overflow-y-auto bg-white p-8">
                <div className="max-w-6xl mx-auto h-full flex gap-8">

                    {/* LEFT COLUMN: Inputs */}
                    <div className="flex-1 space-y-8 pb-10">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Details</h2>
                                <button className="text-blue-600 text-sm font-bold uppercase hover:bg-blue-50 px-2 py-1 rounded">Reuse Details</button>
                            </div>

                            {/* Title (Floating Label Style) */}
                            <div className="relative group">
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="peer w-full h-14 px-4 pt-4 pb-1 rounded border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors placeholder-transparent"
                                    placeholder="Title"
                                />
                                <label className="absolute left-4 top-1 text-[10px] uppercase font-bold text-gray-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:capitalize peer-placeholder-shown:font-normal peer-focus:top-1 peer-focus:text-[10px] peer-focus:font-bold peer-focus:text-blue-600">
                                    Title (required)
                                </label>
                                <p className="text-right text-xs text-gray-400 mt-1">{title.length}/100</p>
                            </div>

                            {/* Description */}
                            <div className="relative group">
                                <textarea
                                    ref={descRef}
                                    className="peer w-full h-40 px-4 pt-6 rounded border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors resize-none placeholder-transparent"
                                    placeholder="Description"
                                ></textarea>
                                <label className="absolute left-4 top-2 text-[10px] uppercase font-bold text-gray-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:capitalize peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-bold peer-focus:text-blue-600">
                                    Description
                                </label>
                                <p className="text-right text-xs text-gray-400 mt-1">0/5000</p>
                            </div>

                            {/* Thumbnail Section */}
                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-800 text-sm">Thumbnail</h3>
                                <p className="text-xs text-gray-500 max-w-lg mb-4">Set a thumbnail that stands out and draws viewers' attention.</p>

                                <div className="flex gap-4">
                                    {/* Upload Box */}
                                    <div
                                        className="w-44 aspect-video border border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 hover:bg-gray-50 overflow-hidden relative"
                                        onClick={() => thumbRef.current?.click()}
                                    >
                                        {thumbnailPreview ? (
                                            <img src={thumbnailPreview} className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <i className="fas fa-image text-gray-400 text-xl mb-1"></i>
                                                <span className="text-xs text-gray-500">Upload file</span>
                                            </>
                                        )}
                                        <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} />
                                    </div>

                                    {/* Auto-generated blanks (Visual Only) */}
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-44 aspect-video bg-gray-100 rounded flex items-center justify-center">
                                            <i className="fas fa-spinner fa-spin text-gray-300"></i>
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

                                <div>
                                    <h3 className="font-bold text-gray-800 text-sm">Audience</h3>
                                    <p className="text-xs text-gray-500 mb-3">Is this video made for kids? (Required)</p>

                                    <div className="space-y-2 border border-gray-200 p-4 rounded bg-gray-50/50">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input type="radio" name="audience" className="mt-1" />
                                            <div>
                                                <span className="text-sm text-gray-900 font-medium">Yes, it's made for kids</span>
                                            </div>
                                        </label>
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input type="radio" name="audience" className="mt-1" defaultChecked />
                                            <div>
                                                <span className="text-sm text-gray-900 font-medium">No, it's not made for kids</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* RIGHT COLUMN: Sticky Preview */}
                    <div className="w-80 hidden lg:block shrink-0">
                        <div className="sticky top-0 bg-gray-50 rounded-none border border-gray-200">
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
                            <div className="p-4 space-y-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Content Link</span>
                                        <button className="text-blue-600"><i className="far fa-copy"></i></button>
                                    </div>
                                    <p className="text-blue-600 text-sm truncate">https://vital.com/watch/...</p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500">Filename</p>
                                    <p className="text-xs text-gray-900 font-medium truncate">{contentFile?.name || 'No file selected'}</p>
                                </div>
                            </div>
                        </div>
                        <input ref={contentRef} type="file" accept={contentType === 'audio' ? "audio/*" : "video/*"} className="hidden" onChange={handleContentUpload} />
                    </div>
                </div>
            </div>

            {/* Sticky Footer */}
            <div className="h-16 border-t border-gray-200 bg-white flex items-center justify-between px-6 shrink-0 z-50">
                {/* Upload Status */}
                <div className="flex items-center gap-2">
                    {!contentFile && <i className="fas fa-exclamation-circle text-gray-400"></i>}
                    {contentFile && <i className="fas fa-check-circle text-blue-500"></i>}
                    <span className="text-xs text-gray-600">{contentFile ? 'Upload complete' : 'Changes saved'}</span>
                </div>

                <div className="flex items-center gap-2">
                    <button className="px-4 py-2 text-sm font-bold text-gray-600 uppercase hover:text-gray-900">Next</button>
                    <button
                        onClick={onPublish}
                        className={`px-6 py-2 rounded text-sm font-bold text-white uppercase tracking-wide transition-all ${isUploading || !title || !contentFile ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {isUploading ? 'Publishing...' : 'Publish'}
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
                                    <span className="flex-1 text-sm text-blue-600 truncate">https://vital.com/watch/123456</span>
                                    <button className="text-gray-400 hover:text-gray-600"><i className="far fa-copy"></i></button>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-100 flex justify-end">
                            <button onClick={() => window.location.href = '/CreatorDashboard'} className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContentUploadPage;
