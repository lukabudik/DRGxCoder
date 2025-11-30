'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import styles from './code-search.module.css';

interface CodeSearchProps {
  value: string;
  onSelect: (code: string, name: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function CodeSearch({ value, onSelect, placeholder = 'Search diagnosis code...', autoFocus }: CodeSearchProps) {
  const [searchTerm, setSearchTerm] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  const { data: results, isLoading } = useQuery({
    queryKey: ['codes', 'search', searchTerm],
    queryFn: () => api.searchCodes(searchTerm),
    enabled: searchTerm.length >= 2 && isOpen,
  });

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || !results) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex].code, results[selectedIndex].name);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (code: string, name: string) => {
    setSearchTerm(code);
    setIsOpen(false);
    onSelect(code, name);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    setSelectedIndex(0);
  };

  return (
    <div className={styles.container}>
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => searchTerm.length >= 2 && setIsOpen(true)}
        placeholder={placeholder}
        className={styles.input}
      />

      {isOpen && searchTerm.length >= 2 && (
        <div ref={dropdownRef} className={styles.dropdown}>
          {isLoading && (
            <div className={styles.loading}>Searching...</div>
          )}

          {!isLoading && results && results.length === 0 && (
            <div className={styles.empty}>No codes found</div>
          )}

          {!isLoading && results && results.length > 0 && (
            <div className={styles.resultsList}>
              {results.slice(0, 10).map((result: any, index: number) => (
                <div
                  key={result.code}
                  className={`${styles.resultItem} ${index === selectedIndex ? styles.selected : ''}`}
                  onClick={() => handleSelect(result.code, result.name)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className={styles.resultCode}>{result.code}</div>
                  <div className={styles.resultName}>{result.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
