import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Layout from '../../components/shared/Layout';
import api from '../../services/api';

export default function TeacherDashboard() {
  const { data, isLoading } = useQuery('teacher-dashboard', () =>
    api.get('/dashboard/teacher').then(r => r.data)
  );

  if (isLoading) return (
    <Layout title="Dashboard Professor">
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </Layout>
  );

  const myClasses = data?.myClasses || [];
  const myAssignments = data?.myAssignments || [];
  const pendingGrades = data?.pendingGrades || [];
  const classPerformance = data?.classPerformance || [];

  return (
    <Layout title="Dashboard Professor">
      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Nova Questão', icon: '❓', path: '/teacher/questions', color: 'blue' },
          { label: 'Nova Atividade', icon: '📋', path: '/teacher/assignments', color: 'green' },
          { label: 'Ver Entregas', icon: '📝', path: '/teacher/submissions', color: 'yellow' },
          { label: 'Design Review', icon: '🎨', path: '/teacher/design-review', color: 'pink' },
        ].map(btn => (
          <Link key={btn.path} to={btn.path}
            className={`bg-slate-900 border border-slate-800 hover:border-${btn.color}-600/50 rounded-2xl p-4 text-center transition-all hover:bg-slate-800/50 group`}>
            <span className="text-3xl group-hover:scale-110 inline-block transition-transform">{btn.icon}</span>
            <div className="text-white text-sm font-medium mt-2">{btn.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Minhas turmas */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">🏫 Minhas Turmas</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {myClasses.length > 0 ? myClasses.map((cls, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                <div>
                  <div className="text-white text-sm font-medium">{cls.class_name}</div>
                  <div className="text-slate-400 text-xs">{cls.year_name} • {cls.subject_name}</div>
                </div>
              </div>
            )) : (
              <div className="text-slate-500 text-center py-8">Nenhuma turma vinculada</div>
            )}
          </div>
        </div>

        {/* Pendentes de avaliação */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">⏳ Aguardando Avaliação</h3>
            {pendingGrades.length > 0 && (
              <span className="px-2 py-1 bg-yellow-900/40 text-yellow-400 text-xs rounded-full">
                {pendingGrades.length} pendentes
              </span>
            )}
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {pendingGrades.length > 0 ? pendingGrades.map((sub, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-yellow-900/10 border border-yellow-900/20 rounded-xl">
                <div>
                  <div className="text-white text-sm">{sub.display_name}</div>
                  <div className="text-slate-400 text-xs">{sub.title}</div>
                </div>
                <Link to={`/teacher/submissions?id=${sub.id}`}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-xs rounded-lg transition-colors">
                  Avaliar
                </Link>
              </div>
            )) : (
              <div className="text-slate-500 text-center py-8">
                <div className="text-3xl mb-2">✅</div>
                Todas as entregas avaliadas!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desempenho por turma */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
        <h3 className="text-white font-semibold mb-4">📊 Desempenho por Turma/Disciplina</h3>
        {classPerformance.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={classPerformance}>
              <XAxis dataKey="class_name" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8 }} />
              <Bar dataKey="avg_score" fill="#6D28D9" radius={[4, 4, 0, 0]} name="Média" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-500">
            Sem dados de desempenho ainda
          </div>
        )}
      </div>

      {/* Atividades recentes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">📋 Minhas Atividades</h3>
          <Link to="/teacher/assignments" className="text-purple-400 text-sm hover:text-purple-300">Ver todas →</Link>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {myAssignments.slice(0, 5).map((a, idx) => {
            const statusColor = a.status === 'published' ? 'green' : a.status === 'closed' ? 'red' : 'yellow';
            return (
              <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                <div className={`w-2 h-2 bg-${statusColor}-500 rounded-full flex-shrink-0`}></div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{a.title}</div>
                  <div className="text-slate-400 text-xs">{a.class_name} • {a.subject_name}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-slate-400 text-xs">{a.submission_count || 0} entregas</div>
                  {a.avg_score && <div className="text-green-400 text-xs">Média: {parseFloat(a.avg_score).toFixed(1)}</div>}
                </div>
              </div>
            );
          })}
          {myAssignments.length === 0 && (
            <div className="text-slate-500 text-center py-8">Nenhuma atividade criada</div>
          )}
        </div>
      </div>
    </Layout>
  );
}
