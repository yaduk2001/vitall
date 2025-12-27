import React from 'react';

interface TrainingModalProps {
    progressValue: number;
    trainingPhase: 'progress' | 'graph';
    trainingStep: number;
    onViewPage: () => void;
}

const TrainingModal: React.FC<TrainingModalProps> = ({
    progressValue,
    trainingPhase,
    trainingStep,
    onViewPage
}) => {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl transform transition-all animate-fade-in relative overflow-hidden ring-1 ring-white/20">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full opacity-50 -z-10 blur-xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-50 rounded-tr-full opacity-50 -z-10 blur-xl"></div>

                {trainingPhase === 'progress' ? (
                    // Progress View
                    <div className="py-6 flex flex-col items-center">
                        <div className="text-center mb-8 w-full">
                            <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 p-1">
                                {/* Spinning glow ring */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-400 to-purple-500 rounded-full animate-spin-slow opacity-70 blur-sm"></div>
                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-400 to-purple-500 rounded-full animate-spin-slow"></div>

                                <div className="w-full h-full bg-white rounded-full flex items-center justify-center relative z-10">
                                    <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-purple-700 rounded-full flex items-center justify-center text-white shadow-inner">
                                        <i className="fas fa-robot text-4xl animate-bounce-subtle"></i>
                                    </div>
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Training AI Model</h3>
                            <p className="text-gray-500 text-sm font-medium">
                                {progressValue < 100 ? 'Processing course data and updating knowledge...' : 'Finalizing...'}
                            </p>
                        </div>

                        <div className="mb-8 w-full">
                            <div className="flex justify-between items-end mb-2 px-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Knowledge XP</span>
                                <span className="text-sm font-bold text-blue-600">{Math.round(progressValue)}%</span>
                            </div>
                            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner ring-1 ring-gray-200">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out relative"
                                    style={{ width: `${progressValue}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 text-center transform transition-all duration-500 hover:scale-[1.02]">
                            <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-1">Lv 3</div>
                            <div className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">Knowledge Level</div>
                        </div>
                    </div>
                ) : (
                    // Graph View
                    <div className="animate-fade-in py-2">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4 ring-4 ring-blue-50 shadow-sm">
                                <i className="fas fa-brain text-blue-600 text-3xl animate-pulse"></i>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Training Complete!</h3>
                            <p className="text-gray-500 text-sm mt-2">Course data successfully integrated</p>
                        </div>

                        <div className="flex items-end justify-center space-x-12 h-64 mb-10 bg-gradient-to-b from-gray-50 to-white rounded-2xl p-8 border border-gray-100 shadow-inner relative overflow-hidden">
                            {/* Grid lines background */}
                            <div className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]"
                                style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
                            </div>

                            {/* Previous Knowledge Bar */}
                            <div className="flex flex-col items-center w-24 group relative z-10">
                                <div className="relative w-full h-48 flex items-end justify-center">
                                    <div
                                        className="w-14 bg-gray-300 rounded-t-lg transition-all duration-1000 ease-out shadow-sm group-hover:bg-gray-400"
                                        style={{ height: trainingStep >= 1 ? '30%' : '0%' }}
                                    ></div>
                                </div>
                                <span className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-wide text-center">Previous</span>
                            </div>

                            {/* Updated Knowledge Bar */}
                            <div className="flex flex-col items-center w-24 group relative z-10 top-[-4px]"> {/* Slight lift */}
                                <div className="relative w-full h-48 flex items-end justify-center">
                                    <div
                                        className="w-14 bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-lg transition-all duration-[1500ms] cubic-bezier(0.34, 1.56, 0.64, 1) shadow-lg shadow-blue-200 relative overflow-hidden group-hover:brightness-110"
                                        style={{ height: trainingStep >= 2 ? '90%' : '0%' }}
                                    >
                                        {trainingStep >= 2 && (
                                            <>
                                                <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-transparent via-white/30 to-transparent transform -translate-y-full hover:translate-y-full transition-transform duration-1000"></div>
                                                <div className="absolute top-0 inset-x-0 h-[2px] bg-white/50 shadow-[0_0_10px_white]"></div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <span className="mt-4 text-xs font-bold text-blue-600 uppercase tracking-wide text-center">Updated</span>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={onViewPage}
                                disabled={trainingStep < 2}
                                className={`flex items-center space-x-3 px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl transition-all transform hover:scale-105 hover:shadow-xl hover:shadow-blue-200/50 active:scale-95 ${trainingStep < 2 ? 'opacity-50 cursor-not-allowed grayscale' : 'opacity-100'}`}
                            >
                                <span>View Channel Page</span>
                                <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(-5%); }
          50% { transform: translateY(5%); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
};

export default TrainingModal;
