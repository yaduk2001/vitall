import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LinkItem {
    label: string;
    path?: string;
    icon?: string;
    onClick?: () => void;
    active?: boolean;
}

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    links: LinkItem[];
    user?: any;
    title?: React.ReactNode;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose, links, user, title }) => {
    const location = useLocation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 lg:hidden font-sans">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Sidebar View */}
            <div className="absolute top-0 left-0 bottom-0 w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    {title || (
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                            Vital
                        </span>
                    )}
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                    >
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </div>

                {/* User Info (Optional) */}
                {user && (
                    <div className="p-6 bg-gray-50 border-b border-gray-100 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full p-1 border-2 border-white shadow-md mb-3 bg-gradient-to-tr from-blue-500 to-purple-600">
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <div className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-2xl">
                                    {user?.name?.charAt(0).toUpperCase() || user?.fullName?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            )}
                        </div>
                        <h3 className="font-bold text-gray-900">{user.name || user.fullName}</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">{user.role}</p>
                    </div>
                )}

                {/* Nav Links */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {links.map((item, idx) => {
                        const isActive = item.active || (item.path && location.pathname === item.path);
                        if (item.path) {
                            return (
                                <Link
                                    key={idx}
                                    to={item.path}
                                    onClick={onClose}
                                    className={`flex items-center px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
                                >
                                    {item.icon && <i className={`fas ${item.icon} w-6 text-center text-lg ${isActive ? 'text-white' : ''}`}></i>}
                                    <span className="ml-3 font-medium">{item.label}</span>
                                </Link>
                            );
                        } else {
                            return (
                                <button
                                    key={idx}
                                    onClick={() => { item.onClick?.(); onClose(); }}
                                    className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
                                >
                                    {item.icon && <i className={`fas ${item.icon} w-6 text-center text-lg`}></i>}
                                    <span className="ml-3 font-medium">{item.label}</span>
                                </button>
                            );
                        }
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400">© 2024 Vital Platform</p>
                </div>
            </div>
        </div>
    );
};

export default MobileSidebar;
