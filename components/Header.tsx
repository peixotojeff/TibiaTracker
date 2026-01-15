'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';

export function Header() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <header className="bg-gray-900 text-white shadow-lg border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">⚡</span>
              </div>
              <span className="font-bold text-lg hidden sm:inline bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Tibia Tracker
              </span>
            </Link>

            {/* Navigation Menu */}
            <nav className="hidden md:flex gap-6">
              <Link
                href="/dashboard"
                className="text-gray-300 hover:text-white transition duration-200 text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/characters"
                className="text-gray-300 hover:text-white transition duration-200 text-sm font-medium"
              >
                Personagens
              </Link>
              <Link
                href="/statistics"
                className="text-gray-300 hover:text-white transition duration-200 text-sm font-medium"
              >
                Estatísticas
              </Link>
              <Link
                href="/help"
                className="text-gray-300 hover:text-white transition duration-200 text-sm font-medium"
              >
                Ajuda
              </Link>
            </nav>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-800 transition duration-200"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium hidden sm:inline">
                {user?.email?.split('@')[0] || 'User'}
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl z-50 border border-gray-700">
                <div className="px-4 py-3 border-b border-gray-700">
                  <p className="text-sm text-gray-400">Logado como</p>
                  <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                </div>
                <div className="py-2">
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/characters"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Meus Personagens
                  </Link>
                  <Link
                    href="/statistics"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Estatísticas
                  </Link>
                  <Link
                    href="/help"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Ajuda
                  </Link>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition border-t border-gray-700 mt-2"
                  >
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
