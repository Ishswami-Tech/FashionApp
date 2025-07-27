'use client';
import React from 'react';

const Header = () => {
  const [isAuth, setIsAuth] = React.useState(false);
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAuth(localStorage.getItem('auth') === 'true');
    }
  }, []);
  const handleClick = () => {
    if (isAuth) {
      window.location.href = '/orderform';
    } else {
      window.location.href = '/auth';
    }
  };
  return (
    <header className="w-full flex justify-end items-center px-6 py-4 bg-white/80 backdrop-blur sticky top-0 z-30 shadow-sm">
      <button
        className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
        onClick={handleClick}
      >
        {isAuth ? 'Order Form' : 'Login'}
      </button>
    </header>
  );
};

export default Header; 