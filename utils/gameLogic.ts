
import { CELL_SIZE, SNAP_DISTANCE, ALIGN_EPSILON } from '../constants';
import { PieceState, PieceConnectors, SnapCandidate } from '../types';

const getRandomConnector = () => (Math.random() > 0.5 ? 1 : -1);

/**
 * Checks if two piece IDs share an edge in the provided grid layout.
 */
const arePiecesNeighbors = (id1: string, id2: string, layout: string[][]): boolean => {
  const rows = layout.length;
  const cols = layout[0].length;
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (layout[r][c] === id1) {
        const deltas = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dr, dc] of deltas) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && layout[nr][nc] === id2) {
             return true;
          }
        }
      }
    }
  }
  return false;
};

/**
 * Generates puzzle pieces based on the provided layout.
 * It determines connectors based on adjacency in the grid.
 */
export const generatePuzzle = (
  containerWidth: number, 
  containerHeight: number,
  layout: string[][]
): PieceState[] => {
  const rows = layout.length;
  const cols = layout[0].length;

  // 1. Map Edges
  // hEdges[y][x]: horizontal edge between row y-1 and y at column x
  // vEdges[y][x]: vertical edge between col x-1 and x at row y
  // Value: 1 or -1 (connector type). 0 is not used here for generation, we assign randoms.
  const hEdges: number[][] = Array.from({ length: rows + 1 }, () => Array(cols).fill(0));
  const vEdges: number[][] = Array.from({ length: rows }, () => Array(cols + 1).fill(0));

  // Generate Vertical Edges (internal left/right connections)
  for (let y = 0; y < rows; y++) {
    for (let x = 1; x < cols; x++) {
      const leftId = layout[y][x - 1];
      const rightId = layout[y][x];
      // If adjacent cells have different IDs, they need a connector
      if (leftId && rightId && leftId !== rightId) {
        vEdges[y][x] = getRandomConnector();
      }
    }
  }

  // Generate Horizontal Edges (internal top/bottom connections)
  for (let y = 1; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const topId = layout[y - 1][x];
      const bottomId = layout[y][x];
      if (topId && bottomId && topId !== bottomId) {
        hEdges[y][x] = getRandomConnector();
      }
    }
  }

  // 2. Group cells by Piece ID
  const cellsByPiece: Record<string, { x: number; y: number }[]> = {};
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const pid = layout[y][x];
      if (!pid) continue;
      if (!cellsByPiece[pid]) cellsByPiece[pid] = [];
      cellsByPiece[pid].push({ x, y });
    }
  }

  // 3. Construct PieceStates
  const newPieces: PieceState[] = [];
  let baseZ = 10;

  for (const [pid, cells] of Object.entries(cellsByPiece)) {
    // Calculate bounding box in grid coordinates
    const xs = cells.map(c => c.x);
    const ys = cells.map(c => c.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;

    // Build Connectors Arrays
    const connectors: PieceConnectors = { top: [], right: [], bottom: [], left: [] };

    // TOP Edge: Scan bounding box top
    for (let cx = minX; cx <= maxX; cx++) {
      const y = minY;
      // Check the edge "above" this cell. 
      // hEdges[y][cx] is the edge at row y (top of this cell).
      // We check if it is an external boundary or internal to the piece.
      const aboveRow = y - 1;
      const isExternal = aboveRow < 0 || layout[aboveRow][cx] !== pid;
      
      if (!isExternal) {
        connectors.top.push(0); // Internal seam (should technically not happen on bounding box unless non-rectangular concave)
      } else {
         // If it's the very top of grid, flat. Otherwise check hEdges.
         if (aboveRow < 0) connectors.top.push(0);
         else {
           // hEdges was generated. If the neighbor is empty/null, flat. If neighbor is different piece, use connector.
           const neighborId = layout[aboveRow][cx];
           if (!neighborId) connectors.top.push(0);
           else connectors.top.push(hEdges[y][cx]); // hEdges store the value
         }
      }
    }

    // BOTTOM Edge: Scan bounding box bottom
    for (let cx = minX; cx <= maxX; cx++) {
      const y = maxY; // The row index of the cell
      const belowRow = y + 1;
      // Edge is hEdges[y+1][cx]
      const isExternal = belowRow >= rows || layout[belowRow][cx] !== pid;
      
      if (!isExternal) {
        connectors.bottom.push(0);
      } else {
        if (belowRow >= rows) connectors.bottom.push(0);
        else {
          const neighborId = layout[belowRow][cx];
          if (!neighborId) connectors.bottom.push(0);
          else connectors.bottom.push(-hEdges[belowRow][cx]); // Invert for opposing piece
        }
      }
    }

    // LEFT Edge: Scan bounding box left
    for (let cy = minY; cy <= maxY; cy++) {
      const x = minX;
      const leftCol = x - 1;
      // Edge is vEdges[cy][x]
      const isExternal = leftCol < 0 || layout[cy][leftCol] !== pid;
      
      if (!isExternal) {
        connectors.left.push(0);
      } else {
        if (leftCol < 0) connectors.left.push(0);
        else {
          const neighborId = layout[cy][leftCol];
          if (!neighborId) connectors.left.push(0);
          else connectors.left.push(vEdges[cy][x]);
        }
      }
    }

    // RIGHT Edge: Scan bounding box right
    for (let cy = minY; cy <= maxY; cy++) {
      const x = maxX;
      const rightCol = x + 1;
      // Edge is vEdges[cy][rightCol]
      const isExternal = rightCol >= cols || layout[cy][rightCol] !== pid;

      if (!isExternal) {
        connectors.right.push(0);
      } else {
        if (rightCol >= cols) connectors.right.push(0);
        else {
          const neighborId = layout[cy][rightCol];
          if (!neighborId) connectors.right.push(0);
          else connectors.right.push(-vEdges[cy][rightCol]); // Invert
        }
      }
    }

    // Random Position
    const visualW = width * CELL_SIZE;
    const visualH = height * CELL_SIZE;
    const startX = Math.random() * (containerWidth - visualW - 40) + 20;
    const startY = Math.random() * (containerHeight - visualH - 40) + 20;

    newPieces.push({
      id: pid,
      dimensions: { width, height },
      gridPos: { col: minX, row: minY },
      currentPos: { x: startX, y: startY },
      connectors,
      zIndex: baseZ++,
      isDragging: false,
      groupId: pid // Initially, each piece is its own group
    });
  }

  return newPieces;
};

/**
 * Finds a snap candidate based on relative grid positions.
 */
export const findSnapCandidate = (
  activePiece: PieceState,
  allPieces: PieceState[],
  layout: string[][]
): SnapCandidate | null => {
  let bestDist = Infinity;
  let bestCandidate: SnapCandidate | null = null;

  for (const other of allPieces) {
    if (other.id === activePiece.id) continue;
    
    // Do not snap to pieces already in the same group
    if (other.groupId === activePiece.groupId) continue;

    // Check if pieces are neighbors in the grid.
    if (!arePiecesNeighbors(activePiece.id, other.id, layout)) continue;

    // Check if they are compatible neighbors
    // Two pieces are neighbors if their grid positions indicate they are close.
    // Calculate where activePiece *should* be relative to `other` based on gridPos.
    
    const colDiff = activePiece.gridPos.col - other.gridPos.col;
    const rowDiff = activePiece.gridPos.row - other.gridPos.row;

    // Ideal position for activePiece if it snaps to other
    const targetX = other.currentPos.x + colDiff * CELL_SIZE;
    const targetY = other.currentPos.y + rowDiff * CELL_SIZE;

    const dx = targetX - activePiece.currentPos.x;
    const dy = targetY - activePiece.currentPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < SNAP_DISTANCE && dist < bestDist) {
      bestDist = dist;
      bestCandidate = {
        targetPieceId: other.id,
        targetPos: { x: targetX, y: targetY },
        distance: dist
      };
    }
  }

  return bestCandidate;
};

export const checkCompletion = (pieces: PieceState[]): boolean => {
  if (pieces.length === 0) return false;

  // We check if all pieces are correctly positioned relative to the first piece (anchor)
  const anchor = pieces[0];
  
  for (let i = 1; i < pieces.length; i++) {
    const p = pieces[i];
    
    const colDiff = p.gridPos.col - anchor.gridPos.col;
    const rowDiff = p.gridPos.row - anchor.gridPos.row;
    
    const idealX = anchor.currentPos.x + colDiff * CELL_SIZE;
    const idealY = anchor.currentPos.y + rowDiff * CELL_SIZE;
    
    const dist = Math.hypot(p.currentPos.x - idealX, p.currentPos.y - idealY);
    
    if (dist > ALIGN_EPSILON) {
      return false;
    }
  }
  
  return true;
};
