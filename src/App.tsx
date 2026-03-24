import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, RefreshCw, Music, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

const GRID_SIZE = 20;
const GAME_SPEED = 100;

const TRACKS = [
  { id: 1, title: "DATA_CORRUPTION_01.wav", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "MEMORY_LEAK_02.wav", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "SYSTEM_OVERRIDE_03.wav", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
];

type Point = { x: number; y: number };

const generateFood = (snake: Point[]): Point => {
  if (snake.length >= GRID_SIZE * GRID_SIZE) return { x: -1, y: -1 };
  let newFood: Point;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
    if (!snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
      break;
    }
  }
  return newFood;
};

export default function App() {
  // Game State
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 15, y: 5 });
  const [direction, setDirection] = useState<Point>({ x: 0, y: -1 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);

  // Refs for game loop
  const directionRef = useRef(direction);
  const currentDirectionRef = useRef(direction);
  const snakeRef = useRef(snake);
  const foodRef = useRef(food);
  const scoreRef = useRef(score);

  // Music State
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);

  // Sync refs
  useEffect(() => {
    directionRef.current = direction;
    snakeRef.current = snake;
    foodRef.current = food;
    scoreRef.current = score;
  }, [direction, snake, food, score]);

  // Audio volume sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Audio track change sync
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrack, isPlaying]);

  // Game Loop
  useEffect(() => {
    if (!isGameStarted || gameOver) return;

    const moveSnake = () => {
      const currentSnake = snakeRef.current;
      const head = currentSnake[0];
      const currentDir = directionRef.current;
      currentDirectionRef.current = currentDir;

      const newHead = { x: head.x + currentDir.x, y: head.y + currentDir.y };

      // Wall collision
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        handleGameOver();
        return;
      }

      // Self collision
      if (currentSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        handleGameOver();
        return;
      }

      const newSnake = [newHead, ...currentSnake];
      const currentFood = foodRef.current;

      // Eat food
      if (newHead.x === currentFood.x && newHead.y === currentFood.y) {
        const newScore = scoreRef.current + 10;
        setScore(newScore);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      setSnake(newSnake);
    };

    const intervalId = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(intervalId);
  }, [isGameStarted, gameOver]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (!isGameStarted || gameOver) {
        if (e.key === 'Enter' || e.key === ' ') {
          startGame();
        }
        return;
      }

      const { x, y } = currentDirectionRef.current;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (x !== -1) setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameStarted, gameOver]);

  const startGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection({ x: 0, y: -1 });
    setScore(0);
    setGameOver(false);
    setIsGameStarted(true);
    setFood(generateFood([{ x: 10, y: 10 }]));
    
    if (!isPlaying && audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleGameOver = () => {
    setGameOver(true);
    setIsGameStarted(false);
    setHighScore(prev => Math.max(prev, scoreRef.current));
  };

  const handleDirectionClick = (x: number, y: number) => {
    if (!isGameStarted || gameOver) return;
    const currentDir = currentDirectionRef.current;
    if (x !== 0 && currentDir.x === -x) return;
    if (y !== 0 && currentDir.y === -y) return;
    setDirection({ x, y });
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const playNext = () => setCurrentTrack((prev) => (prev + 1) % TRACKS.length);
  const playPrev = () => setCurrentTrack((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 font-sans selection:bg-[#f0f] selection:text-[#0ff] relative">
      <div className="scanlines"></div>
      <div className="static-noise"></div>

      {/* Mobile Header */}
      <div className="lg:hidden w-full max-w-md text-center mb-6 z-10 tear">
        <h1 className="text-5xl font-digital text-[#0ff] tracking-tighter drop-shadow-[4px_4px_0_#f0f]">
          SYS.SNAKE
        </h1>
        <p className="text-[#f0f] text-xl tracking-widest uppercase mt-2 bg-[#0ff] text-[#050505] inline-block px-2 font-bold">PROTOCOL_ACTIVE</p>
      </div>

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center z-10">
        
        {/* Left Column: Title & Stats & Music */}
        <div className="flex flex-col gap-8 lg:col-span-5 order-2 lg:order-1 w-full max-w-md mx-auto lg:max-w-none">
          {/* Desktop Header */}
          <div className="hidden lg:block space-y-4 tear">
            <h1 className="text-6xl xl:text-7xl font-digital text-[#0ff] tracking-tighter drop-shadow-[4px_4px_0_#f0f] leading-tight">
              SYS.<br/>SNAKE
            </h1>
            <p className="text-[#f0f] text-2xl tracking-widest uppercase bg-[#0ff] text-[#050505] inline-block px-2 font-bold">PROTOCOL_ACTIVE</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-6 font-mono">
            <div className="bg-[#050505] border-glitch p-4">
              <p className="text-xl text-[#f0f] uppercase tracking-wider mb-1">DATA_COLLECTED</p>
              <p className="text-4xl font-bold text-[#0ff]">{score}</p>
            </div>
            <div className="bg-[#050505] border-glitch-alt p-4">
              <p className="text-xl text-[#0ff] uppercase tracking-wider mb-1">MAX_CORRUPTION</p>
              <p className="text-4xl font-bold text-[#f0f]">{highScore}</p>
            </div>
          </div>

          {/* Music Player */}
          <div className="bg-[#050505] border-glitch p-5 relative group">
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-12 h-12 bg-[#f0f] flex items-center justify-center border-2 border-[#0ff]">
                <Music className="w-6 h-6 text-[#050505]" />
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-lg text-[#0ff] uppercase tracking-widest mb-1 font-mono bg-[#f0f] text-[#050505] inline-block px-1">AUDIO_STREAM</p>
                <p className="text-xl font-bold text-[#0ff] truncate">{TRACKS[currentTrack].title}</p>
              </div>
            </div>

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <button onClick={playPrev} className="p-2 bg-[#050505] border-2 border-[#0ff] text-[#0ff] hover:bg-[#0ff] hover:text-[#050505] border-glitch-active">
                  <SkipBack className="w-6 h-6" />
                </button>
                <button onClick={togglePlay} className="w-14 h-14 mx-2 flex items-center justify-center bg-[#f0f] border-2 border-[#0ff] text-[#050505] hover:bg-[#0ff] hover:text-[#f0f] border-glitch-active">
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </button>
                <button onClick={playNext} className="p-2 bg-[#050505] border-2 border-[#0ff] text-[#0ff] hover:bg-[#0ff] hover:text-[#050505] border-glitch-active">
                  <SkipForward className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <button onClick={() => setIsMuted(!isMuted)} className="p-2 text-[#f0f] hover:text-[#0ff] bg-[#050505] border-2 border-[#f0f] border-glitch-active">
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>
                <input 
                  type="range" 
                  min="0" max="1" step="0.01" 
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    if (isMuted) setIsMuted(false);
                  }}
                  className="w-24 h-2 bg-[#050505] border-2 border-[#0ff] appearance-none cursor-pointer"
                />
              </div>
            </div>

            <audio 
              ref={audioRef} 
              src={TRACKS[currentTrack].url} 
              onEnded={playNext}
              preload="auto"
            />
          </div>
        </div>

        {/* Right Column: Game Board */}
        <div className="lg:col-span-7 flex flex-col items-center lg:items-end order-1 lg:order-2 w-full">
          <div className="relative bg-[#050505] border-glitch p-2 w-full max-w-[500px] mx-auto lg:mx-0">
            
            <div 
              className="bg-[#050505] border-2 border-[#f0f] overflow-hidden relative w-full aspect-square"
            >
              {/* Grid Lines */}
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: `linear-gradient(to right, #0ff 1px, transparent 1px), linear-gradient(to bottom, #0ff 1px, transparent 1px)`,
                backgroundSize: `${100 / GRID_SIZE}% ${100 / GRID_SIZE}%`
              }} />

              {/* Food */}
              <div 
                className="absolute flex items-center justify-center tear"
                style={{
                  width: `${100 / GRID_SIZE}%`, height: `${100 / GRID_SIZE}%`,
                  left: `${(food.x / GRID_SIZE) * 100}%`, top: `${(food.y / GRID_SIZE) * 100}%`,
                }}
              >
                <div className="w-[80%] h-[80%] bg-[#f0f] border border-[#0ff]"></div>
              </div>

              {/* Snake */}
              {snake.map((segment, i) => {
                const isHead = i === 0;
                return (
                  <div 
                    key={`${segment.x}-${segment.y}-${i}`}
                    className="absolute flex items-center justify-center"
                    style={{
                      width: `${100 / GRID_SIZE}%`, height: `${100 / GRID_SIZE}%`,
                      left: `${(segment.x / GRID_SIZE) * 100}%`, top: `${(segment.y / GRID_SIZE) * 100}%`,
                    }}
                  >
                    <div 
                      className={`w-[90%] h-[90%] ${isHead ? 'bg-[#0ff] border-2 border-[#f0f]' : 'bg-[#050505] border-2 border-[#0ff]'}`} 
                    />
                  </div>
                )
              })}

              {/* Overlays */}
              {(!isGameStarted || gameOver) && (
                <div className="absolute inset-0 bg-[#050505]/90 flex flex-col items-center justify-center z-20">
                  {gameOver ? (
                    <>
                      <div className="glitch-wrapper mb-8">
                        <h2 className="glitch" data-text="SYSTEM_FAILURE">SYSTEM_FAILURE</h2>
                      </div>
                      <p className="text-[#0ff] mb-8 font-mono text-2xl bg-[#f0f] text-[#050505] px-2">CORRUPTION: <span className="font-bold">{score}</span></p>
                      <button 
                        onClick={startGame}
                        className="flex items-center gap-3 px-8 py-4 bg-[#050505] border-glitch text-[#0ff] font-digital text-xl hover:bg-[#0ff] hover:text-[#050505] border-glitch-active"
                      >
                        <RefreshCw className="w-6 h-6" />
                        REBOOT_SEQUENCE
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-[#f0f] border-4 border-[#0ff] flex items-center justify-center mb-8 tear">
                        <Play className="w-10 h-10 text-[#050505] ml-2" fill="currentColor" />
                      </div>
                      <button 
                        onClick={startGame}
                        className="px-8 py-4 bg-[#050505] border-glitch-alt text-[#f0f] font-digital text-xl hover:bg-[#f0f] hover:text-[#050505] border-glitch-active"
                      >
                        INITIALIZE_PROTOCOL
                      </button>
                      <p className="text-[#0ff] text-lg mt-6 font-mono bg-[#050505] border border-[#0ff] px-2">INPUT_REQUIRED: WASD // ARROWS</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="lg:hidden grid grid-cols-3 gap-4 mt-8 w-64 mx-auto">
            <div />
            <button onClick={() => handleDirectionClick(0, -1)} className="bg-[#050505] p-6 border-glitch flex justify-center border-glitch-active"><ArrowUp className="w-8 h-8 text-[#0ff]"/></button>
            <div />
            <button onClick={() => handleDirectionClick(-1, 0)} className="bg-[#050505] p-6 border-glitch flex justify-center border-glitch-active"><ArrowLeft className="w-8 h-8 text-[#0ff]"/></button>
            <button onClick={() => handleDirectionClick(0, 1)} className="bg-[#050505] p-6 border-glitch flex justify-center border-glitch-active"><ArrowDown className="w-8 h-8 text-[#0ff]"/></button>
            <button onClick={() => handleDirectionClick(1, 0)} className="bg-[#050505] p-6 border-glitch flex justify-center border-glitch-active"><ArrowRight className="w-8 h-8 text-[#0ff]"/></button>
          </div>
        </div>

      </div>
    </div>
  );
}
