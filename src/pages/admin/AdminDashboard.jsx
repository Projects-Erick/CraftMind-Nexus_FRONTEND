import React from 'react';
import { useQuery } from 'react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Layout from '../../components/shared/Layout';
import api from '../../services/api';

const StatCard = ({ icon, label, value, color, sub }) => (
  <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-${color}-600/50 transition-all`}>
    <div className="flex items-center justify-between mb-3">
      <span className="text-2xl">{icon}</span>
      <div className={`w-2 h-2 bg-${color}-500 rounded-full`}></div>
    </div>
    <div className="text-3xl font-bold text-white">{value ?? '—'}</div>
    <div className="text-slate-400 text-sm mt-1">{label}</div>
    {sub && <div className={`text-${color}-400 text-xs mt-1`}>{sub}</div>}
  </div>
);

const COLORS = ['#6D28D9', '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

export default function AdminDashboard() {
  const { data, isLoading } = useQuery('admin-dashboard', () =>
    api.get('/dashboard/admin').then(r => r.data)
  );

  if (isLoading) return (
    <Layout title="Dashboard Administrativo">
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </Layout>
  );

  const stats = data?.stats || {};
  const xpRanking = data?.xpRanking || [];
  const submissionsByType = data?.submissionsByType || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <Layout title="Dashboard Administrativo">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard icon="👥" label="Total Usuários" value={stats.totalUsers} color="purple" />
        <StatCard icon="👨‍🎓" label="Alunos" value={stats.totalStudents} color="blue" />
        <StatCard icon="👨‍🏫" label="Professores" value={stats.totalTeachers} color="green" />
        <StatCard icon="🏫" label="Turmas Ativas" value={stats.totalClasses} color="yellow" />
        <StatCard icon="📋" label="Atividades Ativas" value={stats.activeAssignments} color="orange" />
        <StatCard icon="📝" label="Entregas Totais" value={stats.totalSubmissions} color="pink" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Atividades por tipo */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">📊 Atividades por Tipo</h3>
          {submissionsByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={submissionsByType} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  dataKey="count" nameKey="type">
                  {submissionsByType.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500">Sem dados</div>
          )}
        </div>

        {/* XP Ranking */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">🏆 Ranking XP - Top 10</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {xpRanking.map((student, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/50 transition-colors">
                <span className={`text-sm font-bold w-6 ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                  #{idx + 1}
                </span>
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {student.display_name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{student.display_name}</div>
                  <div className="text-slate-500 text-xs">{student.minecraft_username || '—'}</div>
                </div>
                <div className="text-right">
                  <div className="text-yellow-400 text-sm font-bold">{student.total_xp?.toLocaleString()} XP</div>
                  <div className="text-slate-500 text-xs">Nível {student.level}</div>
                </div>
              </div>
            ))}
            {xpRanking.length === 0 && (
              <div className="text-center text-slate-500 py-8">Nenhum dado de XP ainda</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">🕐 Atividade Recente</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {recentActivity.map((log, idx) => (
            <div key={idx} className="flex items-center gap-3 py-2 border-b border-slate-800/50">
              <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
              <span className="text-slate-400 text-sm">{log.display_name || 'Sistema'}</span>
              <span className="text-slate-600 text-xs">{log.action}</span>
              <span className="text-slate-600 text-xs ml-auto">
                {log.created_at ? new Date(log.created_at).toLocaleString('pt-BR') : ''}
              </span>
            </div>
          ))}
          {recentActivity.length === 0 && (
            <div className="text-slate-500 text-center py-4">Nenhuma atividade recente</div>
          )}
        </div>
      </div>
    </Layout>
  );
}
