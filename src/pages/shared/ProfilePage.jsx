import React, { useState } from 'react';
import { useMutation } from 'react-query';
import Layout from '../../components/shared/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const XP_PER_LEVEL = 1000;
const ROLE_LABELS = { admin:'👑 Administrador', secretary:'🏢 Secretaria', teacher:'👨‍🏫 Professor', student:'👨‍🎓 Aluno' };

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    minecraftUsername: user?.minecraftUsername || ''
  });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const f = (k,v) => setForm(p=>({...p,[k]:v}));
  const fp = (k,v) => setPwForm(p=>({...p,[k]:v}));

  const profileMut = useMutation(
    (d) => api.put('/auth/profile', d),
    { onSuccess: () => { toast.success('Perfil atualizado!'); refreshUser(); }, onError: () => toast.error('Erro ao salvar') }
  );
  const pwMut = useMutation(
    (d) => api.put('/auth/password', d),
    {
      onSuccess: () => { toast.success('Senha alterada com sucesso!'); setPwForm({ current:'', newPw:'', confirm:'' }); },
      onError: (e) => toast.error(e.response?.data?.error || 'Senha atual incorreta')
    }
  );

  const xp = user?.totalXp || 0;
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpInLevel = xp % XP_PER_LEVEL;
  const xpPct = Math.min(100, Math.round(xpInLevel / XP_PER_LEVEL * 100));

  return (
    <Layout title="Meu Perfil">
      <div className="max-w-2xl mx-auto">
        {/* Header card */}
        <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-700/30 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-purple-900/40 flex-shrink-0">
              {user?.displayName?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white text-2xl font-bold">{user?.displayName}</h2>
              <p className="text-purple-300">@{user?.username}</p>
              <p className="text-slate-400 text-sm mt-1">{ROLE_LABELS[user?.role]}</p>
              {user?.minecraftUsername && (
                <p className="text-green-400 text-sm mt-1">🎮 {user.minecraftUsername}</p>
              )}
            </div>
            {user?.role === 'student' && (
              <div className="text-right flex-shrink-0">
                <div className="text-3xl font-bold text-yellow-400">{level}</div>
                <div className="text-slate-400 text-xs">Nível</div>
                <div className="text-yellow-300 text-sm font-medium mt-1">{xp.toLocaleString()} XP</div>
              </div>
            )}
          </div>
          {user?.role === 'student' && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Nível {level}</span>
                <span>{xpInLevel} / {XP_PER_LEVEL} XP</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all duration-500" style={{width:`${xpPct}%`}}></div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 bg-slate-900 border border-slate-800 rounded-xl p-1">
          {['profile','password'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              {t === 'profile' ? '👤 Dados Pessoais' : '🔑 Alterar Senha'}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <form onSubmit={e => { e.preventDefault(); profileMut.mutate(form); }} className="space-y-4">
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Nome de exibição</label>
                <input value={form.displayName} onChange={e => f('displayName',e.target.value)} required
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Email</label>
                <input type="email" value={form.email} onChange={e => f('email',e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Username Minecraft</label>
                <input value={form.minecraftUsername} onChange={e => f('minecraftUsername',e.target.value)}
                  placeholder="Seu nick no servidor"
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                <p className="text-slate-500 text-xs mt-1">Vincular seu nick permite autenticação automática no servidor Minecraft</p>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={profileMut.isLoading}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors">
                  {profileMut.isLoading ? 'Salvando...' : '✓ Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        )}

        {tab === 'password' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <form onSubmit={e => {
              e.preventDefault();
              if (pwForm.newPw !== pwForm.confirm) { toast.error('Senhas não conferem'); return; }
              if (pwForm.newPw.length < 6) { toast.error('Senha deve ter mínimo 6 caracteres'); return; }
              pwMut.mutate({ currentPassword: pwForm.current, newPassword: pwForm.newPw });
            }} className="space-y-4">
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Senha atual</label>
                <input type="password" value={pwForm.current} onChange={e => fp('current',e.target.value)} required
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Nova senha</label>
                <input type="password" value={pwForm.newPw} onChange={e => fp('newPw',e.target.value)} required
                  placeholder="mínimo 6 caracteres"
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Confirmar nova senha</label>
                <input type="password" value={pwForm.confirm} onChange={e => fp('confirm',e.target.value)} required
                  placeholder="repita a nova senha"
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
              <div className="p-3 bg-yellow-900/10 border border-yellow-800/20 rounded-xl text-xs text-yellow-400">
                ⚠️ Após alterar a senha você precisará fazer login novamente.
              </div>
              <button type="submit" disabled={pwMut.isLoading}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors">
                {pwMut.isLoading ? 'Alterando...' : '🔑 Alterar Senha'}
              </button>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
}
