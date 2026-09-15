import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";

// Dono uid ko sort karke ek fixed chatId banate hain,
// taaki chahe koi bhi pehle message bheje, chatId hamesha same rahe
function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

function DMChat() {
  const { otherUid } = useParams();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }
      setCurrentUser(user);

      const otherDoc = await getDoc(doc(db, "users", otherUid));
      if (otherDoc.exists()) {
        setOtherUser({ uid: otherUid, ...otherDoc.data() });
      }
    });

    return () => unsubscribeAuth();
  }, [otherUid, navigate]);

  useEffect(() => {
    if (!currentUser) return;

    const chatId = getChatId(currentUser.uid, otherUid);
    const q = query(
      collection(db, "direct_messages", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(items);
    });

    return () => unsubscribe();
  }, [currentUser, otherUid]);

  const handleSend = async () => {
    if (input.trim() === "" || !currentUser) return;
    const chatId = getChatId(currentUser.uid, otherUid);

    await addDoc(collection(db, "direct_messages", chatId, "messages"), {
      sender: currentUser.uid,
      text: input,
      createdAt: serverTimestamp(),
    });

    setInput("");
  };

  if (!currentUser || !otherUser) return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 px-6 py-8">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => navigate("/people")}
          className="text-sm text-neutral-400 hover:text-neutral-200 mb-4"
        >
          ← Back to People
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-800 flex items-center justify-center">
            {otherUser.profilePic ? (
              <img src={otherUser.profilePic} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>👤</span>
            )}
          </div>
          <h2 className="text-lg font-semibold">{otherUser.name || "Unnamed User"}</h2>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col h-[500px]">
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {messages.length === 0 && (
              <p className="text-neutral-500 text-sm text-center mt-10">
                No messages yet. Say hi 👋
              </p>
            )}
            {messages.map((msg) => {
              const isMe = msg.sender === currentUser.uid;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                      isMe
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : "bg-neutral-800 text-neutral-100 rounded-bl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message"
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500 transition"
            />
            <button
              onClick={handleSend}
              className="bg-indigo-600 hover:bg-indigo-500 transition px-5 py-2 rounded-xl text-sm font-medium"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DMChat;