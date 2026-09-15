import { useEffect, useState } from "react";
import socket from "./socket";

function TicTacToe({ roomCode }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [mySymbol] = useState(() => (Math.random() > 0.5 ? "X" : "O"));

  useEffect(() => {
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
  }, []);

  const handleBoxClick = (index) => {
    if (board[index] !== null) return;
    socket.emit("game-move", { roomCode, boxIndex: index, symbol: mySymbol });
  };

  const handleReset = () => {
    socket.emit("game-reset", { roomCode });
  };

  return (
    <div className="flex flex-col items-center">
      <h3 className="font-display text-lg font-bold mb-1" style={{ color: "#F5F1E8" }}>
        Tic Tac Toe
      </h3>
      <p className="text-sm mb-4" style={{ color: "#9CAEAA" }}>
        You are: <span className="font-bold" style={{ color: "#F2A93B" }}>{mySymbol}</span>
      </p>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {board.map((value, index) => (
          <div
            key={index}
            onClick={() => handleBoxClick(index)}
            className="w-16 h-16 flex items-center justify-center text-2xl font-bold rounded-xl cursor-pointer border-2 transition"
            style={{ backgroundColor: "#12201F", borderColor: "#3A4E4B", color: "#F5F1E8" }}
          >
            {value}
          </div>
        ))}
      </div>

      <button
        onClick={handleReset}
        className="px-4 py-2 rounded-xl text-sm font-bold border-2"
        style={{ borderColor: "#3A4E4B", color: "#F5F1E8" }}
      >
        Reset Game
      </button>
    </div>
  );
}

export default TicTacToe;