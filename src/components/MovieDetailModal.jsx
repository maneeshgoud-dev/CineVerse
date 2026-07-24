import React, { useEffect, useState } from "react";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
  },
};

// Well-known streaming service brand colors & logos (fallback icons)
const PROVIDER_COLORS = {
  "Netflix": "#E50914",
  "Amazon Prime Video": "#00A8E0",
  "Disney Plus": "#113CCF",
  "Apple TV Plus": "#555555",
  "Hulu": "#1CE783",
  "HBO Max": "#5822B4",
  "Max": "#5822B4",
  "Peacock": "#000000",
  "Paramount Plus": "#0064FF",
  "Crunchyroll": "#F47521",
  "default": "#AB8BFF",
};

const MovieDetailModal = ({ movie, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState(null);

  const isTV = !movie.title && !!movie.name;
  const mediaType = isTV ? "tv" : "movie";

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        // Fetch details and watch providers in parallel
        const [detailsRes, providersRes] = await Promise.all([
          fetch(`${API_BASE_URL}/${mediaType}/${movie.id}`, API_OPTIONS),
          fetch(`${API_BASE_URL}/${mediaType}/${movie.id}/watch/providers`, API_OPTIONS),
        ]);

        const detailsData = await detailsRes.json();
        const providersData = await providersRes.json();

        setDetails(detailsData);

        // Try to get providers for India first, then US, then any available region
        const results = providersData.results || {};
        const regionData = results["IN"] || results["US"] || Object.values(results)[0] || null;
        setProviders(regionData);
      } catch (e) {
        console.error(e);
        setDetails(null);
        setProviders(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();

    // Lock body scroll
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [movie.id, mediaType]);

  const displayTitle = movie.title || movie.name || "Untitled";
  const releaseYear =
    (movie.release_date || movie.first_air_date || "").split("-")[0] || "N/A";
  const posterSrc = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : movie.poster_url || "/no-movie.png";

  const backdropSrc = details?.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}`
    : null;

  const genres = details?.genres?.map((g) => g.name) || [];
  const overview = details?.overview || movie.overview || "No description available.";
  const runtime = details?.runtime
    ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`
    : details?.episode_run_time?.[0]
    ? `${details.episode_run_time[0]}m / ep`
    : null;

  // Collect unique streaming providers (flatrate = subscription, rent, buy)
  const streamProviders = providers?.flatrate || [];
  const rentProviders = providers?.rent || [];
  const buyProviders = providers?.buy || [];
  const watchLink = providers?.link || null;

  const hasProviders = streamProviders.length > 0 || rentProviders.length > 0 || buyProviders.length > 0;

  const ProviderLogo = ({ provider }) => {
    const color = PROVIDER_COLORS[provider.provider_name] || PROVIDER_COLORS.default;
    return (
      <div
        className="provider-logo-wrap"
        title={provider.provider_name}
        style={{ "--provider-color": color }}
      >
        {provider.logo_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
            alt={provider.provider_name}
            className="provider-logo-img"
          />
        ) : (
          <div className="provider-logo-placeholder">
            {provider.provider_name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <span className="provider-name-tooltip">{provider.provider_name}</span>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Backdrop */}
        {backdropSrc && (
          <div className="modal-backdrop">
            <img src={backdropSrc} alt="backdrop" />
            <div className="modal-backdrop-fade" />
          </div>
        )}

        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="modal-content">
          {/* Poster */}
          <div className="modal-poster">
            <img src={posterSrc} alt={displayTitle} />
          </div>

          {/* Info */}
          <div className="modal-info">
            {loading ? (
              <div className="modal-loading">
                <div className="modal-spinner" />
                <p>Loading details…</p>
              </div>
            ) : (
              <>
                <div className="modal-badges">
                  {genres.slice(0, 3).map((g) => (
                    <span key={g} className="modal-badge">{g}</span>
                  ))}
                  {mediaType === "tv" && (
                    <span className="modal-badge modal-badge-tv">TV Show</span>
                  )}
                </div>

                <h2 className="modal-title">{displayTitle}</h2>

                <div className="modal-meta-row">
                  <div className="modal-rating">
                    <img src="/star.svg" alt="star" />
                    <span>{movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}</span>
                  </div>
                  {releaseYear !== "N/A" && (
                    <>
                      <span className="modal-dot">•</span>
                      <span className="modal-year">{releaseYear}</span>
                    </>
                  )}
                  {runtime && (
                    <>
                      <span className="modal-dot">•</span>
                      <span className="modal-runtime">{runtime}</span>
                    </>
                  )}
                  <span className="modal-dot">•</span>
                  <span className="modal-lang">{movie.original_language?.toUpperCase()}</span>
                </div>

                <p className="modal-overview">{overview}</p>

                {/* ── Where to Watch ─────────────────────────────── */}
                <div className="where-to-watch">
                  <div className="wtw-header">
                    <svg className="wtw-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <path d="M8 21h8M12 17v4" />
                    </svg>
                    <span className="wtw-title">Where to Watch</span>
                    {watchLink && (
                      <a
                        href={watchLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="wtw-all-link"
                      >
                        View all →
                      </a>
                    )}
                  </div>

                  {!hasProviders ? (
                    <p className="wtw-none">Not available for streaming in your region.</p>
                  ) : (
                    <div className="wtw-sections">
                      {streamProviders.length > 0 && (
                        <div className="wtw-section">
                          <span className="wtw-section-label">
                            <span className="wtw-dot-stream" />
                            Stream
                          </span>
                          <div className="wtw-providers">
                            {streamProviders.slice(0, 6).map((p) => (
                              <ProviderLogo key={p.provider_id} provider={p} />
                            ))}
                          </div>
                        </div>
                      )}
                      {rentProviders.length > 0 && (
                        <div className="wtw-section">
                          <span className="wtw-section-label">
                            <span className="wtw-dot-rent" />
                            Rent
                          </span>
                          <div className="wtw-providers">
                            {rentProviders.slice(0, 4).map((p) => (
                              <ProviderLogo key={p.provider_id} provider={p} />
                            ))}
                          </div>
                        </div>
                      )}
                      {buyProviders.length > 0 && (
                        <div className="wtw-section">
                          <span className="wtw-section-label">
                            <span className="wtw-dot-buy" />
                            Buy
                          </span>
                          <div className="wtw-providers">
                            {buyProviders.slice(0, 4).map((p) => (
                              <ProviderLogo key={p.provider_id} provider={p} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="modal-stats">
                  {details?.vote_count > 0 && (
                    <div className="modal-stat">
                      <span className="modal-stat-label">Vote Count</span>
                      <span className="modal-stat-value">{details.vote_count?.toLocaleString()}</span>
                    </div>
                  )}
                  {details?.popularity > 0 && (
                    <div className="modal-stat">
                      <span className="modal-stat-label">Popularity</span>
                      <span className="modal-stat-value">{details.popularity?.toFixed(0)}</span>
                    </div>
                  )}
                  {details?.status && (
                    <div className="modal-stat">
                      <span className="modal-stat-label">Status</span>
                      <span className="modal-stat-value">{details.status}</span>
                    </div>
                  )}
                  {details?.budget > 0 && (
                    <div className="modal-stat">
                      <span className="modal-stat-label">Budget</span>
                      <span className="modal-stat-value">${(details.budget / 1e6).toFixed(0)}M</span>
                    </div>
                  )}
                </div>

                {details?.production_companies?.length > 0 && (
                  <div className="modal-companies">
                    <span className="modal-stat-label">Production</span>
                    <span className="modal-companies-list">
                      {details.production_companies.slice(0, 3).map((c) => c.name).join(", ")}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailModal;
