import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
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
          Welcome back
        </h2>
        <p className="text-sm text-center mb-6" style={{ color: "#9CAEAA" }}>
          Log in to rejoin your huddle
        </p>

        {error && (
          <p
            className="text-sm mb-4 rounded-xl px-3 py-2 border"
            style={{ color: "#EF6461", borderColor: "#EF6461", backgroundColor: "#2A1A19" }}
          >
            {error}
          </p>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none border-2 transition mb-3"
          style={{ backgroundColor: "#12201F", borderColor: "#3A4E4B", color: "#F5F1E8" }}
          onFocus={(e) => (e.target.style.borderColor = "#F2A93B")}
          onBlur={(e) => (e.target.style.borderColor = "#3A4E4B")}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none border-2 transition mb-5"
          style={{ backgroundColor: "#12201F", borderColor: "#3A4E4B", color: "#F5F1E8" }}
          onFocus={(e) => (e.target.style.borderColor = "#F2A93B")}
          onBlur={(e) => (e.target.style.borderColor = "#3A4E4B")}
        />

        <button
          onClick={handleLogin}
          className="w-full font-display font-bold py-3 rounded-xl transition hover:-translate-y-0.5"
          style={{ backgroundColor: "#F2A93B", color: "#12201F" }}
        >
          Log In
        </button>

        <p className="text-center text-sm mt-5" style={{ color: "#9CAEAA" }}>
          Don't have an account?{" "}
          <span
            onClick={() => navigate("/signup")}
            className="cursor-pointer font-semibold hover:underline"
            style={{ color: "#F2A93B" }}
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;