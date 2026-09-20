import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../socket";
import Chat from "../Chat";
import WatchParty from "../WatchParty";
import VideoCall from "../VideoCall";
import TicTacToe from "../TicTacToe";
import Snake from "../Snake";
import Ludo from "../Ludo";

const soloGames = ["snake", "tictactoe", "ludo"];

function FeaturePage() {
  const { featureId } = useParams();
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [inRoom, setInRoom] = useState(soloGames.includes(featureId));

  useEffect(() => {
    const handleRoomCreated = (code) => {
      setRoomCode(code);
      setInRoom(true);
    };
    const handleRoomJoined = (code) => {
      setRoomCode(code);
      setInRoom(true);
    };

    socket.on("room-created", handleRoomCreated);
    socket.on("room-joined", handleRoomJoined);

    return () => {
      socket.off("room-created", handleRoomCreated);
      socket.off("room-joined", handleRoomJoined);
    };
  }, []);

  const handleCreateRoom = () => socket.emit("create-room");
  const handleJoinRoom = () => socket.emit("join-room", joinInput.toUpperCase());

  const featureNames = {
    chat: "Chat Room",
    watch: "Watch Party",
    call: "Video Call",
    tictactoe: "Tic Tac Toe",
    snake: "Snake",
    ludo: "Ludo",
  };

  const renderFeature = () => {
    if (featureId === "chat") return <Chat roomCode={roomCode} />;
    if (featureId === "watch") return <WatchParty roomCode={roomCode} />;
    if (featureId === "call") return <VideoCall roomCode={roomCode} />;
    if (featureId === "tictactoe") return <TicTacToe roomCode={roomCode} />;
    if (featureId === "snake") return <Snake />;
    if (featureId === "ludo") return <Ludo roomCode={roomCode} />;
    return <p style={{ color: "#F5F1E8" }}>Unknown feature</p>;
  };

  if (!inRoom) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#12201F" }}
      >
        <div
          className="w-full max-w-sm rounded-3xl p-8 border-2"
          style={{ backgroundColor: "#1A2C2A", borderColor: "#3A4E4B" }}
        >
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm mb-4 font-semibold"
            style={{ color: "#9CAEAA" }}
          >
            ← Back to Dashboard
          </button>
          <h2
            className="font-display text-2xl font-bold mb-6"
            style={{ color: "#F5F1E8" }}
          >
            {featureNames[featureId] || featureId}
          </h2>

          <button
            onClick={handleCreateRoom}
            className="w-full font-display font-bold py-3 rounded-xl mb-4 transition hover:-translate-y-0.5"
            style={{ backgroundColor: "#F2A93B", color: "#12201F" }}
          >
            Create Room
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1" style={{ backgroundColor: "#3A4E4B" }} />
            <span className="text-xs" style={{ color: "#9CAEAA" }}>OR</span>
            <div className="h-px flex-1" style={{ backgroundColor: "#3A4E4B" }} />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter room code"
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value)}
              className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none border-2 uppercase transition"
              style={{ backgroundColor: "#12201F", borderColor: "#3A4E4B", color: "#F5F1E8" }}
              onFocus={(e) => (e.target.style.borderColor = "#F2A93B")}
              onBlur={(e) => (e.target.style.borderColor = "#3A4E4B")}
            />
            <button
              onClick={handleJoinRoom}
              className="px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition"
              style={{ borderColor: "#3A4E4B", color: "#F5F1E8" }}
            >
              Join
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8" style={{ backgroundColor: "#12201F" }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm font-semibold"
            style={{ color: "#9CAEAA" }}
          >
            ← Dashboard
          </button>
          {roomCode && (
            <div
              className="flex items-center gap-2 rounded-full px-4 py-1.5 border-2"
              style={{ borderColor: "#3A4E4B" }}
            >
              <span className="text-sm" style={{ color: "#9CAEAA" }}>Room</span>
              <span className="font-mono font-bold" style={{ color: "#F2A93B" }}>
                {roomCode}
              </span>
            </div>
          )}
        </div>

        <div
          className="rounded-3xl p-6 border-2"
          style={{ backgroundColor: "#1A2C2A", borderColor: "#3A4E4B" }}
        >
          {renderFeature()}
        </div>
      </div>
    </div>
  );
}

export default FeaturePage;