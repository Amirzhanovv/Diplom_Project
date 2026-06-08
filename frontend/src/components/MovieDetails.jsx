import React, { useEffect, useState } from "react";
import axios from "axios";
import StarRating from "./StarRating";
import "../styles/MovieDetails.css";

const MovieDetails = ({ movieId, userEmail, onBack, onJoinParty }) => {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/movies/${movieId}`);
        setMovie(res.data);
      } catch (err) {
        console.error("Ошибка загрузки деталей:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [movieId]);

  // Функция для создания комнаты Watch Party
  const createWatchParty = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:8000/rooms/create", null, {
        params: {
          movie_id: movieId,
          creator_email: userEmail,
          trailer_key: movie.trailer_key, // Передаем ключ трейлера
        },
      });
      onJoinParty(res.data.room_id);
    } catch (err) {
      alert("Ошибка при создании комнаты для трейлера");
    }
  };

  if (loading) return <div className="loader">Загрузка...</div>;
  if (!movie) return <div className="error-msg">Фильм не найден</div>;

  return (
    <div className="movie-details-page">
      <div className="content-container">
        <button className="back-btn-modern" onClick={onBack}>
          ← Назад
        </button>

        <div className="hero-section">
          {movie.trailer_key ? (
            <div className="video-wrapper">
              <iframe
                src={`https://www.youtube.com/embed/${movie.trailer_key}?autoplay=1&mute=1&rel=0`}
                title="Trailer"
                frameBorder="0"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <div
              className="no-trailer-backdrop"
              style={{
                backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`,
              }}
            >
              <div className="backdrop-overlay"></div>
              <p>Трейлер не найден</p>
            </div>
          )}
        </div>
      </div>

      <div className="info-grid">
        <div className="poster-side">
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={movie.title}
            className="detail-poster"
          />

          {/* КНОПКА 1: ОБЫЧНЫЙ ПРОСМОТР */}
          <button className="watch-now-btn" onClick={() => setShowPlayer(true)}>
            <span>▶</span> СМОТРЕТЬ ФИЛЬМ
          </button>

          {/* КНОПКА 2: СОЗДАТЬ КОМНАТУ (WATCH PARTY) */}
          <button className="watch-party-btn-modern" onClick={createWatchParty}>
            <span>👥</span> WATCH PARTY
          </button>
        </div>

        <div className="text-info">
          <h1 className="detail-title">
            {movie.title}{" "}
            <span className="year-dim">
              ({movie.release_date?.split("-")[0]})
            </span>
          </h1>
          <p className="tagline-modern">{movie.tagline}</p>

          <div className="details-meta-chips">
            <span className="meta-chip">📅 {movie.release_date}</span>
            <span className="meta-chip">⏱ {movie.runtime} мин.</span>
            <span className="meta-chip tmdb-gold">
              ⭐ {movie.vote_average.toFixed(1)}
            </span>
          </div>

          <div className="rating-card-modern">
            <h3>Оцените фильм для ИИ:</h3>
            <StarRating
              movieId={movie.id}
              userEmail={userEmail}
              movieData={movie}
            />
          </div>

          <p className="overview-text">{movie.overview}</p>
        </div>
      </div>

      {/* Одиночный плеер (старый режим) */}
      {showPlayer && (
        <div
          className="player-modal-overlay"
          onClick={() => setShowPlayer(false)}
        >
          <div
            className="player-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-player-btn"
              onClick={() => setShowPlayer(false)}
            >
              ×
            </button>
            <div className="iframe-container">
              <iframe
                src={`https://vidsrc.me/embed/movie/${movieId}`}
                title="Movie Player"
                frameBorder="0"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetails;
