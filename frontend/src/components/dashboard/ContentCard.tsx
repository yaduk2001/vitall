import React from 'react';

interface ContentProps {
    content: {
        _id: string;
        title: string;
        thumbnailUrl: string;
        type: 'video' | 'audio';
        creatorId: {
            fullName: string;
            avatarUrl?: string;
        };
        views: number;
        createdAt: string;
    };
}

const ContentCard: React.FC<ContentProps> = ({ content }) => {
    return (
        <a href={`/watch/${content._id}`} className="group block space-y-3 cursor-pointer">
            {/* Thumbnail */}
            <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden relative shadow-sm group-hover:shadow-md transition-all group-hover:scale-[1.02]">
                {content.thumbnailUrl ? (
                    <img src={content.thumbnailUrl} alt={content.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <i className={`fas ${content.type === 'audio' ? 'fa-music' : 'fa-play'} text-2xl`}></i>
                    </div>
                )}

                {/* Duration / Type Badge */}
                <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {content.type === 'audio' ? 'AUDIO' : 'VIDEO'}
                </div>
            </div>

            {/* Meta */}
            <div className="flex space-x-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <img
                        src={content.creatorId?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${content.creatorId?.fullName}`}
                        alt={content.creatorId?.fullName}
                        className="w-9 h-9 rounded-full object-cover border border-gray-100"
                    />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                        {content.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                        {content.creatorId?.fullName || 'Unknown Creator'}
                    </p>
                    <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <span>{content.views} views</span>
                        <span>•</span>
                        <span>{new Date(content.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        </a>
    );
};

export default ContentCard;
