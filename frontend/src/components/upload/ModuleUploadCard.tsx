import React, { useRef } from 'react';

// Re-using the Module interface or defining a subset. 
// Since we are external, we will define the props explicitly.

interface ModuleUploadCardProps {
    id: number;
    order: number;
    title: string;
    type: 'video' | 'document' | 'audio';
    videoFile: File | null;
    documentFile: File | null;
    onTitleChange: (val: string) => void;
    onTypeChange: (val: 'video' | 'document' | 'audio') => void;
    onVideoUpload: (file: File | null) => void;
    onDocumentUpload: (file: File | null) => void;
}

const ModuleUploadCard: React.FC<ModuleUploadCardProps> = ({
    id,
    order,
    title,
    type,
    videoFile,
    documentFile,
    onTitleChange,
    onTypeChange,
    onVideoUpload,
    onDocumentUpload
}) => {
    const videoInputRef = useRef<HTMLInputElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);

    const formatSize = (bytes: number) => (bytes / (1024 * 1024)).toFixed(2) + ' MB';

    return (
        <div className="bg-white border text-left border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 group relative overflow-hidden">
            {/* Module Header */}
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {id}
                    </div>
                    <h4 className="font-semibold text-gray-800">Module {id}</h4>
                </div>
                <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">Order: {order}</span>
            </div>

            <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Module Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    placeholder={`Enter title for Module ${id}`}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-800 placeholder-gray-400"
                />
            </div>

            <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Content Type</label>
                <div className="flex space-x-3 p-1 bg-gray-50 rounded-lg w-fit">
                    <button
                        onClick={() => onTypeChange('video')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${type === 'video'
                            ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <i className="fas fa-video"></i>
                        <span>Video</span>
                    </button>

                    <button
                        onClick={() => onTypeChange('document')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${type === 'document'
                            ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <i className="fas fa-file-alt"></i>
                        <span>Document</span>
                    </button>

                    <button
                        onClick={() => onTypeChange('audio')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${type === 'audio'
                            ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <i className="fas fa-music"></i>
                        <span>Audio</span>
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {type === 'video' ? 'Video File' : type === 'audio' ? 'Audio File' : 'Document File'}
                </label>

                {type === 'video' ? (
                    <div
                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer group-hover:border-blue-300 ${videoFile ? 'border-green-300 bg-green-50/30' : 'border-gray-200 hover:bg-gray-50'}`}
                        onClick={() => !videoFile && videoInputRef.current?.click()}
                    >
                        {videoFile ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 text-left">
                                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <i className="fas fa-check"></i>
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">{videoFile.name}</p>
                                        <p className="text-xs text-green-600">{formatSize(videoFile.size)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onVideoUpload(null); }}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                    title="Remove file"
                                >
                                    <i className="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3 py-2">
                                <div className="w-12 h-12 mx-auto bg-blue-50 text-blue-500 rounded-full flex items-center justify-center shadow-sm">
                                    <i className="fas fa-cloud-upload-alt text-xl"></i>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Click to upload video</p>
                                    <p className="text-xs text-gray-400 mt-1">MP4, MOV, AVI up to 500MB</p>
                                </div>
                            </div>
                        )}
                        <input
                            ref={videoInputRef}
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) onVideoUpload(file);
                                if (videoInputRef.current) videoInputRef.current.value = '';
                            }}
                        />
                    </div>
                ) : type === 'audio' ? (
                    <div
                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer group-hover:border-blue-300 ${videoFile ? 'border-green-300 bg-green-50/30' : 'border-gray-200 hover:bg-gray-50'}`}
                        onClick={() => !videoFile && videoInputRef.current?.click()}
                    >
                        {videoFile ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 text-left">
                                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <i className="fas fa-check"></i>
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">{videoFile.name}</p>
                                        <p className="text-xs text-green-600">{formatSize(videoFile.size)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onVideoUpload(null); }}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                    title="Remove file"
                                >
                                    <i className="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3 py-2">
                                <div className="w-12 h-12 mx-auto bg-purple-50 text-purple-500 rounded-full flex items-center justify-center shadow-sm">
                                    <i className="fas fa-music text-xl"></i>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Click to upload audio</p>
                                    <p className="text-xs text-gray-400 mt-1">MP3, WAV, AAC up to 50MB</p>
                                </div>
                            </div>
                        )}
                        <input
                            ref={videoInputRef}
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) onVideoUpload(file);
                                if (videoInputRef.current) videoInputRef.current.value = '';
                            }}
                        />
                    </div>
                ) : (
                    <div
                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer group-hover:border-blue-300 ${documentFile ? 'border-green-300 bg-green-50/30' : 'border-gray-200 hover:bg-gray-50'}`}
                        onClick={() => !documentFile && docInputRef.current?.click()}
                    >
                        {documentFile ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 text-left">
                                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <i className="fas fa-check"></i>
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">{documentFile.name}</p>
                                        <p className="text-xs text-green-600">{formatSize(documentFile.size)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDocumentUpload(null); }}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                    title="Remove file"
                                >
                                    <i className="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3 py-2">
                                <div className="w-12 h-12 mx-auto bg-blue-50 text-blue-500 rounded-full flex items-center justify-center shadow-sm">
                                    <i className="fas fa-file-invoice text-xl"></i>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Click to upload document</p>
                                    <p className="text-xs text-gray-400 mt-1">PDF, DOC, PPT, XLS...</p>
                                </div>
                            </div>
                        )}
                        <input
                            ref={docInputRef}
                            type="file"
                            accept=".pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.rtf"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) onDocumentUpload(file);
                                if (docInputRef.current) docInputRef.current.value = '';
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModuleUploadCard;
