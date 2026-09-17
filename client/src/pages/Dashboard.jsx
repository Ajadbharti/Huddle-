import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const features = [
  {
    id: "chat",
    name: "Chat Room",
    emoji: "💬",
    description: "Create or join a room to chat in real-time",
    color: "#F2A93B",
  },
  {
    id: "watch",
    name: "Watch Party",
    emoji: "📺",
    description: "Watch YouTube videos together, perfectly synced",
    color: "#EF6461",
  },
  {
    id: "call",
    name: "Video Call",
    emoji: "📹",
    description: "Start a video/voice call with screen share",
    color: "#6FA98F",
  },
  {
    id: "tictactoe",
    name: "Tic Tac Toe",
    emoji: "❌⭕",
    description: "Play solo, or create a room to play with a friend",
    color: "#F2A93B",
  },
  {
    id: "snake",
    name: "Snake",
    emoji: "🐍",
    description: "Classic snake game — play solo anytime",
    color: "#6FA98F",
  },
  {
    id: "ludo",
    name: "Ludo",
    emoji: "🎲",
    description: "Create a room and play Ludo with up to 4 friends",
    color: "#EF6461",
  },
];

function Dashboard() {
  const navigate = useNavigate();
  const [myUsername, setMyUsername] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setMyUsername(userDoc.data().userId || "");
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="min-h-screen px-6 py-10" style={{ backgroundColor: "#12201F" }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1
              className="font-display text-3xl font-bold mb-1"
              style={{ color: "#F5F1E8" }}
            >
              Welcome to Huddle
            </h1>
            <p style={{ color: "#9CAEAA" }}>Pick something to do</p>
            {myUsername && (
              <p className="text-xs font-mono mt-1" style={{ color: "#F2A93B" }}>
                Your Huddle ID: @{myUsername}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => navigate("/profile")}
              className="rounded-full px-4 py-2 text-sm font-semibold border-2 transition hover:-translate-y-0.5"
              style={{ borderColor: "#3A4E4B", color: "#F5F1E8" }}
            >
              👤 Profile
            </button>
            <button
              onClick={() => navigate("/people")}
              className="rounded-full px-4 py-2 text-sm font-semibold border-2 transition hover:-translate-y-0.5"
              style={{ borderColor: "#3A4E4B", color: "#F5F1E8" }}
            >
              👥 Friends
            </button>
            <button
              onClick={handleLogout}
              className="rounded-full px-4 py-2 text-sm font-semibold border-2 transition hover:-translate-y-0.5"
              style={{ borderColor: "#EF6461", color: "#EF6461" }}
            >
              🚪 Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <div
              key={feature.id}
              onClick={() => navigate(`/feature/${feature.id}`)}
              className="rounded-3xl p-6 cursor-pointer border-2 transition hover:-translate-y-1"
              style={{ backgroundColor: "#1A2C2A", borderColor: feature.color }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4"
                style={{ backgroundColor: feature.color }}
              >
                {feature.emoji}
              </div>
              <h3
                className="font-display text-lg font-bold mb-1"
                style={{ color: "#F5F1E8" }}
              >
                {feature.name}
              </h3>
              <p className="text-sm" style={{ color: "#9CAEAA" }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;