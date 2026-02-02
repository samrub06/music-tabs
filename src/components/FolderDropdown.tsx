'use client';

import { Folder } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { ChevronDownIcon, FolderIcon } from '@heroicons/react/24/outline';
import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface FolderDropdownProps {
  currentFolderId?: string;
  folders: Folder[];
  onFolderChange: (folderId: string | undefined) => Promise<void>;
  disabled?: boolean;
}

export default function FolderDropdown({ 
  currentFolderId, 
  folders, 
  onFolderChange, 
  disabled = false 
}: FolderDropdownProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  // Mount effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const getCurrentFolderName = () => {
    if (!currentFolderId) return t('songs.unorganized');
    const folder = folders.find(f => f.id === currentFolderId);
    return folder ? folder.name : t('songs.unknownFolder');
  };

  const handleFolderSelect = async (folderId: string | undefined) => {
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    try {
      await onFolderChange(folderId);
      setIsOpen(false);
    } catch (error) {
      console.error('Error changing folder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDropdownPosition = () => {
    if (!buttonRef.current) return;
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 200; // Estimation de la hauteur du dropdown
    
    // Stocker la position du bouton
    setButtonPosition({
      top: buttonRect.top,
      left: buttonRect.left,
      width: buttonRect.width
    });
    
    // Si le dropdown déborderait en bas, on le positionne en haut
    if (buttonRect.bottom + dropdownHeight > viewportHeight - 20) {
      setDropdownPosition('top');
    } else {
      setDropdownPosition('bottom');
    }
  };

  const handleToggle = () => {
    if (disabled) return;
    
    if (!isOpen) {
      calculateDropdownPosition();
    }
    setIsOpen(!isOpen);
  };

  const dropdownContent = isOpen && !disabled && mounted && (
    <div
      ref={dropdownRef}
      className="fixed rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-[9999] max-h-[300px] overflow-y-auto min-w-fit max-w-xs"
      style={{
        top: dropdownPosition === 'bottom' 
          ? `${buttonPosition.top + 32}px` 
          : `${buttonPosition.top - 200}px`,
        left: `${buttonPosition.left}px`,
        width: 'auto'
      }}
    >
      <div className="py-1">
        <button
          onClick={() => handleFolderSelect(undefined)}
          className={`
            w-full text-left px-4 py-2 text-sm flex items-center space-x-2
            ${!currentFolderId
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
            }
          `}
        >
          <FolderIcon className="h-4 w-4" />
          <span>{t('songs.unorganized')}</span>
        </button>
        
        {folders.map((folder) => (
          <button
            key={folder.id}
            onClick={() => handleFolderSelect(folder.id)}
            className={`
              w-full text-left px-4 py-2 text-sm flex items-center space-x-2
              ${currentFolderId === folder.id
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            <FolderIcon className="h-4 w-4" />
            <span className="truncate">{folder.name}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-200
          ${disabled || isLoading 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : isOpen 
              ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-200' 
              : 'bg-gray-100 text-gray-800 hover:bg-blue-50 hover:text-blue-700 hover:ring-1 hover:ring-blue-200'
          }
        `}
      >
        <FolderIcon className="h-3 w-3 mr-1.5 flex-shrink-0" />
        <span className="truncate max-w-[100px]">
          {isLoading ? '...' : getCurrentFolderName()}
        </span>
        {!disabled && !isLoading && (
          <ChevronDownIcon className={`h-3 w-3 ml-1.5 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {mounted && createPortal(dropdownContent, document.body)}
    </>
  );
}
