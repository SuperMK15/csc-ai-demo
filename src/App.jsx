import { React, useEffect, useState, useRef } from 'react'
import './App.css'
import { CohereClient } from "cohere-ai";
import SyncLoader from "react-spinners/SyncLoader";

function App() {
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [configComplete, setConfigComplete] = useState(false);

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');

  const cohere = new CohereClient({ token: import.meta.env.VITE_COHERE_API_KEY });
  
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [history]); // Scroll to bottom whenever history changes

  const ai_preamble =
    "## Task & Context\n" +
    "In this conversation, you will act as a helpful chatbot. You are Codey, the Waterloo Computer Science club mascot.\n" +
    "## Style Guide\n" +
    "1. Be friendly and helpful\n" +
    "2. Use casual language\n" +
    "3. Be concise\n" +
    "4. Use emojis when appropriate!\n";

  useEffect(() => {
    const setUpCohere = async () => {
      try {
        console.log("Setting up Cohere...");

        const res = await cohere.chat({
          message: "Respond with a helpful welcome message introducing yourself to the user. Also ask how you can help them today.",
          preamble: ai_preamble,
          connectors: [{ "id": "web-search" }],
          temperature: 0.4,
          chatHistory: [],
          maxTokens: 200,
        })

        console.log("Result:", res);

        setHistory(res.chatHistory);
        setConfigComplete(true);
      } catch (error) {
        console.error("Error fetching result:", error)
      }
    }

    if (!configComplete && !loadingConfig) {
      setUpCohere();
      setLoadingConfig(true);
    }
  }, [loadingConfig, configComplete]);

  const handleSendMessage = async () => {
    if (message.trim() === '') return;

    setLoading(true);
    setHistory(prevHistory => [...prevHistory, { role: 'USER', message: message }]);

    try {
      const res = await cohere.chat({
        message: message,
        preamble: ai_preamble,
        connectors: [{ "id": "web-search" }],
        temperature: 0.4,
        chatHistory: history,
        maxTokens: 2000,
      });

      setHistory(prevHistory => [...prevHistory, { role: 'CHATBOT', message: res.text }]);
    } catch (error) {
      console.error("Error fetching result:", error);
    }

    setLoading(false);
    setMessage('');
  };

  return (
    <div className="app">
      <div className="chat-container">
        <div className="chat-history" ref={chatContainerRef}>
          {history.map((msg, index) => (
            index === 0 ? null :
              (<div key={index} className={`chat-message ${msg.role}`}>
                {msg.message}
              </div>)
          ))}
        </div>
        <form className="chat-input-container">
          <input
            disabled={loading}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
          />
          <button className='submitButton' onClick={handleSendMessage} disabled={loading || !message}>
            {loading ? <SyncLoader size={8} /> : 'Send'}
          </button>
          <button className='resetButton' onClick={() => setHistory(history.slice(0, 2))}>Clear Chat</button>
        </form>
      </div>
    </div>
  )
}

export default App
