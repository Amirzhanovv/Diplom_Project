import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/WatchParty.css";

const WatchParty = ({ roomId, userEmail, onExit }) => {
  const [roomData, setRoomData] = useState(null);
  const [message, setMessage] = useState("");

  // Функция получения данных о комнате (фильм, трейлер, сообщения)
  const refreshRoom = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/rooms/${roomId}`);
      setRoomData(res.data);
    } catch (err) {
      console.error("Ошибка обновления комнаты:", err);
    }
  };

  useEffect(() => {
    refreshRoom();
    // Опрос сервера каждые 3 секунды для имитации реального времени в чате
    const interval = setInterval(refreshRoom, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    try {
      await axios.post(`http://127.0.0.1:8000/rooms/${roomId}/message`, null, {
        params: {
          email: userEmail,
          text: message,
        },
      });
      setMessage("");
      refreshRoom(); // Сразу обновляем список сообщений после отправки
    } catch (err) {
      console.error("Ошибка отправки сообщения:", err);
    }
  };

  if (!roomData) return <div className="loader">Вход в комнату...</div>;

  return (
    <div className="watch-party-layout">
      {/* ЛЕВАЯ ЧАСТЬ: ВИДЕО (ТРЕЙЛЕР) */}
      <div className="video-area">
        <div className="video-header">
          <button className="exit-party-btn" onClick={onExit}>
            ← Покинуть комнату
          </button>
          <span className="room-id-badge">ID комнаты: {roomId}</span>
        </div>

        <div className="iframe-wrapper">
          {roomData.trailer_key ? (
            <iframe
              src={`https://www.youtube.com/embed/${roomData.trailer_key}?autoplay=1&rel=0&showinfo=0`}
              title="YouTube Trailer"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            ></iframe>
          ) : (
            <div className="no-video-msg">
              <p>Трейлер для этого фильма не найден 🎬</p>
            </div>
          )}
        </div>
      </div>

      {/* ПРАВАЯ ЧАСТЬ: ЧАТ */}
      <div className="chat-area">
        <div className="chat-header">
          <h3>Обсуждение</h3>
        </div>

        <div className="messages-list">
          {roomData.messages && roomData.messages.length > 0 ? (
            roomData.messages.map((m, i) => (
              <div
                key={i}
                className={`msg-bubble ${m.user === userEmail ? "my-msg" : "other-msg"}`}
              >
                <div className="msg-info">
                  <span className="msg-author">{m.user.split("@")[0]}</span>
                </div>
                <div className="msg-text">{m.text}</div>
              </div>
            ))
          ) : (
            <div className="empty-chat">Начните общение первым!</div>
          )}
        </div>

        <div className="chat-input-container">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Напишите что-нибудь..."
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          />
          <button className="send-btn" onClick={sendMessage}>
            ➜
          </button>
        </div>
      </div>
    </div>
  );
};

export default WatchParty;
