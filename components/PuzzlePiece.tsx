
import React, { useMemo } from 'react';
import { PieceState } from '../types';
import { CELL_SIZE, BOARD_ROTATION_X } from '../constants';
import { buildPiecePath } from '../utils/geometry';

interface PuzzlePieceProps {
  piece: PieceState;
  onPointerDown: (e: React.PointerEvent, pieceId: string) => void;
  isGlowTarget: boolean;
  imageUrl: string;
  imageScaleMultiplier?: number;
  isCompleted?: boolean;
}

const PuzzlePiece: React.FC<PuzzlePieceProps> = ({
  piece,
  onPointerDown,
  isGlowTarget,
  imageUrl,
  imageScaleMultiplier = 2.3,
  isCompleted = false
}) => {


  const pathData = useMemo(() =>
    buildPiecePath(piece.connectors, piece.dimensions, CELL_SIZE),
    [piece.connectors, piece.dimensions]);

  const width = piece.dimensions.width * CELL_SIZE;
  const height = piece.dimensions.height * CELL_SIZE;

  // Use exact logical dimensions for viewBox to avoid scaling artifacts.
  const viewBox = `0 0 ${width} ${height}`;

  // Active if this piece is being dragged OR if it's the target of a snap
  const isActive = piece.isDragging || isGlowTarget;

  // Calculate size for the PNG overlay. 
  // If piece is large (occupies more than 1 cell), fill the space.
  const isLarge = piece.dimensions.width > 1 || piece.dimensions.height > 1;
  const imageScale = (isLarge ? 1.0 : 0.85) * imageScaleMultiplier;

  const imageWidth = width * imageScale;
  const imageHeight = height * imageScale * 1.5;

  return (
    <div
      className={`absolute touch-none select-none ${isActive ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: piece.currentPos.x,
        top: piece.currentPos.y,
        width: width,
        height: height,
        zIndex: piece.zIndex,
        willChange: 'transform, left, top',
        transformStyle: 'preserve-3d',
        transform: `translateZ(${piece.zIndex}px)`, // Sync 3D depth with Z-Index
        // Smooth transition only when snapping (not dragging)
        transition: piece.isDragging ? 'none' : 'left 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}
      onPointerDown={(e) => {
        e.stopPropagation(); // Prevent bubbling
        onPointerDown(e, piece.id);
      }}
    >
      {/* Extended Hit Area removed to prevent overlapping issues */}

      <div
        className="relative w-full h-full pointer-events-none"
        style={{
          // Simple lift when active
          transform: isActive ? 'scale(1.02) translateZ(10px)' : 'translateZ(0px)',
          transition: 'transform 0.1s ease-out',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* The Piece SVG - The Base */}
        <div
          className="absolute inset-0 origin-center"
          style={{
            backfaceVisibility: 'hidden',
            transform: isActive ? 'translateZ(60px)' : 'translateZ(0px)',
            transition: 'transform 0.2s ease-out, opacity 0.5s ease-out',
            opacity: isCompleted ? 0 : 1
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox={viewBox}
            className="overflow-visible"
            style={{
              transition: 'filter 0.2s ease-out'
            }}
          >
            <g>
              {/* Base color (Gray) */}
              {/* Masking stroke to hide underlying lines */}
              <path
                d={pathData}
                fill="none"
                stroke="#e3e7f0"
                strokeWidth={isActive ? 4 : 3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Base color (Gray) */}
              <path
                d={pathData}
                fill="none"
                stroke={isActive ? '#60a5fa' : '#94a3b8'}
                strokeWidth={isActive ? 4 : 3}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="6 6"
              />
            </g>
          </svg>
        </div>

        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            // Lift up and counter-rotate to face screen
            // Also counter-scale Y to prevent distortion from parent's Y-stretch
            transform: `translateZ(30px) scaleY(${Math.cos(BOARD_ROTATION_X * Math.PI / 180)}) rotateX(-${BOARD_ROTATION_X}deg)`,
            transformOrigin: 'center bottom',
            pointerEvents: 'none',
            // Apply glow here so it is associated with the top-most visual element
            filter: isActive ? 'drop-shadow(0 0 10px #60a5fa) drop-shadow(0 0 20px #60a5fa)' : 'none',
            transition: 'filter 0.2s ease-out'
          }}
        >
          {/* 
                Wrapper for Image. 
             */}
          <div style={{
            position: 'relative',
            width: imageWidth,
            height: imageHeight,
            minWidth: imageWidth, // Force minimum width
            minHeight: imageHeight // Force minimum height
          }}>
            <img
              src={imageUrl}
              alt=""
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                maxWidth: 'none', // Prevent max-width constraint
                maxHeight: 'none', // Prevent max-height constraint
                // Keep the shadow for depth, but maybe reduce it if it conflicts with glow? 
                // Actually, let's keep the depth shadow on the image itself, and the glow on the parent.
                filter: 'drop-shadow(0px 10px 8px rgba(0,0,0,0.3))'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PuzzlePiece;
