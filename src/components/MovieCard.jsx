import React from "react";

const MovieCard = ({
  movie,
  onClick,
  rank,
}) => {
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

  const displayTitle = title || name || "Untitled";
  const releaseYear = release_date || first_air_date;

  const rankColors = {
    1: "rank-gold",
    2: "rank-silver",
    3: "rank-bronze",
  };

  return (
    <div
      className="movie-card"
      onClick={() => onClick && onClick(movie)}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="movie-card-poster-wrap">
        {rank && (
          <div className={`rank-badge ${rankColors[rank] || ""}`}>
            #{rank}
          </div>
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
