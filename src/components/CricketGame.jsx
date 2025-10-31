import React, { useState, useEffect, useRef } from 'react';
import { Trophy, XCircle } from 'lucide-react';

const CricketGame = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('start');
  const [score, setScore] = useState(0);
  const [ballsLeft, setBallsLeft] = useState(6);
  const [sixesInRow, setSixesInRow] = useState(0);
  const [message, setMessage] = useState('');
  const [showSixPopup, setShowSixPopup] = useState(false);
  const [countdown, setCountdown] = useState(null);
  
  const gameRef = useRef({
    ball: null,
    batsman: null,
    fielders: [],
    initialFielderPositions: [],
    crowd: [],
    ballInAir: false,
    ballSpeedPattern: [8, 6, 7, 9, 4, 10],
    currentBallIndex: 0,
    hitBall: null,
    hitBallVelocity: null,
    catchAttempt: null,
    animationId: null,
    waitingForNextBall: false,
    countdownActive: false,
    ctx: null,
    canvas: null,
    currentSixes: 0,
    currentBalls: 6
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const game = gameRef.current;
    game.ctx = ctx;
    game.canvas = canvas;
    
    const initGame = () => {
      game.batsman = {
        x: canvas.width / 2,
        y: canvas.height - 100,
        width: 15,
        height: 40,
        batWidth: 40,
        batHeight: 8
      };
      
      game.initialFielderPositions = [
        { x: canvas.width / 2, y: 80 },
        { x: canvas.width / 2 - 150, y: 200 },
        { x: canvas.width / 2 + 150, y: 200 },
        { x: canvas.width / 2 - 100, y: 300 },
        { x: canvas.width / 2 + 100, y: 300 },
        { x: 100, y: 250 },
        { x: canvas.width - 100, y: 250 },
        { x: 150, y: 400 },
        { x: canvas.width - 150, y: 400 },
        { x: canvas.width / 2, y: 500 }
      ];
      
      game.fielders = game.initialFielderPositions.map(pos => ({
        x: pos.x,
        y: pos.y,
        width: 12,
        height: 12,
        vx: 0,
        vy: 0
      }));
      
      // Generate crowd around boundary
      game.crowd = [];
      const numCrowdMembers = 80;
      for (let i = 0; i < numCrowdMembers; i++) {
        const angle = (i / numCrowdMembers) * Math.PI * 2;
        const radius = 290 + Math.random() * 15;
        game.crowd.push({
          x: canvas.width / 2 + Math.cos(angle) * radius,
          y: canvas.height / 2 + Math.sin(angle) * radius,
          color: Math.random() > 0.5 ? '#ff6b6b' : '#4ecdc4',
          size: 4 + Math.random() * 2
        });
      }
      
      game.ball = null;
      game.hitBall = null;
      game.ballInAir = false;
      game.waitingForNextBall = false;
      game.countdownActive = false;
      game.currentSixes = 0;
      game.currentBalls = 6;
      game.currentBallIndex = 0;
    };
    
    const resetFielderPositions = () => {
      game.fielders.forEach((fielder, i) => {
        fielder.x = game.initialFielderPositions[i].x;
        fielder.y = game.initialFielderPositions[i].y;
        fielder.vx = 0;
        fielder.vy = 0;
      });
    };
    
    const startCountdown = () => {
      game.countdownActive = true;
      let currentCount = 2;
      setCountdown(currentCount);
      
      const countdownInterval = setInterval(() => {
        currentCount -= 1;
        if (currentCount <= 0) {
          clearInterval(countdownInterval);
          game.countdownActive = false;
          setCountdown(null);
          startBallDelivery();
        } else {
          setCountdown(currentCount);
        }
      }, 600);
    };
    
    const startBallDelivery = () => {
      if (game.waitingForNextBall || game.countdownActive) return;
      
      resetFielderPositions();
      
      const currentSpeed = game.ballSpeedPattern[game.currentBallIndex];
      
      game.ball = {
        x: canvas.width / 2,
        y: 80,
        radius: 6,
        vy: currentSpeed,
        trail: [],
        isTrap: Math.random() < 0.25
      };
      game.ballInAir = true;
      game.hitBall = null;
      game.catchAttempt = null;
    };
    
    const checkTiming = () => {
      if (!game.ball) return false;
      
      const batsmanTop = game.batsman.y - 20;
      const perfectZoneStart = batsmanTop - 20;
      const perfectZoneEnd = batsmanTop + 20;
      
      return game.ball.y >= perfectZoneStart && game.ball.y <= perfectZoneEnd;
    };
    
    const handleSix = () => {
      game.currentSixes += 1;
      game.currentBalls -= 1;
      game.currentBallIndex += 1;
      
      setShowSixPopup(true);
      setTimeout(() => setShowSixPopup(false), 1500);
      
      setScore(prev => prev + 6);
      setSixesInRow(game.currentSixes);
      setBallsLeft(game.currentBalls);
      
      if (game.currentSixes === 6) {
        setTimeout(() => {
          setGameState('win');
          setMessage('You saved Virat & Rohit! They will keep playing! 🏏');
        }, 1500);
      } else if (game.currentBalls > 0) {
        setTimeout(() => {
          game.waitingForNextBall = false;
          startCountdown();
        }, 1200);
      }
    };
    
    const hitBall = () => {
      if (!game.ball || !game.ballInAir || game.hitBall || game.waitingForNextBall || game.countdownActive) return;
      
      const isPerfectTiming = checkTiming();
      
      if (isPerfectTiming) {
        game.waitingForNextBall = true;
        
        if (game.ball.isTrap) {
          const targetFielder = game.fielders[Math.floor(Math.random() * game.fielders.length)];
          const angle = Math.atan2(targetFielder.y - game.ball.y, targetFielder.x - game.ball.x);
          
          game.hitBall = {
            x: game.ball.x,
            y: game.ball.y,
            vx: Math.cos(angle) * 10,
            vy: Math.sin(angle) * 10 - 3,
            radius: 6,
            trail: [],
            isTrap: true
          };
          
          targetFielder.vx = 0;
          targetFielder.vy = 0;
        } else {
          const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
          game.hitBall = {
            x: game.ball.x,
            y: game.ball.y,
            vx: Math.cos(angle) * 14,
            vy: Math.sin(angle) * 14,
            radius: 6,
            trail: [],
            isTrap: false
          };
        }
        
        game.fielders.forEach(fielder => {
          const dx = game.hitBall.x - fielder.x;
          const dy = game.hitBall.y - fielder.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (!game.hitBall.isTrap || dist > 50) {
            fielder.vx = (dx / dist) * 3.5;
            fielder.vy = (dy / dist) * 3.5;
          }
        });
        
        game.ball = null;
        game.ballInAir = false;
        
        setTimeout(() => {
          if (game.catchAttempt === null) {
            handleSix();
          }
        }, 1800);
      } else {
        endGame(false, 'Mistimed! You need perfect timing for sixes!');
      }
    };
    
    const endGame = (won, msg) => {
      game.ball = null;
      game.hitBall = null;
      game.ballInAir = false;
      game.waitingForNextBall = false;
      game.countdownActive = false;
      setCountdown(null);
      setGameState(won ? 'win' : 'lose');
      setMessage(msg);
    };
    
    const drawField = () => {
      ctx.fillStyle = '#2d5016';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw crowd
      game.crowd.forEach(person => {
        ctx.fillStyle = person.color;
        ctx.beginPath();
        ctx.arc(person.x, person.y, person.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 280, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.setLineDash([10, 5]);
      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 285, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = '#8b7355';
      ctx.fillRect(canvas.width / 2 - 30, 0, 60, canvas.height);
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 40, game.batsman.y - 10);
      ctx.lineTo(canvas.width / 2 + 40, game.batsman.y - 10);
      ctx.stroke();
      
      const batsmanTop = game.batsman.y - 20;
      ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
      ctx.fillRect(canvas.width / 2 - 60, batsmanTop - 20, 120, 40);
      
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(canvas.width / 2 - 60, batsmanTop - 20, 120, 40);
    };
    
    const drawBatsman = () => {
      const b = game.batsman;
      
      ctx.fillStyle = '#0066cc';
      ctx.fillRect(b.x - b.width / 2, b.y - b.height, b.width, b.height);
      
      ctx.fillStyle = '#ffdbac';
      ctx.beginPath();
      ctx.arc(b.x, b.y - b.height - 8, 8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(b.x - b.batWidth / 2, b.y - 25, b.batWidth, b.batHeight);
    };
    
    const drawFielders = () => {
      game.fielders.forEach(fielder => {
        ctx.fillStyle = '#cc0000';
        ctx.beginPath();
        ctx.arc(fielder.x, fielder.y, fielder.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffdbac';
        ctx.beginPath();
        ctx.arc(fielder.x, fielder.y - 10, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    };
    
    const drawBall = (ball) => {
      if (!ball) return;
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ball.trail.forEach((pos, i) => {
        if (i === 0) ctx.moveTo(pos.x, pos.y);
        else ctx.lineTo(pos.x, pos.y);
      });
      ctx.stroke();
      
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(ball.x - 2, ball.y - 2, 2, 0, Math.PI * 2);
      ctx.fill();
    };
    
    const drawCountdown = () => {
      if (countdown !== null) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 120px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(countdown.toString(), canvas.width / 2, canvas.height / 2);
        
        ctx.font = 'bold 24px Arial';
        ctx.fillText('Get Ready...', canvas.width / 2, canvas.height / 2 + 80);
        
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
    };
    
    const update = () => {
      if (game.ball && game.ballInAir) {
        game.ball.y += game.ball.vy;
        game.ball.trail.push({ x: game.ball.x, y: game.ball.y });
        if (game.ball.trail.length > 15) game.ball.trail.shift();
        
        if (game.ball.y > game.batsman.y + 20) {
          endGame(false, 'Missed the ball! Game Over!');
        }
      }
      
      if (game.hitBall) {
        game.hitBall.x += game.hitBall.vx;
        game.hitBall.y += game.hitBall.vy;
        game.hitBall.vy += 0.15;
        
        game.hitBall.trail.push({ x: game.hitBall.x, y: game.hitBall.y });
        if (game.hitBall.trail.length > 30) game.hitBall.trail.shift();
        
        if (game.hitBall.y < -50 || game.hitBall.x < -50 || game.hitBall.x > canvas.width + 50) {
          game.hitBall = null;
        }
        
        if (game.catchAttempt === null && game.hitBall) {
          game.fielders.forEach(fielder => {
            const dx = game.hitBall.x - fielder.x;
            const dy = game.hitBall.y - fielder.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            const catchRadius = game.hitBall.isTrap ? 35 : 20;
            
            if (dist < catchRadius && game.hitBall.vy > 0) {
              game.catchAttempt = 'caught';
              game.hitBall = null;
              endGame(false, 'Caught out! The bowler deceived you!');
            }
          });
        }
      }
      
      game.fielders.forEach(fielder => {
        fielder.x += fielder.vx;
        fielder.y += fielder.vy;
        
        fielder.vx *= 0.95;
        fielder.vy *= 0.95;
        
        fielder.x = Math.max(20, Math.min(canvas.width - 20, fielder.x));
        fielder.y = Math.max(60, Math.min(canvas.height - 120, fielder.y));
      });
    };
    
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawField();
      drawFielders();
      drawBatsman();
      drawBall(game.ball);
      drawBall(game.hitBall);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`Sixes: ${game.currentSixes}/6`, 20, 30);
      ctx.fillText(`Balls Left: ${game.currentBalls}`, 20, 60);
      
      // Show timer during countdown
      if (countdown !== null) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`Next ball in: ${countdown}`, 20, 90);
      }
      
      drawCountdown();
      
      update();
      game.animationId = requestAnimationFrame(render);
    };
    
    const handleClick = () => {
      hitBall();
    };
    
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        hitBall();
      }
    };
    
    if (gameState === 'playing') {
      if (!game.animationId) {
        initGame();
        startCountdown();
        render();
      }
      canvas.addEventListener('click', handleClick);
      window.addEventListener('keydown', handleKeyDown);
    } else {
      if (game.animationId) {
        cancelAnimationFrame(game.animationId);
        game.animationId = null;
      }
    }
    
    return () => {
      if (game.animationId) {
        cancelAnimationFrame(game.animationId);
        game.animationId = null;
      }
      canvas.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState]);
  
  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setBallsLeft(6);
    setSixesInRow(0);
    setMessage('');
    setShowSixPopup(false);
    setCountdown(null);
  };
  
  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4 pt-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 max-w-4xl w-full relative z-10 border-4 border-yellow-400">
        <div className="text-center mb-4 relative">
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full">
            <div className="text-6xl animate-bounce">🏏</div>
          </div>
          <h1 className="text-4xl font-black text-center mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Save Virat & Rohit!
          </h1>
          <p className="text-center text-gray-700 mb-3 text-base font-semibold">
            Hit 6 sixes in a row to keep them playing! Perfect timing is key! ⚡
          </p>
        </div>
        
        {showSixPopup && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 text-white text-8xl font-black px-16 py-10 rounded-full shadow-2xl animate-bounce border-8 border-yellow-600 transform scale-110">
              <span className="drop-shadow-lg">SIX! 🎉</span>
            </div>
          </div>
        )}
        
        {gameState === 'start' && (
          <div className="text-center py-6">
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-4 border-yellow-400 rounded-2xl p-6 mb-6 shadow-lg transform hover:scale-105 transition-transform">
              <div className="flex items-center justify-center mb-3">
                <div className="text-3xl mr-2">🔥</div>
                <h2 className="text-2xl font-black text-yellow-900">The Challenge</h2>
                <div className="text-3xl ml-2">🔥</div>
              </div>
              <p className="text-gray-800 text-base mb-3 font-medium">
                Rumors say Virat and Rohit might retire... but <span className="font-black text-purple-700">YOU</span> can change that!
              </p>
              <p className="text-gray-800 text-base mb-3 font-medium">
                Hit <span className="font-black text-green-700">6 consecutive sixes</span> to show your support and keep them playing!
              </p>
              <div className="bg-red-100 border-2 border-red-400 rounded-xl p-3 mt-4">
                <p className="text-red-700 font-black text-lg">
                  ⚠️ Fail, and the message will be clear: "You want them retired?" ⚠️
                </p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-4 border-blue-400 rounded-2xl p-5 mb-6 shadow-lg transform hover:scale-105 transition-transform">
              <div className="flex items-center justify-center mb-3">
                <div className="text-2xl mr-2">📖</div>
                <h3 className="font-black text-blue-900 text-xl">How to Play</h3>
                <div className="text-2xl ml-2">📖</div>
              </div>
              <ul className="text-left text-gray-800 space-y-2 text-sm font-medium">
                <li className="flex items-start">
                  <span className="text-green-600 font-black mr-2">✓</span>
                  <span>Click or press <span className="font-black text-purple-700">SPACE</span> when the ball enters the <span className="font-black text-yellow-600">yellow zone</span></span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 font-black mr-2">✓</span>
                  <span>Perfect timing = <span className="font-black text-green-700">Six runs!</span></span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 font-black mr-2">✗</span>
                  <span>Mistiming = <span className="font-black text-red-700">Game Over</span></span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 font-black mr-2">⚡</span>
                  <span>Each ball has different speed - <span className="font-black">stay alert!</span></span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 font-black mr-2">🤾</span>
                  <span>Fielders will try to catch your shots</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 font-black mr-2">🎯</span>
                  <span>You have <span className="font-black">6 balls</span> to hit <span className="font-black">6 sixes</span></span>
                </li>
              </ul>
            </div>
            
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black py-4 px-12 rounded-2xl text-2xl transition-all transform hover:scale-110 hover:shadow-2xl shadow-lg border-4 border-green-700"
            >
              🚀 Start Game 🚀
            </button>
          </div>
        )}
        
        {gameState === 'playing' && (
          <div className="flex flex-col items-center">
            <canvas
              ref={canvasRef}
              width={600}
              height={700}
              className="border-4 border-purple-400 rounded-2xl shadow-2xl"
            />
            <p className="mt-4 text-white font-black text-base bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-full shadow-lg">
              Click or press SPACE when the ball is in the yellow zone! ⚡
            </p>
          </div>
        )}
        
        {gameState === 'win' && (
          <div className="text-center py-8">
            <div className="animate-bounce mb-4">
              <Trophy className="w-32 h-32 mx-auto text-yellow-500 drop-shadow-2xl" />
            </div>
            <h2 className="text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
              LEGENDARY! 🎉
            </h2>
            <p className="text-2xl mb-5 font-bold text-gray-700">{message}</p>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-4 border-green-400 rounded-2xl p-6 mb-6 shadow-lg">
              <p className="text-xl text-gray-800 font-bold mb-3">
                🔥 You hit <span className="text-green-700">{sixesInRow}</span> consecutive sixes! 🔥
              </p>
              <p className="text-lg text-gray-700 font-semibold">
                Thanks to you, Virat and Rohit will continue their cricket journey! 🏆
              </p>
            </div>
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black py-4 px-12 rounded-2xl text-2xl transition-all transform hover:scale-110 hover:shadow-2xl shadow-lg border-4 border-blue-700"
            >
              🎮 Play Again 🎮
            </button>
          </div>
        )}
        
        {gameState === 'lose' && (
          <div className="text-center py-8">
            <div className="animate-pulse mb-4">
              <XCircle className="w-32 h-32 mx-auto text-red-500 drop-shadow-2xl" />
            </div>
            <h2 className="text-4xl font-black bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4">
              You want them retired? 😢
            </h2>
            <p className="text-xl mb-5 font-bold text-gray-700">{message}</p>
            <div className="bg-gradient-to-br from-red-50 to-pink-50 border-4 border-red-400 rounded-2xl p-6 mb-6 shadow-lg">
              <p className="text-xl text-gray-800 font-bold mb-3">
                You hit <span className="text-orange-600">{sixesInRow}</span> sixes in a row
              </p>
              <p className="text-lg text-gray-700 font-semibold">
                Needed <span className="text-red-700 font-black">6 consecutive sixes</span> to save them!
              </p>
            </div>
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black py-4 px-12 rounded-2xl text-2xl transition-all transform hover:scale-110 hover:shadow-2xl shadow-lg border-4 border-blue-700"
            >
              🔄 Try Again 🔄
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CricketGame;
