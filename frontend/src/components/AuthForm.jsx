import React, { useState } from "react";
import axios from "axios";
import "../styles/AuthForm.css"; // Импортируем красивые стили

const AuthForm = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? "login" : "register";
    try {
      const res = await axios.post(`http://127.0.0.1:8000/${endpoint}`, {
        email,
        password,
      });

      if (isLogin) {
        localStorage.setItem("token", res.data.access_token);
        localStorage.setItem("userEmail", res.data.email);
        onLoginSuccess(res.data.email);
      } else {
        setMessage("Регистрация успешна! Теперь войдите.");
        setIsLogin(true);
      }
    } catch (err) {
      setMessage(err.response?.data?.detail || "Ошибка сервера");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isLogin ? "С возвращением!" : "Создать аккаунт"}</h2>
        <p className="auth-subtitle">
          {isLogin
            ? "Войдите, чтобы продолжить"
            : "Присоединяйтесь к нашему сообществу"}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label>Email</label>
            <input
              className="auth-input"
              type="email"
              placeholder="example@mail.com"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Пароль</label>
            <input
              className="auth-input"
              type="password"
              placeholder="••••••••"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="auth-submit-btn">
            {isLogin ? "Войти" : "Зарегистрироваться"}
          </button>
        </form>

        <p
          className="auth-toggle"
          onClick={() => {
            setIsLogin(!isLogin);
            setMessage("");
          }}
        >
          {isLogin ? "Нет аккаунта? " : "Уже есть аккаунт? "}
          <span>{isLogin ? "Зарегистрируйтесь" : "Войдите"}</span>
        </p>

        {message && <p className="auth-message">{message}</p>}
      </div>
    </div>
  );
};

export default AuthForm;
