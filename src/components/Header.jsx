import React from 'react';
import StreakCalendar from './StreakCalendar';

const Header = () => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href="/home" className="text-2xl font-bold text-blue-600">
              CodeFolio
            </a>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#profile" className="text-gray-600 hover:text-blue-600 font-medium">
              Profile
            </a>
            <a href="#community" className="text-gray-600 hover:text-blue-600 font-medium">
              Community
            </a>
            <a href="#feedback" className="text-gray-600 hover:text-blue-600 font-medium">
              Feedback
            </a>
            <a href="#tasks" className="text-gray-600 hover:text-blue-600 font-medium">
              Tasks
            </a>
          </div>

          {/* Streak Calendar */}
          <div className="flex items-center">
            <StreakCalendar />
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;