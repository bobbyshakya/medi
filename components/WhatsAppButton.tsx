"use client";
import { useState } from "react";

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "👋 Hi there! How can we help you today?" },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages([...messages, { sender: "user", text: input }]);

    // Mock bot reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "✅ Thanks! Our team will reply shortly." },
      ]);
    }, 1000);

    setInput("");
  };

  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col items-end">
      {/* Chat Popup */}
      {isOpen && (
        <div className="w-80 bg-white rounded-xs h-96 shadow-2xl border border-gray-100 mb-4 animate-slideUp flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[#74BF44] text-white p-4 flex items-center">
            <span className="font-semibold text-lg">💬 Live Chat</span>
            <button
              className="ml-auto text-white hover:text-gray-200 text-xl"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto text-sm text-[#241d1f] space-y-3 max-h-72 custom-scroll">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`px-3 py-2 rounded-xl max-w-[75%] ${
                  msg.sender === "user"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white ml-auto"
                    : "bg-gray-100 text-gray-800 mr-auto"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t flex items-center border-gray-300  space-x-2 bg-gray-50">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
              className="flex-1 border rounded-full px-4 py-2 border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleSend}
              className="bg-[#74BF44] text-white px-4 py-2 rounded-full hover:opacity-90 transition"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Fancy Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#E22026] text-white px-2 py-2 rounded-tl-sm shadow-xs transition transform"
        >
          💬 Live Chat
        </button>
      )}
    </div>
  );
}

