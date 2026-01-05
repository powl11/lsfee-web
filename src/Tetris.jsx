import { useEffect, useRef, useState } from 'react';
import { IoArrowBack, IoPlay, IoPause, IoCaretBack, IoCaretForward, IoCaretDown, IoCaretUp } from "react-icons/io5";
import './index.css';

const WIDTH = 10;

// DEFINIREA TUTUROR ROTATIILOR PENTRU PIESE
// Calculat matematic pentru un grid de latime 10
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

export default function TetrisGame({ onBack }) {
  const gridRef = useRef(null);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const gameRef = useRef({
    timerId: null,
    squares: [],
    currentPosition: 4,
    currentRotation: 0,
    random: 0,
    current: [],
    nextRandom: 0
  });

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    
    // Curatam grid-ul vechi
    grid.innerHTML = ''; 
    
    // Cream 200 de patratele pentru joc
    for (let i = 0; i < 200; i++) {
      const div = document.createElement('div');
      grid.appendChild(div);
    }
    // Cream 10 patratele pentru baza (invizibile, pentru coliziune)
    for (let i = 0; i < 10; i++) {
      const div = document.createElement('div');
      div.classList.add('taken');
      div.classList.add('hide-base'); // Clasa noua ca sa nu le vedem
      grid.appendChild(div);
    }

    gameRef.current.squares = Array.from(grid.querySelectorAll('div'));
    
    // Alegem prima piesa
    gameRef.current.random = Math.floor(Math.random() * THE_TETROMINOES.length);
    gameRef.current.currentRotation = 0;
    gameRef.current.current = THE_TETROMINOES[gameRef.current.random][0];
    gameRef.current.currentPosition = 4;
    
    draw();
    
    // Start Timer
    gameRef.current.timerId = setInterval(moveDown, 800); // Viteza putin mai mare

    return () => clearInterval(gameRef.current.timerId);
  }, []);

  // --- DESENARE ---
  const draw = () => {
    const { current, currentPosition, squares } = gameRef.current;
    current.forEach(index => {
      if(squares[currentPosition + index]) {
        squares[currentPosition + index].classList.add('tetromino');
      }
    });
  };

  const undraw = () => {
    const { current, currentPosition, squares } = gameRef.current;
    current.forEach(index => {
      if(squares[currentPosition + index]) {
        squares[currentPosition + index].classList.remove('tetromino');
      }
    });
  };

  // --- MISCARE ---
  const moveDown = () => {
    if (isGameOver || isPaused) return;
    
    const { current, currentPosition, squares } = gameRef.current;
    
    // Verificam coliziunea cu linia de jos INAINTE sa mutam
    if (current.some(index => squares[currentPosition + index + WIDTH] && squares[currentPosition + index + WIDTH].classList.contains('taken'))) {
      freeze();
    } else {
      undraw();
      gameRef.current.currentPosition += WIDTH;
      draw();
    }
  };

  const moveLeft = () => {
    if (isGameOver || isPaused) return;
    undraw();
    const { current, currentPosition, squares } = gameRef.current;
    
    // Verificam daca e la marginea stanga
    const isAtLeftEdge = current.some(index => (currentPosition + index) % WIDTH === 0);
    
    if (!isAtLeftEdge) {
      gameRef.current.currentPosition -= 1;
    }
    
    // Daca noua pozitie se loveste de o piesa existenta, dam undo
    if (gameRef.current.current.some(index => squares[gameRef.current.currentPosition + index].classList.contains('taken'))) {
      gameRef.current.currentPosition += 1;
    }
    draw();
  };

  const moveRight = () => {
    if (isGameOver || isPaused) return;
    undraw();
    const { current, currentPosition, squares } = gameRef.current;
    
    // Verificam daca e la marginea dreapta
    const isAtRightEdge = current.some(index => (currentPosition + index) % WIDTH === WIDTH - 1);
    
    if (!isAtRightEdge) {
      gameRef.current.currentPosition += 1;
    }
    
    // Daca noua pozitie se loveste de o piesa existenta, dam undo
    if (gameRef.current.current.some(index => squares[gameRef.current.currentPosition + index].classList.contains('taken'))) {
      gameRef.current.currentPosition -= 1;
    }
    draw();
  };

  const rotate = () => {
    if (isGameOver || isPaused) return;
    undraw();
    
    const { random, currentPosition, currentRotation, squares } = gameRef.current;
    const nextRotation = (currentRotation + 1) % 4; // Trecem la urmatoarea rotatie (0->1->2->3->0)
    const nextPiece = THE_TETROMINOES[random][nextRotation];
    
    // VERIFICARI DE COLIZIUNE LA ROTIRE (Anti-Bugs)
    
    // 1. Verificam daca noua rotatie iese prin pereti (Wrap around)
    // Daca piesa e la margine (index % 10 e mic sau mare) si noua piesa sare in partea cealalta
    const isAtLeft = nextPiece.some(index => (currentPosition + index) % WIDTH === 0);
    const isAtRight = nextPiece.some(index => (currentPosition + index) % WIDTH === WIDTH - 1);

    // Daca noua piesa ar fi "sparta" intre stanga si dreapta, nu rotim
    if (!(isAtLeft && isAtRight)) {
       // 2. Verificam daca noua rotatie se loveste de o piesa existenta
       if (!nextPiece.some(index => squares[currentPosition + index] && squares[currentPosition + index].classList.contains('taken'))) {
          // E sigur sa rotim
          gameRef.current.currentRotation = nextRotation;
          gameRef.current.current = nextPiece;
       }
    }
    
    draw();
  };

  // --- LOGICA JOCULUI ---
  const freeze = () => {
    const { current, currentPosition, squares } = gameRef.current;
    
    // Blocăm piesa curentă
    current.forEach(index => squares[currentPosition + index].classList.add('taken'));
    
    // SCOR: Puncte pentru bloc pus
    setScore(prev => prev + 10);
    
    // Generăm piesa nouă
    gameRef.current.random = Math.floor(Math.random() * THE_TETROMINOES.length);
    gameRef.current.currentRotation = 0;
    gameRef.current.current = THE_TETROMINOES[gameRef.current.random][0];
    gameRef.current.currentPosition = 4;
    
    addScore(); // Verificam linii
    draw();
    checkGameOver();
  };

  const addScore = () => {
    const { squares } = gameRef.current;
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
        gameRef.current.squares = squaresRemoved.concat(squares);
        gameRef.current.squares.forEach(cell => gridRef.current.appendChild(cell));
      }
    }

    // SCOR: Sistem Bonus
    if (linesCleared === 1) setScore(prev => prev + 100);
    else if (linesCleared === 2) setScore(prev => prev + 300);
    else if (linesCleared === 3) setScore(prev => prev + 500);
    else if (linesCleared === 4) setScore(prev => prev + 800);
  };

  const checkGameOver = () => {
    const { current, currentPosition, squares } = gameRef.current;
    if (current.some(index => squares[currentPosition + index].classList.contains('taken'))) {
      setIsGameOver(true);
      clearInterval(gameRef.current.timerId);
    }
  };

  const handlePause = () => {
    if (isPaused) {
      gameRef.current.timerId = setInterval(moveDown, 800);
      setIsPaused(false);
    } else {
      clearInterval(gameRef.current.timerId);
      setIsPaused(true);
    }
  };

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
                <button onClick={onBack} className="restart-btn">Ieșire</button>
            </div>
        )}
      </div>

      <div className="controls-area">
         {/* D-PAD cu SAGEATA SUS pentru ROTIRE */}
         <div className="d-pad-grid">
            <div></div>
            <button className="ctrl-btn rotate-btn" onPointerDown={rotate}><IoCaretUp /></button>
            <div></div>
            
            <button className="ctrl-btn" onPointerDown={moveLeft}><IoCaretBack /></button>
            <button className="ctrl-btn" onPointerDown={moveDown}><IoCaretDown /></button>
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