import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '../../components/shared/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  in_progress: { label: '⏳ Em andamento', color: 'text-yellow-400 bg-yellow-900/20' },
  submitted:   { label: '📬 Entregue',     color: 'text-blue-400 bg-blue-900/20' },
  graded:      { label: '✅ Avaliado',      color: 'text-green-400 bg-green-900/20' },
  late:        { label: '⚠️ Atrasado',      color: 'text-red-400 bg-red-900/20' },
};

export default function SubmissionsPage() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('submitted');
  const [gradeModal, setGradeModal] = useState(null); // { id, studentName, title }
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');

  const { data: submissions = [], isLoading } = useQuery(
    ['submissions', filterStatus],
    () => api.get('/submissions', { params: { status: filterStatus || undefined } }).then(r => r.data)
  );

  const gradeMut = useMutation(
    ({ id, score, feedback }) => api.put(`/submissions/${id}/grade`, { score: parseFloat(score), feedback }),
    {
      onSuccess: () => {
        toast.success('Avaliação salva! Aluno notificado.');
        qc.invalidateQueries('submissions');
        setGradeModal(null); setScore(''); setFeedback('');
      },
      onError: () => toast.error('Erro ao avaliar')
    }
  );

  return (
    <Layout title="Entregas dos Alunos">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2 flex-wrap">
          {['', 'in_progress', 'submitted', 'graded'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-sm transition-colors ${filterStatus === s ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {s === '' ? 'Todas' : STATUS_LABELS[s]?.label || s}
            </button>
          ))}
        </div>
        {submissions.length > 0 && (
          <span className="text-slate-400 text-sm">{submissions.length} entregas</span>
        )}
      </div>

      {gradeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-white font-semibold mb-1">Avaliar Entrega</h3>
            <p className="text-slate-400 text-sm mb-4">{gradeModal.studentName} — {gradeModal.title}</p>
            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Nota (0 a 100)</label>
                <input type="number" min="0" max="100" value={score} onChange={e => setScore(e.target.value)}
                  placeholder="Ex: 85"
                  className="w-full bg-slate-800 border border-slate-700 text-white text-lg font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                {score && (
                  <div className={`mt-1 text-sm font-medium ${parseFloat(score) >= 70 ? 'text-green-400' : parseFloat(score) >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {parseFloat(score) >= 70 ? '✅ Aprovado' : parseFloat(score) >= 50 ? '⚠️ Recuperação' : '❌ Reprovado'}
                  </div>
                )}
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Feedback para o aluno (opcional)</label>
                <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3}
                  placeholder="Parabéns! / Precisa melhorar em..."
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setGradeModal(null); setScore(''); setFeedback(''); }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-colors">Cancelar</button>
                <button onClick={() => gradeMut.mutate({ id: gradeModal.id, score, feedback })}
                  disabled={!score || gradeMut.isLoading}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors">
                  {gradeMut.isLoading ? 'Salvando...' : '✓ Salvar Nota'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
      ) : (
        <div className="space-y-3">
          {submissions.map(s => {
            const st = STATUS_LABELS[s.status] || { label: s.status, color: 'text-slate-400 bg-slate-800' };
            return (
              <div key={s.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-white font-medium">{s.student_name}</span>
                      {s.minecraft_username && (
                        <span className="text-green-400 text-xs bg-green-900/20 px-2 py-0.5 rounded-full">🎮 {s.minecraft_username}</span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-xs ${st.color}`}>{st.label}</span>
                    </div>
                    <div className="text-slate-400 text-sm">{s.assignment_title}</div>
                    <div className="flex gap-3 text-xs text-slate-500 mt-1">
                      {s.submitted_at && <span>Entregue: {new Date(s.submitted_at).toLocaleString('pt-BR')}</span>}
                      {s.score !== null && s.score !== undefined && (
                        <span className={`font-bold ${parseFloat(s.score) >= 70 ? 'text-green-400' : parseFloat(s.score) >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          Nota: {parseFloat(s.score).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {s.status === 'submitted' && (
                      <button onClick={() => setGradeModal({ id: s.id, studentName: s.student_name, title: s.assignment_title })}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-xl font-medium transition-colors">
                        ✏️ Avaliar
                      </button>
                    )}
                    {s.status === 'graded' && s.score !== null && (
                      <div className={`text-2xl font-bold ${parseFloat(s.score) >= 70 ? 'text-green-400' : parseFloat(s.score) >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {parseFloat(s.score).toFixed(0)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {submissions.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">📬</div>
              <div className="text-slate-400">Nenhuma entrega {filterStatus ? `com status "${filterStatus}"` : ''}.</div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
