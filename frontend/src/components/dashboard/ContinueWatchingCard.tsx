import React from 'react';

export type ContinueWatchingItem = {
    id: string;
    courseId: string;
    courseTitle: string;
    courseDescription: string;
    courseThumbnail: string;
    moduleIndex: number;
    moduleTitle: string;
    moduleType: string;
    progress: number;
    lastWatchedAt: string;
    watchTimeSeconds: number;
    lastPositionSeconds: number;
    moduleDuration: number;
};

interface ContinueWatchingCardProps {
    item: ContinueWatchingItem;
    baseUrl: string;
}

const ContinueWatchingCard: React.FC<ContinueWatchingCardProps> = ({ item, baseUrl }) => {
    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const thumbnailUrl = item.courseThumbnail
        ? (item.courseThumbnail.startsWith('http') ? item.courseThumbnail : `${baseUrl}${item.courseThumbnail}`)
        : '';

    return (
        <a
            href={`/video/${item.courseId}?module=${item.moduleIndex}`}
            className="group relative flex flex-col min-w-[280px] w-[280px] bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100"
        >
            {/* Thumbnail Container */}
            <div className="relative h-40 w-full bg-gray-100 overflow-hidden">
                {thumbnailUrl ? (
                    <div
                        className="w-full h-full bg-cover bg-center transform group-hover:scale-110 transition-transform duration-700 ease-out"
                        style={{ backgroundImage: `url('${thumbnailUrl}')` }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                        <i className="fas fa-play-circle text-4xl"></i>
                    </div>
                )}

                {/* Play Overlay */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg transform scale-50 group-hover:scale-100 transition-all duration-300">
                        <i className="fas fa-play text-blue-600 pl-1"></i>
                    </div>
                </div>

                {/* Resume Tag */}
                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white text-[10px] uppercase font-bold px-2 py-1 rounded-lg">
                    Resume {Math.round(item.progress)}%
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200/50">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        style={{ width: `${item.progress}%` }}
                    ></div>
                </div>
            </div>

            {/* Meta Content */}
            <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex items-center space-x-2 text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">
                        <span className="text-blue-600">{item.moduleType || 'Lesson'}</span>
                        <span>•</span>
                        <span>Module {item.moduleIndex + 1}</span>
                    </div>

                    <h4 className="font-bold text-gray-800 line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors">
                        {item.courseTitle || 'Untitled Course'}
                    </h4>

                    <p className="text-sm text-gray-600 line-clamp-1 mb-2 font-medium">
                        {item.moduleTitle || `Module ${item.moduleIndex + 1}`}
                    </p>
                </div>

                <div className="flex items-center justify-between mt-3 text-xs text-gray-400 border-t border-gray-50 pt-3">
                    <div className="flex items-center space-x-1">
                        <i className="fas fa-clock text-[10px]"></i>
                        <span>{formatTime(item.lastPositionSeconds)} / {formatDuration(item.moduleDuration)}</span>
                    </div>
                </div>
            </div>
        </a>
    );
};

export default ContinueWatchingCard;
