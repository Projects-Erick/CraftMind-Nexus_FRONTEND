import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '../../components/shared/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TYPES = [
  { value: 'exam', label: '📖 Prova', desc: 'Avaliação formal' },
  { value: 'quiz', label: '❓ Quiz', desc: 'Questionário rápido' },
  { value: 'practice_code', label: '💻 Programação', desc: 'Desafio de código' },
  { value: 'practice_design', label: '🎨 Design', desc: 'PixelStudio 24x24' },
  { value: 'homework', label: '📝 Tarefa', desc: 'Dissertativa' },
];

const STATUS_COLORS = {
  draft: 'text-yellow-400 bg-yellow-900/20 border-yellow-800/30',
  published: 'text-green-400 bg-green-900/20 border-green-800/30',
  closed: 'text-red-400 bg-red-900/20 border-red-800/30',
};

const emptyForm = {
  classId: '', subjectId: '', title: '', type: 'quiz',
  maxScore: 100, xpReward: 100, timeLimitMinutes: 0,
  startsAt: '', endsAt: '', instructions: '', questionIds: []
};

export default function AssignmentsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filterStatus, setFilterStatus] = useState('');
  const [qSearch, setQSearch] = useState('');
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const { data: assignments = [], isLoading } = useQuery(
    ['assignments', filterStatus],
    () => api.get('/assignments', { params: { status: filterStatus || undefined } }).then(r => r.data)
  );
  const { data: classes = [] } = useQuery('classes', () => api.get('/classes').then(r => r.data));
  const { data: subjects = [] } = useQuery('subjects', () => api.get('/subjects').then(r => r.data));
  const { data: questions = [] } = useQuery(
    ['q-assign', form.subjectId, qSearch],
    () => api.get('/questions', { params: { subjectId: form.subjectId || undefined, search: qSearch || undefined } }).then(r => r.data),
    { enabled: showForm }
  );

  const createMut = useMutation((d) => api.post('/assignments', d), {
    onSuccess: () => { toast.success('Atividade criada!'); qc.invalidateQueries('assignments'); setShowForm(false); setForm(emptyForm); },
    onError: (e) => toast.error(e.response?.data?.error || 'Erro')
  });
  const pubMut = useMutation((id) => api.put(`/assignments/${id}/publish`), {
    onSuccess: () => { toast.success('Publicada! Alunos notificados.'); qc.invalidateQueries('assignments'); }
  });
  const delMut = useMutation((id) => api.delete(`/assignments/${id}`), {
    onSuccess: () => { toast.success('Removida'); qc.invalidateQueries('assignments'); }
  });

  const toggleQ = (id) => f('questionIds', form.questionIds.includes(id) ? form.questionIds.filter(x => x !== id) : [...form.questionIds, id]);

  return (
    <Layout title="Atividades">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {['', 'draft', 'published', 'closed'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-sm transition-colors ${filterStatus === s ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {s === '' ? 'Todas' : s === 'draft' ? 'Rascunhos' : s === 'published' ? 'Publicadas' : 'Encerradas'}
            </button>
          ))}
        </div>
        <button onClick={() => { setShowForm(true); setForm(emptyForm); }}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-colors">
          ➕ Nova Atividade
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <h2 className="text-white font-semibold">Nova Atividade</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={e => { e.preventDefault(); createMut.mutate(form); }} className="p-5 space-y-4">
              <div>
                <label className="text-slate-400 text-sm mb-2 block">Tipo</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {TYPES.map(t => (
                    <button key={t.value} type="button" onClick={() => f('type', t.value)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${form.type === t.value ? 'border-purple-500 bg-purple-900/30 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                      <div className="text-lg">{t.label.split(' ')[0]}</div>
                      <div className="text-xs mt-0.5">{t.label.substring(2)}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Turma *</label>
                  <select value={form.classId} onChange={e => f('classId', e.target.value)} required
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none">
                    <option value="">Selecione...</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Disciplina *</label>
                  <select value={form.subjectId} onChange={e => f('subjectId', e.target.value)} required
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none">
                    <option value="">Selecione...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Título *</label>
                <input value={form.title} onChange={e => f('title', e.target.value)} required placeholder="Ex: Quiz de Frações"
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Instruções para os alunos</label>
                <textarea value={form.instructions} onChange={e => f('instructions', e.target.value)} rows={2}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Nota máx.</label>
                  <input type="number" value={form.maxScore} onChange={e => f('maxScore', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">XP recompensa</label>
                  <input type="number" value={form.xpReward} onChange={e => f('xpReward', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Tempo (min)</label>
                  <input type="number" value={form.timeLimitMinutes} onChange={e => f('timeLimitMinutes', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Início</label>
                  <input type="datetime-local" value={form.startsAt} onChange={e => f('startsAt', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Fim</label>
                  <input type="datetime-local" value={form.endsAt} onChange={e => f('endsAt', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                </div>
              </div>
              {['exam','quiz','homework'].includes(form.type) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-slate-400 text-xs">Questões: <span className="text-purple-400 font-bold">{form.questionIds.length}</span> selecionadas</label>
                    <input value={qSearch} onChange={e => setQSearch(e.target.value)} placeholder="Buscar..."
                      className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-1.5 focus:ring-1 focus:ring-purple-500 focus:outline-none w-40" />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 border border-slate-800 rounded-xl p-2 bg-slate-950/50">
                    {questions.length === 0 ? (
                      <div className="text-slate-500 text-center py-4 text-xs">{form.subjectId ? 'Sem questões. Crie no banco de questões!' : 'Selecione uma disciplina'}</div>
                    ) : questions.map(q => {
                      const sel = form.questionIds.includes(q.id);
                      return (
                        <button key={q.id} type="button" onClick={() => toggleQ(q.id)}
                          className={`w-full flex items-center gap-2 p-2 rounded-lg text-left ${sel ? 'bg-purple-900/30 border border-purple-700/40' : 'bg-slate-800/50 hover:bg-slate-800'}`}>
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${sel ? 'bg-purple-600 border-purple-500' : 'border-slate-600'}`}>
                            {sel && <span className="text-white text-xs leading-none">✓</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-xs truncate">{q.content?.substring(0, 55)}...</div>
                            <div className="text-slate-500 text-xs">{q.difficulty} • {q.points}pts</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm">Cancelar</button>
                <button type="submit" disabled={createMut.isLoading}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                  {createMut.isLoading ? 'Criando...' : '✓ Criar Rascunho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
      ) : (
        <div className="space-y-3">
          {assignments.map(a => {
            const ti = TYPES.find(t => t.value === a.type) || TYPES[1];
            return (
              <div key={a.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ti.label.split(' ')[0]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium">{a.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[a.status]}`}>
                        {a.status === 'draft' ? 'Rascunho' : a.status === 'published' ? '✅ Publicada' : '🔒 Encerrada'}
                      </span>
                    </div>
                    <div className="flex gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                      <span>🏫 {a.class_name}</span>
                      <span>📚 {a.subject_name}</span>
                      <span>❓ {a.question_count || 0} questões</span>
                      <span>📝 {a.submission_count || 0} entregas</span>
                      <span className="text-yellow-400">+{a.xp_reward} XP</span>
                      {a.ends_at && <span className="text-red-400">⏰ {new Date(a.ends_at).toLocaleDateString('pt-BR')}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {a.status === 'draft' && (
                      <button onClick={() => { if (window.confirm('Publicar e notificar alunos?')) pubMut.mutate(a.id); }}
                        className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white text-xs rounded-lg font-medium transition-colors">
                        🚀 Publicar
                      </button>
                    )}
                    {a.status === 'draft' && (
                      <button onClick={() => { if (window.confirm('Remover?')) delMut.mutate(a.id); }}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-colors">🗑️</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {assignments.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">📋</div>
              <div className="text-slate-400">Nenhuma atividade. Crie a primeira!</div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
