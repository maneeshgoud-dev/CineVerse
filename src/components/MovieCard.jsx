import React from "react";

const MovieCard = ({
  movie: {
    title,
    name,
    vote_average,
    poster_path,
    release_date,
    first_air_date,
    original_language,
    poster_url,
  },
}) => {
  const displayTitle = title || name || "Untitled";
  const releaseYear = release_date || first_air_date;

  return (
    <div className="movie-card">
      <img
        src={
          poster_url ||
          (poster_path
            ? `https://image.tmdb.org/t/p/w500/${poster_path}`
            : "/no-movie.png")
        }
        alt={displayTitle}
      />

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
