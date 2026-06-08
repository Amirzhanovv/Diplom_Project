import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export const getPopularMovies = async () => {
  const res = await axios.get(`${API_URL}/movies/popular`);
  return res.data.results;
};

export const searchMovies = async (query) => {
  const res = await axios.get(`${API_URL}/movies/search?q=${query}`);
  return res.data.results;
};