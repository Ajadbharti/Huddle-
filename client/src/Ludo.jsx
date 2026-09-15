import { useEffect, useState } from "react";
import socket from "./socket";

const COLORS = ["red", "green", "yellow", "blue"];
const COLOR_HEX = {
  red: "#EF6461",
  green: "#6FA98F",
  yellow: "#F2A93B",
  blue: "#6FA9D8",
};

function Ludo({ roomCode }) {
  const [myColor, setMyColor] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [full, setFull] = useState(false);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    const handleYourColor = (color) => setMyColor(color);
    const handleState = (state) => setGameState(state);
    const handleFull = () => setFull(true);
    const handleWinner = (color) => setWinner(color);

    socket.on("ludo-your-color", handleYourColor);
    socket.on("ludo-state", handleState);
    socket.on("ludo-full", handleFull);
    socket.on("ludo-winner", handleWinner);

    socket.emit("ludo-join", { roomCode });

    return () => {
      socket.off("ludo-your-color", handleYourColor);
      socket.off("ludo-state", handleState);
      socket.off("ludo-full", handleFull);
      socket.off("ludo-winner", handleWinner);
    };
  }, [roomCode]);

  const handleRollDice = () => {
    socket.emit("ludo-roll-dice", { roomCode });
  };

  const handleMoveToken = (tokenIndex) => {
    socket.emit("ludo-move-token", { roomCode, tokenIndex });
  };

  if (full)
    return <p className="text-center" style={{ color: "#9CAEAA" }}>Ludo room is full (max 4 players)</p>;
  if (!gameState)
    return <p className="text-center" style={{ color: "#9CAEAA" }}>Joining Ludo...</p>;

  const currentTurnColor = COLORS[gameState.turnIndex];
  const isMyTurn = myColor === currentTurnColor;

  return (
    <div className="flex flex-col items-center">
      <h3 className="font-display text-lg font-bold mb-4" style={{ color: "#F5F1E8" }}>
        Ludo
      </h3>

      {winner && (
        <div
          className="mb-4 px-4 py-2 rounded-xl font-bold"
          style={{ backgroundColor: COLOR_HEX[winner], color: "#12201F" }}
        >
          {winner.toUpperCase()} WINS! 🎉
        </div>
      )}

      <div className="flex flex-wrap gap-2 justify-center mb-3">
        <div className="rounded-lg px-3 py-1.5 text-sm border-2" style={{ borderColor: "#3A4E4B" }}>
          <span style={{ color: "#9CAEAA" }}>You are: </span>
          <span className="font-bold" style={{ color: COLOR_HEX[myColor] }}>{myColor}</span>
        </div>
        <div className="rounded-lg px-3 py-1.5 text-sm border-2" style={{ borderColor: "#3A4E4B" }}>
          <span style={{ color: "#9CAEAA" }}>Turn: </span>
          <span className="font-bold" style={{ color: COLOR_HEX[currentTurnColor] }}>
            {currentTurnColor}
          </span>
        </div>
        <div className="rounded-lg px-3 py-1.5 text-sm border-2" style={{ borderColor: "#3A4E4B" }}>
          <span style={{ color: "#9CAEAA" }}>Dice: </span>
          <span className="font-bold" style={{ color: "#F2A93B" }}>
            {gameState.diceValue ?? "-"}
          </span>
        </div>
      </div>

      <p className="text-xs mb-4" style={{ color: "#9CAEAA" }}>
        Players joined: {gameState.joinedColors.map((j) => j.color).join(", ") || "none yet"}
      </p>

      {isMyTurn && gameState.diceValue === null && (
        <button
          onClick={handleRollDice}
          className="px-6 py-2.5 rounded-xl font-bold mb-6 transition hover:-translate-y-0.5"
          style={{ backgroundColor: "#F2A93B", color: "#12201F" }}
        >
          🎲 Roll Dice
        </button>
      )}

      <div className="w-full space-y-3">
        {COLORS.map((color) => (
          <div
            key={color}
            className="flex items-center gap-2 rounded-xl px-3 py-2 border-2"
            style={{ backgroundColor: "#12201F", borderColor: "#3A4E4B" }}
          >
            <span
              className="text-sm font-bold w-16 capitalize"
              style={{ color: COLOR_HEX[color] }}
            >
              {color}
            </span>
            <div className="flex gap-1.5 flex-1 flex-wrap">
              {gameState.players[color].tokens.map((pos, index) => {
                const disabled =
                  !isMyTurn || myColor !== color || gameState.diceValue === null;
                return (
                  <button
                    key={index}
                    disabled={disabled}
                    onClick={() => handleMoveToken(index)}
                    className="text-xs px-2 py-1.5 rounded-lg border-2 transition"
                    style={
                      disabled
                        ? { backgroundColor: "#1A2C2A", borderColor: "#243836", color: "#5A6E6B", cursor: "not-allowed" }
                        : { backgroundColor: "#1A2C2A", borderColor: "#3A4E4B", color: "#F5F1E8", cursor: "pointer" }
                    }
                  >
                    T{index + 1}: {pos === -1 ? "Yard" : pos === 58 ? "Home" : pos}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Ludo;