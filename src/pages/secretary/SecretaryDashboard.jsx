// SecretaryDashboard.jsx
import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import Layout from '../../components/shared/Layout';
import api from '../../services/api';

export default function SecretaryDashboard() {
  const { data, isLoading } = useQuery('secretary-dashboard', () =>
    api.get('/dashboard/secretary').then(r => r.data)
  );

  const classes = data?.classes || [];
  const recentUsers = data?.recentUsers || [];

  return (
    <Layout title="Dashboard Secretaria">
      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Criar Usuário', icon: '👤', path: '/admin/users', color: 'blue' },
          { label: 'Gerenciar Turmas', icon: '🏫', path: '/admin/classes', color: 'green' },
          { label: 'Relatórios', icon: '📈', path: '/admin/reports', color: 'yellow' },
          { label: 'Ver Alunos', icon: '👨‍🎓', path: '/admin/users?role=student', color: 'purple' },
        ].map(btn => (
          <Link key={btn.path} to={btn.path}
            className="bg-slate-900 border border-slate-800 hover:border-purple-600/50 rounded-2xl p-4 text-center transition-all hover:bg-slate-800/50 group">
            <span className="text-3xl group-hover:scale-110 inline-block transition-transform">{btn.icon}</span>
            <div className="text-white text-sm font-medium mt-2">{btn.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">🏫 Turmas Ativas ({classes.length})</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {classes.map((cls, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                <div>
                  <div className="text-white text-sm font-medium">{cls.name}</div>
                  <div className="text-slate-400 text-xs">{cls.year_name}</div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <div>{cls.student_count} alunos</div>
                  <div>{cls.teacher_count} professores</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">👥 Usuários Recentes</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {recentUsers.map((u, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-xl">
                <div className="w-8 h-8 bg-purple-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {u.display_name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm">{u.display_name}</div>
                  <div className="text-slate-400 text-xs">{u.role} • {u.username}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
