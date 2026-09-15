import { useEffect, useRef, useState } from "react";

const GRID_SIZE = 20;
const CELL_SIZE = 20;

function Snake() {
  const canvasRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let snake = [{ x: 10, y: 10 }];
    let direction = { x: 0, y: 0 };
    let food = { x: 5, y: 5 };
    let gameActive = true;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowUp" && direction.y === 0) direction = { x: 0, y: -1 };
      else if (e.key === "ArrowDown" && direction.y === 0) direction = { x: 0, y: 1 };
      else if (e.key === "ArrowLeft" && direction.x === 0) direction = { x: -1, y: 0 };
      else if (e.key === "ArrowRight" && direction.x === 0) direction = { x: 1, y: 0 };
    };

    window.addEventListener("keydown", handleKeyDown);

    const interval = setInterval(() => {
      if (!gameActive) return;
      if (direction.x === 0 && direction.y === 0) return;

      const newHead = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y,
      };

      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        gameActive = false;
        setGameOver(true);
        return;
      }

      if (snake.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
        gameActive = false;
        setGameOver(true);
        return;
      }

      snake = [newHead, ...snake];

      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((prev) => prev + 1);
        food = {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE),
        };
      } else {
        snake.pop();
      }

      ctx.fillStyle = "#12201F";
      ctx.fillRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);

      ctx.fillStyle = "#F2A93B";
      snake.forEach((seg) => {
        ctx.fillRect(seg.x * CELL_SIZE, seg.y * CELL_SIZE, CELL_SIZE - 2, CELL_SIZE - 2);
      });

      ctx.fillStyle = "#EF6461";
      ctx.fillRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE - 2, CELL_SIZE - 2);
    }, 150);

    return () => {
      clearInterval(interval);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      <h3 className="font-display text-lg font-bold mb-1" style={{ color: "#F5F1E8" }}>
        Snake
      </h3>
      <p className="text-sm mb-1" style={{ color: "#9CAEAA" }}>
        Score: <span className="font-bold" style={{ color: "#F2A93B" }}>{score}</span>
      </p>
      {gameOver && (
        <p className="text-sm font-semibold mb-2" style={{ color: "#EF6461" }}>
          Game Over! Refresh to play again.
        </p>
      )}
      <canvas
        ref={canvasRef}
        width={GRID_SIZE * CELL_SIZE}
        height={GRID_SIZE * CELL_SIZE}
        className="rounded-xl border-2 mt-2"
        style={{ borderColor: "#3A4E4B" }}
      />
      <p className="text-xs mt-3" style={{ color: "#9CAEAA" }}>
        Use arrow keys to move
      </p>
    </div>
  );
}

export default Snake;