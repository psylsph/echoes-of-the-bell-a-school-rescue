import React from 'react';
import { RefreshCwIcon } from './IconComponents';

interface GameOverScreenProps {
  message: string;
  onRestart: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ message, onRestart }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in bg-slate-800/50 rounded-lg shadow-2xl border border-slate-700">
      <h2 className="text-4xl font-bold text-indigo-300 mb-4">The End</h2>
      <p className="text-lg text-slate-300 max-w-2xl mb-8 leading-relaxed">
        {message}
      </p>
      <button
        onClick={onRestart}
        className="inline-flex items-center justify-center px-8 py-4 text-xl font-bold text-white bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-500 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300"
      >
        <RefreshCwIcon className="w-6 h-6 mr-3" />
        Play Again
      </button>
    </div>
  );
};

export default GameOverScreen;
