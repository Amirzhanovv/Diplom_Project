import { useEffect, useState } from "react";
import { getPopularMovies, searchMovies } from "../services/api";
import MovieCard from "../components/MovieCard";
import SearchBar from "../components/SearchBar";

export default function Home() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    getPopularMovies().then(setMovies);
  }, []);

  const handleSearch = async (query) => {
    if (!query) {
      const data = await getPopularMovies();
      setMovies(data);
      return;
    }

    const results = await searchMovies(query);
    setMovies(results);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🔥 AI Cinema</h1>

      <SearchBar onSearch={handleSearch} />

      <div style={styles.grid}>
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#111",
    minHeight: "100vh",
    padding: "20px",
  },
  title: {
    color: "white",
  },
  grid: {
    display: "flex",
    flexWrap: "wrap",
  },
};
