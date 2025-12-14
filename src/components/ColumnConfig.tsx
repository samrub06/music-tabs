'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Cog6ToothIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ChevronDownIcon 
} from '@heroicons/react/24/outline';

interface ColumnConfigProps {
  visibleColumns: string[];
  onToggleColumn: (column: string) => void;
}

const COLUMN_DEFINITIONS = [
  { key: 'title', label: 'Titre', icon: '📝', defaultVisible: true },
  { key: 'author', label: 'Artiste', icon: '👤', defaultVisible: true },
  { key: 'key', label: 'Tonalité', icon: '🎵', defaultVisible: true },
  { key: 'rating', label: 'Note', icon: '⭐', defaultVisible: true },
  { key: 'reviews', label: 'Avis', icon: '👥', defaultVisible: false },
  { key: 'difficulty', label: 'Difficulté', icon: '🎸', defaultVisible: false },
  { key: 'version', label: 'Version', icon: '🔢', defaultVisible: false },
  { key: 'viewCount', label: 'Vues', icon: '👁️', defaultVisible: true },
  { key: 'folder', label: 'Dossier', icon: '📁', defaultVisible: true },
  { key: 'updatedAt', label: 'Modifié', icon: '📅', defaultVisible: false },
];

export default function ColumnConfig({ visibleColumns, onToggleColumn }: ColumnConfigProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        buttonRef.current &&
        menuRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Cog6ToothIcon className="h-4 w-4" />
        <span>Colonnes</span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Overlay pour fermer le menu */}
          <div 
            className="fixed inset-0 z-[100]" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu de configuration */}
          <div 
            ref={menuRef}
            className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-[101]"
          >
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Afficher les colonnes</h3>
              
              <div className="space-y-2">
                {COLUMN_DEFINITIONS.map((column) => {
                  const isVisible = visibleColumns.includes(column.key);
                  
                  return (
                    <label
                      key={column.key}
                      className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                        column.key === 'title' 
                          ? 'cursor-not-allowed opacity-60' 
                          : 'cursor-pointer hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => onToggleColumn(column.key)}
                        disabled={column.key === 'title'}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:cursor-not-allowed"
                      />
                      <span className="text-lg">{column.icon}</span>
                      <span className="text-sm text-gray-700 flex-1">{column.label}</span>
                      {isVisible ? (
                        <EyeIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </label>
                  );
                })}
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-200">
                <button
                  onClick={() => {
                    // Réinitialiser aux colonnes par défaut
                    const defaultColumns = COLUMN_DEFINITIONS
                      .filter(col => col.defaultVisible)
                      .map(col => col.key);
                    defaultColumns.forEach(col => {
                      if (!visibleColumns.includes(col)) {
                        onToggleColumn(col);
                      }
                    });
                    visibleColumns.forEach(col => {
                      if (!defaultColumns.includes(col)) {
                        onToggleColumn(col);
                      }
                    });
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
