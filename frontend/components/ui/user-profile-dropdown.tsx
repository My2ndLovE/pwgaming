'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { User, LogOut, ChevronDown } from 'lucide-react';

interface UserAvatarProps {
  size?: number;
  iconSize?: number;
}

function UserAvatar({ size = 32, iconSize = 18 }: UserAvatarProps) {
  return (
    <div
      className="rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white"
      style={{ width: size, height: size }}
    >
      <User size={iconSize} />
    </div>
  );
}

export function UserProfileDropdown() {
  const { user, logout, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  // Get display name
  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.firstName || user.username;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="User profile menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex items-center gap-2">
          <UserAvatar size={32} iconSize={18} />
          <div className="hidden md:block text-left">
            <div className="text-sm font-medium">{displayName}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              @{user.username}
            </div>
          </div>
          <ChevronDown
            size={16}
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <UserAvatar size={40} iconSize={20} />
                <div>
                  <div className="text-sm font-medium">{displayName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    @{user.username}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              role="menuitem"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
