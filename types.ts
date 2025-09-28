export enum GameStatus {
  TITLE,
  PLAYING,
  GAME_OVER,
}

export interface GameStep {
  story: string;
  choices: string[];
  gameOver: boolean;
  gameOverMessage: string;
  sceneDescription: string;
}

export interface SvgElement {
  type: 'rect' | 'circle' | 'path' | 'polygon';
  [key: string]: string | number;
}

export interface SvgScene {
  viewBox: string;
  backgroundColor: string;
  elements: SvgElement[];
}