import React, { useState } from 'react';
import './SearchFilter.css';

const SearchFilter = ({ onSearch, onFilter, totalDecks }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const filters = [
    { id: 'all', label: 'All Decks', icon: '📚' },
    { id: 'new', label: 'Needs Practice', icon: '🔥' },
    { id: 'progress', label: 'In Progress', icon: '⏳' },
    { id: 'mastered', label: 'Mastered', icon: '✅' }
  ];

  const sortOptions = [
    { id: 'name', label: 'Name A-Z' },
    { id: 'recent', label: 'Recently Updated' },
    { id: 'progress', label: 'Progress' },
    { id: 'cards', label: 'Card Count' }
  ];

  const handleSearch = (value) => {
    setSearchTerm(value);
    onSearch(value);
  };

  const handleFilter = (filterId) => {
    setSelectedFilter(filterId);
    onFilter(filterId, sortBy);
  };

  const handleSort = (sortId) => {
    setSortBy(sortId);
    onFilter(selectedFilter, sortId);
  };

  return (
    <div className="search-filter">
      <div className="search-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search your decks..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search"
              onClick={() => handleSearch('')}
            >
              ✕
            </button>
          )}
        </div>
        
        <div className="results-info">
          <span className="results-count">
            {totalDecks} deck{totalDecks !== 1 ? 's' : ''} found
          </span>
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-tabs">
          {filters.map(filter => (
            <button
              key={filter.id}
              className={`filter-tab ${selectedFilter === filter.id ? 'active' : ''}`}
              onClick={() => handleFilter(filter.id)}
            >
              <span className="filter-icon">{filter.icon}</span>
              <span className="filter-label">{filter.label}</span>
            </button>
          ))}
        </div>

        <div className="sort-section">
          <label className="sort-label">Sort by:</label>
          <select 
            className="sort-select"
            value={sortBy}
            onChange={(e) => handleSort(e.target.value)}
          >
            {sortOptions.map(option => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchFilter;
