import React, { useState } from "react";
import axios from "axios";

const StarRating = ({
  movieId,
  userEmail,
  movieData = {},
  initialRating = 0,
}) => {
  const [hover, setHover] = useState(0);
  const [ratingScore, setRatingScore] = useState(initialRating);

  const handleRate = async (score) => {
    if (!userEmail) return;
    setRatingScore(score);
    try {
      await axios.post("http://127.0.0.1:8000/favorites/add", {
        email: userEmail,
        movie_id: movieId,
        title: movieData.title || "Фильм",
        poster_path: movieData.poster_path || "",
        release_date: movieData.release_date || "",
        rating: score,
      });
    } catch (err) {
      console.error("Ошибка при оценке:", err);
    }
  };

  return (
    <div className="modern-rating" onClick={(e) => e.stopPropagation()}>
      <div className="stars-group">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star-icon ${star <= (hover || ratingScore) ? "active" : ""}`}
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
          >
            ★
          </span>
        ))}
      </div>
      {ratingScore > 0 && <div className="rating-value">{ratingScore}/5</div>}
    </div>
  );
};

export default StarRating;
