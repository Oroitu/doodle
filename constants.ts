
// Layout definitions
// IDs must match the pieces. Identical IDs in adjacent cells form a single larger piece.

// Original 10-piece layout
export const GRID_LAYOUT_10 = [
  ['p1', 'p2', 'p2', 'p3'],
  ['p4', 'p5', 'p6', 'p7'],
  ['p8', 'p9', 'p9', 'p10']
];

// New 4-piece layout (1x4)
export const GRID_LAYOUT_4 = [
  ['p20', 'p21', 'p22', 'p23']
];

export const CELL_SIZE = 150; // Large pieces
export const SNAP_DISTANCE = 100; // Increased to make snapping easier
export const ALIGN_EPSILON = 20;
export const BASE_PADDING = 0;

// Visual constants for Isometric/3D view
export const BOARD_ROTATION_X = 45; // Degrees of tilt
