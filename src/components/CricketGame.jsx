import React, { useState, useEffect, useRef } from 'react';
import { Trophy, XCircle } from 'lucide-react';

const CricketGame = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('start');
  const [score, setScore] = useState(0);
  const [ballsLeft, setBallsLeft] = useState(6);
  const [sixesInRow, setSixesInRow] = useState(0);
  const [message, setMessage] = useState('');
  
  const gameRef = useRef({
    ball: null,
    batsman: null,
    fielders: [],
    ballInAir: false,
    ballSpeed: 7,
    hitBall: null,
    hitBallVelocity: null,
    catchAttempt: null,
    animationId: null,
    waitingForNextBall: false
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const game = gameRef.current;
    
    const initGame = () => {
      game.batsman = {
        x: canvas.width / 2,
        y: canvas.height - 100,
        width: 15,
        height: 40,
        batWidth: 40,
        batHeight: 8
      };
      
      game.fielders = [
        { x: canvas.width / 2, y: 80, width: 12, height: 12, vx: 0, vy: 0 },
        { x: canvas.width / 2 - 150, y: 200, width: 12, height: 12, vx: 0, vy: 0 },
        { x: canvas.width / 2 + 150, y: 200, width: 12, height: 12, vx: 0, vy: 0 },
        { x: canvas.width / 2 - 100, y: 300, width: 12, height: 12, vx: 0, vy: 0 },
        { x: canvas.width / 2 + 100, y: 300, width: 12, height: 12, vx: 0, vy: 0 },
        { x: 100, y: 250, width: 12, height: 12, vx: 0, vy: 0 },
        { x: canvas.width - 100, y: 250, width: 12, height: 12, vx: 0, vy: 0 },
        { x: 150, y: 400, width: 12, height: 12, vx: 0, vy: 0 },
        { x: canvas.width - 150, y: 400, width: 12, height: 12, vx: 0, vy: 0 },
        { x: canvas.width / 2, y: 500, width: 12, height: 12, vx: 0, vy: 0 }
      ];
      
      game.ball = null;
      game.hitBall = null;
      game.ballInAir = false;
      game.waitingForNextBall = false;
    };
    
    const startBallDelivery = () => {
      if (gameState !== 'playing' || game.waitingForNextBall) return;
      
      game.ball = {
        x: canvas.width / 2,
        y: 80,
        radius: 6,
        vy: game.ballSpeed,
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
      const perfectZoneStart = batsmanTop - 15;
      const perfectZoneEnd = batsmanTop + 15;
      
      return game.ball.y >= perfectZoneStart && game.ball.y <= perfectZoneEnd;
    };
    
    const hitBall = () => {
      if (!game.ball || !game.ballInAir || game.hitBall || game.waitingForNextBall) return;
      
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
          if (game.catchAttempt === null && gameState === 'playing') {
            setScore(prev => prev + 6);
            setSixesInRow(prev => prev + 1);
            setBallsLeft(prev => {
              const newBalls = prev - 1;
              if (newBalls > 0) {
                setTimeout(() => {
                  game.waitingForNextBall = false;
                  startBallDelivery();
                }, 500);
              }
              return newBalls;
            });
          }
          game.waitingForNextBall = false;
        }, 2500);
      } else {
        endGame(false, 'Mistimed! You need perfect timing for sixes!');
      }
    };
    
    const endGame = (won, msg) => {
      setGameState(won ? 'win' : 'lose');
      setMessage(msg);
      game.ball = null;
      game.hitBall = null;
      game.ballInAir = false;
      game.waitingForNextBall = false;
    };
    
    const drawField = () => {
      ctx.fillStyle = '#2d5016';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
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
      ctx.fillRect(canvas.width / 2 - 50, batsmanTop - 15, 100, 30);
      
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(canvas.width / 2 - 50, batsmanTop - 15, 100, 30);
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
      ctx.fillText(`Sixes: ${sixesInRow}/6`, 20, 30);
      ctx.fillText(`Balls Left: ${ballsLeft}`, 20, 60);
      
      if (gameState === 'playing') {
        update();
        game.animationId = requestAnimationFrame(render);
      }
    };
    
    const handleClick = () => {
      if (gameState === 'playing') {
        hitBall();
      }
    };
    
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && gameState === 'playing') {
        e.preventDefault();
        hitBall();
      }
    };
    
    canvas.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    
    if (gameState === 'playing') {
      initGame();
      startBallDelivery();
      render();
    }
    
    return () => {
      canvas.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
      if (game.animationId) {
        cancelAnimationFrame(game.animationId);
      }
    };
  }, [gameState, sixesInRow, ballsLeft]);
  
  useEffect(() => {
    if (sixesInRow === 6 && gameState === 'playing') {
      setGameState('win');
      setMessage('You saved Virat & Rohit! They will keep playing! 🏏');
    }
  }, [sixesInRow, gameState]);
  
  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setBallsLeft(6);
    setSixesInRow(0);
    setMessage('');
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-4xl w-full">
        <h1 className="text-3xl font-bold text-center mb-2 text-blue-900">
          Save Virat & Rohit! 🏏
        </h1>
        <p className="text-center text-gray-600 mb-4">
          Hit 6 sixes in a row to keep them playing! Perfect timing is key! ⚡
        </p>
        
        {gameState === 'start' && (
          <div className="text-center py-8">
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-3 text-yellow-900">The Challenge</h2>
              <p className="text-gray-700 mb-3">
                Rumors say Virat and Rohit might retire... but YOU can change that!
              </p>
              <p className="text-gray-700 mb-3">
                Hit 6 consecutive sixes to show your support and keep them playing!
              </p>
              <p className="text-red-600 font-semibold">
                Fail, and the message will be clear: "You want them retired?"
              </p>
            </div>
            
            <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-4 mb-6">
              <h3 className="font-bold mb-2 text-blue-900">How to Play:</h3>
              <ul className="text-left text-gray-700 space-y-1">
                <li>• Click or press SPACE when the ball enters the yellow zone</li>
                <li>• Perfect timing = Six runs!</li>
                <li>• Mistiming = Game Over</li>
                <li>• Fielders will try to catch your shots</li>
                <li>• You have 6 balls to hit 6 sixes</li>
              </ul>
            </div>
            
            <button
              onClick={startGame}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-colors"
            >
              Start Game
            </button>
          </div>
        )}
        
        {gameState === 'playing' && (
          <div className="flex flex-col items-center">
            <canvas
              ref={canvasRef}
              width={600}
              height={700}
              className="border-4 border-gray-300 rounded-lg shadow-lg"
            />
            <p className="mt-4 text-gray-700 font-semibold">
              Click or press SPACE when the ball is in the yellow zone! ⚡
            </p>
          </div>
        )}
        
        {gameState === 'win' && (
          <div className="text-center py-8">
            <Trophy className="w-24 h-24 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-3xl font-bold text-green-600 mb-4">LEGENDARY! 🎉</h2>
            <p className="text-xl mb-6">{message}</p>
            <div className="bg-green-50 border-2 border-green-400 rounded-lg p-6 mb-6">
              <p className="text-lg text-gray-700">
                You hit {sixesInRow} consecutive sixes!
              </p>
              <p className="text-lg text-gray-700 mt-2">
                Thanks to you, Virat and Rohit will continue their cricket journey! 🏆
              </p>
            </div>
            <button
              onClick={startGame}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-colors"
            >
              Play Again
            </button>
          </div>
        )}
        
        {gameState === 'lose' && (
          <div className="text-center py-8">
            <XCircle className="w-24 h-24 mx-auto text-red-500 mb-4" />
            <h2 className="text-3xl font-bold text-red-600 mb-4">You want them retired? 😢</h2>
            <p className="text-lg mb-4">{message}</p>
            <div className="bg-red-50 border-2 border-red-400 rounded-lg p-6 mb-6">
              <p className="text-lg text-gray-700">
                You hit {sixesInRow} sixes in a row
              </p>
              <p className="text-lg text-gray-700 mt-2">
                Needed 6 consecutive sixes to save them!
              </p>
            </div>
            <button
              onClick={startGame}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CricketGame;