import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

function People() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const friendUids = userDoc.exists() ? userDoc.data().friends || [] : [];

      const friendDocs = await Promise.all(
        friendUids.map((uid) => getDoc(doc(db, "users", uid)))
      );

      const friendsList = friendDocs
        .filter((d) => d.exists())
        .map((d) => ({ uid: d.id, ...d.data() }));

      setFriends(friendsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen px-6 py-10" style={{ backgroundColor: "#12201F" }}>
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-sm mb-6 font-semibold"
          style={{ color: "#9CAEAA" }}
        >
          ← Back to Dashboard
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold" style={{ color: "#F5F1E8" }}>
            Friends
          </h1>
          <button
            onClick={() => navigate("/add-friend")}
            className="px-4 py-2 rounded-full text-sm font-bold"
            style={{ backgroundColor: "#F2A93B", color: "#12201F" }}
          >
            + Add Friend
          </button>
        </div>

        <div className="space-y-3">
          {!loading && friends.length === 0 && (
            <div className="text-center py-10">
              <p className="text-sm mb-3" style={{ color: "#9CAEAA" }}>
                No friends yet
              </p>
              <p className="text-xs" style={{ color: "#9CAEAA" }}>
                Share your Huddle ID (from Profile) or add someone using theirs
              </p>
            </div>
          )}
          {friends.map((u) => (
            <div
              key={u.uid}
              onClick={() => navigate(`/with/${u.uid}`)}
              className="flex items-center gap-3 rounded-2xl p-3 cursor-pointer border-2 transition hover:-translate-y-0.5"
              style={{ backgroundColor: "#1A2C2A", borderColor: "#3A4E4B" }}
            >
              <div
                className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#12201F" }}
              >
                {u.profilePic ? (
                  <img src={u.profilePic} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>👤</span>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#F5F1E8" }}>
                  {u.name || "Unnamed User"}
                </p>
                <p className="text-xs font-mono" style={{ color: "#9CAEAA" }}>
                  @{u.userId}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default People;