import React, { useState } from "react";
import axios from "axios";
import "../styles/PreferenceForm.css";

const STEPS = [
  {
    id: "genres",
    title: "Что вы любите? 🍿",
    subtitle: "Выберите жанры, которые вам ближе всего",
    options: [
      { id: 28, name: "🚀 Боевики", desc: "Драйв и адреналин" },
      { id: 35, name: "😂 Комедии", desc: "Юмор и отдых" },
      { id: 878, name: "👾 Фантастика", desc: "Будущее и космос" },
      { id: 27, name: "😱 Ужасы", desc: "Острые ощущения" },
    ],
  },
  {
    id: "mood",
    title: "Какое настроение? 🎭",
    subtitle: "Что ваш ИИ должен искать сейчас?",
    options: [
      { id: "mood_think", name: "🧠 Подумать", desc: "Глубокие сюжеты" },
      { id: "mood_relax", name: "🌊 Расслабиться", desc: "Легкий вайб" },
      { id: "mood_cry", name: "😢 Поплакать", desc: "Сильные драмы" },
      { id: "mood_scary", name: "🔦 Испугаться", desc: "Мрачная атмосфера" },
    ],
  },
  {
    id: "tempo",
    title: "И напоследок... ⏱",
    subtitle: "Какой темп повествования вам нравится?",
    options: [
      { id: "tempo_fast", name: "⚡️ Нон-стоп", desc: "Динамично и быстро" },
      { id: "tempo_slow", name: "🕯 Атмосферно", desc: "Медленное погружение" },
    ],
  },
];

const PreferenceForm = ({ userEmail, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selected, setSelected] = useState([]);

  const stepData = STEPS[currentStep];

  const toggleOption = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      // ФИЛЬТРАЦИЯ: Бэкенд ждет List[int] в поле 'genres'
      // Отбираем только числовые ID (жанры TMDB)
      const genreIds = selected.filter((id) => typeof id === "number");

      const payload = {
        email: userEmail,
        genres: genreIds, // Исправлено: теперь имя поля совпадает с моделью в Python
      };

      console.log("Отправка предпочтений:", payload);

      await axios.post("http://127.0.0.1:8000/user/preferences", payload);

      onComplete();
    } catch (err) {
      console.error(
        "Ошибка сохранения предпочтений:",
        err.response?.data || err.message,
      );
      // Даже при ошибке вызываем onComplete, чтобы закрыть форму в UI (опционально)
      onComplete();
    }
  };

  return (
    <div className="pref-overlay">
      <div className="pref-modal">
        {/* Линия прогресса */}
        <div className="progress-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          ></div>
        </div>

        <span className="step-info">
          Шаг {currentStep + 1} из {STEPS.length}
        </span>
        <h1 className="pref-title">{stepData.title}</h1>
        <p className="pref-subtitle">{stepData.subtitle}</p>

        {/* Сетка карточек */}
        <div className="pref-grid">
          {stepData.options.map((opt) => (
            <div
              key={opt.id}
              className={`pref-card ${selected.includes(opt.id) ? "active" : ""}`}
              onClick={() => toggleOption(opt.id)}
            >
              <div className="pref-card-content">
                <h3>{opt.name}</h3>
                <p>{opt.desc}</p>
              </div>
              <div className="checkbox-ring"></div>
            </div>
          ))}
        </div>

        {/* Кнопки управления */}
        <div className="pref-actions">
          {currentStep > 0 && (
            <button
              className="pref-btn secondary"
              onClick={() => setCurrentStep((prev) => prev - 1)}
            >
              Назад
            </button>
          )}
          <button className="pref-btn primary" onClick={handleNext}>
            {currentStep === STEPS.length - 1 ? "Завершить 🎬" : "Далее →"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreferenceForm;
