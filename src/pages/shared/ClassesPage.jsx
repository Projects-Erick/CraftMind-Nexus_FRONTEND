import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '../../components/shared/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const emptyForm = { name: '', schoolYearId: '', maxStudents: 40 };

export default function ClassesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [expanded, setExpanded] = useState(null);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const { data: classes = [], isLoading } = useQuery('classes', () =>
    api.get('/classes').then(r => r.data)
  );
  const { data: years = [] } = useQuery('school-years', () =>
    api.get('/school-years').then(r => r.data).catch(() => [
      { id:1,name:'6º Ano EF' },{ id:2,name:'7º Ano EF' },{ id:3,name:'8º Ano EF' },
      { id:4,name:'9º Ano EF' },{ id:5,name:'1º Ano EM' },{ id:6,name:'2º Ano EM' },{ id:7,name:'3º Ano EM' }
    ])
  );
  const { data: classDetail } = useQuery(
    ['class-detail', expanded],
    () => api.get(`/classes/${expanded}`).then(r => r.data),
    { enabled: !!expanded }
  );

  const createMut = useMutation((d) => api.post('/classes', d), {
    onSuccess: () => { toast.success('Turma criada!'); qc.invalidateQueries('classes'); setShowForm(false); setForm(emptyForm); },
    onError: (e) => toast.error(e.response?.data?.error || 'Erro ao criar turma')
  });

  const yearColors = ['bg-blue-900/30 border-blue-700/30','bg-green-900/30 border-green-700/30',
    'bg-yellow-900/30 border-yellow-700/30','bg-purple-900/30 border-purple-700/30',
    'bg-red-900/30 border-red-700/30','bg-pink-900/30 border-pink-700/30','bg-indigo-900/30 border-indigo-700/30'];

  return (
    <Layout title="Gerenciar Turmas">
      <div className="flex items-center justify-between mb-6">
        <p className="text-slate-400 text-sm">{classes.length} turmas cadastradas</p>
        <button onClick={() => { setShowForm(true); setForm(emptyForm); }}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-colors">
          ➕ Nova Turma
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Nova Turma</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={e => { e.preventDefault(); createMut.mutate(form); }} className="space-y-4">
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Nome da Turma *</label>
                <input value={form.name} onChange={e => f('name', e.target.value)} required
                  placeholder="Ex: 6º A, 9º B, Turma Alfa..."
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Série *</label>
                <select value={form.schoolYearId} onChange={e => f('schoolYearId', e.target.value)} required
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none">
                  <option value="">Selecione a série...</option>
                  {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Máximo de alunos</label>
                <input type="number" value={form.maxStudents} onChange={e => f('maxStudents', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm">Cancelar</button>
                <button type="submit" disabled={createMut.isLoading}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                  {createMut.isLoading ? 'Criando...' : '✓ Criar Turma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {classes.map((cls, idx) => (
            <div key={cls.id} className={`border rounded-2xl overflow-hidden transition-all ${yearColors[idx % yearColors.length]}`}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-white font-bold text-lg">{cls.name}</h3>
                    <p className="text-slate-400 text-sm">{cls.year_name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{cls.student_count || 0}</div>
                    <div className="text-slate-400 text-xs">alunos</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>👨‍🏫 {cls.teacher_count || 0} professores</span>
                  <span>📋 {cls.assignment_count || 0} atividades</span>
                </div>
                <button onClick={() => setExpanded(expanded === cls.id ? null : cls.id)}
                  className="w-full mt-3 py-2 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 text-xs rounded-xl transition-colors">
                  {expanded === cls.id ? '▲ Fechar detalhes' : '▼ Ver detalhes'}
                </button>
              </div>

              {expanded === cls.id && classDetail && (
                <div className="border-t border-slate-700/50 p-4 bg-slate-900/50">
                  <div className="mb-3">
                    <h4 className="text-slate-300 text-xs font-semibold mb-2 uppercase tracking-wider">Alunos</h4>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {(classDetail.students || []).length === 0 ? (
                        <p className="text-slate-500 text-xs">Nenhum aluno matriculado</p>
                      ) : (classDetail.students || []).map(s => (
                        <div key={s.id} className="flex items-center gap-2 text-xs">
                          <div className="w-5 h-5 bg-purple-700 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">
                            {s.display_name?.charAt(0)}
                          </div>
                          <span className="text-slate-300 truncate">{s.display_name}</span>
                          {s.minecraft_username && <span className="text-green-400 text-xs">🎮 {s.minecraft_username}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-slate-300 text-xs font-semibold mb-2 uppercase tracking-wider">Professores</h4>
                    <div className="space-y-1">
                      {(classDetail.teachers || []).length === 0 ? (
                        <p className="text-slate-500 text-xs">Nenhum professor vinculado</p>
                      ) : (classDetail.teachers || []).map(t => (
                        <div key={t.id} className="text-xs text-slate-300 flex items-center gap-2">
                          <span>👨‍🏫</span>
                          <span className="truncate">{t.display_name}</span>
                          {t.subject_name && <span className="text-slate-500">— {t.subject_name}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {classes.length === 0 && (
            <div className="col-span-3 text-center py-16">
              <div className="text-5xl mb-3">🏫</div>
              <div className="text-slate-400">Nenhuma turma cadastrada.</div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
