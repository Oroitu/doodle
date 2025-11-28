
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RotateCcw, Bot, AlertTriangle, XCircle, Terminal, PlayCircle } from 'lucide-react';
import { generatePuzzle, findSnapCandidate, checkCompletion } from './utils/gameLogic';
import { PieceState, GamePhase } from './types';
import { CELL_SIZE, BOARD_ROTATION_X, GRID_LAYOUT_10, GRID_LAYOUT_4 } from './constants';
import PuzzlePiece from './components/PuzzlePiece';
import { soundManager } from './utils/SoundManager';

const GAME_WIDTH = 1000;
const GAME_HEIGHT = 800;

const getViewportSize = () => ({
  width: window.visualViewport?.width ?? window.innerWidth,
  height: window.visualViewport?.height ?? window.innerHeight
});

// --- Sub-components for UI Overlays ---

const IntroOverlay: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
    <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl p-8 text-center space-y-6">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Terminal className="text-blue-600 w-8 h-8" />
      </div>

      <p className="text-slate-600 text-base whitespace-pre-line leading-relaxed"><strong>{"Konektatu elementu guztiak eta abiatu 2026a behar bezala."}</strong></p>

      <p className="text-slate-600 text-base whitespace-pre-line leading-relaxed">
        {"Conecta los componentes y arranca el 2026 con buen pie."}
      </p>

      <button
        onClick={() => { soundManager.playClick(); onStart(); }}
        className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg whitespace-pre-line"
      >
        {"Sistema Abiarazi / Iniciar Sistema"}
      </button>
    </div>
  </div>
);

const ErrorToast: React.FC<{ message: string, id: number }> = ({ message }) => (
  <div className="flex items-center gap-3 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg animate-in zoom-in-95 fade-in duration-300 max-w-md">
    <AlertTriangle size={24} className="shrink-0" />
    <span className="font-mono text-sm font-semibold whitespace-pre-line">{message}</span>
  </div>
);

const AssistantOverlay: React.FC<{ onPause: () => void }> = ({ onPause }) => {
  // Structured content
  const content = useMemo(() => [
    { text: "Guri ere gertatzen zaigu.", className: "font-bold text-slate-900" },
    { text: "\nEtenaldi bat egingo dugu?", className: "text-blue-600 font-semibold" },
    { text: "\nEsto nos pasa también a nosotras.\n¿Hacemos una pausa?", className: "text-slate-600" }
  ], []);

  // Initialize state immediately with empty strings but correct structure
  const [displayedSegments, setDisplayedSegments] = useState(() =>
    content.map(c => ({ text: "", className: c.className }))
  );

  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let currentSegmentIdx = 0;
    let currentCharIdx = 0;

    const interval = setInterval(() => {
      if (currentSegmentIdx >= content.length) {
        setIsComplete(true);
        clearInterval(interval);
        return;
      }

      const targetSegment = content[currentSegmentIdx];

      // Append next character
      setDisplayedSegments(prev => {
        // Safety check
        if (!prev[currentSegmentIdx]) return prev;

        const next = [...prev];
        next[currentSegmentIdx] = {
          ...next[currentSegmentIdx],
          text: targetSegment.text.slice(0, currentCharIdx + 1)
        };
        return next;
      });

      currentCharIdx++;

      // Move to next segment if finished
      if (currentCharIdx >= targetSegment.text.length) {
        currentSegmentIdx++;
        currentCharIdx = 0;
      }
    }, 30);

    return () => clearInterval(interval);
  }, [content]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center shadow-inner">
          <Bot className="text-indigo-600 w-10 h-10" />
        </div>
        <div className="bg-slate-50 p-4 rounded-xl w-full border border-slate-200 min-h-[160px] flex items-center justify-center">
          <p className="text-lg whitespace-pre-line leading-relaxed">
            {displayedSegments.map((seg, i) => (
              <span key={i} className={seg.className}>{seg.text}</span>
            ))}
            {!isComplete && <span className="animate-pulse text-blue-600">|</span>}
          </p>
        </div>
        <button
          onClick={() => { soundManager.playClick(); onPause(); }}
          className="py-3 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full transition-all hover:shadow-lg whitespace-pre-line text-center leading-tight"
        >
          {"Pausa"}
        </button>
      </div>
    </div>
  );
};

const BreathingOverlay: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale');

  useEffect(() => {
    // 4 complete breaths.
    // 1 breath = Inhale (2.5s) + Exhale (2.5s) = 5s.
    // Total duration = 2 * 5s = 20s.
    // Total ticks = 4 (2 inhales, 2 exhales).

    let ticks = 0;
    const maxTicks = 4;

    const interval = setInterval(() => {
      ticks++;
      if (ticks >= maxTicks) {
        clearInterval(interval);
        onComplete();
      } else {
        setPhase(prev => prev === 'inhale' ? 'exhale' : 'inhale');
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 text-white p-4">
      <div
        className={`relative w-56 h-56 rounded-full border-4 border-white/20 flex items-center justify-center transition-all duration-[2500ms] ease-in-out ${phase === 'inhale' ? 'scale-125 bg-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.5)]' : 'scale-75 bg-blue-500/0'
          }`}
      >
        {/* Heartbeat Effect - Only visible during inhale */}
        {phase === 'inhale' && (
          <div className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping" style={{ animationDuration: '3s' }} />
        )}

        <span className="relative z-10 text-xl font-light tracking-widest uppercase text-center whitespace-pre-line leading-relaxed">
          {phase === 'inhale' ? 'Hartu arnasa\nInspira' : 'Bota arnasa\nEspira'}
        </span>
      </div>
      <div className="mt-16 text-slate-400 font-light animate-pulse text-center whitespace-pre-line">
        {"Sistema eragilea lasaitzen...\nRelajando sistema operativo..."}
      </div>
    </div>
  );
};

const Snowfall: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const particles: { x: number, y: number, r: number, d: number }[] = [];
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 3 + 1,
        d: Math.random() * 100 // density
      });
    }

    let animationFrameId: number;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.beginPath();
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.moveTo(p.x, p.y);
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2, true);
      }
      ctx.fill();
      update();
      animationFrameId = requestAnimationFrame(draw);
    };

    let angle = 0;
    const update = () => {
      angle += 0.01;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y += Math.cos(angle + p.d) + 1 + p.r / 2;
        p.x += Math.sin(angle) * 2;

        if (p.x > w + 5 || p.x < -5 || p.y > h) {
          if (i % 3 > 0) { // 66.67% of the flakes
            particles[i] = { x: Math.random() * w, y: -10, r: p.r, d: p.d };
          } else {
            // If the flake is exitting from the right
            if (Math.sin(angle) > 0) {
              // Enter from the left
              particles[i] = { x: -5, y: Math.random() * h, r: p.r, d: p.d };
            } else {
              // Enter from the right
              particles[i] = { x: w + 5, y: Math.random() * h, r: p.r, d: p.d };
            }
          }
        }
      }
    };

    draw();

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-40 pointer-events-none" />;
};

const SuccessOverlay: React.FC<{ onRestartMini: () => void }> = ({ onRestartMini }) => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
    <div className="bg-white/95 max-w-xl w-full rounded-2xl shadow-2xl p-10 text-center space-y-6 animate-in zoom-in-90 duration-500 border border-white/20">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <Terminal className="text-green-600 w-10 h-10" />
      </div>
      <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-line">
        {"Informazioaren eta Komunikazioen Teknologien Zerbitzutik jai egun lasaiak eta berrabiarazte zoriontsuz betetako 2026a opa dizugu.\n"}
        <strong>{"Desde el Servicios de las Tecnologías de la Información y las Comunicaciones te deseamos unas fiestas tranquilas y un 2026 lleno de reinicios felices."}</strong>
      </p>

      <div className="pt-4 border-t border-slate-100">
        <button
          onClick={() => { soundManager.playClick(); onRestartMini(); }}
          className="flex items-center justify-center gap-2 mx-auto py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors h-auto"
        >
          <PlayCircle size={24} className="shrink-0" />
          <span className="text-left whitespace-pre-line text-sm leading-tight">
            {"2026"}
          </span>
        </button>
      </div>

      <div className="text-xs text-slate-400 font-mono whitespace-pre-line">
        {"EGOERA OK: SISTEMA_MARTXAN\nSTATUS OK: SYSTEM_OPERATIONAL"}
      </div>
    </div>
  </div>
);

// --- Main App Component ---

const App: React.FC = () => {
  const [pieces, setPieces] = useState<PieceState[]>([]);
  const [gameState, setGameState] = useState<GamePhase>('INTRO');
  const [glowTargetId, setGlowTargetId] = useState<string | null>(null);
  const [currentLayout, setCurrentLayout] = useState<string[][]>(GRID_LAYOUT_10);

  // Logic Refs
  const piecesRef = useRef<PieceState[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    activeGroupId: string | null;
    pointerId: number | null;
    lastPos: { x: number; y: number };
  }>({ activeGroupId: null, pointerId: null, lastPos: { x: 0, y: 0 } });
  const zCounter = useRef(100);

  // Fail Mode Logic
  const [failAttempts, setFailAttempts] = useState(0);
  const [activeErrors, setActiveErrors] = useState<{ id: number, msg: string }[]>([]);
  const failTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // Initial Setup (Game is paused behind intro)
    startNewGame(GRID_LAYOUT_10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Fail Mode Timer
    if (gameState === 'PLAYING_FAIL') {
      failTimerRef.current = window.setTimeout(() => {
        setGameState('ASSISTANT');
      }, 90000);
    }
    return () => {
      if (failTimerRef.current) clearTimeout(failTimerRef.current);
    };
  }, [gameState]);

  // Background Music Manager
  useEffect(() => {
    switch (gameState) {
      case 'PLAYING_FAIL':
        soundManager.playMusic('01.mp3');
        break;
      case 'BREATHING':
        soundManager.playMusic('02.mp3');
        break;
      case 'PLAYING_SUCCESS':
        soundManager.playMusic('03.mp3');
        break;
      case 'INTRO':
        soundManager.stopMusic();
        break;
      // ASSISTANT: Keep playing previous (01.mp3)
      // COMPLETED: Keep playing previous (03.mp3)
    }
  }, [gameState]);

  useEffect(() => {
    // Attempts Trigger
    if (gameState === 'PLAYING_FAIL' && failAttempts >= 10) {
      if (failTimerRef.current) clearTimeout(failTimerRef.current);
      setGameState('ASSISTANT');
    }
  }, [failAttempts, gameState]);

  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  useEffect(() => {
    if (gameState === 'COMPLETED') {
      const delay = pieces.length > 4 ? 5000 : 0; // 5s delay for first puzzle, immediate for second (text handles anim)
      const timer = setTimeout(() => {
        setShowSuccessOverlay(true);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setShowSuccessOverlay(false);
    }
  }, [gameState, pieces.length]);

  const startNewGame = (layout: string[][]) => {
    setCurrentLayout(layout);
    let newPieces = generatePuzzle(GAME_WIDTH, GAME_HEIGHT, layout);

    // Initialize Z-indexes: Single pieces (50) > Grouped pieces (10)
    const groupSizes = new Map<string, number>();
    newPieces.forEach(p => {
      groupSizes.set(p.groupId, (groupSizes.get(p.groupId) || 0) + 1);
    });

    newPieces = newPieces.map(p => {
      const size = groupSizes.get(p.groupId) || 1;
      return { ...p, zIndex: size > 1 ? 10 : 50 };
    });

    setPieces(newPieces);
    piecesRef.current = newPieces;
    zCounter.current = 100;
  };

  const handleRestartMini = () => {
    setGameState('PLAYING_SUCCESS'); // Allow snapping immediately
    setFailAttempts(0);
    setActiveErrors([]);
    startNewGame(GRID_LAYOUT_4); // Use 4 piece grid
  };

  const startGame = () => {
    soundManager.playBootSequence();
    setGameState('PLAYING_FAIL');
  };

  const handlePointerDown = (e: React.PointerEvent, pieceId: string) => {
    if (gameState !== 'PLAYING_FAIL' && gameState !== 'PLAYING_SUCCESS') return;

    const clickedPiece = piecesRef.current.find(p => p.id === pieceId);
    if (!clickedPiece) return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    // Scale client coordinates to game space
    const containerRect = containerRef.current!.getBoundingClientRect();

    // Use explicit math for scaling to ensure 1:1 tracking and avoid DOM inaccuracies
    const scaleX = 1 / scale;
    // Since we are compensating for the rotation with scaleY in the container,
    // the visual Y is now 1:1 with logical Y (multiplied by global scale).
    const scaleY = 1 / scale;

    const startX = (e.clientX - containerRect.left) * scaleX;
    const startY = (e.clientY - containerRect.top) * scaleY;

    dragRef.current = {
      activeGroupId: clickedPiece.groupId,
      pointerId: e.pointerId,
      lastPos: { x: startX, y: startY }
    };

    // Bring entire group to front and set dragging state
    zCounter.current += 1;
    const currentZ = zCounter.current;

    const newPieces = piecesRef.current.map(p => {
      if (p.groupId === clickedPiece.groupId) {
        return { ...p, isDragging: true, zIndex: currentZ };
      }
      return p;
    });

    piecesRef.current = newPieces;
    setPieces(newPieces);
    soundManager.playGrab();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const { activeGroupId, pointerId, lastPos } = dragRef.current;

    if (!activeGroupId || !containerRef.current || e.pointerId !== pointerId) return;

    e.preventDefault();

    const containerRect = containerRef.current.getBoundingClientRect();
    const viewport = getViewportSize();

    // Use explicit math for scaling to ensure 1:1 tracking
    const scaleX = 1 / scale;
    const scaleY = 1 / scale;

    const currentX = (e.clientX - containerRect.left) * scaleX;
    const currentY = (e.clientY - containerRect.top) * scaleY;

    const rawDx = currentX - lastPos.x;
    const rawDy = currentY - lastPos.y;

    let dx = rawDx;
    let dy = rawDy;

    // --- CONSTRAIN TO SCREEN ---
    // Calculate the bounding box of the active group
    const groupPieces = piecesRef.current.filter(p => p.groupId === activeGroupId);
    let groupMinX = Infinity, groupMinY = Infinity, groupMaxX = -Infinity, groupMaxY = -Infinity;

    groupPieces.forEach(p => {
      groupMinX = Math.min(groupMinX, p.currentPos.x);
      groupMinY = Math.min(groupMinY, p.currentPos.y);
      groupMaxX = Math.max(groupMaxX, p.currentPos.x + p.dimensions.width * CELL_SIZE);
      groupMaxY = Math.max(groupMaxY, p.currentPos.y + p.dimensions.height * CELL_SIZE);
    });

    // Calculate visible screen bounds in Game Space dynamically
    // This handles any centering offsets or margins automatically
    const screenLeftInGame = (0 - containerRect.left) * scaleX;
    const screenRightInGame = (viewport.width - containerRect.left) * scaleX;
    const screenTopInGame = (0 - containerRect.top) * scaleY;
    const screenBottomInGame = (viewport.height - containerRect.top) * scaleY;

    // Apply padding to keep pieces fully on screen
    const padding = 10;

    // Clamp dx
    if (groupMinX + dx < screenLeftInGame + padding) dx = screenLeftInGame + padding - groupMinX;
    if (groupMaxX + dx > screenRightInGame - padding) dx = screenRightInGame - padding - groupMaxX;

    // Clamp dy
    if (groupMinY + dy < screenTopInGame + padding) dy = screenTopInGame + padding - groupMinY;
    if (groupMaxY + dy > screenBottomInGame - padding) dy = screenBottomInGame - padding - groupMaxY;
    // ---------------------------

    // Update position
    const newPieces = piecesRef.current.map(p => {
      if (p.groupId === activeGroupId) {
        return {
          ...p,
          currentPos: { x: p.currentPos.x + dx, y: p.currentPos.y + dy }
        };
      }
      return p;
    });

    piecesRef.current = newPieces;
    setPieces(newPieces);

    dragRef.current.lastPos = { x: currentX, y: currentY };

    // Check for potential snaps (visual feedback only)
    if (gameState === 'PLAYING_SUCCESS' || gameState === 'PLAYING_FAIL') {
      const groupPieces = newPieces.filter(p => p.groupId === activeGroupId);
      let bestCandidateId: string | null = null;
      let minDist = Infinity;

      for (const groupPiece of groupPieces) {
        const candidate = findSnapCandidate(groupPiece, newPieces, currentLayout);
        if (candidate && candidate.distance < minDist) {
          minDist = candidate.distance;
          bestCandidateId = candidate.targetPieceId;
        }
      }
      setGlowTargetId(bestCandidateId);
    }
  };

  const triggerError = () => {
    soundManager.playError();
    const errorMessages = [
      "2025 abiarazte-errorea: sistema gainezka.\nError de arranque 2025: sistema saturado.",
      "Ez da zure errua, urtea da. 😉\nNo es culpa tuya, es el año. 😉",
      "IRQ gatazka atzeman da.\nConflicto de IRQ detectado.",
      "Buffer overflow memoria emozionalean.\nBuffer overflow en la memoria emocional.",
      "8. geruzako errorea.\nError de capa 8.",
      "Salbuespen kontrolatu gabea: URTE_BERRI_NOT_FOUND\nExcepción no controlada: AÑO_NUEVO_NOT_FOUND"
    ];
    const msg = errorMessages[Math.floor(Math.random() * errorMessages.length)];
    const id = Date.now();
    setActiveErrors(prev => [...prev.slice(-2), { id, msg }]);

    // Auto remove
    setTimeout(() => {
      setActiveErrors(prev => prev.filter(e => e.id !== id));
    }, 4000);

    setFailAttempts(prev => prev + 1);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const { activeGroupId, pointerId } = dragRef.current;
    if (!activeGroupId || e.pointerId !== pointerId) return;

    const groupPieces = piecesRef.current.filter(p => p.groupId === activeGroupId);

    let bestSnap: { sourcePieceId: string, targetPieceId: string, diff: { x: number, y: number } } | null = null;
    let minDist = Infinity;

    // Find if snap is possible
    for (const groupPiece of groupPieces) {
      const candidate = findSnapCandidate(groupPiece, piecesRef.current, currentLayout);
      if (candidate && candidate.distance < minDist) {
        minDist = candidate.distance;
        const dx = candidate.targetPos.x - groupPiece.currentPos.x;
        const dy = candidate.targetPos.y - groupPiece.currentPos.y;

        bestSnap = {
          sourcePieceId: groupPiece.id,
          targetPieceId: candidate.targetPieceId,
          diff: { x: dx, y: dy }
        };
      }
    }

    let finalPieces = [...piecesRef.current];

    // HANDLE MODES
    if (gameState === 'PLAYING_FAIL') {
      // In Fail mode, even if we have a bestSnap, we reject it or random error
      // If the user tries to drop it "close enough" (bestSnap exists), trigger error
      if (bestSnap) {
        triggerError();
      } else {
        setFailAttempts(prev => prev + 1);
      }

      // Just stop dragging, no snap
      finalPieces = finalPieces.map(p =>
        p.groupId === activeGroupId ? { ...p, isDragging: false } : p
      );

    } else if (gameState === 'PLAYING_SUCCESS') {
      // Normal Logic
      if (bestSnap) {
        const targetPiece = finalPieces.find(p => p.id === bestSnap!.targetPieceId);
        const targetGroupId = targetPiece!.groupId;

        finalPieces = finalPieces.map(p => {
          if (p.groupId === activeGroupId) {
            return {
              ...p,
              currentPos: {
                x: p.currentPos.x + bestSnap!.diff.x,
                y: p.currentPos.y + bestSnap!.diff.y
              },
              groupId: targetGroupId,
              isDragging: false
            };
          }
          return p;
        });
        soundManager.playSnap();
      } else {
        finalPieces = finalPieces.map(p =>
          p.groupId === activeGroupId ? { ...p, isDragging: false } : p
        );
      }
    }

    // STRICT BOUNDS & COLLISION RESOLUTION
    // Only apply if we didn't just snap (snapping implies valid placement)
    const hasSnapped = (gameState === 'PLAYING_SUCCESS' && bestSnap);

    if (!hasSnapped && activeGroupId) {
      const getGroupRect = (pList: PieceState[], gId: string) => {
        const group = pList.filter(p => p.groupId === gId);
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        group.forEach(p => {
          minX = Math.min(minX, p.currentPos.x);
          minY = Math.min(minY, p.currentPos.y);
          maxX = Math.max(maxX, p.currentPos.x + p.dimensions.width * CELL_SIZE);
          maxY = Math.max(maxY, p.currentPos.y + p.dimensions.height * CELL_SIZE);
        });
        return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
      };

      const moveGroup = (pList: PieceState[], gId: string, dx: number, dy: number) => {
        return pList.map(p => {
          if (p.groupId === gId) {
            return { ...p, currentPos: { x: p.currentPos.x + dx, y: p.currentPos.y + dy } };
          }
          return p;
        });
      };

      const isOverlapping = (r1: any, r2: any) => {
        // Add a small buffer to avoid touching-is-overlapping
        const buffer = 2;
        return r1.minX < r2.maxX - buffer && r1.maxX > r2.minX + buffer &&
          r1.minY < r2.maxY - buffer && r1.maxY > r2.minY + buffer;
      };

      let currentPieces = finalPieces;
      let rect = getGroupRect(currentPieces, activeGroupId);
      let anyCorrection = false;

      // Iterative solver to satisfy both constraints
      for (let i = 0; i < 10; i++) {
        let moved = false;
        let dx = 0;
        let dy = 0;

        // 1. Strict Screen Bounds
        if (rect.minX < 0) dx = -rect.minX;
        if (rect.minY < 0) dy = -rect.minY;
        if (rect.maxX > GAME_WIDTH) dx = GAME_WIDTH - rect.maxX;
        if (rect.maxY > GAME_HEIGHT) dy = GAME_HEIGHT - rect.maxY;

        if (dx !== 0 || dy !== 0) {
          currentPieces = moveGroup(currentPieces, activeGroupId, dx, dy);
          rect = getGroupRect(currentPieces, activeGroupId);
          moved = true;
          anyCorrection = true;
        }

        // 2. Collision with other groups
        // Get all unique group IDs except current
        const otherGroupIds = Array.from(new Set(currentPieces.map(p => p.groupId))).filter(id => id !== activeGroupId);

        for (const otherId of otherGroupIds) {
          const otherRect = getGroupRect(currentPieces, otherId);
          if (isOverlapping(rect, otherRect)) {
            // Push away vector
            const cx = (rect.minX + rect.maxX) / 2;
            const cy = (rect.minY + rect.maxY) / 2;
            const ox = (otherRect.minX + otherRect.maxX) / 2;
            const oy = (otherRect.minY + otherRect.maxY) / 2;

            let vx = cx - ox;
            let vy = cy - oy;

            // If centers are perfectly aligned, pick random direction
            if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1) {
              vx = Math.random() - 0.5;
              vy = Math.random() - 0.5;
            }

            const len = Math.sqrt(vx * vx + vy * vy);
            // Push by a fixed step or proportional to overlap? Fixed step is safer for stability.
            const pushStep = 20;
            const pushX = (vx / len) * pushStep;
            const pushY = (vy / len) * pushStep;

            currentPieces = moveGroup(currentPieces, activeGroupId, pushX, pushY);
            rect = getGroupRect(currentPieces, activeGroupId);
            moved = true;
            anyCorrection = true;
            // Break after one collision to re-evaluate bounds in next iteration
            break;
          }
        }

        if (!moved) break;
      }

      if (anyCorrection) {
        soundManager.playError();
      }

      finalPieces = currentPieces;
    }

    // RECALCULATE Z-INDEXES
    // Unplaced (single) pieces -> Higher Z (e.g. 50)
    // Placed (grouped) pieces -> Lower Z (e.g. 10)
    const groupSizes = new Map<string, number>();
    finalPieces.forEach(p => {
      groupSizes.set(p.groupId, (groupSizes.get(p.groupId) || 0) + 1);
    });

    finalPieces = finalPieces.map(p => {
      const size = groupSizes.get(p.groupId) || 1;
      const baseZ = size > 1 ? 10 : 50;
      // Add small offset to maintain relative order or just flatten
      return { ...p, zIndex: baseZ };
    });

    zCounter.current = 100;

    piecesRef.current = finalPieces;
    setPieces(finalPieces);
    setGlowTargetId(null);
    dragRef.current = { activeGroupId: null, pointerId: null, lastPos: { x: 0, y: 0 } };

    // Check Completion (Only in Success Mode)
    if (gameState === 'PLAYING_SUCCESS') {
      setTimeout(() => {
        if (checkCompletion(piecesRef.current)) {
          // Wait 2 seconds before showing success
          setTimeout(() => {
            // Center the puzzle
            const currentPieces = piecesRef.current;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

            currentPieces.forEach(p => {
              minX = Math.min(minX, p.currentPos.x);
              minY = Math.min(minY, p.currentPos.y);
              maxX = Math.max(maxX, p.currentPos.x + p.dimensions.width * CELL_SIZE);
              maxY = Math.max(maxY, p.currentPos.y + p.dimensions.height * CELL_SIZE);
            });

            const cx = (minX + maxX) / 2;
            const cy = (minY + maxY) / 2;
            const dx = (GAME_WIDTH / 2) - cx;
            const dy = (GAME_HEIGHT / 2) - cy;

            const centeredPieces = currentPieces.map(p => ({
              ...p,
              currentPos: {
                x: p.currentPos.x + dx,
                y: p.currentPos.y + dy
              }
            }));

            setPieces(centeredPieces);
            piecesRef.current = centeredPieces;

            soundManager.playWin();
            setGameState('COMPLETED');
          }, 2000);
        }
      }, 150);
    }
  };

  const getPngUrl = (id: string) => {
    const number = id.replace('p', '');
    const padded = number.padStart(2, '0');
    // Special case for 21 which is a jpg
    if (padded === '21') return `./img/${padded}.png`;
    return `./img/${padded}.png`;
  };

  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const { width: w, height: h } = getViewportSize();
      // Leave some margin
      const margin = 20;
      const availableW = w - margin;
      const availableH = h - margin;

      const scaleW = availableW / GAME_WIDTH;
      const scaleH = availableH / GAME_HEIGHT;

      // Fit within screen, max scale 1 (or slightly more if on huge screen? let's cap at 1.2 for fun, but 1 is safe)
      const newScale = Math.min(scaleW, scaleH, 1.2);
      setScale(newScale);
    };

    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);
    handleResize();
    return () => {
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);

  const isAnyDragging = pieces.some(p => p.isDragging);

  return (
    <div className={`w-screen h-screen bg-[#e3e7f0] overflow-hidden flex items-center justify-center relative font-sans ${isAnyDragging ? 'cursor-grabbing' : ''}`}>

      {/* UI LAYERS */}
      {gameState === 'INTRO' && <IntroOverlay onStart={startGame} />}

      {gameState === 'ASSISTANT' && (
        <AssistantOverlay onPause={() => setGameState('BREATHING')} />
      )}

      {gameState === 'BREATHING' && (
        <BreathingOverlay onComplete={() => setGameState('PLAYING_SUCCESS')} />
      )}

      {/* DEBUG OVERLAY */}
      {/* <div className="fixed top-0 left-0 bg-black/50 text-white p-2 z-[100] font-mono text-xs pointer-events-none whitespace-pre">
        {(() => {
          if (!containerRef.current) return 'No Container';
          const r = containerRef.current.getBoundingClientRect();
          const scaleX = 1 / scale;
          const left = (0 - r.left) * scaleX;
          return `Rect: L${r.left.toFixed(0)} T${r.top.toFixed(0)} W${r.width.toFixed(0)}\nWin: ${window.innerWidth}x${window.innerHeight}\nScale: ${scale.toFixed(3)}\nBoundL: ${left.toFixed(0)}`;
        })()}
      </div> */}

      {gameState === 'COMPLETED' && (
        <>
          <Snowfall />
          {showSuccessOverlay && (
            pieces.length > 4 ? (
              <SuccessOverlay onRestartMini={handleRestartMini} />
            ) : (
              <div className="absolute top-1/2 left-2/3 transform -translate-x-1/2 translate-y-[150px] text-end z-50 animate-in fade-in zoom-in duration-2000 pointer-events-none">
                <h1 className="text-5xl md:text-3xl font-bold text-blue-400 drop-shadow-2xl font-sans tracking-wider mb-2" style={{ textShadow: '0 4px 8px rgba(255,255,255,0.8)' }}>
                  URTE ZORIONTSUA
                </h1>
                <h2 className="text-3xl md:text-3xl font-semibold text-slate-400 font-sans tracking-wide" style={{ textShadow: '0 2px 4px rgba(255,255,255,0.8)' }}>
                  FELIZ AÑO
                </h2>
              </div>
            )
          )}
        </>
      )}

      {/* Error Toasts Container */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center pointer-events-none gap-4">
        {activeErrors.map(err => (
          <ErrorToast key={err.id} message={err.msg} id={err.id} />
        ))}
      </div>

      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{
          width: '100%',
          height: '100%',
          // perspective: '2500px' // Removed to ensure orthographic projection for accurate 1:1 dragging
        }}
      >
        <div
          className="relative touch-none"
          style={{
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            transformStyle: 'preserve-3d',
            // Compensate for foreshortening by scaling Y up by 1/cos(theta)
            transform: `scale(${scale}) rotateX(${BOARD_ROTATION_X}deg) scaleY(${1 / Math.cos(BOARD_ROTATION_X * Math.PI / 180)})`,
            transformOrigin: 'center center',
            transition: 'transform 0.5s ease-out'
          }}
          ref={containerRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Floor */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)',
              backgroundSize: `${CELL_SIZE / 2}px ${CELL_SIZE / 2}px`,
              transform: 'translateZ(-1px)'
            }}
          />

          {pieces.map((piece) => {
            const isMini = currentLayout.length === 1;
            const multiplier = isMini ? 1.7 : 1.4;
            // console.log(`Piece ${piece.id} scale: ${multiplier} (Mini: ${isMini})`);

            return (
              <PuzzlePiece
                key={piece.id}
                piece={piece}
                onPointerDown={handlePointerDown}
                isGlowTarget={piece.id === glowTargetId}
                imageUrl={getPngUrl(piece.id)}
                imageScaleMultiplier={multiplier}
                isCompleted={gameState === 'COMPLETED'}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default App;
