import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 4000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const typeStyles = {
        success: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
        error: 'bg-gradient-to-r from-red-500 to-rose-500 text-white',
        warning: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
        info: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
    };

    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };

    return (
        <div className={`${typeStyles[type]} rounded-xl shadow-2xl p-4 min-w-[300px] max-w-md flex items-center gap-3 animate-slide-in-right`}>
            <i className={`${icons[type]} text-xl`}></i>
            <p className="flex-1 font-medium text-sm">{message}</p>
            <button
                onClick={onClose}
                className="hover:bg-white/20 rounded-lg p-1 transition-colors"
            >
                <i className="fas fa-times text-sm"></i>
            </button>
        </div>
    );
};

export default Toast;
