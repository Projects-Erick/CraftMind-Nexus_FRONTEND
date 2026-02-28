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
  const [showAddStudent, setShowAddStudent] = useState(null); // class id
  const [showAddTeacher, setShowAddTeacher] = useState(null); // class id
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [teacherForm, setTeacherForm] = useState({ teacherId: '', subjectId: '' });
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

  const { data: classDetail, refetch: refetchDetail } = useQuery(
    ['class-detail', expanded],
    () => api.get(`/classes/${expanded}`).then(r => r.data),
    { enabled: !!expanded }
  );

  // Busca todos os alunos disponíveis
  const { data: allStudents = [] } = useQuery(
    'all-students',
    () => api.get('/users?role=student').then(r => r.data).catch(() => []),
    { enabled: !!showAddStudent }
  );

  // Busca todos os professores disponíveis
  const { data: allTeachers = [] } = useQuery(
    'all-teachers',
    () => api.get('/users?role=teacher').then(r => r.data).catch(() => []),
    { enabled: !!showAddTeacher }
  );

  // Busca matérias
  const { data: allSubjects = [] } = useQuery(
    'all-subjects',
    () => api.get('/subjects').then(r => r.data).catch(() => []),
    { enabled: !!showAddTeacher }
  );

  const createMut = useMutation((d) => api.post('/classes', d), {
    onSuccess: () => {
      toast.success('Turma criada!');
      qc.invalidateQueries('classes');
      setShowForm(false);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Erro ao criar turma')
  });

  const addStudentsMut = useMutation(
    ({ classId, studentIds }) => api.post(`/classes/${classId}/students`, { studentIds }),
    {
      onSuccess: () => {
        toast.success('Alunos adicionados!');
        qc.invalidateQueries('classes');
        qc.invalidateQueries(['class-detail', expanded]);
        setShowAddStudent(null);
        setSelectedStudents([]);
      },
      onError: (e) => toast.error(e.response?.data?.error || 'Erro ao adicionar alunos')
    }
  );

  const addTeacherMut = useMutation(
    ({ classId, teacherId, subjectId }) => api.post(`/classes/${classId}/teachers`, { teacherId, subjectId }),
    {
      onSuccess: () => {
        toast.success('Professor vinculado!');
        qc.invalidateQueries('classes');
        qc.invalidateQueries(['class-detail', expanded]);
        setShowAddTeacher(null);
        setTeacherForm({ teacherId: '', subjectId: '' });
      },
      onError: (e) => toast.error(e.response?.data?.error || 'Erro ao vincular professor')
    }
  );

  const removeStudentMut = useMutation(
    ({ classId, studentId }) => api.delete(`/classes/${classId}/students/${studentId}`),
    {
      onSuccess: () => {
        toast.success('Aluno removido!');
        qc.invalidateQueries('classes');
        qc.invalidateQueries(['class-detail', expanded]);
      },
      onError: () => toast.error('Erro ao remover aluno')
    }
  );

  const yearColors = [
    'bg-blue-900/30 border-blue-700/30',
    'bg-green-900/30 border-green-700/30',
    'bg-yellow-900/30 border-yellow-700/30',
    'bg-purple-900/30 border-purple-700/30',
    'bg-red-900/30 border-red-700/30',
    'bg-pink-900/30 border-pink-700/30',
    'bg-indigo-900/30 border-indigo-700/30'
  ];

  const toggleStudent = (id) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  // Filtra alunos que já estão na turma
  const enrolledIds = new Set((classDetail?.students || []).map(s => s.id));
  const availableStudents = allStudents.filter(s => !enrolledIds.has(s.id));

  return (
    <Layout title="Gerenciar Turmas">
      <div className="flex items-center justify-between mb-6">
        <p className="text-slate-400 text-sm">{classes.length} turmas cadastradas</p>
        <button
          onClick={() => { setShowForm(true); setForm(emptyForm); }}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-colors"
        >
          ➕ Nova Turma
        </button>
      </div>

      {/* Modal Nova Turma */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Nova Turma</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
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
                <button onClick={() => createMut.mutate(form)} disabled={createMut.isLoading}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                  {createMut.isLoading ? 'Criando...' : '✓ Criar Turma'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Alunos */}
      {showAddStudent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Adicionar Alunos</h3>
              <button onClick={() => { setShowAddStudent(null); setSelectedStudents([]); }} className="text-slate-400 hover:text-white">✕</button>
            </div>
            {availableStudents.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">Nenhum aluno disponível para adicionar.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                {availableStudents.map(s => (
                  <label key={s.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(s.id)}
                      onChange={() => toggleStudent(s.id)}
                      className="accent-purple-500"
                    />
                    <div className="w-7 h-7 bg-purple-700 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">
                      {(s.display_name || s.username)?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white text-sm">{s.display_name || s.username}</div>
                      {s.minecraft_username && <div className="text-green-400 text-xs">🎮 {s.minecraft_username}</div>}
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setShowAddStudent(null); setSelectedStudents([]); }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm">Cancelar</button>
              <button
                onClick={() => addStudentsMut.mutate({ classId: showAddStudent, studentIds: selectedStudents })}
                disabled={selectedStudents.length === 0 || addStudentsMut.isLoading}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                {addStudentsMut.isLoading ? 'Adicionando...' : `Adicionar (${selectedStudents.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Professor */}
      {showAddTeacher && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Vincular Professor</h3>
              <button onClick={() => { setShowAddTeacher(null); setTeacherForm({ teacherId: '', subjectId: '' }); }} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Professor *</label>
                <select value={teacherForm.teacherId} onChange={e => setTeacherForm(p => ({ ...p, teacherId: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none">
                  <option value="">Selecione o professor...</option>
                  {allTeachers.map(t => <option key={t.id} value={t.id}>{t.display_name || t.username}</option>)}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Matéria *</label>
                <select value={teacherForm.subjectId} onChange={e => setTeacherForm(p => ({ ...p, subjectId: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none">
                  <option value="">Selecione a matéria...</option>
                  {allSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowAddTeacher(null); setTeacherForm({ teacherId: '', subjectId: '' }); }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm">Cancelar</button>
                <button
                  onClick={() => addTeacherMut.mutate({ classId: showAddTeacher, ...teacherForm })}
                  disabled={!teacherForm.teacherId || !teacherForm.subjectId || addTeacherMut.isLoading}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                  {addTeacherMut.isLoading ? 'Vinculando...' : '✓ Vincular'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
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
                  {/* Alunos */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Alunos</h4>
                      <button
                        onClick={() => { setShowAddStudent(cls.id); setSelectedStudents([]); }}
                        className="text-xs px-2 py-1 bg-purple-600/40 hover:bg-purple-600/70 text-purple-300 rounded-lg transition-colors"
                      >
                        ➕ Adicionar
                      </button>
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {(classDetail.students || []).length === 0 ? (
                        <p className="text-slate-500 text-xs">Nenhum aluno matriculado</p>
                      ) : (classDetail.students || []).map(s => (
                        <div key={s.id} className="flex items-center gap-2 text-xs group">
                          <div className="w-5 h-5 bg-purple-700 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">
                            {s.display_name?.charAt(0)}
                          </div>
                          <span className="text-slate-300 truncate flex-1">{s.display_name}</span>
                          {s.minecraft_username && <span className="text-green-400 text-xs">🎮 {s.minecraft_username}</span>}
                          <button
                            onClick={() => removeStudentMut.mutate({ classId: cls.id, studentId: s.id })}
                            className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                            title="Remover aluno"
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Professores */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Professores</h4>
                      <button
                        onClick={() => { setShowAddTeacher(cls.id); setTeacherForm({ teacherId: '', subjectId: '' }); }}
                        className="text-xs px-2 py-1 bg-blue-600/40 hover:bg-blue-600/70 text-blue-300 rounded-lg transition-colors"
                      >
                        ➕ Vincular
                      </button>
                    </div>
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
