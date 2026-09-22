import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Home from './Home';
import AboutTfl from './AboutTfl';

const App = (): React.ReactElement => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    () => localStorage.getItem('theme') === 'dark',
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-white text-black dark:bg-gray-900 dark:text-white">
      <nav className="relative flex items-center justify-center gap-6 border-b border-gray-200 py-4 dark:border-gray-700">
        <Link to="/" className="font-medium hover:underline">
          Home
        </Link>
        <Link to="/about-tfl" className="font-medium hover:underline">
          About TfL
        </Link>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="absolute right-6 rounded-full border border-gray-300 px-3 py-1 text-sm font-medium hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          {isDarkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about-tfl" element={<AboutTfl />} />
      </Routes>
    </div>
  );
};

export default App;
