'use client';

import { Search, X } from 'lucide-react';
import { useState } from 'react';
import styles from './search-filters.module.css';

interface SearchFiltersProps {
  onSearchChange: (search: string) => void;
  onStatusChange: (status: string) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

export function SearchFilters({
  onSearchChange,
  onStatusChange,
  onClearFilters,
  activeFiltersCount,
}: SearchFiltersProps) {
  const [searchValue, setSearchValue] = useState('');
  const [statusValue, setStatusValue] = useState('all');

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearchChange(value);
  };

  const handleStatusChange = (value: string) => {
    setStatusValue(value);
    onStatusChange(value);
  };

  const handleClear = () => {
    setSearchValue('');
    setStatusValue('all');
    onClearFilters();
  };

  return (
    <div className={styles.container}>
      {/* Search Bar */}
      <div className={styles.searchContainer}>
        <Search className={styles.searchIcon} size={18} />
        <input
          type="text"
          placeholder="Search patients, codes, diagnoses..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className={styles.searchInput}
        />
        {searchValue && (
          <button
            onClick={() => handleSearchChange('')}
            className={styles.clearButton}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <select
          value={statusValue}
          onChange={(e) => handleStatusChange(e.target.value)}
          className={styles.select}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        {activeFiltersCount > 0 && (
          <button onClick={handleClear} className={styles.clearFiltersButton}>
            Clear {activeFiltersCount} {activeFiltersCount === 1 ? 'filter' : 'filters'}
          </button>
        )}
      </div>
    </div>
  );
}
