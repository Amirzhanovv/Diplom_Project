import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/UserProfile.css";

const UserProfile = ({ userEmail, onEditPrefs }) => {
  const [stats, setStats] = useState({ total_rated: 0, average_score: 0 });
  const [aiProgress, setAiProgress] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(
          `http://127.0.0.1:8000/user/stats/${userEmail}`,
        );
        setStats(res.data);
        const progress = Math.min(
          Math.round((res.data.total_rated / 50) * 100),
          100,
        );
        setAiProgress(progress);
      } catch (err) {
        console.error("Ошибка статистики:", err);
      }
    };
    fetchStats();
  }, [userEmail]);

  return (
    <div className="profile-wrapper">
      <div className="profile-glow-blob"></div>

      <section className="profile-main">
        <header className="profile-identity">
          <div className="avatar-wrapper">
            <div className="avatar-ring"></div>
            <div className="avatar-content">{userEmail[0].toUpperCase()}</div>
          </div>
          <div className="identity-text">
            <h1>{userEmail.split("@")[0]}</h1>
            <span className="status-badge">AI Cinema Pro</span>
          </div>
        </header>

        <div className="profile-layout">
          {/* Левая колонка: Статистика и Прогресс */}
          <div className="layout-col">
            <div className="glass-card stat-card">
              <div className="card-header">
                <i className="icon">📊</i>
                <span>Активность</span>
              </div>
              <div className="stat-display">
                <div className="stat-unit">
                  <div className="val">{stats.total_rated}</div>
                  <div className="lab">Оценок</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-unit">
                  <div className="val">{stats.average_score}</div>
                  <div className="lab">Средний балл</div>
                </div>
              </div>
            </div>

            <div className="glass-card training-card">
              <div className="card-header">
                <i className="icon">🧠</i>
                <span>Обучение SVD</span>
              </div>
              <div className="progress-radial">
                <div className="progress-bar-wrap">
                  <div
                    className="progress-bar-inner"
                    style={{ width: `${aiProgress}%` }}
                  ></div>
                </div>
                <div className="progress-label">{aiProgress}% готовности</div>
              </div>
              <p className="hint">
                Чем больше оценок, тем точнее рекомендации вашего ИИ.
              </p>
            </div>
          </div>

          {/* Правая колонка: ДНК и Настройки */}
          <div className="layout-col">
            <div className="glass-card dna-card">
              <div className="card-header">
                <i className="icon">🧬</i>
                <span>Кино-ДНК</span>
              </div>
              <div className="dna-tags">
                <span className="dna-tag">Action</span>
                <span className="dna-tag">Mystery</span>
                <span className="dna-tag">Cyberpunk</span>
              </div>
              <button className="glass-button primary" onClick={onEditPrefs}>
                Настроить предпочтения
              </button>
            </div>

            <div className="glass-card help-card">
              <div className="card-header">
                <i className="icon">📌</i>
                <span>Где мои фильмы?</span>
              </div>
              <p>
                Ваша коллекция переехала в раздел <b>"Избранное"</b> в верхнем
                меню.
              </p>
            </div>
          </div>
          {/* Добавь этот блок в profile-layout */}
          <div className="glass-card analytics-card">
            <div className="card-header">
              <i className="icon">📊</i>
              <span>Аналитика жанров</span>
            </div>
            <div className="genre-stats">
              <div className="genre-row">
                <div className="genre-info">
                  <span>Боевики</span>
                  <span>45%</span>
                </div>
                <div className="genre-track">
                  <div className="genre-fill" style={{ width: "45%" }}></div>
                </div>
              </div>

              <div className="genre-row">
                <div className="genre-info">
                  <span>Фантастика</span>
                  <span>30%</span>
                </div>
                <div className="genre-track">
                  <div className="genre-fill" style={{ width: "30%" }}></div>
                </div>
              </div>

              <div className="genre-row">
                <div className="genre-info">
                  <span>Ужасы</span>
                  <span>25%</span>
                </div>
                <div className="genre-track">
                  <div className="genre-fill" style={{ width: "25%" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default UserProfile;
