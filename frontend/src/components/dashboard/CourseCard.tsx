import React from 'react';

// Use a shared type definition in real project, redefining here for independent portability
export type Course = {
    id: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    thumbnailData?: string;
    modules?: any[];
    tutorId?: string;
    tutorName?: string; // Optional if available
};

interface CourseCardProps {
    course: Course;
    baseUrl: string;
    onShare?: (e: React.MouseEvent, course: Course) => void;
    onSave?: (e: React.MouseEvent, course: Course) => void;
    variant?: 'portrait' | 'landscape'; // Future extensibility
}

const CourseCard: React.FC<CourseCardProps> = ({ course, baseUrl, onShare, onSave }) => {
    const thumbnailUrl = course.thumbnailUrl
        ? (course.thumbnailUrl.startsWith('http') ? course.thumbnailUrl : course.thumbnailData ? `${baseUrl}/api/files/${course.id}/thumbnail` : `${baseUrl}${course.thumbnailUrl}`)
        : '';

    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onShare) {
            onShare(e, course);
        } else {
            // Default share behavior
            const shareUrl = `${window.location.origin}/video/${course.id}`;
            navigator.clipboard.writeText(shareUrl).then(() => alert('Link copied!')).catch(() => { });
        }
    };

    const handleSave = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onSave && onSave(e, course);
    };

    return (
        <div className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
            <a href={`/course/${course.id}`} className="block h-full flex flex-col text-left">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                    {thumbnailUrl ? (
                        <div
                            className="w-full h-full bg-cover bg-center transform group-hover:scale-105 transition-transform duration-500 ease-out"
                            style={{ backgroundImage: `url('${thumbnailUrl}')` }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                            <i className="fas fa-image text-3xl"></i>
                        </div>
                    )}

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>

                    {/* Quick Actions (Hover visible) */}
                    <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-[-10px] group-hover:translate-y-0 duration-200">
                        {onSave && (
                            <button
                                onClick={handleSave}
                                className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-white hover:text-black flex items-center justify-center transition-colors"
                                title="Watch Later"
                            >
                                <i className="far fa-bookmark text-xs"></i>
                            </button>
                        )}
                        <button
                            onClick={handleShare}
                            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-white hover:text-black flex items-center justify-center transition-colors"
                            title="Share"
                        >
                            <i className="fas fa-share-alt text-xs"></i>
                        </button>
                    </div>

                    {/* Module Count Badge */}
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-md font-medium flex items-center">
                        <i className="fas fa-layer-group text-[8px] mr-1.5 opacity-70"></i>
                        {course.modules?.length || 0} Modules
                    </div>
                </div>

                {/* Info */}
                <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-gray-900 line-clamp-2 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                        {course.title || 'Untitled Course'}
                    </h3>

                    {course.description && (
                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                            {course.description}
                        </p>
                    )}

                    <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                        <span className="flex items-center">
                            <i className="fas fa-user-circle mr-1.5"></i>
                            {course.tutorName || 'Tutor'}
                        </span>
                        <span className="flex items-center text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                            Enroll Now <i className="fas fa-arrow-right ml-1"></i>
                        </span>
                    </div>
                </div>
            </a>
        </div>
    );
};

export default CourseCard;
