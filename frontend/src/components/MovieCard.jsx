import React from "react";
import StarRating from "./StarRating";
import "../styles/MovieCard.css";

const MovieCard = ({ movie }) => {
  const userEmail = localStorage.getItem("userEmail");

  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://via.placeholder.com/500x750?text=Нет+постера";

  const year = movie.release_date ? movie.release_date.split("-")[0] : "Н/Д";
  const tmdbRating = movie.vote_average ? movie.vote_average.toFixed(1) : "—";

  return (
    <div className="movie-card">
      <img
        src={imageUrl}
        alt={movie.title}
        className="movie-poster"
        loading="lazy"
      />

      <div className="movie-info">
        <h3 className="movie-title">{movie.title}</h3>
        <span className="movie-year">{year}</span>
      </div>

      <div className="movie-overlay">
        <div className="overlay-content">
          <span className="movie-rating">⭐ TMDB: {tmdbRating}</span>
          <p className="movie-overview">
            {movie.overview
              ? movie.overview.length > 120
                ? movie.overview.substring(0, 120) + "..."
                : movie.overview
              : "Описание отсутствует."}
          </p>
          <div className="card-rating-wrapper">
            <p className="rate-text">ОЦЕНИТЬ:</p>
            <StarRating
              movieId={movie.id}
              userEmail={userEmail}
              movieData={movie}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
