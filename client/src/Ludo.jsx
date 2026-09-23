import { useEffect, useState } from "react";
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

const PATH_COORDS = [
  [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7],
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7],
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0],
];

const HOME_STRETCH = {
  red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
  blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
};

const YARD_GRID = {
  red: { gridRow: "1 / 7", gridColumn: "1 / 7" },
  green: { gridRow: "1 / 7", gridColumn: "10 / 16" },
  yellow: { gridRow: "10 / 16", gridColumn: "10 / 16" },
  blue: { gridRow: "10 / 16", gridColumn: "1 / 7" },
};

function getCellCoord(color, pos) {
  if (pos === -1 || pos === 58) return null;
  if (pos < 52) return PATH_COORDS[pos];
  return HOME_STRETCH[color][pos - 52];
}

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

      if (!hasTokenOutside && !canOpenNew) {
        return {
          ...prev,
          diceValue: null,
          turnIndex: (prev.turnIndex + 1) % COLORS.length,
        };
      }
      return { ...prev, diceValue };
    });
  };

  // ---- Computer ki turn: clean setTimeout chain, koi stale closure nahi ----
  useEffect(() => {
    if (isOnline || localWinner) return;

    const currentColor = COLORS[localState.turnIndex];
    if (currentColor === HUMAN_COLOR) return;

    let cancelled = false;
    setComputerThinking(true);

    const rollTimer = setTimeout(() => {
      if (cancelled) return;

      setLocalState((prev) => {
        if (COLORS[prev.turnIndex] !== currentColor) return prev;

        const diceValue = Math.floor(Math.random() * 6) + 1;
        const tokens = prev.players[currentColor].tokens;
        const hasTokenOutside = tokens.some((pos) => pos !== -1 && pos !== 58);
        const canOpenNew = diceValue === 6 && tokens.includes(-1);

        if (!hasTokenOutside && !canOpenNew) {
          return {
            ...prev,
            diceValue: null,
            turnIndex: (prev.turnIndex + 1) % COLORS.length,
          };
        }

        setTimeout(() => {
          if (cancelled) return;
          setLocalState((latest) => {
            if (COLORS[latest.turnIndex] !== currentColor || latest.diceValue !== diceValue) {
              return latest;
            }
            const moveIdx = pickComputerMove(latest.players, currentColor, diceValue);
            if (moveIdx === null) {
              return {
                ...latest,
                diceValue: null,
                turnIndex: (latest.turnIndex + 1) % COLORS.length,
              };
            }
            const result = simulateMove(latest.players, currentColor, moveIdx, diceValue);
            if (!result) {
              return {
                ...latest,
                diceValue: null,
                turnIndex: (latest.turnIndex + 1) % COLORS.length,
              };
            }
            const homeTokens = result.players[currentColor].tokens;
            if (homeTokens.every((pos) => pos === 58)) {
              setLocalWinner(currentColor);
            }
            const newTurnIndex =
              diceValue === 6 ? latest.turnIndex : (latest.turnIndex + 1) % COLORS.length;
            return { players: result.players, turnIndex: newTurnIndex, diceValue: null };
          });
          setComputerThinking(false);
        }, 700);

        return { ...prev, diceValue };
      });
    }, 700);

    return () => {
      cancelled = true;
      clearTimeout(rollTimer);
      setComputerThinking(false);
    };
  }, [localState.turnIndex, isOnline, localWinner]);

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

  const cellMap = {};
  COLORS.forEach((color) => {
    gameState.players[color].tokens.forEach((pos, idx) => {
      const coord = getCellCoord(color, pos);
      if (coord) {
        const key = `${coord[0]}-${coord[1]}`;
        if (!cellMap[key]) cellMap[key] = [];
        cellMap[key].push({ color, idx });
      }
    });
  });

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
        className="w-full max-w-md aspect-square rounded-2xl border-2 p-1.5 mb-4"
        style={{ backgroundColor: "#0D1615", borderColor: "#3A4E4B" }}
      >
        <div
          className="w-full h-full grid"
          style={{
            gridTemplateColumns: "repeat(15, 1fr)",
            gridTemplateRows: "repeat(15, 1fr)",
            gap: "1px",
          }}
        >
          {COLORS.map((color) => (
            <div
              key={color}
              style={{
                ...YARD_GRID[color],
                backgroundColor: "#12201F",
                border: `2px solid ${COLOR_HEX[color]}`,
                borderRadius: "8px",
              }}
              className="flex items-center justify-center"
            >
              <div className="grid grid-cols-2 gap-1.5 p-2">
                {gameState.players[color].tokens
                  .map((pos, idx) => ({ pos, idx }))
                  .filter((t) => t.pos === -1)
                  .map((t) => (
                    <span
                      key={t.idx}
                      className="rounded-full block"
                      style={{
                        width: "10px",
                        height: "10px",
                        backgroundColor: COLOR_HEX[color],
                      }}
                    />
                  ))}
              </div>
            </div>
          ))}

          <div
            style={{ gridRow: "7 / 10", gridColumn: "7 / 10", backgroundColor: "#1A2C2A" }}
            className="flex items-center justify-center relative overflow-hidden rounded"
          >
            <div
              className="absolute inset-0"
              style={{
                background: `conic-gradient(${COLOR_HEX.red} 0% 25%, ${COLOR_HEX.green} 25% 50%, ${COLOR_HEX.yellow} 50% 75%, ${COLOR_HEX.blue} 75% 100%)`,
                opacity: 0.85,
              }}
            />
            <div className="relative flex flex-wrap gap-0.5 justify-center max-w-[80%]">
              {COLORS.map((color) =>
                gameState.players[color].tokens
                  .map((pos, idx) => ({ pos, idx }))
                  .filter((t) => t.pos === 58)
                  .map((t) => (
                    <span
                      key={`${color}-${t.idx}`}
                      className="rounded-full block border"
                      style={{
                        width: "6px",
                        height: "6px",
                        backgroundColor: COLOR_HEX[color],
                        borderColor: "#12201F",
                      }}
                    />
                  ))
              )}
            </div>
          </div>

          {PATH_COORDS.map(([row, col], idx) => {
            const isStart = SAFE_POSITIONS.includes(idx);
            const tokensHere = cellMap[`${row}-${col}`] || [];
            return (
              <div
                key={`path-${idx}`}
                style={{
                  gridRow: row + 1,
                  gridColumn: col + 1,
                  backgroundColor: isStart ? "#243836" : "#1A2C2A",
                  border: isStart ? "1px solid #F2A93B" : "1px solid #2A3A38",
                }}
                className="flex items-center justify-center"
              >
                {tokensHere.length > 0 && (
                  <span
                    className="rounded-full block"
                    style={{
                      width: "55%",
                      aspectRatio: "1",
                      backgroundColor: COLOR_HEX[tokensHere[0].color],
                    }}
                  />
                )}
              </div>
            );
          })}

          {COLORS.map((color) =>
            HOME_STRETCH[color].map(([row, col], idx) => {
              const tokensHere = cellMap[`${row}-${col}`] || [];
              return (
                <div
                  key={`${color}-stretch-${idx}`}
                  style={{
                    gridRow: row + 1,
                    gridColumn: col + 1,
                    backgroundColor: COLOR_HEX[color],
                    opacity: 0.35,
                  }}
                  className="flex items-center justify-center"
                >
                  {tokensHere.length > 0 && (
                    <span
                      className="rounded-full block"
                      style={{
                        width: "55%",
                        aspectRatio: "1",
                        backgroundColor: COLOR_HEX[color],
                        opacity: 1,
                        border: "1px solid #12201F",
                      }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 w-full mb-4">
        {COLORS.map((color) => {
          const homeCount = gameState.players[color].tokens.filter((p) => p === 58).length;
          return (
            <div
              key={color}
              className="rounded-lg p-2 text-center border-2"
              style={{ borderColor: COLOR_HEX[color], backgroundColor: "#1A2C2A" }}
            >
              <span className="text-xs" style={{ color: COLOR_HEX[color] }}>
                {homeCount}/4 Home
              </span>
            </div>
          );
        })}
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