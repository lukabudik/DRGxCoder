'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';
import styles from './simple-sidebar.module.css';

interface SimpleSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function SimpleSidebar({ isOpen, onClose, children }: SimpleSidebarProps) {
  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={styles.overlay}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <button 
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
        
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </>
  );
}
