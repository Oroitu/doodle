export interface Vector2 {
  x: number;
  y: number;
}

export interface PieceConnectors {
  top: number[];
  right: number[];
  bottom: number[];
  left: number[];
}

export interface PieceState {
  id: string;
  dimensions: { width: number; height: number }; // Dimensions in grid cells (e.g., 2x1)
  gridPos: { col: number; row: number }; // Original position in the solved grid
  currentPos: Vector2; // Current visual position in pixels
  connectors: PieceConnectors;
  zIndex: number;
  isDragging: boolean;
  groupId: string;
}

export interface SnapCandidate {
  targetPieceId: string;
  targetPos: Vector2;
  distance: number;
}

export type GamePhase = 
  | 'INTRO' 
  | 'PLAYING_FAIL' 
  | 'ASSISTANT' 
  | 'BREATHING' 
  | 'PLAYING_SUCCESS' 
  | 'COMPLETED';
