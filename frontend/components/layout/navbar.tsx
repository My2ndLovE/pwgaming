'use client';

import Link from 'next/link';
import { UserProfileDropdown } from '@/components/ui/user-profile-dropdown';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              PW Gaming
            </Link>

            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/lobby"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Lobby
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <UserProfileDropdown />
          </div>
        </div>
      </div>
    </nav>
  );
}
