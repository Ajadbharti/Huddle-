import { useEffect, useState, useRef } from "react";
import socket from "./socket";

const COLORS = ["red", "green", "yellow", "blue"];
const COLOR_HEX = {
  red: "#EF6461",
  green: "#6FA98F",
  yellow: "#F2A93B",
  blue: "#6FA9D8",
};
const START_POSITIONS = { red: 0, green: 13, yellow: 26, blue: 39 };
const SAFE_POSITIONS = [0, 13, 26, 39];
const HUMAN_COLOR = "red";

function createLocalState() {
  const players = {};
  COLORS.forEach((color) => {
    players[color] = { tokens: [-1, -1, -1, -1] };
  });
  return { players, turnIndex: 0, diceValue: null };
}

function simulateMove(players, color, tokenIndex, diceValue) {
  const newPlayers = JSON.parse(JSON.stringify(players));
  const tokens = newPlayers[color].tokens;
  const currentPos = tokens[tokenIndex];

  if (currentPos === -1) {
    if (diceValue !== 6) return null;
    tokens[tokenIndex] = START_POSITIONS[color];
  } else if (currentPos !== 58) {
    tokens[tokenIndex] = Math.min(currentPos + diceValue, 58);
    const newPos = tokens[tokenIndex];
    let captured = false;

    if (newPos < 52 && !SAFE_POSITIONS.includes(newPos)) {
      COLORS.forEach((otherColor) => {
        if (otherColor === color) return;
        const otherTokens = newPlayers[otherColor].tokens;
        otherTokens.forEach((otherPos, otherIdx) => {
          if (otherPos === newPos) {
            otherTokens[otherIdx] = -1;
            captured = true;
          }
        });
      });
    }
    return { players: newPlayers, captured };
  } else {
    return null;
  }

  return { players: newPlayers, captured: false };
}

function pickComputerMove(players, color, diceValue) {
  const tokens = players[color].tokens;
  const validIndices = [];

  tokens.forEach((pos, idx) => {
    if (pos === -1 && diceValue === 6) validIndices.push(idx);
    else if (pos !== -1 && pos !== 58) validIndices.push(idx);
  });

  if (validIndices.length === 0) return null;

  for (const idx of validIndices) {
    const result = simulateMove(players, color, idx, diceValue);
    if (result && result.captured) return idx;
  }

  let best = validIndices[0];
  let bestPos = tokens[best];
  for (const idx of validIndices) {
    if (tokens[idx] > bestPos) {
      best = idx;
      bestPos = tokens[idx];
    }
  }
  return best;
}

function Ludo({ roomCode }) {
  const isOnline = Boolean(roomCode);

  const [myColor, setMyColor] = useState(null);
  const [onlineState, setOnlineState] = useState(null);
  const [full, setFull] = useState(false);
  const [winner, setWinner] = useState(null);

  const [localState, setLocalState] = useState(createLocalState());
  const [localWinner, setLocalWinner] = useState(null);
  const [computerThinking, setComputerThinking] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!isOnline) return;

    const handleYourColor = (color) => setMyColor(color);
    const handleState = (state) => setOnlineState(state);
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
  }, [roomCode, isOnline]);

  const gameState = isOnline ? onlineState : localState;

  const applyLocalMove = (color, tokenIndex, diceValue) => {
    setLocalState((prev) => {
      const result = simulateMove(prev.players, color, tokenIndex, diceValue);
      if (!result) return prev;

      const tokens = result.players[color].tokens;
      const allHome = tokens.every((pos) => pos === 58);
      if (allHome) setLocalWinner(color);

      let newTurnIndex = prev.turnIndex;
      if (diceValue !== 6) {
        newTurnIndex = (prev.turnIndex + 1) % COLORS.length;
      }

      return { players: result.players, turnIndex: newTurnIndex, diceValue: null };
    });
  };

  const handleLocalRollDice = () => {
    setLocalState((prev) => {
      const currentColor = COLORS[prev.turnIndex];
      const diceValue = Math.floor(Math.random() * 6) + 1;
      const tokens = prev.players[currentColor].tokens;
      const hasTokenOutside = tokens.some((pos) => pos !== -1 && pos !== 58);
      const canOpenNew = diceValue === 6 && tokens.includes(-1);

      let newTurnIndex = prev.turnIndex;
      let newDice = diceValue;

      if (!hasTokenOutside && !canOpenNew) {
        newTurnIndex = (prev.turnIndex + 1) % COLORS.length;
        newDice = null;
      }

      return { ...prev, diceValue: newDice, turnIndex: newTurnIndex };
    });
  };

  useEffect(() => {
    if (isOnline || localWinner) return;
    const currentColor = COLORS[localState.turnIndex];
    if (currentColor === HUMAN_COLOR) return;
    if (busyRef.current) return;

    busyRef.current = true;
    setComputerThinking(true);

    const runComputerTurn = async () => {
      await new Promise((r) => setTimeout(r, 600));

      let diceValue, tokens, hasTokenOutside, canOpenNew;
      setLocalState((prev) => {
        diceValue = Math.floor(Math.random() * 6) + 1;
        tokens = prev.players[currentColor].tokens;
        hasTokenOutside = tokens.some((pos) => pos !== -1 && pos !== 58);
        canOpenNew = diceValue === 6 && tokens.includes(-1);

        if (!hasTokenOutside && !canOpenNew) {
          return {
            ...prev,
            diceValue: null,
            turnIndex: (prev.turnIndex + 1) % COLORS.length,
          };
        }
        return { ...prev, diceValue };
      });

      await new Promise((r) => setTimeout(r, 600));

      if (hasTokenOutside || canOpenNew) {
        setLocalState((prev) => {
          const moveIdx = pickComputerMove(prev.players, currentColor, diceValue);
          if (moveIdx === null) {
            return {
              ...prev,
              diceValue: null,
              turnIndex: (prev.turnIndex + 1) % COLORS.length,
            };
          }
          const result = simulateMove(prev.players, currentColor, moveIdx, diceValue);
          if (!result) {
            return {
              ...prev,
              diceValue: null,
              turnIndex: (prev.turnIndex + 1) % COLORS.length,
            };
          }
          const homeTokens = result.players[currentColor].tokens;
          if (homeTokens.every((pos) => pos === 58)) {
            setLocalWinner(currentColor);
          }
          const newTurnIndex =
            diceValue === 6 ? prev.turnIndex : (prev.turnIndex + 1) % COLORS.length;
          return { players: result.players, turnIndex: newTurnIndex, diceValue: null };
        });
      }

      setComputerThinking(false);
      busyRef.current = false;
    };

    runComputerTurn();
  }, [localState.turnIndex, localState.diceValue, isOnline, localWinner]);

  const handleRollDice = () => {
    if (isOnline) socket.emit("ludo-roll-dice", { roomCode });
    else handleLocalRollDice();
  };

  const handleMoveToken = (tokenIndex) => {
    if (isOnline) {
      socket.emit("ludo-move-token", { roomCode, tokenIndex });
    } else {
      if (gameState.diceValue === null) return;
      applyLocalMove(HUMAN_COLOR, tokenIndex, gameState.diceValue);
    }
  };

  if (isOnline && full)
    return <p className="text-center" style={{ color: "#9CAEAA" }}>Ludo room is full (max 4 players)</p>;
  if (isOnline && !gameState)
    return <p className="text-center" style={{ color: "#9CAEAA" }}>Joining Ludo...</p>;

  const currentTurnColor = COLORS[gameState.turnIndex];
  const isMyTurn = isOnline ? myColor === currentTurnColor : currentTurnColor === HUMAN_COLOR;
  const activeWinner = isOnline ? winner : localWinner;

  const tokensAtPosition = (pos) => {
    const found = [];
    COLORS.forEach((color) => {
      gameState.players[color].tokens.forEach((tokenPos, idx) => {
        if (tokenPos === pos) found.push({ color, idx });
      });
    });
    return found;
  };

  return (
    <div className="flex flex-col items-center w-full">
      <h3 className="font-display text-lg font-bold mb-1" style={{ color: "#F5F1E8" }}>
        Ludo
      </h3>
      {!isOnline && (
        <p className="text-xs mb-3" style={{ color: "#9CAEAA" }}>
          You are <span style={{ color: COLOR_HEX.red }}>Red</span> — vs 3 computer players
          {computerThinking && <span> (computer playing...)</span>}
        </p>
      )}

      {activeWinner && (
        <div
          className="mb-4 px-4 py-2 rounded-xl font-bold"
          style={{ backgroundColor: COLOR_HEX[activeWinner], color: "#12201F" }}
        >
          {!isOnline && activeWinner !== HUMAN_COLOR
            ? `${activeWinner.toUpperCase()} (Computer) Wins! 🤖`
            : `${activeWinner.toUpperCase()} WINS! 🎉`}
        </div>
      )}

      <div className="flex flex-wrap gap-2 justify-center mb-3">
        {isOnline && (
          <div className="rounded-lg px-3 py-1.5 text-sm border-2" style={{ borderColor: "#3A4E4B" }}>
            <span style={{ color: "#9CAEAA" }}>You are: </span>
            <span className="font-bold" style={{ color: COLOR_HEX[myColor] }}>{myColor}</span>
          </div>
        )}
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

      {isMyTurn && gameState.diceValue === null && !activeWinner && (
        <button
          onClick={handleRollDice}
          className="px-6 py-2.5 rounded-xl font-bold mb-4 transition hover:-translate-y-0.5"
          style={{ backgroundColor: "#F2A93B", color: "#12201F" }}
        >
          🎲 Roll Dice
        </button>
      )}

      <div
        className="w-full rounded-2xl p-4 border-2 mb-4"
        style={{ backgroundColor: "#0D1615", borderColor: "#3A4E4B" }}
      >
        <div className="grid grid-cols-4 gap-2 mb-3">
          {COLORS.map((color) => (
            <div
              key={color}
              className="rounded-lg p-2 flex flex-wrap gap-1 justify-center min-h-[44px] items-center border-2"
              style={{ borderColor: COLOR_HEX[color], backgroundColor: "#12201F" }}
            >
              {gameState.players[color].tokens
                .map((pos, idx) => ({ pos, idx }))
                .filter((t) => t.pos === -1)
                .map((t) => (
                  <span
                    key={t.idx}
                    className="w-4 h-4 rounded-full inline-block"
                    style={{ backgroundColor: COLOR_HEX[color] }}
                  />
                ))}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-center mb-3" style={{ color: "#9CAEAA" }}>
          ↑ Yards (tokens waiting to start — roll a 6 to release)
        </p>

        <div className="flex flex-wrap gap-1 justify-center">
          {Array.from({ length: 52 }).map((_, pos) => {
            const tokensHere = tokensAtPosition(pos);
            const isStart = SAFE_POSITIONS.includes(pos);
            return (
              <div
                key={pos}
                className="w-6 h-6 rounded flex items-center justify-center relative"
                style={{
                  backgroundColor: isStart ? "#243836" : "#1A2C2A",
                  border: isStart ? "1px solid #F2A93B" : "1px solid #2A3A38",
                }}
                title={`Position ${pos}`}
              >
                {tokensHere.length > 0 && (
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLOR_HEX[tokensHere[0].color] }}
                  />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-center mt-2" style={{ color: "#9CAEAA" }}>
          Shared path (52 squares) — amber-outlined squares are safe start points
        </p>

        <div className="grid grid-cols-4 gap-2 mt-3">
          {COLORS.map((color) => {
            const homeCount = gameState.players[color].tokens.filter((p) => p === 58).length;
            return (
              <div
                key={color}
                className="rounded-lg p-2 text-center border-2"
                style={{ borderColor: COLOR_HEX[color], backgroundColor: "#12201F" }}
              >
                <span className="text-xs" style={{ color: COLOR_HEX[color] }}>
                  {homeCount}/4 Home
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full space-y-3">
        {(isOnline ? COLORS : [HUMAN_COLOR]).map((color) => (
          <div
            key={color}
            className="flex items-center gap-2 rounded-xl px-3 py-2 border-2"
            style={{ backgroundColor: "#1A2C2A", borderColor: "#3A4E4B" }}
          >
            <span
              className="text-sm font-bold w-16 capitalize"
              style={{ color: COLOR_HEX[color] }}
            >
              {color}
            </span>
            <div className="flex gap-1.5 flex-1 flex-wrap">
              {gameState.players[color].tokens.map((pos, index) => {
                const isThisColorsTurn = color === currentTurnColor;
                const disabled =
                  activeWinner ||
                  !isThisColorsTurn ||
                  (isOnline && myColor !== color) ||
                  gameState.diceValue === null;
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