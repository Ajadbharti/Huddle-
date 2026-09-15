import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";

function Signup() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const navigate = useNavigate();

  const isValidUsername = (value) => /^[a-z0-9_]{3,20}$/.test(value);

  const isUsernameTaken = async (value) => {
    const q = query(collection(db, "users"), where("userId", "==", value));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  };

  const handleSignup = async () => {
    console.log("1. Signup clicked", { name, username, email, password });
    setError("");

    const cleanUsername = username.trim().toLowerCase();

    if (!name.trim()) {
      console.log("2. STOPPED: Name is empty");
      setError("Please enter your name");
      return;
    }
    if (!isValidUsername(cleanUsername)) {
      console.log("2. STOPPED: Username invalid:", cleanUsername);
      setError("Username must be 3-20 characters: lowercase letters, numbers, or underscore only");
      return;
    }

    console.log("3. Validation passed, checking username availability...");
    setCheckingUsername(true);

    let taken;
    try {
      taken = await isUsernameTaken(cleanUsername);
      console.log("4. Username availability checked. Taken?", taken);
    } catch (checkErr) {
      console.log("4. ERROR while checking username:", checkErr);
      setCheckingUsername(false);
      setError("Something went wrong checking the username. Check console.");
      return;
    }

    setCheckingUsername(false);

    if (taken) {
      console.log("5. STOPPED: Username already taken");
      setError("This username is already taken. Try another one.");
      return;
    }

    console.log("6. Creating account with Firebase Auth...");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("7. Auth account created:", userCredential.user.uid);

      await setDoc(doc(db, "users", userCredential.user.uid), {
        userId: cleanUsername,
        name: name.trim(),
        email: userCredential.user.email,
        phone: "",
        profilePic: "",
        friends: [],
        createdAt: new Date().toISOString(),
      });
      console.log("8. Firestore user document created. Success!");

      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err) {
      console.log("ERROR during signup:", err.code, err.message);
      if (err.code === "auth/email-already-in-use") {
        try {
          console.log("9. Email already in use, trying login instead...");
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const existing = await getDoc(doc(db, "users", userCredential.user.uid));
          if (!existing.exists()) {
            await setDoc(doc(db, "users", userCredential.user.uid), {
              userId: cleanUsername,
              name: name.trim(),
              email: userCredential.user.email,
              phone: "",
              profilePic: "",
              friends: [],
              createdAt: new Date().toISOString(),
            });
          }
          console.log("10. Login fallback succeeded!");
          setSuccess(true);
          setTimeout(() => navigate("/dashboard"), 1000);
        } catch (loginErr) {
          console.log("ERROR: Login fallback also failed:", loginErr.code, loginErr.message);
          setError("This email is already registered. Try logging in instead.");
        }
      } else {
        setError(err.message);
      }
    }
  };

  const inputStyle = {
    backgroundColor: "#12201F",
    borderColor: "#3A4E4B",
    color: "#F5F1E8",
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#12201F" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8 border-2"
        style={{ backgroundColor: "#1A2C2A", borderColor: "#3A4E4B" }}
      >
        <h2
          className="font-display text-3xl font-bold mb-1 text-center"
          style={{ color: "#F5F1E8" }}
        >
          Join Huddle
        </h2>
        <p className="text-sm text-center mb-6" style={{ color: "#9CAEAA" }}>
          Create your account
        </p>

        {success && (
          <p
            className="text-sm mb-4 rounded-xl px-3 py-2 border font-semibold text-center"
            style={{ color: "#F2A93B", borderColor: "#F2A93B", backgroundColor: "#2A2416" }}
          >
            ✓ Account created! Taking you to your dashboard...
          </p>
        )}

        {error && (
          <p
            className="text-sm mb-4 rounded-xl px-3 py-2 border"
            style={{ color: "#EF6461", borderColor: "#EF6461", backgroundColor: "#2A1A19" }}
          >
            {error}
          </p>
        )}

        <label className="text-xs" style={{ color: "#9CAEAA" }}>Full Name</label>
        <input
          type="text"
          placeholder="Rahul Sharma"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none border-2 transition mb-3 mt-1"
          style={inputStyle}
        />

        <label className="text-xs" style={{ color: "#9CAEAA" }}>Username</label>
        <div className="relative mb-3 mt-1">
          <span
            className="absolute left-4 top-1/2 -translate-y-1/2 text-sm"
            style={{ color: "#9CAEAA" }}
          >
            @
          </span>
          <input
            type="text"
            placeholder="rahul_sharma"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            className="w-full rounded-xl pl-8 pr-4 py-3 text-sm outline-none border-2 transition"
            style={inputStyle}
          />
        </div>

        <label className="text-xs" style={{ color: "#9CAEAA" }}>Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none border-2 transition mb-3 mt-1"
          style={inputStyle}
        />

        <label className="text-xs" style={{ color: "#9CAEAA" }}>Password</label>
        <input
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none border-2 transition mb-5 mt-1"
          style={inputStyle}
        />

        <button
          onClick={handleSignup}
          disabled={checkingUsername}
          className="w-full font-display font-bold py-3 rounded-xl transition hover:-translate-y-0.5 disabled:opacity-50"
          style={{ backgroundColor: "#F2A93B", color: "#12201F" }}
        >
          {checkingUsername ? "Checking..." : "Sign Up"}
        </button>

        <p className="text-center text-sm mt-5" style={{ color: "#9CAEAA" }}>
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="cursor-pointer font-semibold hover:underline"
            style={{ color: "#F2A93B" }}
          >
            Log In
          </span>
        </p>
      </div>
    </div>
  );
}

export default Signup;