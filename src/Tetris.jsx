import { useEffect, useRef, useState, useCallback } from 'react';
import { IoArrowBack, IoPlay, IoPause, IoCaretBack, IoCaretForward, IoCaretDown, IoCaretUp, IoRefresh } from "react-icons/io5";
import './index.css';

const WIDTH = 10;

// FORMELE (TETROMINOES)
const lTetromino = [
  [1, WIDTH+1, WIDTH*2+1, 2],
  [WIDTH, WIDTH+1, WIDTH+2, WIDTH*2+2],
  [1, WIDTH+1, WIDTH*2+1, WIDTH*2],
  [WIDTH, WIDTH*2, WIDTH*2+1, WIDTH*2+2]
];
const zTetromino = [
  [0, WIDTH, WIDTH+1, WIDTH*2+1],
  [WIDTH+1, WIDTH+2, WIDTH*2, WIDTH*2+1],
  [0, WIDTH, WIDTH+1, WIDTH*2+1],
  [WIDTH+1, WIDTH+2, WIDTH*2, WIDTH*2+1]
];
const tTetromino = [
  [1, WIDTH, WIDTH+1, WIDTH+2],
  [1, WIDTH+1, WIDTH+2, WIDTH*2+1],
  [WIDTH, WIDTH+1, WIDTH+2, WIDTH*2+1],
  [1, WIDTH, WIDTH+1, WIDTH*2+1]
];
const oTetromino = [
  [0, 1, WIDTH, WIDTH+1],
  [0, 1, WIDTH, WIDTH+1],
  [0, 1, WIDTH, WIDTH+1],
  [0, 1, WIDTH, WIDTH+1]
];
const iTetromino = [
  [1, WIDTH+1, WIDTH*2+1, WIDTH*3+1],
  [WIDTH, WIDTH+1, WIDTH+2, WIDTH+3],
  [1, WIDTH+1, WIDTH*2+1, WIDTH*3+1],
  [WIDTH, WIDTH+1, WIDTH+2, WIDTH+3]
];

const THE_TETROMINOES = [lTetromino, zTetromino, tTetromino, oTetromino, iTetromino];

// --- HOOK PENTRU APASARE LUNGA (DOAR PENTRU BUTONUL JOS) ---
function useLongPress(callback = () => {}, ms = 50) {
  const [startLongPress, setStartLongPress] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (startLongPress) {
      callback(); 
      timerRef.current = setInterval(callback, ms);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [startLongPress, callback, ms]);

  return {
    onMouseDown: () => setStartLongPress(true),
    onMouseUp: () => setStartLongPress(false),
    onMouseLeave: () => setStartLongPress(false),
    onTouchStart: (e) => { 
        if(e.cancelable) e.preventDefault(); 
        setStartLongPress(true); 
    },
    onTouchEnd: () => setStartLongPress(false),
  };
}

export default function TetrisGame({ onBack }) {
  const gridRef = useRef(null);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Starea jocului tinuta in Ref pentru performanta maxima
  const game = useRef({
    timerId: null,
    squares: [], 
    currentPosition: 4,
    currentRotation: 0,
    random: 0,
    current: [],
    isFrozen: false
  });

  // --- INITIALIZARE ---
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    
    grid.innerHTML = ''; 
    const squares = [];
    
    // 200 patratele de joc
    for (let i = 0; i < 200; i++) {
      const div = document.createElement('div');
      grid.appendChild(div);
      squares.push(div);
    }
    // 10 patratele baza (invizibile, pentru podea)
    for (let i = 0; i < 10; i++) {
      const div = document.createElement('div');
      div.classList.add('taken');
      div.classList.add('hide-base');
      grid.appendChild(div);
      squares.push(div);
    }

    game.current.squares = squares;
    
    startNewPiece();
    game.current.timerId = setInterval(moveDown, 800);

    return () => clearInterval(game.current.timerId);
  }, []);

  // --- LOGICA JOCULUI ---
  const startNewPiece = () => {
    game.current.random = Math.floor(Math.random() * THE_TETROMINOES.length);
    game.current.currentRotation = 0;
    game.current.current = THE_TETROMINOES[game.current.random][0];
    game.current.currentPosition = 4;
    game.current.isFrozen = false;
    
    if (checkCollision(0, 0)) {
      setIsGameOver(true);
      clearInterval(game.current.timerId);
    } else {
      draw();
    }
  };

  const draw = () => {
    const { current, currentPosition, squares } = game.current;
    current.forEach(index => {
      if(squares[currentPosition + index]) {
        squares[currentPosition + index].classList.add('tetromino');
      }
    });
  };

  const undraw = () => {
    const { current, currentPosition, squares } = game.current;
    current.forEach(index => {
      if(squares[currentPosition + index]) {
        squares[currentPosition + index].classList.remove('tetromino');
      }
    });
  };

  // --- VERIFICARE COLIZIUNE (OPTIMIZATA) ---
  const checkCollision = (moveOffset, rotationOffset = 0) => {
    const { currentPosition, currentRotation, random, squares } = game.current;
    let nextRotation = (currentRotation + rotationOffset) % 4;
    let nextPiece = THE_TETROMINOES[random][nextRotation];
    
    return nextPiece.some(index => {
      let nextIndex = currentPosition + index + moveOffset;
      if (!squares[nextIndex]) return true; 
      if (squares[nextIndex].classList.contains('taken')) return true;
      if (moveOffset === 1 && (currentPosition + index) % WIDTH === WIDTH - 1) return true;
      if (moveOffset === -1 && (currentPosition + index) % WIDTH === 0) return true;
      return false;
    });
  };

  // --- MISCARE ---
  const moveDown = useCallback(() => {
    if (game.current.isFrozen || isGameOver || isPaused) return;

    if (checkCollision(WIDTH)) {
      freeze();
    } else {
      undraw();
      game.current.currentPosition += WIDTH;
      draw();
    }
  }, [isGameOver, isPaused]);

  const moveLeft = useCallback(() => {
    if (isGameOver || isPaused) return;
    if (!checkCollision(-1)) {
      undraw();
      game.current.currentPosition -= 1;
      draw();
    }
  }, [isGameOver, isPaused]);

  const moveRight = useCallback(() => {
    if (isGameOver || isPaused) return;
    if (!checkCollision(1)) {
      undraw();
      game.current.currentPosition += 1;
      draw();
    }
  }, [isGameOver, isPaused]);

  const rotate = useCallback(() => {
    if (isGameOver || isPaused) return;
    
    const { random, currentPosition, currentRotation } = game.current;
    const nextRotation = (currentRotation + 1) % 4;
    const nextPiece = THE_TETROMINOES[random][nextRotation];
    
    const isAtLeft = nextPiece.some(index => (currentPosition + index) % WIDTH === 0);
    const isAtRight = nextPiece.some(index => (currentPosition + index) % WIDTH === WIDTH - 1);

    if (!(isAtLeft && isAtRight)) {
       if (!checkCollision(0, 1)) {
          undraw();
          game.current.currentRotation = nextRotation;
          game.current.current = nextPiece;
          draw();
       }
    }
  }, [isGameOver, isPaused]);

  const freeze = () => {
    if (game.current.isFrozen) return;
    game.current.isFrozen = true;

    const { current, currentPosition, squares } = game.current;
    
    current.forEach(index => squares[currentPosition + index].classList.add('taken'));
    
    let linesCleared = 0;
    for (let i = 0; i < 199; i += WIDTH) {
      const row = [i, i+1, i+2, i+3, i+4, i+5, i+6, i+7, i+8, i+9];

      if (row.every(index => squares[index].classList.contains('taken'))) {
        linesCleared++;
        row.forEach(index => {
          squares[index].classList.remove('taken');
          squares[index].classList.remove('tetromino');
        });
        const squaresRemoved = squares.splice(i, WIDTH);
        game.current.squares = squaresRemoved.concat(squares);
        game.current.squares.forEach(cell => gridRef.current.appendChild(cell));
      }
    }

    if (linesCleared > 0) {
      const bonus = [0, 100, 300, 500, 800];
      setScore(prev => prev + bonus[linesCleared]);
    } else {
        setScore(prev => prev + 10);
    }
    startNewPiece();
  };

  const handlePause = () => {
    if (isPaused) {
      game.current.timerId = setInterval(moveDown, 800);
      setIsPaused(false);
    } else {
      clearInterval(game.current.timerId);
      setIsPaused(true);
    }
  };

  const handleRestart = () => {
     window.location.reload();
  };

  // --- CONTROALE ---
  // Doar JOS are useLongPress (ca sa curga repede)
  const downPress = useLongPress(moveDown, 60);

  return (
    <div className="tetris-container fade-in">
      <div className="tetris-header">
        <button onClick={onBack} className="back-btn"><IoArrowBack size={28} /></button>
        <h2>LSFEE Tetris</h2>
        <div className="score-box">Scor: {score}</div>
      </div>

      <div className="grid-wrapper">
        <div className="tetris-grid" ref={gridRef}></div>
        {isGameOver && (
            <div className="game-over-overlay">
                <h3>GAME OVER</h3>
                <p>Scor Final: {score}</p>
                <button onClick={handleRestart} className="restart-btn"><IoRefresh size={20}/> Reîncepe</button>
            </div>
        )}
      </div>

      <div className="controls-area">
         <div className="d-pad-grid">
            <div></div>
            {/* ROTIRE: Folosim onPointerDown pentru reactie rapida (tap) */}
            <button className="ctrl-btn rotate-btn" onPointerDown={rotate}><IoCaretUp /></button>
            <div></div>
            
            {/* STANGA: onPointerDown (tap) */}
            <button className="ctrl-btn" onPointerDown={moveLeft}><IoCaretBack /></button>
            
            {/* JOS: Long Press Activat (Hold) */}
            <button className="ctrl-btn" {...downPress}><IoCaretDown /></button>
            
            {/* DREAPTA: onPointerDown (tap) */}
            <button className="ctrl-btn" onPointerDown={moveRight}><IoCaretForward /></button>
         </div>

         <div className="action-row">
            <button className="ctrl-btn big-btn" onClick={handlePause}>
                {isPaused ? <IoPlay /> : <IoPause />}
            </button>
         </div>
      </div>
    </div>
  );
}
