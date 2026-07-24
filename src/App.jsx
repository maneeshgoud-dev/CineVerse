import { useEffect, useState } from "react";
import Search from "./components/Search.jsx";
import Spinner from "./components/Spinner.jsx";
import MovieCard from "./components/MovieCard.jsx";
import MovieDetailModal from "./components/MovieDetailModal.jsx";
import { useDebounce } from "react-use";
import { updateSearchCount, getTrendingMovies } from "./appwrite.js";
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

// TMDB genre list with emoji icons
const GENRES = [
  { id: 28,    name: "Action",         emoji: "💥" },
  { id: 35,    name: "Comedy",         emoji: "😂" },
  { id: 27,    name: "Horror",         emoji: "👻" },
  { id: 10749, name: "Romance",        emoji: "❤️" },
  { id: 878,   name: "Sci-Fi",         emoji: "🚀" },
  { id: 16,    name: "Animation",      emoji: "🎨" },
  { id: 53,    name: "Thriller",       emoji: "🔪" },
  { id: 18,    name: "Drama",          emoji: "🎭" },
  { id: 14,    name: "Fantasy",        emoji: "🧙" },
  { id: 80,    name: "Crime",          emoji: "🕵️" },
  { id: 12,    name: "Adventure",      emoji: "🗺️" },
  { id: 10751, name: "Family",         emoji: "👨‍👩‍👧" },
  { id: 36,    name: "History",        emoji: "🏛️" },
  { id: 10752, name: "War",            emoji: "⚔️" },
  { id: 9648,  name: "Mystery",        emoji: "🔍" },
  { id: 10402, name: "Music",          emoji: "🎵" },
  { id: 37,    name: "Western",        emoji: "🤠" },
  { id: 99,    name: "Documentary",    emoji: "🎥" },
];

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

  // Top searched movies from Appwrite (ranked by user search count)
  const [topSearched, setTopSearched] = useState([]);

  // Active genre filter
  const [activeGenre, setActiveGenre] = useState(null); // { id, name, emoji }
  const [genreMovies, setGenreMovies] = useState([]);
  const [genreLoading, setGenreLoading] = useState(false);

  // Selected movie for detail modal
  const [selectedMovie, setSelectedMovie] = useState(null);

  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);

  const isSearching = searchTerm.trim().length > 0;
  const isGenreMode = !isSearching && activeGenre !== null;

  // ── Fetch movies by text search ────────────────────────────────────────
  const fetchMovies = async (query = "") => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

      const response = await fetch(endpoint, API_OPTIONS);
      if (!response.ok) throw new Error("Failed to fetch movies");

      const data = await response.json();

      if (data.Response === "False") {
        setErrorMessage(data.Error || "Failed to fetch movies");
        setMovieList([]);
        return;
      }

      setMovieList(data.results || []);

      if (query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
        loadTopSearched();
      }
    } catch (error) {
      console.error(`Error fetching movies: ${error}`);
      setMovieList(fallbackMovies);
      setErrorMessage("");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Fetch movies by genre ──────────────────────────────────────────────
  const fetchGenreMovies = async (genre) => {
    setGenreLoading(true);
    setGenreMovies([]);
    try {
      const res = await fetch(
        `${API_BASE_URL}/discover/movie?with_genres=${genre.id}&sort_by=popularity.desc&page=1`,
        API_OPTIONS
      );
      if (!res.ok) throw new Error("Failed to fetch genre movies");
      const data = await res.json();
      setGenreMovies(data.results || []);
    } catch (e) {
      console.error(e);
      setGenreMovies([]);
    } finally {
      setGenreLoading(false);
    }
  };

  // ── Handle genre chip click ────────────────────────────────────────────
  const handleGenreClick = (genre) => {
    if (activeGenre?.id === genre.id) {
      // Deselect — go back to home
      setActiveGenre(null);
      setGenreMovies([]);
    } else {
      setActiveGenre(genre);
      setSearchTerm(""); // clear any active search
      fetchGenreMovies(genre);
    }
  };

  // ── Handle search input — clears genre ────────────────────────────────
  const handleSearchChange = (term) => {
    setSearchTerm(term);
    if (term.trim().length > 0) {
      setActiveGenre(null);
      setGenreMovies([]);
    }
  };

  const fetchMediaSection = async (endpoint, setter, fallbackData = []) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, API_OPTIONS);
      if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
      const data = await response.json();
      setter(data.results || fallbackData);
    } catch (error) {
      console.error(`Error fetching media section ${endpoint}: ${error}`);
      setter(fallbackData);
    }
  };

  const loadTopSearched = async () => {
    try {
      const docs = await getTrendingMovies();
      if (docs && docs.length > 0) {
        const ranked = docs.map((doc) => ({
          id: doc.movie_id,
          title: doc.searchTerm,
          poster_path: null,
          poster_url: doc.poster_url,
          vote_average: null,
          release_date: null,
          original_language: null,
          _count: doc.count,
          _docMovieId: doc.movie_id,
        }));
        setTopSearched(ranked);
      }
    } catch (e) {
      console.error("Failed to load top searched:", e);
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
    loadTopSearched();
  }, []);

  const handleMovieClick = (movie) => setSelectedMovie(movie);
  const handleCloseModal = () => setSelectedMovie(null);

  const handleTopSearchedClick = async (doc) => {
    if (!doc._docMovieId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/movie/${doc._docMovieId}`, API_OPTIONS);
      if (res.ok) {
        setSelectedMovie(await res.json());
      } else {
        setSelectedMovie(doc);
      }
    } catch {
      setSelectedMovie(doc);
    }
  };

  // ── Genre Chips bar ───────────────────────────────────────────────────
  const GenreChips = () => (
    <div className="genre-chips-bar">
      <div className="genre-chips-scroll">
        {GENRES.map((genre) => (
          <button
            key={genre.id}
            className={`genre-chip ${activeGenre?.id === genre.id ? "genre-chip-active" : ""}`}
            onClick={() => handleGenreClick(genre)}
          >
            <span className="genre-chip-emoji">{genre.emoji}</span>
            <span>{genre.name}</span>
          </button>
        ))}
      </div>
    </div>
  );

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

          <Search searchTerm={searchTerm} setSearchTerm={handleSearchChange} />

          {/* ── Genre Category Chips ── */}
          <GenreChips />
        </header>

        {/* ─── GENRE MODE ──────────────────────────────────────────────── */}
        {isGenreMode ? (
          <section className="search-results-section">
            <div className="search-results-header">
              <h2>
                <span className="genre-result-emoji">{activeGenre.emoji}</span>{" "}
                <span className="text-gradient">{activeGenre.name}</span>{" "}
                Movies
              </h2>
              <button
                className="clear-search-btn"
                onClick={() => {
                  setActiveGenre(null);
                  setGenreMovies([]);
                }}
              >
                ✕ Clear
              </button>
            </div>

            {genreLoading ? (
              <div className="search-loading">
                <Spinner />
                <p>Loading {activeGenre.name} movies…</p>
              </div>
            ) : genreMovies.length === 0 ? (
              <div className="no-results">
                <p>No {activeGenre.name} movies found.</p>
              </div>
            ) : (
              <ul className="search-results-grid">
                {genreMovies.map((movie, index) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onClick={handleMovieClick}
                    rank={index < 3 ? index + 1 : undefined}
                  />
                ))}
              </ul>
            )}
          </section>
        ) : isSearching ? (
          /* ─── SEARCH MODE ────────────────────────────────────────────── */
          <section className="search-results-section">
            <div className="search-results-header">
              <h2>
                Results for{" "}
                <span className="text-gradient">"{searchTerm}"</span>
              </h2>
              <button
                className="clear-search-btn"
                onClick={() => setSearchTerm("")}
              >
                ✕ Clear
              </button>
            </div>

            {isLoading ? (
              <div className="search-loading">
                <Spinner />
                <p>Searching…</p>
              </div>
            ) : errorMessage ? (
              <p className="text-red-500">{errorMessage}</p>
            ) : movieList.length === 0 ? (
              <div className="no-results">
                <p>No movies found for "{searchTerm}"</p>
              </div>
            ) : (
              <ul className="search-results-grid">
                {movieList.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onClick={handleMovieClick}
                  />
                ))}
              </ul>
            )}
          </section>
        ) : (
          /* ─── HOME MODE ──────────────────────────────────────────────── */
          <>
            {/* Top Searched Ranking */}
            {topSearched.length > 0 && (
              <section className="top-searched-section">
                <div className="top-searched-header">
                  <h2>🏆 Most Searched</h2>
                  <p className="top-searched-subtitle">
                    Ranked by CineVerse users
                  </p>
                </div>
                <div className="top-searched-list">
                  {topSearched.slice(0, 5).map((doc, index) => (
                    <div
                      key={doc.id || index}
                      className={`top-searched-item rank-item-${index + 1}`}
                      onClick={() => handleTopSearchedClick(doc)}
                    >
                      <div className={`top-rank-number rank-num-${Math.min(index + 1, 3)}`}>
                        #{index + 1}
                      </div>
                      <div className="top-searched-poster">
                        <img src={doc.poster_url || "/no-movie.png"} alt={doc.title} />
                      </div>
                      <div className="top-searched-info">
                        <p className="top-searched-title">{doc.title}</p>
                        <p className="top-searched-count">
                          {doc._count}{" "}
                          {doc._count === 1 ? "search" : "searches"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="media-section">
              <h2>Trending Movies</h2>
              <ul>
                {trendingMovies.map((movie, index) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onClick={handleMovieClick}
                    rank={index < 3 ? index + 1 : undefined}
                  />
                ))}
              </ul>
            </section>

            <section className="media-section">
              <h2>Top IMDb Movies</h2>
              <ul>
                {topRatedMovies.map((movie, index) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onClick={handleMovieClick}
                    rank={index < 3 ? index + 1 : undefined}
                  />
                ))}
              </ul>
            </section>

            <section className="media-section">
              <h2>Trending TV Shows</h2>
              <ul>
                {trendingTvShows.map((show, index) => (
                  <MovieCard
                    key={show.id}
                    movie={show}
                    onClick={handleMovieClick}
                    rank={index < 3 ? index + 1 : undefined}
                  />
                ))}
              </ul>
            </section>

            <section className="media-section">
              <h2>Top IMDb TV Shows</h2>
              <ul>
                {topRatedTvShows.map((show, index) => (
                  <MovieCard
                    key={show.id}
                    movie={show}
                    onClick={handleMovieClick}
                    rank={index < 3 ? index + 1 : undefined}
                  />
                ))}
              </ul>
            </section>

            <section className="all-movies">
              <h2>Popular Movies</h2>

              {isLoading ? (
                <Spinner />
              ) : errorMessage ? (
                <p className="text-red-500">{errorMessage}</p>
              ) : (
                <ul>
                  {movieList.map((movie, index) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      onClick={handleMovieClick}
                      rank={index < 3 ? index + 1 : undefined}
                    />
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>

      {/* Movie Detail Modal */}
      {selectedMovie && (
        <MovieDetailModal movie={selectedMovie} onClose={handleCloseModal} />
      )}
    </main>
  );
};

export default App;
