import React, { useRef, useEffect, useState } from 'react';
import { SvgScene } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { ChevronRightIcon, ImageIcon, AlertTriangleIcon } from './IconComponents';

interface GameScreenProps {
  story: string[];
  choices: string[];
  onChoice: (choice: string) => void;
  isLoading: boolean;
  error: string | null;
  image: string | SvgScene | null;
  isImageLoading: boolean;
  imageError: string | null;
}

const SvgRenderer: React.FC<{ scene: SvgScene }> = ({ scene }) => {
    if (!scene || !scene.viewBox || !Array.isArray(scene.elements)) {
      return (
        <div className="p-4 text-center text-amber-300 flex flex-col items-center justify-center h-full">
            <AlertTriangleIcon className="w-8 h-8 mb-2 text-amber-400" />
            <p className="font-semibold">Invalid Scene Data</p>
            <p className="text-sm text-amber-400 mt-1">The illustration data from the AI was malformed.</p>
        </div>
      );
    }
    const { viewBox, backgroundColor, elements } = scene;
  
    return (
      <div 
        className="w-full h-full animate-fade-in" 
        style={{ backgroundColor: backgroundColor || 'transparent' }}
      >
        <svg viewBox={viewBox} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          {elements.map((element, index) => {
            const { type, ...attrs } = element;
            // The AI might return attributes with incorrect casing for React, so we normalize them.
            const normalizedAttrs: { [key: string]: string | number } = {};
            for (const key in attrs) {
                // E.g., stroke-width -> strokeWidth
                const camelCaseKey = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
                normalizedAttrs[camelCaseKey] = attrs[key];
            }
            return React.createElement(type, { key: index, ...normalizedAttrs });
          })}
        </svg>
      </div>
    );
};


const ImagePanel: React.FC<{ image: string | SvgScene | null; isLoading: boolean; imageError: string | null }> = ({ image, isLoading, imageError }) => {
  return (
    <div className="w-full h-64 md:h-full bg-slate-900/50 rounded-lg flex items-center justify-center border border-slate-700 overflow-hidden">
      {isLoading && <LoadingSpinner />}
      {!isLoading && image && (
        typeof image === 'string' ? (
          <img 
            src={image} 
            alt="Scene illustration" 
            className="w-full h-full object-cover animate-fade-in"
          />
        ) : (
          <SvgRenderer scene={image} />
        )
      )}
      {!isLoading && !image && !imageError && (
        <div className="text-slate-600 flex flex-col items-center">
          <ImageIcon className="w-16 h-16" />
          <p className="mt-2 text-sm">No scene preview</p>
        </div>
      )}
      {!isLoading && imageError && (
        <div className="p-4 text-center text-amber-300 animate-fade-in flex flex-col items-center justify-center">
          <AlertTriangleIcon className="w-10 h-10 mb-2 text-amber-400" />
          <p className="font-semibold">Image Unavailable</p>
          <p className="text-sm text-amber-400 mt-1 max-w-xs">{imageError}</p>
        </div>
      )}
    </div>
  );
};

const GameScreen: React.FC<GameScreenProps> = ({ story, choices, onChoice, isLoading, error, image, isImageLoading, imageError }) => {
  const storyEndRef = useRef<HTMLDivElement>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
        storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [story, isLoading]);

  useEffect(() => {
    setSelectedChoice(null);
  }, [choices]);

  const handleChoiceClick = (choice: string) => {
    if (isLoading) return;
    setSelectedChoice(choice);
    onChoice(choice);
  };


  return (
    <div className="h-[85vh] w-full max-w-6xl rounded-lg grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6 animate-fade-in">
      
      {/* Image Panel */}
      <div className="md:col-span-2 h-full">
        <ImagePanel image={image} isLoading={isImageLoading} imageError={imageError} />
      </div>

      {/* Story and Choices Panel */}
      <div className="md:col-span-3 h-full bg-slate-800/50 rounded-lg shadow-2xl flex flex-col p-4 md:p-6 border border-slate-700 animate-subtle-glow overflow-hidden">
        <div id="story-container" className="flex-grow min-h-0 overflow-y-auto pr-4 space-y-6 text-lg leading-relaxed text-slate-300">
          {story.map((paragraph, index) => (
            <p 
              key={index} 
              className={`story-paragraph ${paragraph.startsWith('>') ? 'text-indigo-300 italic pl-4 border-l-2 border-indigo-400' : ''}`}
              style={{ animationDelay: `${Math.min(index * 150, 1500)}ms` }}
            >
              {paragraph.startsWith('>') ? paragraph.substring(1).trim() : paragraph}
            </p>
          ))}
          <div ref={storyEndRef} />
        </div>

        {error && (
          <div className="my-4 p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-lg">
            <strong>An error occurred:</strong> {error}
          </div>
        )}

        <div id="choices-container" className="mt-6 pt-6 border-t-2 border-slate-700">
          {isLoading && (
              <div className="flex justify-center items-center mb-4 animate-fade-in">
                  <LoadingSpinner />
                  <span className="ml-4 text-slate-400">The story unfolds...</span>
              </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {choices.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => handleChoiceClick(choice)}
                  disabled={isLoading}
                  className={`group flex items-center text-left w-full p-4 bg-slate-700/50 rounded-lg hover:bg-indigo-800/60 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-wait ${
                      isLoading && selectedChoice === choice ? 'choice-selected' : ''
                  }`}
                >
                  <ChevronRightIcon className="w-5 h-5 mr-3 text-indigo-400 flex-shrink-0" />
                  <span className="text-slate-200 group-hover:text-white">{choice}</span>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameScreen;