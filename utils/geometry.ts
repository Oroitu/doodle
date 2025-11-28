import { PieceConnectors } from '../types';

/**
 * Generates the SVG path d attribute for a grid-based puzzle piece.
 * The path walks the perimeter of the piece defined by dimensions and connector arrays.
 */
export const buildPiecePath = (
  connectors: PieceConnectors,
  dimensions: { width: number; height: number },
  cellSize: number
): string => {
  const { width, height } = dimensions; // in cells
  const unit = cellSize;
  
  // Connector dimensions
  const connDepth = unit * 0.25; // Depth of tab/slot
  const connWidth = unit * 0.3;  // Width of the neck of the tab
  
  // Helper to draw a single edge segment (flat, tab, or slot)
  // start: {x,y}, end: {x,y}, type: 0 (flat), 1 (out), -1 (in)
  // We assume we are drawing from left-to-right (relative to the edge's local coordinate system)
  // For standard processing, we'll just handle the logic inline for each side to keep orientation clear.

  let d = `M 0 0`;
  let cx = 0;
  let cy = 0;

  // 1. TOP EDGE (Left -> Right)
  // Iterating through columns 0 to width-1
  for (let i = 0; i < width; i++) {
    const type = connectors.top[i];
    const nextX = cx + unit;
    
    if (type === 0) {
      d += ` L ${nextX} ${cy}`;
    } else {
      const midX = cx + unit / 2;
      const sign = type === 1 ? -1 : 1; // Top edge: 1 is OUT (Up, negative Y), -1 is IN (Down, positive Y)
      // Actually standard: 1 = Tab (Out), -1 = Slot (In). 
      // For Top edge, "Out" is -Y. "In" is +Y.
      
      const p1x = midX - connWidth / 2;
      const p2x = midX + connWidth / 2;
      const tipY = cy + sign * connDepth;
      
      d += ` L ${p1x} ${cy}`;
      d += ` C ${p1x} ${tipY} ${p2x} ${tipY} ${p2x} ${cy}`;
      d += ` L ${nextX} ${cy}`;
    }
    cx = nextX;
  }

  // 2. RIGHT EDGE (Top -> Bottom)
  // Iterating through rows 0 to height-1
  for (let i = 0; i < height; i++) {
    const type = connectors.right[i];
    const nextY = cy + unit;

    if (type === 0) {
      d += ` L ${cx} ${nextY}`;
    } else {
      const midY = cy + unit / 2;
      const sign = type === 1 ? 1 : -1; // Right edge: 1 is OUT (Right, +X), -1 is IN (Left, -X)
      
      const p1y = midY - connWidth / 2;
      const p2y = midY + connWidth / 2;
      const tipX = cx + sign * connDepth;

      d += ` L ${cx} ${p1y}`;
      d += ` C ${tipX} ${p1y} ${tipX} ${p2y} ${cx} ${p2y}`;
      d += ` L ${cx} ${nextY}`;
    }
    cy = nextY;
  }

  // 3. BOTTOM EDGE (Right -> Left)
  // Iterating through columns width-1 down to 0
  for (let i = width - 1; i >= 0; i--) {
    const type = connectors.bottom[i]; // Note: connectors array is 0..width-1 ordered left-to-right grid-wise
    const nextX = cx - unit;

    if (type === 0) {
      d += ` L ${nextX} ${cy}`;
    } else {
      const midX = cx - unit / 2;
      const sign = type === 1 ? 1 : -1; // Bottom edge: 1 is OUT (Down, +Y), -1 is IN (Up, -Y)
      
      const p1x = midX + connWidth / 2; // Moving left, so p1 is right side
      const p2x = midX - connWidth / 2;
      const tipY = cy + sign * connDepth;

      d += ` L ${p1x} ${cy}`;
      d += ` C ${p1x} ${tipY} ${p2x} ${tipY} ${p2x} ${cy}`;
      d += ` L ${nextX} ${cy}`;
    }
    cx = nextX;
  }

  // 4. LEFT EDGE (Bottom -> Top)
  // Iterating through rows height-1 down to 0
  for (let i = height - 1; i >= 0; i--) {
    const type = connectors.left[i];
    const nextY = cy - unit;

    if (type === 0) {
      d += ` L ${cx} ${nextY}`;
    } else {
      const midY = cy - unit / 2;
      const sign = type === 1 ? -1 : 1; // Left edge: 1 is OUT (Left, -X), -1 is IN (Right, +X)
      
      const p1y = midY + connWidth / 2; // Moving up, so p1 is bottom side
      const p2y = midY - connWidth / 2;
      const tipX = cx + sign * connDepth;

      d += ` L ${cx} ${p1y}`;
      d += ` C ${tipX} ${p1y} ${tipX} ${p2y} ${cx} ${p2y}`;
      d += ` L ${cx} ${nextY}`;
    }
    cy = nextY;
  }

  d += " Z";
  return d;
};
