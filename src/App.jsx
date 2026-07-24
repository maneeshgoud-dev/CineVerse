import { useEffect, useState } from "react";
import Search from "./components/Search.jsx";
import Spinner from "./components/Spinner.jsx";
import MovieCard from "./components/MovieCard.jsx";
import { useDebounce } from "react-use";
import { updateSearchCount } from "./appwrite.js";
import fallbackMovies from "./fallbackMovies.js";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
  },
};

const App = () => {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [movieList, setMovieList] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [trendingMovies, setTrendingMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [trendingTvShows, setTrendingTvShows] = useState([]);
  const [topRatedTvShows, setTopRatedTvShows] = useState([]);

  // Debounce the search term to prevent making too many API requests
  // by waiting for the user to stop typing for 500ms
  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);

  const fetchMovies = async (query = "") => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

      const response = await fetch(endpoint, API_OPTIONS);

      if (!response.ok) {
        throw new Error("Failed to fetch movies");
      }

      const data = await response.json();

      if (data.Response === "False") {
        setErrorMessage(data.Error || "Failed to fetch movies");
        setMovieList([]);
        return;
      }

      setMovieList(data.results || []);

      if (query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }
    } catch (error) {
      console.error(`Error fetching movies: ${error}`);
      setMovieList(fallbackMovies);
      setErrorMessage("");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMediaSection = async (endpoint, setter, fallbackData = []) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, API_OPTIONS);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${endpoint}`);
      }

      const data = await response.json();
      setter(data.results || fallbackData);
    } catch (error) {
      console.error(`Error fetching media section ${endpoint}: ${error}`);
      setter(fallbackData);
    }
  };

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchMediaSection("/trending/movie/day", setTrendingMovies, fallbackMovies);
    fetchMediaSection("/movie/top_rated", setTopRatedMovies, fallbackMovies);
    fetchMediaSection("/trending/tv/day", setTrendingTvShows, []);
    fetchMediaSection("/tv/top_rated", setTopRatedTvShows, []);
  }, []);

  return (
    <main>
      <div className="pattern" />

      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>
            Find <span className="text-gradient">Movies</span> You'll Enjoy
            Without the Hassle
          </h1>

          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        <section className="media-section">
          <h2>Trending Movies</h2>
          <ul>
            {trendingMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </ul>
        </section>

        <section className="media-section">
          <h2>Top IMDb Movies</h2>
          <ul>
            {topRatedMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </ul>
        </section>

        <section className="media-section">
          <h2>Trending TV Shows</h2>
          <ul>
            {trendingTvShows.map((show) => (
              <MovieCard key={show.id} movie={show} />
            ))}
          </ul>
        </section>

        <section className="media-section">
          <h2>Top IMDb TV Shows</h2>
          <ul>
            {topRatedTvShows.map((show) => (
              <MovieCard key={show.id} movie={show} />
            ))}
          </ul>
        </section>

        <section className="all-movies">
          <h2>Search Results</h2>

          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
};

export default App;
