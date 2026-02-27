import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '../../components/shared/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ─── Constantes ────────────────────────────────────────────
const ROLES = [
  { value: 'admin',     label: '👑 Admin',      color: 'text-red-400 bg-red-900/20 border-red-800/30' },
  { value: 'secretary', label: '🏢 Secretaria', color: 'text-blue-400 bg-blue-900/20 border-blue-800/30' },
  { value: 'teacher',   label: '👨‍🏫 Professor', color: 'text-green-400 bg-green-900/20 border-green-800/30' },
  { value: 'student',   label: '👨‍🎓 Aluno',    color: 'text-yellow-400 bg-yellow-900/20 border-yellow-800/30' },
];
const roleInfo = Object.fromEntries(ROLES.map(r => [r.value, r]));

const emptyCreate = { username: '', displayName: '', email: '', password: '', role: 'student', minecraftUsername: '' };

// ─── Componentes auxiliares ─────────────────────────────────
const Input = ({ label, ...props }) => (
  <div>
    {label && <label className="block text-xs text-slate-400 mb-1">{label}</label>}
    <input
      {...props}
      className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5
                 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none
                 placeholder-slate-600 transition-all"
    />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div>
    {label && <label className="block text-xs text-slate-400 mb-1">{label}</label>}
    <select
      {...props}
      className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5
                 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none"
    >
      {children}
    </select>
  </div>
);

const Avatar = ({ name, role, size = 9 }) => {
  const bg = { admin:'from-red-600 to-red-700', secretary:'from-blue-600 to-blue-700',
                teacher:'from-green-600 to-green-700', student:'from-yellow-500 to-amber-600' };
  return (
    <div className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 bg-gradient-to-br ${bg[role] || 'from-purple-600 to-indigo-600'}`}>
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
};

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <h3 className="text-white font-semibold text-base">{title}</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-xl leading-none">×</button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

// ─── Modal: Criar usuário ────────────────────────────────────
function CreateModal({ onClose, isAdmin }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyCreate);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const mut = useMutation(d => api.post('/auth/register', d), {
    onSuccess: () => {
      toast.success('✅ Usuário criado com sucesso!');
      qc.invalidateQueries('admin-users');
      onClose();
    },
    onError: e => toast.error(e.response?.data?.error || 'Erro ao criar usuário'),
  });

  return (
    <Modal title="➕ Criar Novo Usuário" onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); mut.mutate(form); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Username *" value={form.username} onChange={e => f('username', e.target.value)} required placeholder="ex: joao.silva" />
          <Input label="Nome completo *" value={form.displayName} onChange={e => f('displayName', e.target.value)} required placeholder="João Silva" />
        </div>
        <Input label="Email" type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="joao@escola.edu.br" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Senha *" type="password" value={form.password} onChange={e => f('password', e.target.value)} required placeholder="mín. 6 caracteres" />
          <Select label="Cargo *" value={form.role} onChange={e => f('role', e.target.value)}>
            {ROLES.filter(r => isAdmin || r.value !== 'admin').map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </Select>
        </div>
        <Input label="Username Minecraft (opcional)" value={form.minecraftUsername} onChange={e => f('minecraftUsername', e.target.value)} placeholder="Player123" />
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-colors">Cancelar</button>
          <button type="submit" disabled={mut.isLoading} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
            {mut.isLoading ? '⏳ Criando...' : '✓ Criar Conta'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Modal: Editar usuário ───────────────────────────────────
function EditModal({ user, onClose, isAdmin }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    username: user.username || '',
    displayName: user.display_name || '',
    email: user.email || '',
    role: user.role || 'student',
    minecraftUsername: user.minecraft_username || '',
    minecraftUuid: user.minecraft_uuid || '',
  });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Senha separada
  const [pwForm, setPwForm] = useState({ newPassword: '', confirm: '' });
  const [tab, setTab] = useState('info'); // 'info' | 'password'

  const editMut = useMutation(d => api.put(`/users/${user.id}`, d), {
    onSuccess: () => { toast.success('✅ Dados atualizados!'); qc.invalidateQueries('admin-users'); onClose(); },
    onError: e => toast.error(e.response?.data?.error || 'Erro ao atualizar'),
  });

  const pwMut = useMutation(d => api.put(`/users/${user.id}/password`, d), {
    onSuccess: () => { toast.success('🔑 Senha alterada!'); setPwForm({ newPassword: '', confirm: '' }); setTab('info'); },
    onError: e => toast.error(e.response?.data?.error || 'Erro ao alterar senha'),
  });

  const handlePw = e => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('As senhas não coincidem!');
    if (pwForm.newPassword.length < 6) return toast.error('Senha deve ter no mínimo 6 caracteres');
    pwMut.mutate({ newPassword: pwForm.newPassword });
  };

  return (
    <Modal title={`✏️ Editar — ${user.display_name}`} onClose={onClose}>
      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {['info', 'password'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            {t === 'info' ? '📋 Dados' : '🔑 Senha'}
          </button>
        ))}
      </div>

      {tab === 'info' ? (
        <form onSubmit={e => { e.preventDefault(); editMut.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Username" value={form.username} onChange={e => f('username', e.target.value)} required placeholder="usuario" />
            <Input label="Nome completo" value={form.displayName} onChange={e => f('displayName', e.target.value)} required placeholder="Nome Completo" />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="email@escola.edu.br" />
          {isAdmin && (
            <Select label="Cargo" value={form.role} onChange={e => f('role', e.target.value)}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Select>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Minecraft Username" value={form.minecraftUsername} onChange={e => f('minecraftUsername', e.target.value)} placeholder="Player123" />
            <Input label="Minecraft UUID" value={form.minecraftUuid} onChange={e => f('minecraftUuid', e.target.value)} placeholder="uuid-aqui" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-colors">Cancelar</button>
            <button type="submit" disabled={editMut.isLoading} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
              {editMut.isLoading ? '⏳ Salvando...' : '✓ Salvar Alterações'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handlePw} className="space-y-4">
          <div className="p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-xl">
            <p className="text-yellow-400 text-xs">⚠️ A nova senha será ativada imediatamente. O usuário precisará utilizá-la no próximo login.</p>
          </div>
          <Input label="Nova senha" type="password" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} required placeholder="mín. 6 caracteres" />
          <Input label="Confirmar nova senha" type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} required placeholder="repita a senha" />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setTab('info')} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-colors">Voltar</button>
            <button type="submit" disabled={pwMut.isLoading} className="flex-1 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
              {pwMut.isLoading ? '⏳ Alterando...' : '🔑 Alterar Senha'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

// ─── Modal: Confirmar deleção ────────────────────────────────
function DeleteModal({ user, onClose }) {
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState('');

  const mut = useMutation(() => api.delete(`/users/${user.id}`), {
    onSuccess: () => { toast.success('🗑️ Usuário deletado'); qc.invalidateQueries('admin-users'); onClose(); },
    onError: e => toast.error(e.response?.data?.error || 'Erro ao deletar'),
  });

  return (
    <Modal title="🗑️ Deletar Usuário" onClose={onClose}>
      <div className="space-y-4">
        <div className="p-4 bg-red-900/20 border border-red-700/30 rounded-xl">
          <p className="text-red-400 text-sm font-medium mb-1">⚠️ Ação irreversível!</p>
          <p className="text-slate-400 text-sm">Isso irá deletar permanentemente a conta de <strong className="text-white">{user.display_name}</strong> (@{user.username}) e todos os seus dados associados.</p>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Digite <strong className="text-white">{user.username}</strong> para confirmar</label>
          <input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder={user.username}
            className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-red-500 focus:outline-none" />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-colors">Cancelar</button>
          <button onClick={() => mut.mutate()} disabled={confirm !== user.username || mut.isLoading}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {mut.isLoading ? '⏳ Deletando...' : '🗑️ Deletar Conta'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Página principal ────────────────────────────────────────
export default function AdminPanel() {
  const { data: currentUser } = useQuery('me', () => api.get('/auth/me').then(r => r.data));
  const isAdmin = currentUser?.role === 'admin';

  const qc = useQueryClient();
  const [filterRole, setFilterRole] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // { type: 'create'|'edit'|'delete', user? }

  const { data: users = [], isLoading } = useQuery(
    ['admin-users', filterRole, search],
    () => api.get('/users', { params: { role: filterRole || undefined, search: search || undefined } }).then(r => r.data),
    { refetchOnWindowFocus: false }
  );

  const toggleMut = useMutation(id => api.put(`/users/${id}/toggle`), {
    onSuccess: (_, id) => {
      const u = users.find(u => u.id === id);
      toast.success(`${u?.display_name} ${u?.is_active ? 'desativado' : 'ativado'}`);
      qc.invalidateQueries('admin-users');
    },
    onError: e => toast.error(e.response?.data?.error || 'Erro'),
  });

  // Stats
  const counts = ROLES.reduce((acc, r) => { acc[r.value] = users.filter(u => u.role === r.value).length; return acc; }, {});

  return (
    <Layout title="🛡️ Painel Administrativo">

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {ROLES.map(r => (
          <div key={r.value} onClick={() => setFilterRole(filterRole === r.value ? '' : r.value)}
            className={`bg-slate-900 border rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.02] ${filterRole === r.value ? 'border-purple-500 shadow-lg shadow-purple-900/20' : 'border-slate-800 hover:border-slate-700'}`}>
            <div className="text-2xl mb-2">{r.label.split(' ')[0]}</div>
            <div className="text-2xl font-bold text-white">{counts[r.value] || 0}</div>
            <div className="text-xs text-slate-400 mt-0.5">{r.label.split(' ').slice(1).join(' ')}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex-1 relative min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, username ou email..."
            className="w-full bg-slate-900 border border-slate-800 text-white text-sm rounded-xl pl-9 pr-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterRole('')}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${filterRole === '' ? 'bg-purple-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}>
            Todos ({users.length})
          </button>
          {ROLES.map(r => (
            <button key={r.value} onClick={() => setFilterRole(filterRole === r.value ? '' : r.value)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${filterRole === r.value ? 'bg-purple-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}>
              {r.label}
            </button>
          ))}
        </div>

        <button onClick={() => setModal({ type: 'create' })}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-purple-900/30">
          ➕ Nova Conta
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <div className="text-4xl mb-3">👤</div>
            <p>Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80">
                  {['Usuário', 'Cargo', 'Email', 'Minecraft', 'Status', 'Último acesso', 'Ações'].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {users.map(u => {
                  const info = roleInfo[u.role];
                  const isMe = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors group">
                      {/* Usuário */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.display_name} role={u.role} />
                          <div>
                            <div className="text-white text-sm font-medium flex items-center gap-1.5">
                              {u.display_name}
                              {isMe && <span className="text-xs bg-purple-900/40 text-purple-400 px-1.5 py-0.5 rounded-full">você</span>}
                            </div>
                            <div className="text-slate-500 text-xs">@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      {/* Cargo */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${info?.color || 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                          {info?.label || u.role}
                        </span>
                      </td>
                      {/* Email */}
                      <td className="px-4 py-3 text-slate-400 text-sm max-w-[200px] truncate">
                        {u.email || <span className="text-slate-600">—</span>}
                      </td>
                      {/* Minecraft */}
                      <td className="px-4 py-3">
                        {u.minecraft_username
                          ? <span className="text-green-400 text-sm">🎮 {u.minecraft_username}</span>
                          : <span className="text-slate-600 text-sm">—</span>}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1.5 text-xs font-medium ${u.is_active ? 'text-green-400' : 'text-red-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                          {u.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      {/* Último acesso */}
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {u.last_login ? new Date(u.last_login).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—'}
                      </td>
                      {/* Ações */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {/* Editar */}
                          <button onClick={() => setModal({ type: 'edit', user: u })}
                            title="Editar dados"
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-purple-900/40 transition-colors text-sm">
                            ✏️
                          </button>
                          {/* Ativar/Desativar */}
                          {!isMe && (
                            <button onClick={() => toggleMut.mutate(u.id)}
                              title={u.is_active ? 'Desativar conta' : 'Ativar conta'}
                              className={`p-1.5 rounded-lg text-sm transition-colors ${u.is_active ? 'bg-slate-800 text-orange-400 hover:bg-orange-900/30' : 'bg-slate-800 text-green-400 hover:bg-green-900/30'}`}>
                              {u.is_active ? '🔒' : '🔓'}
                            </button>
                          )}
                          {/* Deletar — só admin, não pode deletar a si mesmo */}
                          {isAdmin && !isMe && u.role !== 'admin' && (
                            <button onClick={() => setModal({ type: 'delete', user: u })}
                              title="Deletar conta"
                              className="p-1.5 rounded-lg bg-slate-800 text-red-500 hover:bg-red-900/30 transition-colors text-sm">
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {!isLoading && users.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-600">
            {users.length} usuário{users.length !== 1 ? 's' : ''} encontrado{users.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === 'create' && <CreateModal isAdmin={isAdmin} onClose={() => setModal(null)} />}
      {modal?.type === 'edit'   && <EditModal   isAdmin={isAdmin} user={modal.user} onClose={() => setModal(null)} />}
      {modal?.type === 'delete' && <DeleteModal user={modal.user} onClose={() => setModal(null)} />}
    </Layout>
  );
}
