import { useEffect, useState } from "react";
import socket from "./socket";

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checkResult(board) {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  if (board.every((cell) => cell !== null)) {
    return { winner: "draw", line: [] };
  }
  return { winner: null, line: [] };
}

// ---- Minimax: computer (O) hamesha best possible move khelta hai ----
function minimax(board, isMaximizing) {
  const { winner } = checkResult(board);
  if (winner === "O") return { score: 1 };
  if (winner === "X") return { score: -1 };
  if (winner === "draw") return { score: 0 };

  const emptyIndices = board
    .map((val, idx) => (val === null ? idx : null))
    .filter((idx) => idx !== null);

  let bestMove = null;
  let bestScore = isMaximizing ? -Infinity : Infinity;

  for (const index of emptyIndices) {
    const newBoard = [...board];
    newBoard[index] = isMaximizing ? "O" : "X";
    const result = minimax(newBoard, !isMaximizing);

    if (isMaximizing) {
      if (result.score > bestScore) {
        bestScore = result.score;
        bestMove = index;
      }
    } else {
      if (result.score < bestScore) {
        bestScore = result.score;
        bestMove = index;
      }
    }
  }

  return { score: bestScore, move: bestMove };
}

function getComputerMove(board) {
  const { move } = minimax(board, true);
  return move;
}

function TicTacToe({ roomCode }) {
  const isOnline = Boolean(roomCode);

  const [board, setBoard] = useState(Array(9).fill(null));
  const [mySymbol] = useState(() => (Math.random() > 0.5 ? "X" : "O"));

  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    if (!isOnline) return;

    const handleGameUpdate = ({ boxIndex, symbol }) => {
      setBoard((prev) => {
        const newBoard = [...prev];
        newBoard[boxIndex] = symbol;
        return newBoard;
      });
    };

    const handleReset = () => {
      setBoard(Array(9).fill(null));
    };

    socket.on("game-update", handleGameUpdate);
    socket.on("game-reset-update", handleReset);

    return () => {
      socket.off("game-update", handleGameUpdate);
      socket.off("game-reset-update", handleReset);
    };
  }, [isOnline]);

  const { winner, line: winLine } = checkResult(board);

  useEffect(() => {
    if (isOnline || winner) return;

    const xCount = board.filter((c) => c === "X").length;
    const oCount = board.filter((c) => c === "O").length;
    const isComputerTurn = xCount > oCount;

    if (isComputerTurn) {
      setThinking(true);
      const timer = setTimeout(() => {
        const move = getComputerMove(board);
        if (move !== null && move !== undefined) {
          setBoard((prev) => {
            const newBoard = [...prev];
            newBoard[move] = "O";
            return newBoard;
          });
        }
        setThinking(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [board, isOnline, winner]);

  const handleBoxClick = (index) => {
    if (board[index] !== null || winner || thinking) return;

    if (isOnline) {
      socket.emit("game-move", { roomCode, boxIndex: index, symbol: mySymbol });
    } else {
      setBoard((prev) => {
        const newBoard = [...prev];
        newBoard[index] = "X";
        return newBoard;
      });
    }
  };

  const handleReset = () => {
    if (isOnline) {
      socket.emit("game-reset", { roomCode });
    } else {
      setBoard(Array(9).fill(null));
    }
  };

  return (
    <div className="flex flex-col items-center">
      <h3 className="font-display text-lg font-bold mb-1" style={{ color: "#F5F1E8" }}>
        Tic Tac Toe
      </h3>

      {isOnline ? (
        <p className="text-sm mb-4" style={{ color: "#9CAEAA" }}>
          You are: <span className="font-bold" style={{ color: "#F2A93B" }}>{mySymbol}</span>
        </p>
      ) : (
        <p className="text-sm mb-4" style={{ color: "#9CAEAA" }}>
          You: <span className="font-bold" style={{ color: "#F2A93B" }}>X</span> vs{" "}
          <span className="font-bold" style={{ color: "#EF6461" }}>Computer: O</span>
          {thinking && <span className="text-xs"> (thinking...)</span>}
        </p>
      )}

      {winner && (
        <div
          className="mb-4 px-4 py-2 rounded-xl font-bold"
          style={{
            backgroundColor: winner === "draw" ? "#3A4E4B" : "#F2A93B",
            color: winner === "draw" ? "#F5F1E8" : "#12201F",
          }}
        >
          {winner === "draw"
            ? "It's a Draw! 🤝"
            : !isOnline && winner === "O"
            ? "Computer Wins! 🤖"
            : `${winner} Wins! 🎉`}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-4">
        {board.map((value, index) => {
          const isWinningCell = winLine.includes(index);
          return (
            <div
              key={index}
              onClick={() => handleBoxClick(index)}
              className="w-16 h-16 flex items-center justify-center text-2xl font-bold rounded-xl cursor-pointer border-2 transition"
              style={{
                backgroundColor: isWinningCell ? "#F2A93B" : "#12201F",
                borderColor: isWinningCell ? "#F2A93B" : "#3A4E4B",
                color: isWinningCell ? "#12201F" : "#F5F1E8",
              }}
            >
              {value}
            </div>
          );
        })}
      </div>

      <button
        onClick={handleReset}
        className="px-4 py-2 rounded-xl text-sm font-bold border-2"
        style={{ borderColor: "#3A4E4B", color: "#F5F1E8" }}
      >
        {winner ? "Play Again" : "Reset Game"}
      </button>
    </div>
  );
}

export default TicTacToe;