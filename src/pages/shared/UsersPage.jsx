import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '../../components/shared/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ROLE_LABELS = { admin:'👑 Admin', secretary:'🏢 Secretaria', teacher:'👨‍🏫 Professor', student:'👨‍🎓 Aluno' };
const ROLE_COLORS = { admin:'text-red-400 bg-red-900/20', secretary:'text-blue-400 bg-blue-900/20', teacher:'text-green-400 bg-green-900/20', student:'text-yellow-400 bg-yellow-900/20' };

const emptyForm = { username:'', email:'', password:'', role:'student', displayName:'', minecraftUsername:'' };

export default function UsersPage() {
  const qc = useQueryClient();
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const f = (k,v) => setForm(p => ({...p,[k]:v}));

  const { data: users = [], isLoading } = useQuery(
    ['users', role, search],
    () => api.get('/users', { params: { role: role || undefined, search: search || undefined } }).then(r => r.data)
  );

  const createMut = useMutation((d) => api.post('/auth/register', d), {
    onSuccess: () => { toast.success('Usuário criado!'); qc.invalidateQueries('users'); setShowForm(false); setForm(emptyForm); },
    onError: (e) => toast.error(e.response?.data?.error || 'Erro')
  });
  const toggleMut = useMutation((id) => api.put(`/users/${id}/toggle`), {
    onSuccess: () => { toast.success('Status alterado'); qc.invalidateQueries('users'); }
  });
  const resetPwMut = useMutation((id) => api.put(`/users/${id}/reset-password`, { newPassword: 'Mudar@123' }), {
    onSuccess: () => toast.success('Senha redefinida para: Mudar@123')
  });

  return (
    <Layout title="Gerenciar Usuários">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {['','admin','secretary','teacher','student'].map(r => (
            <button key={r} onClick={() => setRole(r)}
              className={`px-3 py-1.5 rounded-xl text-sm transition-colors ${role === r ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {r === '' ? 'Todos' : ROLE_LABELS[r]}
            </button>
          ))}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Buscar..."
            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-purple-500 focus:outline-none w-44" />
        </div>
        <button onClick={() => { setShowForm(true); setForm(emptyForm); }}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium">➕ Novo Usuário</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Novo Usuário</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={e => { e.preventDefault(); createMut.mutate(form); }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Username *</label>
                  <input value={form.username} onChange={e => f('username',e.target.value)} required placeholder="usuario"
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Nome completo *</label>
                  <input value={form.displayName} onChange={e => f('displayName',e.target.value)} required placeholder="João Silva"
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Email</label>
                <input type="email" value={form.email} onChange={e => f('email',e.target.value)} placeholder="joao@escola.edu.br"
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Senha *</label>
                  <input type="password" value={form.password} onChange={e => f('password',e.target.value)} required placeholder="mín. 6 chars"
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Função *</label>
                  <select value={form.role} onChange={e => f('role',e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none">
                    {Object.entries(ROLE_LABELS).filter(([r]) => r !== 'admin').map(([r,l]) => <option key={r} value={r}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Username Minecraft (opcional)</label>
                <input value={form.minecraftUsername} onChange={e => f('minecraftUsername',e.target.value)} placeholder="Player123"
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm">Cancelar</button>
                <button type="submit" disabled={createMut.isLoading}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                  {createMut.isLoading ? 'Criando...' : '✓ Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                {['Usuário','Função','Minecraft','Status','Último login','Ações'].map(h => (
                  <th key={h} className="text-left text-slate-400 text-xs font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {u.display_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">{u.display_name}</div>
                        <div className="text-slate-500 text-xs">@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role]}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{u.minecraft_username || <span className="text-slate-600">—</span>}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${u.is_active ? 'text-green-400' : 'text-red-400'}`}>
                      {u.is_active ? '● Ativo' : '● Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {u.last_login ? new Date(u.last_login).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => toggleMut.mutate(u.id)}
                        className={`px-2 py-1 rounded-lg text-xs transition-colors ${u.is_active ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40' : 'bg-green-900/20 text-green-400 hover:bg-green-900/40'}`}>
                        {u.is_active ? 'Desativar' : 'Ativar'}
                      </button>
                      <button onClick={() => { if(window.confirm('Redefinir senha para Mudar@123?')) resetPwMut.mutate(u.id); }}
                        className="px-2 py-1 rounded-lg text-xs bg-slate-800 text-slate-400 hover:text-white transition-colors">
                        🔑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-12 text-slate-500">Nenhum usuário encontrado.</div>
          )}
        </div>
      )}
    </Layout>
  );
}
