import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { auth, db } from "../firebase";

function AddFriend() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(""); // "", "not-found", "added", "self"
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    const cleanId = searchInput.trim().replace("@", "");
    if (!cleanId) return;

    setSearching(true);
    setResult(null);
    setStatus("");

    const currentUser = auth.currentUser;

    const q = query(collection(db, "users"), where("userId", "==", cleanId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      setStatus("not-found");
    } else {
      const foundDoc = snapshot.docs[0];
      if (foundDoc.id === currentUser.uid) {
        setStatus("self");
      } else {
        setResult({ uid: foundDoc.id, ...foundDoc.data() });
      }
    }

    setSearching(false);
  };

  const handleAddFriend = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !result) return;

    // Dono taraf se friend list update karo
    await updateDoc(doc(db, "users", currentUser.uid), {
      friends: arrayUnion(result.uid),
    });
    await updateDoc(doc(db, "users", result.uid), {
      friends: arrayUnion(currentUser.uid),
    });

    setStatus("added");
  };

  return (
    <div className="min-h-screen px-6 py-10" style={{ backgroundColor: "#12201F" }}>
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate("/people")}
          className="text-sm mb-6 font-semibold"
          style={{ color: "#9CAEAA" }}
        >
          ← Back to Friends
        </button>

        <h1 className="font-display text-2xl font-bold mb-2" style={{ color: "#F5F1E8" }}>
          Add a Friend
        </h1>
        <p className="text-sm mb-6" style={{ color: "#9CAEAA" }}>
          Enter their Huddle ID to connect
        </p>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="e.g. user4821"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none border-2"
            style={{ backgroundColor: "#1A2C2A", borderColor: "#3A4E4B", color: "#F5F1E8" }}
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ backgroundColor: "#F2A93B", color: "#12201F" }}
          >
            {searching ? "..." : "Search"}
          </button>
        </div>

        {status === "not-found" && (
          <p className="text-sm text-center" style={{ color: "#EF6461" }}>
            No user found with that ID
          </p>
        )}
        {status === "self" && (
          <p className="text-sm text-center" style={{ color: "#EF6461" }}>
            That's your own ID 🙂
          </p>
        )}
        {status === "added" && (
          <p className="text-sm text-center font-semibold" style={{ color: "#F2A93B" }}>
            Friend added! ✓
          </p>
        )}

        {result && status !== "added" && (
          <div
            className="flex items-center gap-3 rounded-2xl p-4 border-2"
            style={{ backgroundColor: "#1A2C2A", borderColor: "#3A4E4B" }}
          >
            <div
              className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#12201F" }}
            >
              {result.profilePic ? (
                <img src={result.profilePic} alt="" className="w-full h-full object-cover" />
              ) : (
                <span>👤</span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: "#F5F1E8" }}>
                {result.name || "Unnamed User"}
              </p>
              <p className="text-xs font-mono" style={{ color: "#9CAEAA" }}>
                @{result.userId}
              </p>
            </div>
            <button
              onClick={handleAddFriend}
              className="px-4 py-2 rounded-lg text-sm font-bold"
              style={{ backgroundColor: "#F2A93B", color: "#12201F" }}
            >
              Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddFriend;