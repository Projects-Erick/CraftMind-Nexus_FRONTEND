import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '../../components/shared/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DIFFICULTY = ['easy', 'medium', 'hard'];
const TYPES = ['multiple_choice', 'true_false', 'open', 'code', 'design'];
const TYPE_LABELS = { multiple_choice: 'Múltipla Escolha', true_false: 'V ou F', open: 'Dissertativa', code: 'Código', design: 'Design' };
const DIFF_LABELS = { easy: '🟢 Fácil', medium: '🟡 Médio', hard: '🔴 Difícil' };

const initialForm = {
  subjectId: '', schoolYearId: '', title: '', content: '',
  questionType: 'multiple_choice', difficulty: 'medium', points: 10,
  timeLimitSeconds: 0, explanation: '',
  options: [
    { letter: 'A', content: '', isCorrect: false },
    { letter: 'B', content: '', isCorrect: false },
    { letter: 'C', content: '', isCorrect: false },
    { letter: 'D', content: '', isCorrect: false },
  ]
};

export default function QuestionsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [filters, setFilters] = useState({ subjectId: '', difficulty: '', type: '' });
  const [editId, setEditId] = useState(null);

  const { data: questions = [], isLoading } = useQuery(['questions', filters], () =>
    api.get('/questions', { params: filters }).then(r => r.data)
  );
  const { data: subjects = [] } = useQuery('subjects', () => api.get('/subjects').then(r => r.data));
  const { data: schoolYears = [] } = useQuery('school-years', () =>
    api.get('/school-years').then(r => r.data)
  );

  const createMutation = useMutation(
    (data) => editId ? api.put(`/questions/${editId}`, data) : api.post('/questions', data),
    {
      onSuccess: () => {
        toast.success(editId ? 'Questão atualizada!' : 'Questão criada!');
        qc.invalidateQueries('questions');
        setShowForm(false);
        setForm(initialForm);
        setEditId(null);
      },
      onError: (err) => toast.error(err.response?.data?.error || 'Erro ao salvar questão')
    }
  );

  const deleteMutation = useMutation(
    (id) => api.delete(`/questions/${id}`),
    { onSuccess: () => { toast.success('Questão removida'); qc.invalidateQueries('questions'); } }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const setCorrectOption = (idx) => {
    setForm(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => ({ ...opt, isCorrect: i === idx }))
    }));
  };

  return (
    <Layout title="Banco de Questões">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-3">
          <select value={filters.subjectId} onChange={e => setFilters(p => ({ ...p, subjectId: e.target.value }))}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none">
            <option value="">Todas disciplinas</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filters.difficulty} onChange={e => setFilters(p => ({ ...p, difficulty: e.target.value }))}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none">
            <option value="">Todas dificuldades</option>
            {DIFFICULTY.map(d => <option key={d} value={d}>{DIFF_LABELS[d]}</option>)}
          </select>
          <select value={filters.type} onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none">
            <option value="">Todos tipos</option>
            {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(initialForm); }}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-colors">
          ➕ Nova Questão
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-white font-semibold">{editId ? 'Editar' : 'Nova'} Questão</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-sm mb-1 block">Disciplina</label>
                  <select value={form.subjectId} onChange={e => setForm(p => ({ ...p, subjectId: e.target.value }))} required
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none">
                    <option value="">Selecione...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-sm mb-1 block">Série</label>
                  <select value={form.schoolYearId} onChange={e => setForm(p => ({ ...p, schoolYearId: e.target.value }))} required
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none">
                    <option value="">Selecione...</option>
                    {[1,2,3,4,5,6,7].map(id => {
                      const names = ['6º EF','7º EF','8º EF','9º EF','1º EM','2º EM','3º EM'];
                      return <option key={id} value={id}>{names[id-1]}</option>;
                    })}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-400 text-sm mb-1 block">Tipo</label>
                  <select value={form.questionType} onChange={e => setForm(p => ({ ...p, questionType: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none">
                    {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-sm mb-1 block">Dificuldade</label>
                  <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none">
                    {DIFFICULTY.map(d => <option key={d} value={d}>{DIFF_LABELS[d]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-sm mb-1 block">Pontos</label>
                  <input type="number" value={form.points} onChange={e => setForm(p => ({ ...p, points: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-sm mb-1 block">Título</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required
                  placeholder="Título breve da questão"
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>

              <div>
                <label className="text-slate-400 text-sm mb-1 block">Enunciado</label>
                <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} required rows={3}
                  placeholder="Escreva a pergunta completa aqui..."
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none" />
              </div>

              {/* Opções para múltipla escolha */}
              {(form.questionType === 'multiple_choice' || form.questionType === 'true_false') && (
                <div>
                  <label className="text-slate-400 text-sm mb-2 block">Opções (clique ✓ para marcar a correta)</label>
                  <div className="space-y-2">
                    {form.options.slice(0, form.questionType === 'true_false' ? 2 : 4).map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <button type="button" onClick={() => setCorrectOption(idx)}
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${opt.isCorrect ? 'bg-green-600 border-green-500 text-white' : 'border-slate-600 text-slate-400 hover:border-green-500'}`}>
                          {opt.letter}
                        </button>
                        <input value={opt.content} onChange={e => {
                          const newOpts = [...form.options];
                          newOpts[idx] = { ...newOpts[idx], content: e.target.value };
                          setForm(p => ({ ...p, options: newOpts }));
                        }}
                          placeholder={form.questionType === 'true_false' ? (idx === 0 ? 'Verdadeiro' : 'Falso') : `Opção ${opt.letter}`}
                          className="flex-1 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-slate-400 text-sm mb-1 block">Explicação (exibida após responder)</label>
                <textarea value={form.explanation} onChange={e => setForm(p => ({ ...p, explanation: e.target.value }))} rows={2}
                  placeholder="Explique o porquê da resposta correta..."
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={createMutation.isLoading}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                  {createMutation.isLoading ? 'Salvando...' : (editId ? 'Atualizar' : 'Criar Questão')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Questions list */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Carregando questões...</div>
      ) : (
        <div className="space-y-3">
          {questions.map(q => (
            <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-purple-600/30 transition-all">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="px-2 py-0.5 bg-purple-900/30 text-purple-300 text-xs rounded-full">{TYPE_LABELS[q.question_type]}</span>
                    <span className="text-xs text-slate-500">{q.subject_name}</span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-500">{q.year_name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${q.difficulty === 'easy' ? 'bg-green-900/30 text-green-400' : q.difficulty === 'hard' ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                      {DIFF_LABELS[q.difficulty]}
                    </span>
                    <span className="text-yellow-400 text-xs">{q.points} pts</span>
                  </div>
                  <div className="text-white text-sm font-medium">{q.title || q.content?.substring(0, 80)}</div>
                  {q.content && q.title && (
                    <div className="text-slate-400 text-xs mt-1 line-clamp-1">{q.content}</div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => { setEditId(q.id); setForm({ ...q }); setShowForm(true); }}
                    className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors text-sm">✏️</button>
                  <button onClick={() => { if (window.confirm('Remover questão?')) deleteMutation.mutate(q.id); }}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors text-sm">🗑️</button>
                </div>
              </div>
            </div>
          ))}
          {questions.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">❓</div>
              <div className="text-slate-400">Nenhuma questão encontrada.</div>
              <div className="text-slate-500 text-sm mt-1">Crie sua primeira questão!</div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
