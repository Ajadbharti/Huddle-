import { useEffect, useRef, useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";
import socket from "./socket";

function Chat({ roomCode }) {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleReceiveMessage = (data) => {
      setMessages((prev) => [...prev, data]);
    };

    socket.on("receive-message", handleReceiveMessage);

    return () => {
      socket.off("receive-message", handleReceiveMessage);
    };
  }, []);

  const handleSendMessage = () => {
    if (messageInput.trim() === "") return;
    socket.emit("send-message", {
      roomCode,
      type: "text",
      message: messageInput,
      sender: socket.id,
    });
    setMessageInput("");
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const filePath = `chat-files/${roomCode}/${Date.now()}-${file.name}`;
      const fileRef = ref(storage, filePath);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      const isImage = file.type.startsWith("image/");

      socket.emit("send-message", {
        roomCode,
        type: isImage ? "image" : "file",
        fileUrl: url,
        fileName: file.name,
        sender: socket.id,
      });
    } catch (err) {
      console.error("File upload failed:", err);
    }
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col h-[70vh] sm:h-[500px]">
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {messages.length === 0 && (
          <p className="text-sm text-center mt-10" style={{ color: "#9CAEAA" }}>
            No messages yet. Say hi 👋
          </p>
        )}
        {messages.map((msg, index) => {
          const isMe = msg.sender === socket.id;
          return (
            <div key={index} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[80%] sm:max-w-[70%] px-3 py-2 rounded-2xl text-sm"
                style={{
                  backgroundColor: isMe ? "#F2A93B" : "#243836",
                  color: isMe ? "#12201F" : "#F5F1E8",
                }}
              >
                {msg.type === "image" && (
                  <img
                    src={msg.fileUrl}
                    alt={msg.fileName}
                    className="rounded-lg max-w-full max-h-60 object-cover"
                  />
                )}
                {msg.type === "file" && (
                  <a
                    href={msg.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 underline"
                  >
                    📄 {msg.fileName}
                  </a>
                )}
                {(!msg.type || msg.type === "text") && msg.message}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 mt-3 items-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        <button
          onClick={() => fileInputRef.current.click()}
          disabled={uploading}
          className="w-10 h-10 flex items-center justify-center rounded-full border-2 flex-shrink-0"
          style={{ borderColor: "#3A4E4B", color: "#F5F1E8" }}
        >
          {uploading ? "…" : "📎"}
        </button>
        <input
          type="text"
          placeholder="Type a message"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          className="flex-1 rounded-xl px-4 py-2 text-sm outline-none border-2 transition min-w-0"
          style={{ backgroundColor: "#12201F", borderColor: "#3A4E4B", color: "#F5F1E8" }}
        />
        <button
          onClick={handleSendMessage}
          className="px-4 sm:px-5 py-2 rounded-xl text-sm font-semibold flex-shrink-0"
          style={{ backgroundColor: "#F2A93B", color: "#12201F" }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;