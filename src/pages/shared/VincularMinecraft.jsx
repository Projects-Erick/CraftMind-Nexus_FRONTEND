import { useState, useEffect } from "react";
import api from "../../services/api";

export default function VincularMinecraft() {
  const [status, setStatus]   = useState(null);
  const [code, setCode]       = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied]   = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => { fetchStatus(); }, []);

  // Countdown do código
  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const diff = Math.floor((new Date(expiresAt) - new Date()) / 1000);
      if (diff <= 0) { setCode(null); setTimeLeft(null); clearInterval(interval); }
      else setTimeLeft(diff);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  async function fetchStatus() {
    try {
      const r = await api.get('/link/status');
      setStatus(r.data);
    } catch {}
  }

  async function generateCode() {
    setLoading(true);
    try {
      const r = await api.post('/link/generate');
      setCode(r.data.code);
      setExpiresAt(r.data.expiresAt);
      setTimeLeft(15 * 60);
    } catch (e) {
      alert('Erro ao gerar código. Tente novamente.');
    } finally { setLoading(false); }
  }

  async function removeLink() {
    if (!window.confirm('Remover vínculo com o Minecraft?')) return;
    try {
      await api.delete('/link');
      setStatus({ linked: false });
      setCode(null);
    } catch { alert('Erro ao remover vínculo.'); }
  }

  function copyCode() {
    navigator.clipboard.writeText(`/vincular ${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const fmtTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  return (
    <div className="max-w-lg mx-auto mt-8 p-6 bg-gray-800 rounded-2xl shadow-xl border border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl"></span>
        <div>
          <h2 className="text-xl font-bold text-white">Vincular Minecraft</h2>
          <p className="text-sm text-gray-400">Conecte sua conta ao servidor</p>
        </div>
      </div>

      {/* Status atual */}
      {status?.linked ? (
        <div className="bg-green-900/40 border border-green-600 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 font-semibold flex items-center gap-2">
                <span></span> Conta vinculada!
              </p>
              {status.minecraftUsername && (
                <p className="text-gray-300 text-sm mt-1">
                  Nick: <span className="font-mono text-white">{status.minecraftUsername}</span>
                </p>
              )}
              {status.minecraftUuid && (
                <p className="text-gray-500 text-xs mt-1 font-mono truncate">
                  UUID: {status.minecraftUuid}
                </p>
              )}
            </div>
            <button onClick={removeLink}
              className="text-xs text-red-400 hover:text-red-300 underline ml-4">
              Desvincular
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4 mb-5">
          <p className="text-yellow-400 text-sm flex items-center gap-2">
            <span></span> Sua conta não está vinculada ao Minecraft ainda.
          </p>
        </div>
      )}

      {/* Instruções */}
      <div className="mb-5">
        <p className="text-gray-300 text-sm font-semibold mb-3">Como vincular:</p>
        <ol className="space-y-2 text-sm text-gray-400">
          <li className="flex gap-2"><span className="text-emerald-400 font-bold">1.</span> Clique em "Gerar Código" abaixo</li>
          <li className="flex gap-2"><span className="text-emerald-400 font-bold">2.</span> Entre no servidor Minecraft</li>
          <li className="flex gap-2"><span className="text-emerald-400 font-bold">3.</span> Digite o comando gerado no chat</li>
          <li className="flex gap-2"><span className="text-emerald-400 font-bold">4.</span> Pronto! O vínculo é automático </li>
        </ol>
      </div>

      {/* Código gerado */}
      {code && timeLeft > 0 && (
        <div className="bg-gray-900 border border-emerald-600 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Comando para digitar no Minecraft:</span>
            <span className={`text-xs font-mono px-2 py-1 rounded-full ${timeLeft < 60 ? 'bg-red-900 text-red-300' : 'bg-gray-700 text-gray-300'}`}>
              {fmtTime(timeLeft)}
            </span>
          </div>

          <div className="bg-black rounded-lg p-3 flex items-center justify-between gap-3 mb-3">
            <code className="text-emerald-400 font-mono text-lg tracking-widest">
              /vincular <span className="text-white font-bold">{code}</span>
            </code>
            <button onClick={copyCode}
              className="flex-shrink-0 bg-emerald-700 hover:bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            O código expira em {fmtTime(timeLeft)}. Após usar, um novo será necessário.
          </p>
        </div>
      )}

      {/* Botão gerar */}
      <button
        onClick={generateCode}
        disabled={loading}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
        {loading ? (
          <><span className="animate-spin">⟳</span> Gerando...</>
        ) : (
          <>{code && timeLeft > 0 ? 'Gerar novo código' : 'Gerar Código'}</>
        )}
      </button>

      {status?.linked && (
        <p className="text-center text-xs text-gray-600 mt-3">
          Você já está vinculado. Gerar novo código substituirá o vínculo atual.
        </p>
      )}
    </div>
  );
}
