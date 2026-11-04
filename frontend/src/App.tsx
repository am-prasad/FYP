import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { AssessmentPage } from './pages/AssessmentPage';
import { ScoringPage } from './pages/ScoringPage';
import { ModelPage } from './pages/ModelPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <Navigation />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<AssessmentPage />} />
            <Route path="/scoring" element={<ScoringPage />} />
            <Route path="/model" element={<ModelPage />} />
          </Routes>
        </main>
        <footer className="no-print py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
          <p>Psychometric Profiling System &copy; {new Date().getFullYear()} — Psychometric Assessment & TabNet Classifier</p>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;

