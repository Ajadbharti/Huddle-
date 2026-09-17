import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import socket from "../socket";
import Chat from "../Chat";
import VideoCall from "../VideoCall";
import TicTacToe from "../TicTacToe";
import Ludo from "../Ludo";

// Dono uid ko sort karke ek fixed room banate hain -
// isse do specific logo ka room hamesha same rahega, koi code nahi chahiye
function getPairRoomCode(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

function DirectRoom() {
  const { otherUid } = useParams();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [roomCode, setRoomCode] = useState(null);

  // view: "chat" | "voice" | "video" | "games"
  const [view, setView] = useState("chat");
  const [gameChoice, setGameChoice] = useState("tictactoe");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }
      setCurrentUser(user);

      const otherDoc = await getDoc(doc(db, "users", otherUid));
      if (otherDoc.exists()) {
        setOtherUser({ uid: otherUid, ...otherDoc.data() });
      }

      const code = getPairRoomCode(user.uid, otherUid);
      setRoomCode(code);
      socket.emit("join-room", code);
    });

    return () => unsubscribe();
  }, [otherUid, navigate]);

  if (!currentUser || !otherUser || !roomCode) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#12201F" }}>
      {/* WhatsApp-style header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b-2"
        style={{ borderColor: "#3A4E4B", backgroundColor: "#1A2C2A" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/people")}
            className="text-lg"
            style={{ color: "#9CAEAA" }}
          >
            ←
          </button>
          <div
            className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#12201F" }}
          >
            {otherUser.profilePic ? (
              <img src={otherUser.profilePic} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>👤</span>
            )}
          </div>
          <div>
            <p
  onClick={() => navigate(`/user/${otherUid}`)}
  className="font-semibold text-sm truncate cursor-pointer hover:underline"
  style={{ color: "#F5F1E8" }}
>
  {otherUser.name || "Unnamed User"}
</p>
            <p
              className="text-xs cursor-pointer"
              onClick={() => setView("games")}
              style={{ color: view === "games" ? "#F2A93B" : "#9CAEAA" }}
            >
              🎮 Play a game
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setView("voice")}
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition"
            style={{ backgroundColor: view === "voice" ? "#F2A93B" : "transparent" }}
          >
            📞
          </button>
          <button
            onClick={() => setView("video")}
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition"
            style={{ backgroundColor: view === "video" ? "#F2A93B" : "transparent" }}
          >
            📹
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-4 max-w-2xl w-full mx-auto">
        {view === "chat" && <Chat roomCode={roomCode} />}

        {view === "voice" && (
          <div>
            <button
              onClick={() => setView("chat")}
              className="text-sm mb-3"
              style={{ color: "#9CAEAA" }}
            >
              ← Back to chat
            </button>
            <VideoCall roomCode={roomCode} audioOnly={true} />
          </div>
        )}

        {view === "video" && (
          <div>
            <button
              onClick={() => setView("chat")}
              className="text-sm mb-3"
              style={{ color: "#9CAEAA" }}
            >
              ← Back to chat
            </button>
            <VideoCall roomCode={roomCode} audioOnly={false} />
          </div>
        )}

        {view === "games" && (
          <div>
            <button
              onClick={() => setView("chat")}
              className="text-sm mb-4"
              style={{ color: "#9CAEAA" }}
            >
              ← Back to chat
            </button>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setGameChoice("tictactoe")}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{
                  backgroundColor: gameChoice === "tictactoe" ? "#F2A93B" : "#243836",
                  color: gameChoice === "tictactoe" ? "#12201F" : "#F5F1E8",
                }}
              >
                ❌⭕ Tic Tac Toe
              </button>
              <button
                onClick={() => setGameChoice("ludo")}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{
                  backgroundColor: gameChoice === "ludo" ? "#F2A93B" : "#243836",
                  color: gameChoice === "ludo" ? "#12201F" : "#F5F1E8",
                }}
              >
                🎲 Ludo
              </button>
            </div>

            <div
              className="rounded-2xl p-6 border-2"
              style={{ backgroundColor: "#1A2C2A", borderColor: "#3A4E4B" }}
            >
              {gameChoice === "tictactoe" && <TicTacToe roomCode={roomCode} />}
              {gameChoice === "ludo" && <Ludo roomCode={roomCode} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DirectRoom;