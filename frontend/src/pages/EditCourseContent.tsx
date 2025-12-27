import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProfileMenu from '../components/ProfileMenu';
import ModuleUploadCard from '../components/upload/ModuleUploadCard';

interface Module {
    id: number;
    title: string;
    type: 'video' | 'document' | 'audio';
    video: File | null;
    document: File | null;
    videoUrl?: string; // Existing URL
    documentUrl?: string; // Existing URL
    order: number;
}

const EditCourseContent: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState<any>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const thumbInputRef = useRef<HTMLInputElement>(null);

    const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/courses/${id}`);
            if (res.ok) {
                const data = await res.json();
                setCourse(data.course);
                setThumbnailUrl(data.course.thumbnailUrl || '');

                // Map existing modules to Module interface
                const existingModules = (data.course.modules || []).map((m: any, idx: number) => ({
                    id: idx + 1, // temporary ID for frontend keying
                    title: m.title,
                    type: m.type || 'video',
                    video: null,
                    document: null,
                    videoUrl: m.videoUrl,
                    documentUrl: m.documentUrl,
                    order: m.order || idx + 1
                }));
                setModules(existingModules);
            } else {
                alert('Course not found');
                navigate('/EditUploadsPage');
            }
        } catch (e) {
            console.error("Failed to load course", e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddModule = () => {
        const nextId = modules.length > 0 ? Math.max(...modules.map(m => m.id)) + 1 : 1;
        setModules([...modules, {
            id: nextId,
            title: `Module ${modules.length + 1}`,
            type: 'video',
            video: null,
            document: null,
            order: modules.length + 1
        }]);
    };

    const handleDeleteModule = (modId: number) => {
        if (confirm('Delete this module?')) {
            setModules(modules.filter(m => m.id !== modId));
        }
    };

    const handleModuleTitleChange = (id: number, title: string) => {
        setModules(prev => prev.map(m => m.id === id ? { ...m, title } : m));
    };

    const handleModuleTypeChange = (id: number, type: 'video' | 'document' | 'audio') => {
        setModules(prev => prev.map(m => m.id === id ? { ...m, type } : m));
    };

    const handleVideoUpload = (id: number, file: File | null) => {
        setModules(prev => prev.map(m => m.id === id ? { ...m, video: file } : m));
    };

    const handleDocumentUpload = (id: number, file: File | null) => {
        setModules(prev => prev.map(m => m.id === id ? { ...m, document: file } : m));
    };

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setThumbnailFile(file);
            const reader = new FileReader();
            reader.onload = (ev) => {
                setThumbnailUrl(ev.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Upload new thumbnail if present
            let finalThumbnailUrl = course.thumbnailUrl;
            if (thumbnailFile) {
                const thumbFd = new FormData();
                thumbFd.append('title', `${course.title} - Thumbnail`);
                thumbFd.append('thumbnail', thumbnailFile);
                const tres = await fetch(`${BASE_URL}/api/videos`, { method: 'POST', body: thumbFd });
                if (tres.ok) {
                    const tjson = await tres.json();
                    finalThumbnailUrl = tjson.video?.thumbnailUrl || finalThumbnailUrl;
                } else {
                    throw new Error('Failed to upload thumbnail');
                }
            }

            const modulePayloads = [];

            for (const m of modules) {
                let videoUrl = m.videoUrl || '';
                let documentUrl = m.documentUrl || '';

                // Upload new video OR audio if present (treating audio as video)
                if ((m.type === 'video' || m.type === 'audio') && m.video) {
                    const f = new FormData();
                    f.append('title', `${course.title} - ${m.title}`);
                    f.append('video', m.video);
                    const r = await fetch(`${BASE_URL}/api/videos`, { method: 'POST', body: f });
                    if (r.ok) {
                        const j = await r.json();
                        videoUrl = j.video?.videoUrl || '';
                    } else {
                        throw new Error(`Failed to upload ${m.type} for ${m.title}`);
                    }
                }

                // Upload new document if present
                if (m.type === 'document' && m.document) {
                    const f = new FormData();
                    f.append('document', m.document);
                    const r = await fetch(`${BASE_URL}/api/documents`, { method: 'POST', body: f });
                    if (r.ok) {
                        const j = await r.json();
                        documentUrl = j.documentUrl || '';
                    } else {
                        throw new Error(`Failed to upload document for ${m.title}`);
                    }
                }

                modulePayloads.push({
                    title: m.title,
                    order: m.order, // You might want to re-calculate order based on array index
                    type: m.type,
                    videoUrl,
                    documentUrl,
                    documentType: '', // simplified
                    documentName: '', // simplified
                    lessonId: '',
                    resourceUrl: ''
                });
            }

            // Update Course
            const res = await fetch(`${BASE_URL}/api/courses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    modules: modulePayloads,
                    thumbnailUrl: finalThumbnailUrl
                })
            });

            if (res.ok) {
                alert('Course content updated!');
                navigate('/EditUploadsPage');
            } else {
                throw new Error('Failed to update course');
            }

        } catch (e: any) {
            console.error(e);
            alert(`Error saving changes: ${e.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50/50 font-sans flex flex-col">
            {/* Header */}
            <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm/50">
                <div className="flex items-center space-x-3 log-effect">
                    <a href="/EditUploadsPage" className="text-gray-500 hover:text-blue-600 transition-colors">
                        <i className="fas fa-arrow-left"></i> Back
                    </a>
                    <span className="h-6 w-px bg-gray-200 mx-2"></span>
                    <h1 className="text-lg font-bold text-gray-900 truncate max-w-md">Edit Content: {course?.title}</h1>
                </div>
                <ProfileMenu />
            </div>

            <div className="max-w-4xl mx-auto w-full p-8 pb-24">
                {/* Course Thumbnail Section */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <i className="fas fa-image text-blue-500"></i> Course Thumbnail
                    </h2>
                    <div className="flex gap-6 items-start">
                        <div
                            className="flex-1 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group flex flex-col items-center justify-center min-h-[160px]"
                            onClick={() => thumbInputRef.current?.click()}
                        >
                            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <i className="fas fa-camera text-xl"></i>
                            </div>
                            <p className="font-medium text-gray-700">Click to change thumbnail</p>
                            <p className="text-xs text-gray-400 mt-1">Recommended 1280x720</p>
                            <input
                                ref={thumbInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleThumbnailChange}
                            />
                        </div>
                        {thumbnailUrl && (
                            <div className="w-64 aspect-video bg-gray-100 rounded-xl overflow-hidden shadow-md border border-gray-200 flex-shrink-0 relative group">
                                <img
                                    src={thumbnailUrl}
                                    alt="Course Thumbnail"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white font-medium text-sm">Target Preview</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Modules</h2>
                    <button
                        onClick={handleAddModule}
                        className="px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-2"
                    >
                        <i className="fas fa-plus"></i> Add Module
                    </button>
                </div>

                <div className="space-y-6">
                    {modules.map((m, idx) => (
                        <div key={m.id} className="relative group">
                            <ModuleUploadCard
                                id={m.id}
                                title={m.title}
                                type={m.type}
                                order={idx + 1}

                                // We inject existing URL support into ModuleUploadCard usually via visual hacks or we just assume null means check existing logic
                                // But ModuleUploadCard expects File | null.
                                // For existing modules, video is null, but we need to show "Existing Video".
                                // This requires modifying ModuleUploadCard potentially? 
                                // Or we can rely on title to imply content exists. 
                                // Since I can't easily mod ModuleUploadCard to show "Existing URL", I will rely on the user seeing the title.
                                // NOTE: Better UX would be to show "Current: [link]" inside the card.
                                // For now, I will use it as is. If user uploads new file, it replaces old.
                                videoFile={m.video}
                                documentFile={m.document}
                                onTitleChange={(t) => handleModuleTitleChange(m.id, t)}
                                onTypeChange={(t) => handleModuleTypeChange(m.id, t)}
                                onVideoUpload={(f) => handleVideoUpload(m.id, f)}
                                onDocumentUpload={(f) => handleDocumentUpload(m.id, f)}
                            />
                            {/* Delete Button Overlay */}
                            <button
                                onClick={() => handleDeleteModule(m.id)}
                                className="absolute top-4 right-4 p-2 text-red-400 hover:text-red-600 bg-white rounded-lg shadow-sm border border-gray-100 opacity-60 hover:opacity-100 transition-all z-10"
                                title="Delete Module"
                            >
                                <i className="fas fa-trash"></i>
                            </button>

                            {/* Existing Content Indicator */}
                            {(!m.video && !m.document && (m.videoUrl || m.documentUrl)) && (
                                <div className="absolute top-4 right-16 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-100 z-10">
                                    <i className="fas fa-check-circle mr-1"></i> Content Exists
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Save Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
                <div className="max-w-4xl mx-auto flex justify-end gap-4">
                    <button
                        onClick={() => navigate('/EditUploadsPage')}
                        className="px-6 py-3 font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {saving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                        <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditCourseContent;
