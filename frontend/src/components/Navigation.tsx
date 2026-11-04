import React from 'react';
import { NavLink } from 'react-router-dom';

export const Navigation: React.FC = () => {
  const navItems = [
    { name: 'Assessment', path: '/' },
    { name: 'Question mapping', path: '/scoring' },
    { name: 'Model Info', path: '/model' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm tracking-wider shadow-sm">
            PQ
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
              Psychometric Profiling
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Student Assessment & TabNet Intelligence
            </p>
          </div>
        </div>

        <nav className="flex items-center space-x-1 sm:space-x-2" aria-label="Main Navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
};

