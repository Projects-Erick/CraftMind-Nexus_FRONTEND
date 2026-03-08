import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loggedUser = await login(username, password);
      const roleRoutes = {
        admin: '/admin',
        secretary: '/secretary',
        teacher: '/teacher',
        student: '/student',
      };
      navigate(roleRoutes[loggedUser.role] || '/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Usuário ou senha inválidos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-black rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-gray-700 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(rgba(220,220,220,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.5) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}>
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-black to-gray-700 rounded-2xl mb-4 shadow-lg shadow-gray-400 animate-pulse-glow">
            <span className="text-4xl">C-M</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-1">CraftMind</h1>
          <p className="text-gray-300 text-lg font-medium">Nexus Education System</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-8 h-px bg-white"></div>
            <span className="text-white text-sm">Escola Digital × Minecraft</span>
            <div className="w-8 h-px bg-white"></div>
          </div>
        </div>

        {/* Login card */}
        <div className="bg-gray-850 backdrop-blur-xl rounded-2xl border border-white p-8">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">Entrar na Plataforma</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1.5">
                Usuário ou Email
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                placeholder="seu.usuario"
                className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1.5">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-black to-gray-600 hover:from-gray-300 hover:to-white text-white border:from-white border:to-gray-100 font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-gray-400"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Entrando...
                </span>
              ) : 'Entrar'}
            </button>
          </form>

          {/* Info box */}
          <div className="mt-6 p-3 bg-gray-780 border border-white rounded-xl">
            <p className="text-xs text-white text-center">
              Atividades são realizadas <strong>exclusivamente no Minecraft</strong><br/>
              Este dashboard é para professores e gestão
            </p>
          </div>
        </div>

        {/* Roles display */}
        <div className="mt-6 grid grid-cols-4 gap-2">
          {[
            { icon: '', role: 'Admin', color: 'from-red-900/40 to-red-800/20 border-red-800/30' },
            { icon: '', role: 'Secretaria', color: 'from-blue-900/40 to-blue-800/20 border-blue-800/30' },
            { icon: '', role: 'Professor', color: 'from-green-900/40 to-green-800/20 border-green-800/30' },
            { icon: '', role: 'Aluno', color: 'from-yellow-900/40 to-yellow-800/20 border-yellow-800/30' },
          ].map(({ icon, role, color }) => (
            <div key={role} className={`bg-gradient-to-b ${color} border rounded-xl p-2 text-center`}>
              <div className="text-xl">{icon}</div>
              <div className="text-xs text-slate-400 mt-1">{role}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
