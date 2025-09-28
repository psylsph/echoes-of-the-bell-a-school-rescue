import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { BookOpenIcon } from './IconComponents';

interface TitleScreenProps {
  onStart: () => void;
  isLoading: boolean;
}

const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, isLoading }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
      <h1 className="text-5xl md:text-7xl font-bold text-indigo-300 tracking-wider" style={{ fontFamily: "'Times New Roman', serif" }}>
        Echoes of the Bell
      </h1>
      <p className="mt-4 text-lg md:text-xl text-slate-400 max-w-2xl">
        The last bell rang hours ago, but the school did not let everyone leave. Guide Lily through the darkened halls and solve the mystery to rescue her friends before it's too late.
      </p>
      <button
        onClick={onStart}
        disabled={isLoading}
        className="mt-12 inline-flex items-center justify-center px-8 py-4 text-xl font-bold text-white bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-500 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:bg-indigo-800 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <BookOpenIcon className="w-6 h-6 mr-3" />
            Begin the Rescue
          </>
        )}
      </button>
    </div>
  );
};

export default TitleScreen;
