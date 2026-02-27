import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '../../components/shared/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

function gradeColor(g) {
  if (g === null || g === undefined) return 'text-slate-500';
  const n = parseFloat(g);
  if (n >= 7) return 'text-green-400';
  if (n >= 5) return 'text-yellow-400';
  return 'text-red-400';
}

function gradeLabel(g) {
  if (g === null || g === undefined) return '—';
  const n = parseFloat(g);
  if (n >= 7) return '✅ Aprovado';
  if (n >= 5) return '⚠️ Recuperação';
  return '❌ Reprovado';
}

export default function GradesPage({ readOnly = false }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isStudent = user?.role === 'student' || readOnly;
  const [bimester, setBimester] = useState('');
  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [editModal, setEditModal] = useState(null);
  const [editScore, setEditScore] = useState('');

  const { data: grades = [], isLoading } = useQuery(
    ['grades', bimester, classId, studentId],
    () => api.get('/grades', { params: {
      bimester: bimester || undefined,
      classId: classId || undefined,
      studentId: studentId || undefined
    }}).then(r => r.data)
  );
  const { data: classes = [] } = useQuery('classes', () =>
    api.get('/classes').then(r => r.data), { enabled: !isStudent }
  );

  const saveMut = useMutation(
    ({ id, grade }) => id
      ? api.put(`/grades/${id}`, { grade: parseFloat(grade) })
      : api.post('/grades', editModal),
    {
      onSuccess: () => { toast.success('Nota salva!'); qc.invalidateQueries('grades'); setEditModal(null); },
      onError: () => toast.error('Erro ao salvar nota')
    }
  );

  // Group by subject
  const bySubject = grades.reduce((acc, g) => {
    const key = g.subject_name;
    if (!acc[key]) acc[key] = { color: g.color, bimesters: {} };
    acc[key].bimesters[g.bimester] = g;
    return acc;
  }, {});

  // Average per subject (media anual)
  const subjectAvg = (bims) => {
    const vals = Object.values(bims).map(b => b.grade).filter(v => v !== null && v !== undefined);
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + parseFloat(b), 0) / vals.length;
  };

  return (
    <Layout title={isStudent ? 'Minhas Notas' : 'Notas por Turma'}>
      {/* Filtros */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="flex gap-1">
          {['', '1', '2', '3', '4'].map(b => (
            <button key={b} onClick={() => setBimester(b)}
              className={`px-3 py-1.5 rounded-xl text-sm transition-colors ${bimester === b ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {b === '' ? 'Todos bimestres' : `${b}º Bim`}
            </button>
          ))}
        </div>
        {!isStudent && (
          <select value={classId} onChange={e => { setClassId(e.target.value); setStudentId(''); }}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-purple-500 focus:outline-none">
            <option value="">Todas as turmas</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {/* Modal de edição de nota */}
      {editModal && !isStudent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-white font-semibold mb-1">Editar Nota</h3>
            <p className="text-slate-400 text-sm mb-4">
              {editModal.subject_name} • {editModal.bimester}º Bimestre<br/>
              <span className="text-slate-300">{editModal.student_name}</span>
            </p>
            <input type="number" min="0" max="10" step="0.1" value={editScore}
              onChange={e => setEditScore(e.target.value)}
              placeholder="Ex: 8.5"
              className="w-full bg-slate-800 border border-slate-700 text-white text-2xl font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none mb-2" />
            <p className="text-slate-500 text-xs mb-4">Escala 0–10</p>
            <div className="flex gap-3">
              <button onClick={() => setEditModal(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm">Cancelar</button>
              <button onClick={() => saveMut.mutate({ id: editModal.id, grade: editScore })}
                disabled={!editScore || saveMut.isLoading}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                {saveMut.isLoading ? 'Salvando...' : '✓ Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
      ) : Object.keys(bySubject).length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">📊</div>
          <div className="text-slate-400">Nenhuma nota registrada ainda.</div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-slate-400 text-xs font-medium px-4 py-3 min-w-[160px]">Disciplina</th>
                {['1','2','3','4'].map(b => (
                  <th key={b} className="text-center text-slate-400 text-xs font-medium px-4 py-3 w-24">{b}º Bimestre</th>
                ))}
                <th className="text-center text-slate-400 text-xs font-medium px-4 py-3 w-28">Média Anual</th>
                {!isStudent && <th className="text-slate-400 text-xs font-medium px-4 py-3">Status</th>}
              </tr>
            </thead>
            <tbody>
              {Object.entries(bySubject).map(([subject, data]) => {
                const avg = subjectAvg(data.bimesters);
                return (
                  <tr key={subject} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: data.color || '#6D28D9' }}></div>
                        <span className="text-white text-sm font-medium">{subject}</span>
                      </div>
                    </td>
                    {['1','2','3','4'].map(b => {
                      const g = data.bimesters[b];
                      const val = g?.grade;
                      return (
                        <td key={b} className="px-4 py-3 text-center">
                          {isStudent ? (
                            <span className={`text-lg font-bold ${gradeColor(val)}`}>
                              {val !== null && val !== undefined ? parseFloat(val).toFixed(1) : '—'}
                            </span>
                          ) : (
                            <button
                              onClick={() => setEditModal({ ...g, subject_name: subject, bimester: b })}
                              className={`text-lg font-bold ${gradeColor(val)} hover:underline cursor-pointer`}>
                              {val !== null && val !== undefined ? parseFloat(val).toFixed(1) : <span className="text-slate-600 text-sm">+ lançar</span>}
                            </button>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xl font-bold ${gradeColor(avg)}`}>
                        {avg !== null ? avg.toFixed(1) : '—'}
                      </span>
                    </td>
                    {!isStudent && avg !== null && (
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${avg >= 7 ? 'bg-green-900/30 text-green-400' : avg >= 5 ? 'bg-yellow-900/30 text-yellow-400' : 'bg-red-900/30 text-red-400'}`}>
                          {gradeLabel(avg)}
                        </span>
                      </td>
                    )}
                    {!isStudent && avg === null && <td></td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legenda */}
      <div className="flex gap-4 mt-4 text-xs text-slate-500">
        <span className="text-green-400">■</span><span>≥ 7.0 Aprovado</span>
        <span className="text-yellow-400">■</span><span>5.0–6.9 Recuperação</span>
        <span className="text-red-400">■</span><span>&lt; 5.0 Reprovado</span>
      </div>
    </Layout>
  );
}
