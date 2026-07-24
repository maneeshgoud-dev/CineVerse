import React, { useState } from "react";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "hi", name: "Hindi" },
  { code: "ar", name: "Arabic" },
];

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "popularity.asc", label: "Least Popular" },
  { value: "rating.desc", label: "Highest Rated" },
  { value: "rating.asc", label: "Lowest Rated" },
  { value: "release_date.desc", label: "Newest" },
  { value: "release_date.asc", label: "Oldest" },
  { value: "primary_release_date.desc", label: "Latest Release" },
];

const Filters = ({ onFiltersChange, isVisible, onClose }) => {
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [ratingFrom, setRatingFrom] = useState("");
  const [ratingTo, setRatingTo] = useState("");
  const [language, setLanguage] = useState("");
  const [sortBy, setSortBy] = useState("popularity.desc");

  const handleApplyFilters = () => {
    onFiltersChange({
      yearFrom: yearFrom ? parseInt(yearFrom) : null,
      yearTo: yearTo ? parseInt(yearTo) : null,
      ratingFrom: ratingFrom ? parseFloat(ratingFrom) : null,
      ratingTo: ratingTo ? parseFloat(ratingTo) : null,
      language: language || null,
      sortBy,
    });
    onClose();
  };

  const handleReset = () => {
    setYearFrom("");
    setYearTo("");
    setRatingFrom("");
    setRatingTo("");
    setLanguage("");
    setSortBy("popularity.desc");
    onFiltersChange({
      yearFrom: null,
      yearTo: null,
      ratingFrom: null,
      ratingTo: null,
      language: null,
      sortBy: "popularity.desc",
    });
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="filters-overlay" onClick={onClose}>
      <div className="filters-modal" onClick={(e) => e.stopPropagation()}>
        <div className="filters-header">
          <h3>Advanced Filters</h3>
          <button className="filters-close" onClick={onClose}>✕</button>
        </div>

        <div className="filters-content">
          {/* Sort By */}
          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Year Range */}
          <div className="filter-group">
            <label>Release Year</label>
            <div className="filter-range">
              <input
                type="number"
                placeholder="From"
                value={yearFrom}
                onChange={(e) => setYearFrom(e.target.value)}
                min="1900"
                max={new Date().getFullYear()}
              />
              <span>—</span>
              <input
                type="number"
                placeholder="To"
                value={yearTo}
                onChange={(e) => setYearTo(e.target.value)}
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
          </div>

          {/* Rating Range */}
          <div className="filter-group">
            <label>Rating</label>
            <div className="filter-range">
              <input
                type="number"
                placeholder="From"
                value={ratingFrom}
                onChange={(e) => setRatingFrom(e.target.value)}
                min="0"
                max="10"
                step="0.1"
              />
              <span>—</span>
              <input
                type="number"
                placeholder="To"
                value={ratingTo}
                onChange={(e) => setRatingTo(e.target.value)}
                min="0"
                max="10"
                step="0.1"
              />
            </div>
          </div>

          {/* Language */}
          <div className="filter-group">
            <label>Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="">All Languages</option>
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filters-footer">
          <button className="filter-btn-reset" onClick={handleReset}>
            Reset
          </button>
          <button className="filter-btn-apply" onClick={handleApplyFilters}>
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default Filters;
