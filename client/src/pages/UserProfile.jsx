import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

function UserProfile() {
  const { otherUid } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [thoughts, setThoughts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const userDoc = await getDoc(doc(db, "users", otherUid));
      if (userDoc.exists()) {
        setProfile({ uid: otherUid, ...userDoc.data() });
      }
      setLoading(false);
    };
    load();
  }, [otherUid]);

  useEffect(() => {
    const q = query(
      collection(db, "thoughts"),
      where("uid", "==", otherUid),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setThoughts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [otherUid]);

  if (loading) return null;

  if (!profile) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#12201F" }}
      >
        <p style={{ color: "#9CAEAA" }}>User not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10" style={{ backgroundColor: "#12201F" }}>
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="text-sm mb-6 font-semibold"
          style={{ color: "#9CAEAA" }}
        >
          ← Back
        </button>

        <div
          className="rounded-3xl p-6 border-2 mb-6 flex flex-col items-center"
          style={{ backgroundColor: "#1A2C2A", borderColor: "#3A4E4B" }}
        >
          <div
            className="w-24 h-24 rounded-full overflow-hidden border-2 mb-3 flex items-center justify-center"
            style={{ backgroundColor: "#12201F", borderColor: "#3A4E4B" }}
          >
            {profile.profilePic ? (
              <img src={profile.profilePic} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">👤</span>
            )}
          </div>
          <h1 className="font-display text-xl font-bold" style={{ color: "#F5F1E8" }}>
            {profile.name || "Unnamed User"}
          </h1>
          <p className="text-sm font-mono mt-1" style={{ color: "#F2A93B" }}>
            @{profile.userId}
          </p>

          <button
            onClick={() => navigate(`/with/${otherUid}`)}
            className="mt-4 px-5 py-2 rounded-xl text-sm font-bold"
            style={{ backgroundColor: "#F2A93B", color: "#12201F" }}
          >
            💬 Message
          </button>
        </div>

        <div
          className="rounded-3xl p-6 border-2"
          style={{ backgroundColor: "#1A2C2A", borderColor: "#3A4E4B" }}
        >
          <h2 className="font-display text-lg font-bold mb-4" style={{ color: "#F5F1E8" }}>
            Thoughts
          </h2>
          <div className="space-y-2">
            {thoughts.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: "#9CAEAA" }}>
                No thoughts shared yet
              </p>
            )}
            {thoughts.map((t) => (
              <div
                key={t.id}
                className="rounded-xl px-4 py-3 border-2"
                style={{ backgroundColor: "#12201F", borderColor: "#3A4E4B" }}
              >
                <p className="text-sm" style={{ color: "#F5F1E8" }}>{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;