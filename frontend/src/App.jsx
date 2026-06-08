import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import AuthForm from "./components/AuthForm";
import MovieCard from "./components/MovieCard";
import SearchBar from "./components/SearchBar";
import MovieDetails from "./components/MovieDetails";
import UserProfile from "./components/UserProfile";
import PreferenceForm from "./components/PreferenceForm";
import StarRating from "./components/StarRating";
import WatchParty from "./components/WatchParty";

import "./styles/App.css";
import "./styles/Header.css";
import "./styles/Footer.css";

const MOVIE_GENRES = [
  { id: 28, name: "Боевики" },
  { id: 35, name: "Комедии" },
  { id: 18, name: "Драмы" },
  { id: 878, name: "Фантастика" },
  { id: 27, name: "Ужасы" },
];

function App() {
  const [popularMovies, setPopularMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [recs, setRecs] = useState([]); // Данные для блока AI SVD
  const [prefRecs, setPrefRecs] = useState([]); // Данные для блока PREF (Анкета)
  const [favorites, setFavorites] = useState([]);
  const [genreMovies, setGenreMovies] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(28);

  const [view, setView] = useState("home");
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState(0);
  const [user, setUser] = useState(localStorage.getItem("userEmail"));

  // Состояние для обязательной формы предпочтений
  // Проверяем статус в localStorage при загрузке
  const [showPrefForm, setShowPrefForm] = useState(
    localStorage.getItem(`pref_done_${localStorage.getItem("userEmail")}`) !==
      "true",
  );

  const [activeRoomId, setActiveRoomId] = useState(null);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setView("home");
    setSelectedMovieId(null);
    setShowPrefForm(false);
    setActiveRoomId(null);
  };

  const fetchByGenre = useCallback(async (genreId) => {
    setSelectedGenre(genreId);
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/movies/genre/${genreId}`,
      );
      setGenreMovies(res.data.results);
    } catch (err) {
      console.error("Ошибка загрузки жанра:", err);
    }
  }, []);

  const refreshAllData = useCallback(async () => {
    if (!user) return;

    const fetchSafe = async (url) => {
      try {
        const res = await axios.get(url);
        return res.data.results || [];
      } catch (err) {
        console.error(`Ошибка запроса к ${url}:`, err);
        return [];
      }
    };

    const popData = await fetchSafe("http://127.0.0.1:8000/movies/popular");
    const topData = await fetchSafe("http://127.0.0.1:8000/movies/top_rated");
    const recData = await fetchSafe(
      `http://127.0.0.1:8000/movies/recommendations/${user}`,
    );
    const prefData = await fetchSafe(
      `http://127.0.0.1:8000/movies/by_preferences/${user}`,
    );

    setPopularMovies(popData);
    setTopRatedMovies(topData);
    setRecs(recData);
    setPrefRecs(prefData);
  }, [user]);

  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get(`http://127.0.0.1:8000/favorites/${user}`);
      setFavorites(res.data.favorites);
    } catch (err) {
      console.error("Ошибка загрузки избранного:", err);
    }
  }, [user]);

  const searchMovies = useCallback(async (query) => {
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/movies/search?query=${query}`,
      );
      setPopularMovies(res.data.results);
    } catch (err) {
      console.error("Ошибка поиска:", err);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (view === "favs") {
      fetchFavorites();
    } else if (view === "home") {
      if (popularMovies.length === 0) refreshAllData();
      if (genreMovies.length === 0) fetchByGenre(28);

      if (searchTerm.trim() !== "") {
        const delayDebounceFn = setTimeout(() => {
          searchMovies(searchTerm);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
      }
    }
  }, [
    user,
    view,
    searchTerm,
    refreshAllData,
    fetchFavorites,
    fetchByGenre,
    popularMovies.length,
    genreMovies.length,
  ]);

  const openMovie = (id) => {
    setSelectedMovieId(id);
    window.scrollTo(0, 0);
  };

  const navigateTo = (newView) => {
    setView(newView);
    setSelectedMovieId(null);
    setRatingFilter(0);
    setActiveRoomId(null);
  };

  const handleLoginSuccess = (email) => {
    setUser(email);
    localStorage.setItem("userEmail", email);
    // Проверка: заполнял ли уже пользователь анкету?
    if (localStorage.getItem(`pref_done_${email}`) !== "true") {
      setShowPrefForm(true);
    } else {
      setShowPrefForm(false);
    }
  };

  // Функция для присоединения к комнате друга
  const joinRoomById = () => {
    const id = prompt("Введите ID комнаты друга для совместного просмотра:");
    if (id && id.trim() !== "") {
      setActiveRoomId(id.trim());
    }
  };

  const filteredFavorites =
    ratingFilter > 0
      ? favorites.filter((m) => m.rating === ratingFilter)
      : favorites;

  return (
    <div className="site-wrapper">
      <header>
        <div
          className="logo"
          onClick={() => navigateTo("home")}
          style={{ cursor: "pointer" }}
        >
          AI<span>CINEMA</span>
        </div>
        {user && (
          <nav className="nav-links">
            <span
              className={`nav-item ${view === "home" && !selectedMovieId ? "active" : ""}`}
              onClick={() => navigateTo("home")}
            >
              Главная
            </span>
            <span
              className={`nav-item ${view === "favs" ? "active" : ""}`}
              onClick={() => navigateTo("favs")}
            >
              Избранное
            </span>
            <span
              className={`nav-item ${view === "profile" ? "active" : ""}`}
              onClick={() => navigateTo("profile")}
            >
              Профиль
            </span>

            {/* Кнопка входа в комнату */}
            <button className="join-room-btn" onClick={joinRoomById}>
               Войти в комнату
            </button>

            <div className="user-profile-nav">
              <span className="user-email-badge">{user}</span>
              <button className="logout-btn" onClick={handleLogout}>
                Выйти
              </button>
            </div>
          </nav>
        )}
      </header>

      <main className="main-content">
        {!user ? (
          <AuthForm onLoginSuccess={handleLoginSuccess} />
        ) : showPrefForm ? (
          /* ОБЯЗАТЕЛЬНЫЙ БЛОК ПРЕДПОЧТЕНИЙ (АНКЕТА) */
          <PreferenceForm
            userEmail={user}
            onComplete={() => {
              localStorage.setItem(`pref_done_${user}`, "true");
              setShowPrefForm(false);
              refreshAllData();
            }}
          />
        ) : activeRoomId ? (
          /* РЕЖИМ СОВМЕСТНОГО ПРОСМОТРА */
          <WatchParty
            roomId={activeRoomId}
            userEmail={user}
            onExit={() => setActiveRoomId(null)}
          />
        ) : selectedMovieId ? (
          /* ДЕТАЛИ ФИЛЬМА */
          <MovieDetails
            movieId={selectedMovieId}
            userEmail={user}
            onBack={() => setSelectedMovieId(null)}
            onJoinParty={(roomId) => setActiveRoomId(roomId)}
          />
        ) : view === "profile" ? (
          <UserProfile
            userEmail={user}
            onOpenMovie={openMovie}
            onEditPrefs={() => setShowPrefForm(true)}
          />
        ) : view === "favs" ? (
          <section className="favs-page">
            <div className="favs-header">
              <h2 className="section-title"> Ваша библиотека</h2>
              <div className="favs-controls">
                <div className="rating-filters">
                  {[5, 4, 3].map((num) => (
                    <button
                      key={num}
                      className={`filter-chip ${ratingFilter === num ? "active" : ""}`}
                      onClick={() =>
                        setRatingFilter(ratingFilter === num ? 0 : num)
                      }
                    >
                      {num} ★
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredFavorites.length > 0 ? (
              <div className="movie-grid">
                {filteredFavorites.map((m) => (
                  <div key={m.movie_id} className="movie-card-wrapper">
                    <div
                      onClick={() => openMovie(m.movie_id)}
                      style={{ cursor: "pointer" }}
                    >
                      <MovieCard movie={{ ...m, id: m.movie_id }} />
                    </div>
                    <StarRating
                      movieId={m.movie_id}
                      userEmail={user}
                      movieData={m}
                      initialRating={m.rating}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-container">
                <div className="empty-glow"></div>
                <div className="empty-content">
                  <div className="empty-icon-wrapper">
                    <span className="empty-icon-ai">🤖</span>
                  </div>
                  <h2>
                    {ratingFilter > 0
                      ? "ИИ не нашел совпадений"
                      : "Ваша библиотека пуста"}
                  </h2>
                  <p>
                    {ratingFilter > 0
                      ? "Попробуйте изменить фильтр."
                      : "Добавьте фильмы для обучения ИИ."}
                  </p>
                  <button
                    className="modern-glass-button"
                    onClick={() => navigateTo("home")}
                  >
                    Найти фильмы
                  </button>
                </div>
              </div>
            )}
          </section>
        ) : (
          /* ГЛАВНАЯ СТРАНИЦА (HOME) */
          <div className="home-fade-in">
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

            {!searchTerm ? (
              <div className="home-sections">
                {/* 1. БЛОК AI SVD (Коллаборативная фильтрация) */}
                <section className="ultra-section ai-glow-section">
                  <div className="section-header">
                    <div className="header-title-wrap">
                      <span className="section-icon">✨</span>
                      <h2 className="section-title">
                        Для вас от AI SVD (Опыт других)
                      </h2>
                    </div>
                    <div className="ai-status-tag">Модель обучена</div>
                  </div>
                  <div className="movie-grid">
                    {recs.length > 0 ? (
                      recs.map((m) => (
                        <div
                          key={m.id}
                          className="modern-card-hover"
                          onClick={() => openMovie(m.id)}
                        >
                          <MovieCard movie={m} />
                        </div>
                      ))
                    ) : (
                      <div className="ai-placeholder">
                        <p>Оцените больше фильмов для работы SVD...</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* 2. БЛОК PREF (Рекомендации на основе Анкеты) */}
                <section className="ultra-section pref-glow-section">
                  <div className="section-header">
                    <div className="header-title-wrap">
                      <span className="section-icon">🎯</span>
                      <h2 className="section-title">
                        На основе вашей анкеты (PREF)
                      </h2>
                    </div>
                  </div>
                  <div className="movie-grid">
                    {prefRecs.length > 0 ? (
                      prefRecs.map((m) => (
                        <div
                          key={m.id}
                          className="modern-card-hover"
                          onClick={() => openMovie(m.id)}
                        >
                          <MovieCard movie={m} />
                        </div>
                      ))
                    ) : (
                      <div className="ai-placeholder">
                        <p>Заполните анкету для получения рекомендаций...</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* 3. ЖАНРЫ */}
                <section className="ultra-section">
                  <div className="section-header">
                    <div className="header-title-wrap">
                      <span className="section-icon">🎭</span>
                      <h2 className="section-title">Исследовать жанры</h2>
                    </div>
                  </div>
                  <div className="modern-genre-tabs">
                    {MOVIE_GENRES.map((g) => (
                      <button
                        key={g.id}
                        className={`modern-genre-btn ${selectedGenre === g.id ? "active" : ""}`}
                        onClick={() => fetchByGenre(g.id)}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                  <div className="movie-grid">
                    {genreMovies.map((m) => (
                      <div
                        key={m.id}
                        className="modern-card-hover"
                        onClick={() => openMovie(m.id)}
                      >
                        <MovieCard movie={m} />
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              /* ПОИСК */
              <section className="ultra-section">
                <div className="section-header">
                  <h2 className="section-title">Результаты поиска</h2>
                </div>
                <div className="movie-grid">
                  {popularMovies.map((m) => (
                    <div
                      key={m.id}
                      className="modern-card-hover"
                      onClick={() => openMovie(m.id)}
                    >
                      <MovieCard movie={m} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ПОПУЛЯРНОЕ (ВСЕГДА ВНИЗУ ГЛАВНОЙ) */}
            {!searchTerm && (
              <section className="ultra-section">
                <div className="section-header">
                  <div className="header-title-wrap">
                    <span className="section-icon">🔥</span>
                    <h2 className="section-title">Сейчас популярно</h2>
                  </div>
                </div>
                <div className="movie-grid">
                  {popularMovies.map((m) => (
                    <div
                      key={m.id}
                      className="modern-card-hover"
                      onClick={() => openMovie(m.id)}
                    >
                      <MovieCard movie={m} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <footer>
        <p>© 2026 AI Cinema Project | Дипломная работа</p>
        <p style={{ fontSize: "0.7rem", marginTop: "5px" }}>
          FastAPI + React + SVD Hybrid Engine
        </p>
      </footer>
    </div>
  );
}

export default App;
