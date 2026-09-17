import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../firebase";

async function generateUniqueUserId() {
  let userId;
  let isUnique = false;

  while (!isUnique) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    userId = `user${randomNum}`;

    const q = query(collection(db, "users"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) isUnique = true;
  }

  return userId;
}

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [userId, setUserId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [thoughts, setThoughts] = useState([]);
  const [thoughtInput, setThoughtInput] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }
      setUser(currentUser);

      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        setName(data.name || "");
        setPhone(data.phone || "");
        setProfilePic(data.profilePic || "");

        if (data.userId) {
          setUserId(data.userId);
        } else {
          // Purana/adhoora account: userId missing hai, isse abhi generate karke fix karte hain
          const newUserId = await generateUniqueUserId();
          await setDoc(userDocRef, { userId: newUserId, friends: data.friends || [] }, { merge: true });
          setUserId(newUserId);
        }
      } else {
        // Document hai hi nahi (bahut purana adhoora signup) - poora bana do
        const newUserId = await generateUniqueUserId();
        await setDoc(userDocRef, {
          userId: newUserId,
          name: "",
          email: currentUser.email,
          phone: "",
          profilePic: "",
          friends: [],
          createdAt: new Date().toISOString(),
        });
        setUserId(newUserId);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "thoughts"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setThoughts(items);
    });

    return () => unsubscribe();
  }, [user]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const imageRef = ref(storage, `profile-pics/${user.uid}`);
      await uploadBytes(imageRef, file);
      const url = await getDownloadURL(imageRef);
      setProfilePic(url);
    } catch (err) {
      console.error("Upload failed:", err);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    await setDoc(
      doc(db, "users", user.uid),
      { name, phone, profilePic },
      { merge: true }
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePostThought = async () => {
    if (thoughtInput.trim() === "" || !user) return;
    await addDoc(collection(db, "thoughts"), {
      uid: user.uid,
      text: thoughtInput,
      createdAt: serverTimestamp(),
    });
    setThoughtInput("");
  };

  if (!user) return null;

  const inputStyle = {
    backgroundColor: "#12201F",
    borderColor: "#3A4E4B",
    color: "#F5F1E8",
  };

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

        <h1 className="font-display text-2xl font-bold mb-6" style={{ color: "#F5F1E8" }}>
          Your Profile
        </h1>

        <div
          className="rounded-2xl px-4 py-3 border-2 mb-4 flex items-center justify-between"
          style={{ backgroundColor: "#1A2C2A", borderColor: "#F2A93B" }}
        >
          <div>
            <p className="text-xs" style={{ color: "#9CAEAA" }}>Your Huddle ID</p>
            <p className="font-bold font-mono" style={{ color: "#F2A93B" }}>
              {userId ? `@${userId}` : "Loading..."}
            </p>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(userId)}
            disabled={!userId}
            className="text-xs px-3 py-1.5 rounded-lg border-2 font-semibold disabled:opacity-50"
            style={{ borderColor: "#3A4E4B", color: "#F5F1E8" }}
          >
            📋 Copy
          </button>
        </div>

        <div
          className="rounded-3xl p-6 border-2"
          style={{ backgroundColor: "#1A2C2A", borderColor: "#3A4E4B" }}
        >
          <div className="flex flex-col items-center mb-6">
            <div
              className="w-24 h-24 rounded-full overflow-hidden border-2 mb-3 flex items-center justify-center"
              style={{ backgroundColor: "#12201F", borderColor: "#3A4E4B" }}
            >
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">👤</span>
              )}
            </div>
            <label className="text-sm cursor-pointer font-semibold" style={{ color: "#F2A93B" }}>
              {uploading ? "Uploading..." : "Change photo"}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>

          <label className="text-xs" style={{ color: "#9CAEAA" }}>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border-2 mb-4 mt-1"
            style={inputStyle}
          />

          <label className="text-xs" style={{ color: "#9CAEAA" }}>Email</label>
          <input
            type="text"
            value={user.email}
            disabled
            className="w-full rounded-xl px-4 py-2.5 text-sm mb-4 mt-1 opacity-60"
            style={inputStyle}
          />

          <label className="text-xs" style={{ color: "#9CAEAA" }}>Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91xxxxxxxxxx"
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border-2 mb-6 mt-1"
            style={inputStyle}
          />

          <button
            onClick={handleSave}
            className="w-full font-display font-bold py-2.5 rounded-xl transition hover:-translate-y-0.5"
            style={{ backgroundColor: "#F2A93B", color: "#12201F" }}
          >
            {saved ? "Saved ✓" : "Save Changes"}
          </button>
        </div>

        <div
          className="rounded-3xl p-6 border-2 mt-6"
          style={{ backgroundColor: "#1A2C2A", borderColor: "#3A4E4B" }}
        >
          <h2 className="font-display text-lg font-bold mb-4" style={{ color: "#F5F1E8" }}>
            Thoughts
          </h2>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={thoughtInput}
              onChange={(e) => setThoughtInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePostThought()}
              placeholder="What's on your mind?"
              className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none border-2"
              style={inputStyle}
            />
            <button
              onClick={handlePostThought}
              className="px-5 py-2.5 rounded-xl text-sm font-bold"
              style={{ backgroundColor: "#F2A93B", color: "#12201F" }}
            >
              Post
            </button>
          </div>

          <div className="space-y-2">
            {thoughts.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: "#9CAEAA" }}>
                No thoughts yet
              </p>
            )}
            {thoughts.map((thought) => (
              <div
                key={thought.id}
                className="rounded-xl px-4 py-3 border-2"
                style={{ backgroundColor: "#12201F", borderColor: "#3A4E4B" }}
              >
                <p className="text-sm" style={{ color: "#F5F1E8" }}>{thought.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;