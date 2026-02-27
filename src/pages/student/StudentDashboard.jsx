import React from 'react';
import { useQuery } from 'react-query';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import Layout from '../../components/shared/Layout';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const XP_PER_LEVEL = 1000;

function XPBar({ current, total, level }) {
  const pct = Math.min(100, Math.round((current % XP_PER_LEVEL) / XP_PER_LEVEL * 100));
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>Nível {level}</span>
        <span>{current % XP_PER_LEVEL} / {XP_PER_LEVEL} XP</span>
      </div>
      <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        ></div>
      </div>
    </div>
  );
}

const typeLabels = {
  exam: { icon: '📖', label: 'Prova', color: 'red' },
  quiz: { icon: '❓', label: 'Quiz', color: 'blue' },
  practice_code: { icon: '💻', label: 'Programação', color: 'green' },
  practice_design: { icon: '🎨', label: 'Design', color: 'pink' },
  homework: { icon: '📝', label: 'Tarefa', color: 'yellow' }
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery('student-dashboard', () =>
    api.get('/dashboard/student').then(r => r.data)
  );

  if (isLoading) return (
    <Layout title="Meu Dashboard">
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </Layout>
  );

  const xp = data?.xp || { total_xp: 0, level: 1 };
  const pending = data?.pendingAssignments || [];
  const recentGrades = data?.recentGrades || [];
  const achievements = data?.achievements || [];
  const ranking = data?.ranking || [];

  return (
    <Layout title="Meu Dashboard">
      {/* XP + Level card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border border-purple-700/30 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-900/30">
              <span className="text-2xl font-bold text-white">{xp.level}</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{user?.displayName}</div>
              <div className="text-purple-300">🏆 {xp.total_xp?.toLocaleString()} XP Total</div>
            </div>
          </div>
          <XPBar current={xp.total_xp || 0} total={XP_PER_LEVEL} level={xp.level || 1} />
          <div className="mt-4 p-3 bg-purple-950/50 rounded-xl text-sm text-purple-300">
            🎮 Realize atividades <strong>no servidor Minecraft</strong> para ganhar XP!
          </div>
        </div>

        {/* Conquistas recentes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-3">🏅 Conquistas</h3>
          <div className="space-y-2 max-h-44 overflow-y-auto">
            {achievements.length > 0 ? achievements.slice(0, 4).map((a, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-yellow-900/10 border border-yellow-900/20 rounded-lg">
                <span className="text-lg">{a.icon || '⭐'}</span>
                <div>
                  <div className="text-yellow-400 text-xs font-semibold">{a.name}</div>
                  <div className="text-slate-500 text-xs">{a.description}</div>
                </div>
              </div>
            )) : (
              <div className="text-slate-500 text-center py-6 text-sm">
                Nenhuma conquista ainda.<br/>Continue estudando!
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Atividades pendentes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">📋 Atividades Pendentes</h3>
            {pending.length > 0 && (
              <span className="px-2 py-1 bg-red-900/40 text-red-400 text-xs rounded-full animate-pulse">
                {pending.length} pendentes
              </span>
            )}
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {pending.length > 0 ? pending.map((a, idx) => {
              const typeInfo = typeLabels[a.type] || { icon: '📋', label: a.type, color: 'purple' };
              return (
                <div key={idx} className="p-3 bg-slate-800/50 border border-slate-700/30 rounded-xl hover:border-purple-600/30 transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{typeInfo.icon}</span>
                    <span className="text-white text-sm font-medium flex-1 truncate">{a.title}</span>
                    <span className="text-yellow-400 text-xs">+{a.xp_reward} XP</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="px-2 py-0.5 rounded-full" style={{ background: a.color + '33', color: a.color }}>
                      {a.subject_name}
                    </span>
                    <span>{a.class_name}</span>
                    {a.ends_at && (
                      <span className="text-red-400 ml-auto">
                        ⏰ {new Date(a.ends_at).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-purple-400">
                    🎮 Abra no Minecraft: /quiz {a.id}
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🎉</div>
                <div className="text-slate-400">Todas as atividades concluídas!</div>
              </div>
            )}
          </div>
        </div>

        {/* Notas recentes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">📊 Notas Recentes</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentGrades.length > 0 ? recentGrades.map((g, idx) => {
              const nota = parseFloat(g.grade);
              const noteColor = nota >= 7 ? 'text-green-400' : nota >= 5 ? 'text-yellow-400' : 'text-red-400';
              return (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: g.color || '#6D28D9' }}></div>
                    <div>
                      <div className="text-white text-sm">{g.subject_name}</div>
                      <div className="text-slate-500 text-xs">{g.bimester}º Bimestre</div>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${noteColor}`}>
                    {nota.toFixed(1)}
                  </div>
                </div>
              );
            }) : (
              <div className="text-slate-500 text-center py-8">Nenhuma nota registrada</div>
            )}
          </div>
        </div>
      </div>

      {/* Ranking da turma */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">🏆 Ranking da Escola</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {ranking.map((student, idx) => {
            const rankColors = { 0: 'text-yellow-400', 1: 'text-gray-400', 2: 'text-amber-600' };
            return (
              <div key={idx} className={`flex items-center gap-3 p-2 rounded-xl ${idx < 3 ? 'bg-slate-800/80' : 'hover:bg-slate-800/30'} transition-colors`}>
                <span className={`font-bold w-6 text-center text-sm ${rankColors[idx] || 'text-slate-500'}`}>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                </span>
                <div className="w-7 h-7 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {student.display_name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs font-medium truncate">{student.display_name}</div>
                </div>
                <div className="text-yellow-400 text-xs font-bold">{student.total_xp?.toLocaleString()}</div>
              </div>
            );
          })}
          {ranking.length === 0 && (
            <div className="col-span-2 text-slate-500 text-center py-6">Ranking ainda não disponível</div>
          )}
        </div>
      </div>
    </Layout>
  );
}
