import { useEffect, useRef, useState } from "react";
import YouTube from "react-youtube";
import socket from "./socket";

function WatchParty({ roomCode }) {
  const [videoId] = useState("dQw4w9WgXcQ");
  const playerRef = useRef(null);

  useEffect(() => {
    const handleVideoSync = ({ action, time }) => {
      if (!playerRef.current) return;
      if (action === "play") {
        playerRef.current.seekTo(time, true);
        playerRef.current.playVideo();
      } else if (action === "pause") {
        playerRef.current.seekTo(time, true);
        playerRef.current.pauseVideo();
      }
    };

    socket.on("video-sync", handleVideoSync);

    return () => {
      socket.off("video-sync", handleVideoSync);
    };
  }, []);

  const onPlayerReady = (event) => {
    playerRef.current = event.target;
  };

  const handleStateChange = (event) => {
    const time = event.target.getCurrentTime();
    if (event.data === 1) {
      socket.emit("video-action", { roomCode, action: "play", time });
    } else if (event.data === 2) {
      socket.emit("video-action", { roomCode, action: "pause", time });
    }
  };

  return (
    <div>
      <h3 className="font-display text-lg font-bold mb-3" style={{ color: "#F5F1E8" }}>
        Watch Party
      </h3>
      <div className="rounded-xl overflow-hidden border-2" style={{ borderColor: "#3A4E4B" }}>
        <YouTube
          videoId={videoId}
          onReady={onPlayerReady}
          onStateChange={handleStateChange}
          opts={{ width: "100%" }}
          className="w-full"
        />
      </div>
      <p className="text-xs mt-3" style={{ color: "#9CAEAA" }}>
        Play, pause, or seek — everyone in the room stays in sync.
      </p>
    </div>
  );
}

export default WatchParty;