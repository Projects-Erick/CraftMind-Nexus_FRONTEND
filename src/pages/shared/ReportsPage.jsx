import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import Layout from '../../components/shared/Layout';
import api from '../../services/api';

const COLORS = ['#6D28D9','#4F46E5','#10B981','#F59E0B','#EF4444','#EC4899','#06B6D4'];

function StatCard({ icon, label, value, sub, color = 'purple' }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <div className={`text-3xl font-bold text-${color}-400`}>{value ?? '—'}</div>
      </div>
      <div className="text-white text-sm font-medium">{label}</div>
      {sub && <div className="text-slate-400 text-xs mt-0.5">{sub}</div>}
    </div>
  );
}

export default function ReportsPage() {
  const [classId, setClassId] = useState('');
  const { data: report, isLoading } = useQuery(
    ['reports', classId],
    () => api.get('/reports', { params: { classId: classId || undefined } }).then(r => r.data)
  );
  const { data: classes = [] } = useQuery('classes', () => api.get('/classes').then(r => r.data));

  const school   = report?.school   || {};
  const byClass  = report?.byClass  || [];
  const bySubject= report?.bySubject|| [];
  const xpTop    = report?.xpTop    || [];
  const bimesterTrend = report?.bimesterTrend || [];

  return (
    <Layout title="Relatórios de Desempenho">
      <div className="flex items-center gap-3 mb-6">
        <select value={classId} onChange={e => setClassId(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none">
          <option value="">Escola toda</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span className="text-slate-500 text-sm">Ano letivo atual</span>
      </div>

      {isLoading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard icon="👥" label="Alunos Ativos"     value={school.totalStudents}   color="blue" />
            <StatCard icon="📋" label="Atividades Publicadas" value={school.totalAssignments} color="green" />
            <StatCard icon="📬" label="Entregas Realizadas"   value={school.totalSubmissions} color="yellow" />
            <StatCard icon="📊" label="Média Geral da Escola" value={school.avgScore ? parseFloat(school.avgScore).toFixed(1) : '—'} color="purple" sub="escala 0–10" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Desempenho por turma */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-4">📊 Média por Turma</h3>
              {byClass.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byClass} layout="vertical">
                    <XAxis type="number" domain={[0,10]} tick={{ fill:'#94A3B8', fontSize:11 }} />
                    <YAxis dataKey="class_name" type="category" tick={{ fill:'#94A3B8', fontSize:11 }} width={70} />
                    <Tooltip contentStyle={{ background:'#1E293B', border:'none', borderRadius:8 }} />
                    <Bar dataKey="avg_grade" fill="#6D28D9" radius={[0,4,4,0]} name="Média" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-48 flex items-center justify-center text-slate-500">Sem dados</div>}
            </div>

            {/* Desempenho por disciplina */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-4">📚 Média por Disciplina</h3>
              {bySubject.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={bySubject} cx="50%" cy="50%" outerRadius={85} dataKey="avg_grade" nameKey="subject_name" label={({ name, value }) => `${name?.substring(0,6)} ${parseFloat(value||0).toFixed(1)}`}>
                      {bySubject.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => parseFloat(v).toFixed(2)} contentStyle={{ background:'#1E293B', border:'none', borderRadius:8 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="h-48 flex items-center justify-center text-slate-500">Sem dados</div>}
            </div>
          </div>

          {/* Tendência por bimestre */}
          {bimesterTrend.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
              <h3 className="text-white font-semibold mb-4">📈 Evolução por Bimestre</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={bimesterTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="bimester" tickFormatter={v => `${v}º Bim`} tick={{ fill:'#94A3B8', fontSize:11 }} />
                  <YAxis domain={[0,10]} tick={{ fill:'#94A3B8', fontSize:11 }} />
                  <Tooltip contentStyle={{ background:'#1E293B', border:'none', borderRadius:8 }} formatter={v => parseFloat(v).toFixed(2)} />
                  <Line type="monotone" dataKey="avg_grade" stroke="#6D28D9" strokeWidth={2} dot={{ fill:'#6D28D9', r:4 }} name="Média" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top XP */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">🏆 Ranking XP — Top 15</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-slate-400 text-xs font-medium px-3 py-2">#</th>
                    <th className="text-left text-slate-400 text-xs font-medium px-3 py-2">Aluno</th>
                    <th className="text-left text-slate-400 text-xs font-medium px-3 py-2">Minecraft</th>
                    <th className="text-center text-slate-400 text-xs font-medium px-3 py-2">Nível</th>
                    <th className="text-right text-slate-400 text-xs font-medium px-3 py-2">XP Total</th>
                  </tr>
                </thead>
                <tbody>
                  {xpTop.map((s, i) => (
                    <tr key={i} className="border-b border-slate-800/40 hover:bg-slate-800/20">
                      <td className="px-3 py-2 text-sm font-bold" style={{ color: i===0?'#FBBF24':i===1?'#94A3B8':i===2?'#B45309':'#475569' }}>
                        {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-purple-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {s.display_name?.charAt(0)}
                          </div>
                          <span className="text-white text-sm">{s.display_name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-green-400 text-sm">{s.minecraft_username || <span className="text-slate-600">—</span>}</td>
                      <td className="px-3 py-2 text-center">
                        <span className="px-2 py-0.5 bg-purple-900/30 text-purple-300 text-xs rounded-full">Nv {s.level}</span>
                      </td>
                      <td className="px-3 py-2 text-right text-yellow-400 font-bold text-sm">{(s.total_xp||0).toLocaleString()}</td>
                    </tr>
                  ))}
                  {xpTop.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-slate-500 py-8">Sem dados de XP</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
