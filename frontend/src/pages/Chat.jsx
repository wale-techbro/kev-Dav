import ChatWindow from "../components/ChatWindow";
import ErrorMessage from "../components/ErrorMessage";
import Header from "../components/Header";
import InputBox from "../components/InputBox";
import { useChat } from "../hooks/useChat";

export default function Chat() {
  const { messages, loading, error, submitMessage, retryLastMessage, startNewConversation } = useChat();

  return (
    <main className="app-shell">
      <Header onNewConversation={startNewConversation} disabled={loading} />
      <div className="chat-layout">
        <ChatWindow messages={messages} loading={loading} />
        <div className="composer-area">
          <ErrorMessage message={error} onRetry={retryLastMessage} retryDisabled={loading} />
          <InputBox onSubmit={submitMessage} loading={loading} />
          <p className="privacy-note">For official decisions, refer to the academy’s approved information.</p>
        </div>
      </div>
    </main>
  );
}
