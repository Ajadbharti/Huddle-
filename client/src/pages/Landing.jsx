import { useNavigate } from "react-router-dom";

const features = [
  {
    emoji: "💬",
    title: "Chat that feels alive",
    desc: "Text, share photos and documents, all in one place — with friends or in group rooms.",
    color: "#F2A93B",
  },
  {
    emoji: "📹",
    title: "Voice & video, one tap away",
    desc: "Call anyone directly from your chat, or start a group call with screen share.",
    color: "#EF6461",
  },
  {
    emoji: "📺",
    title: "Watch together, in sync",
    desc: "Queue up a YouTube video and everyone in the room watches it perfectly synced.",
    color: "#6FA98F",
  },
  {
    emoji: "🎲",
    title: "Game nights, anywhere",
    desc: "Ludo, Tic Tac Toe, Snake — play solo or challenge friends in real time.",
    color: "#F2A93B",
  },
];

function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: "#12201F" }} className="min-h-screen">
      {/* Nav */}
      <div className="flex items-center justify-between px-6 sm:px-10 py-6 max-w-6xl mx-auto">
        <span className="font-display text-2xl font-extrabold" style={{ color: "#F5F1E8" }}>
          Huddle
        </span>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/login")}
            className="font-display font-bold px-5 py-2 rounded-xl text-sm border-2 transition hover:-translate-y-0.5"
            style={{ borderColor: "#3A4E4B", color: "#F5F1E8" }}
          >
            Log In
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="font-display font-bold px-5 py-2 rounded-xl text-sm transition hover:-translate-y-0.5"
            style={{ backgroundColor: "#F2A93B", color: "#12201F" }}
          >
            Sign Up
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 pt-10 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="flex gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg rotate-[-8deg]" style={{ backgroundColor: "#F2A93B" }} />
            <div className="w-8 h-8 rounded-lg rotate-[6deg]" style={{ backgroundColor: "#EF6461" }} />
            <div className="w-8 h-8 rounded-lg rotate-[-4deg]" style={{ backgroundColor: "#6FA98F" }} />
          </div>
          <h1
            className="font-display text-5xl sm:text-6xl font-extrabold leading-tight mb-5"
            style={{ color: "#F5F1E8" }}
          >
            Your people.
            <br />
            One huddle.
          </h1>
          <p className="text-lg mb-8" style={{ color: "#9CAEAA" }}>
            Chat, call, watch, and play — all in one place, wherever
            your friends and family are.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/signup")}
              className="font-display font-bold px-8 py-3.5 rounded-2xl text-lg transition hover:-translate-y-0.5"
              style={{ backgroundColor: "#F2A93B", color: "#12201F" }}
            >
              Get Started Free
            </button>
            <button
              onClick={() => navigate("/login")}
              className="font-display font-bold px-8 py-3.5 rounded-2xl text-lg border-2 transition hover:-translate-y-0.5"
              style={{ borderColor: "#3A4E4B", color: "#F5F1E8" }}
            >
              Log In
            </button>
          </div>
        </div>

        {/* Illustrative app mockup */}
        <div className="flex justify-center">
          <div
            className="w-full max-w-sm rounded-3xl border-2 p-4 space-y-3"
            style={{ backgroundColor: "#1A2C2A", borderColor: "#3A4E4B" }}
          >
            <div className="flex items-center gap-2 pb-3 border-b-2" style={{ borderColor: "#3A4E4B" }}>
              <div className="w-8 h-8 rounded-full" style={{ backgroundColor: "#F2A93B" }} />
              <div className="flex-1">
                <div className="h-2.5 w-24 rounded-full mb-1.5" style={{ backgroundColor: "#F5F1E8" }} />
                <div className="h-2 w-16 rounded-full" style={{ backgroundColor: "#3A4E4B" }} />
              </div>
              <span>📞</span>
              <span>📹</span>
            </div>

            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm px-3 py-2 text-sm" style={{ backgroundColor: "#243836", color: "#F5F1E8" }}>
                Movie night at 8? 🍿
              </div>
            </div>
            <div className="flex justify-end">
              <div className="rounded-2xl rounded-br-sm px-3 py-2 text-sm" style={{ backgroundColor: "#F2A93B", color: "#12201F" }}>
                I'm in! Sending the room code
              </div>
            </div>
            <div className="flex justify-start">
              <div
                className="rounded-2xl rounded-bl-sm px-3 py-2 text-sm flex items-center gap-2"
                style={{ backgroundColor: "#243836", color: "#F5F1E8" }}
              >
                🎲 Rolled a 6!
              </div>
            </div>

            <div
              className="rounded-2xl p-3 flex items-center justify-between border-2"
              style={{ borderColor: "#3A4E4B" }}
            >
              <span className="text-xs" style={{ color: "#9CAEAA" }}>Type a message</span>
              <span className="text-lg">📎</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 pb-24">
        <h2
          className="font-display text-3xl font-bold text-center mb-2"
          style={{ color: "#F5F1E8" }}
        >
          Everything, together
        </h2>
        <p className="text-center mb-12" style={{ color: "#9CAEAA" }}>
          No more switching between five different apps
        </p>

        <div className="grid sm:grid-cols-2 gap-5">
          {features.map((f, i) => (
            <div
              key={i}
              className="rounded-3xl p-6 border-2 transition hover:-translate-y-1"
              style={{ backgroundColor: "#1A2C2A", borderColor: f.color }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4"
                style={{ backgroundColor: f.color }}
              >
                {f.emoji}
              </div>
              <h3 className="font-display text-lg font-bold mb-1" style={{ color: "#F5F1E8" }}>
                {f.title}
              </h3>
              <p className="text-sm" style={{ color: "#9CAEAA" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-3xl mx-auto px-6 sm:px-10 pb-24 text-center">
        <h2 className="font-display text-3xl font-bold mb-4" style={{ color: "#F5F1E8" }}>
          Ready to huddle up?
        </h2>
        <button
          onClick={() => navigate("/signup")}
          className="font-display font-bold px-10 py-4 rounded-2xl text-lg transition hover:-translate-y-0.5"
          style={{ backgroundColor: "#F2A93B", color: "#12201F" }}
        >
          Create Your Free Account
        </button>
      </div>
    </div>
  );
}

export default Landing;