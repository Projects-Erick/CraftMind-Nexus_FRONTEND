import React from 'react';
import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="text-8xl mb-4">404</div>
        <div className="text-white text-2xl mb-4">Página não encontrada</div>
        <Link to="/dashboard" className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-colors">
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
}
