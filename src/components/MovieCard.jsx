import React, { useState, useEffect } from "react";
import {
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
} from "../appwrite";

const MovieCard = ({ movie, onClick, rank, user, onWatchlistChange }) => {
  const {
    title,
    name,
    vote_average,
    poster_path,
    release_date,
    first_air_date,
    original_language,
    poster_url,
  } = movie;

  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(""); // "added" | "removed" | ""

  const displayTitle = title || name || "Untitled";
  const releaseYear = release_date || first_air_date;

  const rankColors = {
    1: "rank-gold",
    2: "rank-silver",
    3: "rank-bronze",
  };

  useEffect(() => {
    if (user) {
      checkWatchlist();
    } else {
      setInWatchlist(false);
    }
  }, [user, movie.id]);

  const checkWatchlist = async () => {
    try {
      const isIn = await isInWatchlist(user.$id, movie.id);
      setInWatchlist(isIn);
    } catch (err) {
      console.error("Error checking watchlist:", err);
    }
  };

  const handleWatchlistClick = async (e) => {
    e.stopPropagation();
    if (!user || loading) return;

    setLoading(true);
    try {
      if (inWatchlist) {
        await removeFromWatchlist(user.$id, movie.id);
        setInWatchlist(false);
        setFeedback("removed");
      } else {
        await addToWatchlist(user.$id, movie);
        setInWatchlist(true);
        setFeedback("added");
      }
      // Notify parent (App) to refresh watchlist count
      if (onWatchlistChange) onWatchlistChange();
      setTimeout(() => setFeedback(""), 1500);
    } catch (err) {
      console.error("Error updating watchlist:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="movie-card"
      onClick={() => onClick && onClick(movie)}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="movie-card-poster-wrap">
        {rank && (
          <div className={`rank-badge ${rankColors[rank] || ""}`}>#{rank}</div>
        )}

        {user && (
          <button
            className={`watchlist-btn ${inWatchlist ? "in-watchlist" : ""} ${loading ? "loading" : ""} ${feedback === "added" ? "just-added" : ""}`}
            onClick={handleWatchlistClick}
            disabled={loading}
            title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
          >
            {loading ? (
              <span className="watchlist-btn-spinner" />
            ) : feedback === "added" ? (
              "✓"
            ) : inWatchlist ? (
              "★"
            ) : (
              "☆"
            )}
          </button>
        )}

        <img
          src={
            poster_url ||
            (poster_path
              ? `https://image.tmdb.org/t/p/w500/${poster_path}`
              : "/no-movie.png")
          }
          alt={displayTitle}
        />
      </div>

      <div className="mt-4">
        <h3>{displayTitle}</h3>

        <div className="content">
          <div className="rating">
            <img src="star.svg" alt="Star Icon" />
            <p>{vote_average ? vote_average.toFixed(1) : "N/A"}</p>
          </div>

          <span>•</span>
          <p className="lang">{original_language}</p>

          <span>•</span>
          <p className="year">
            {releaseYear ? releaseYear.split("-")[0] : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
