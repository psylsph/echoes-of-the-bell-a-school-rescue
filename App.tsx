import React, { useState, useCallback, useEffect } from 'react';
import { GameStatus, GameStep, SvgScene } from './types';
import { getNextStep, generateSceneImage } from './services/gameService';
import { loadCacheFromStorage, saveCacheToStorage } from './services/cacheService';
import { INITIAL_PROMPT } from './constants';
import TitleScreen from './components/TitleScreen';
import GameScreen from './components/GameScreen';
import GameOverScreen from './components/GameOverScreen';

const App: React.FC = () => {
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.TITLE);
  const [storyHistory, setStoryHistory] = useState<string[]>([]);
  const [currentChoices, setCurrentChoices] = useState<string[]>([]);
  const [currentImage, setCurrentImage] = useState<string | SvgScene | null>(null);
  const [imageCache, setImageCache] = useState<Map<string, string | SvgScene>>(() => loadCacheFromStorage());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [gameOverMessage, setGameOverMessage] = useState<string>('');

  useEffect(() => {
    saveCacheToStorage(imageCache);
  }, [imageCache]);

  const handleStartGame = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setImageError(null);
    setStoryHistory([]);
    setCurrentImage(null);
    // Keep the cache between games
    // setImageCache(new Map());

    try {
      const initialStep = await getNextStep(INITIAL_PROMPT);
      if (initialStep) {
        setStoryHistory([initialStep.story]);
        setCurrentChoices(initialStep.choices);
        setGameStatus(GameStatus.PLAYING);

        // --- Start Image Generation in Parallel ---
        const generateInitialImage = async () => {
          const sceneDesc = initialStep.sceneDescription;
          if (!sceneDesc) {
            setCurrentImage(null);
            return;
          }
           if (imageCache.has(sceneDesc)) {
              setCurrentImage(imageCache.get(sceneDesc)!);
              return;
            }
          setIsImageLoading(true);
          setCurrentImage(null);
          setImageError(null);
          try {
            const newImage = await generateSceneImage(sceneDesc);
            setCurrentImage(newImage);
            setImageCache(prev => new Map(prev).set(sceneDesc, newImage));
          } catch (imgErr) {
            console.error("Image generation failed:", imgErr);
            setImageError(imgErr instanceof Error ? imgErr.message : "An unknown error occurred while generating the image.");
          } finally {
            setIsImageLoading(false);
          }
        };
        generateInitialImage(); // Fire-and-forget
        // --- End Image Generation ---

      } else {
         setError('Failed to start the game. The story could not be generated.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [imageCache]);

  const handleChoice = useCallback(async (choice: string) => {
    setIsLoading(true);
    setError(null);
    
    const context = `
      PREVIOUS STORY:
      ${storyHistory.join('\n\n')}
      
      PLAYER'S ACTION: "${choice}"
    `;

    try {
      const nextStep = await getNextStep(context);
      if (nextStep) {
        if (nextStep.gameOver) {
          setGameOverMessage(nextStep.gameOverMessage);
          setGameStatus(GameStatus.GAME_OVER);
          setCurrentImage(null);
        } else {
          setStoryHistory(prev => [...prev, `> ${choice}`, nextStep.story]);
          setCurrentChoices(nextStep.choices);
          
          // --- Start Image Generation in Parallel ---
          const generateNextImage = async () => {
            const sceneDesc = nextStep.sceneDescription;
            if (!sceneDesc) {
              setCurrentImage(null);
              return;
            }
            if (imageCache.has(sceneDesc)) {
              setCurrentImage(imageCache.get(sceneDesc)!);
              return;
            }
            setIsImageLoading(true);
            setCurrentImage(null);
            setImageError(null);
            try {
              const newImage = await generateSceneImage(sceneDesc);
              setCurrentImage(newImage);
              setImageCache(prev => new Map(prev).set(sceneDesc, newImage));
            } catch (imgErr) {
              console.error("Image generation failed:", imgErr);
              setImageError(imgErr instanceof Error ? imgErr.message : "An unknown error occurred while generating the image.");
            } finally {
              setIsImageLoading(false);
            }
          };
          generateNextImage(); // Fire-and-forget
          // --- End Image Generation ---
        }
      } else {
        setError('The story could not continue. Please try another choice or restart.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [storyHistory, imageCache]);

  const handleRestart = useCallback(() => {
    setGameStatus(GameStatus.TITLE);
    setStoryHistory([]);
    setCurrentChoices([]);
    setCurrentImage(null);
    // Don't clear cache on restart
    // setImageCache(new Map());
    setIsLoading(false);
    setIsImageLoading(false);
    setError(null);
    setImageError(null);
    setGameOverMessage('');
  }, []);

  const renderContent = () => {
    switch (gameStatus) {
      case GameStatus.TITLE:
        return <TitleScreen onStart={handleStartGame} isLoading={isLoading} />;
      case GameStatus.PLAYING:
        return (
          <GameScreen
            story={storyHistory}
            choices={currentChoices}
            onChoice={handleChoice}
            isLoading={isLoading}
            error={error}
            image={currentImage}
            isImageLoading={isImageLoading}
            imageError={imageError}
          />
        );
      case GameStatus.GAME_OVER:
        return <GameOverScreen message={gameOverMessage} onRestart={handleRestart} />;
      default:
        return <TitleScreen onStart={handleStartGame} isLoading={isLoading} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-indigo-950 flex flex-col items-center justify-center p-4 font-serif">
        <div className="w-full max-w-6xl mx-auto">
            {renderContent()}
        </div>
    </div>
  );
};

export default App;