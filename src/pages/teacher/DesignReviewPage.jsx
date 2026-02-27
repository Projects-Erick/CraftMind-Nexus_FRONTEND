import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '../../components/shared/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const COLOR_PALETTE = {
  '#FFFFFF': '#FFFFFF', '#FF0000': '#FF0000', '#00FF00': '#00FF00',
  '#0000FF': '#0000FF', '#FFFF00': '#FFFF00', '#FF8800': '#FF8800',
  '#FF00FF': '#FF00FF', '#00FFFF': '#00FFFF', '#000000': '#000000',
  '#888888': '#888888', '#AAAAAA': '#AAAAAA', '#5500FF': '#5500FF',
  '#004D00': '#004D00', '#8B4513': '#8B4513', '#FFB6C1': '#FFB6C1',
  '#003087': '#003087'
};

function PixelCanvas({ canvasData, size = 200 }) {
  if (!canvasData || !Array.isArray(canvasData)) return (
    <div className="flex items-center justify-center bg-slate-800 rounded-xl" style={{ width: size, height: size }}>
      <span className="text-slate-500 text-xs">Sem dados</span>
    </div>
  );
  const cellSize = size / 24;
  return (
    <div style={{ width: size, height: size, display: 'grid', gridTemplateColumns: `repeat(24, ${cellSize}px)` }}
      className="rounded-xl overflow-hidden border border-slate-700">
      {canvasData.flat().map((color, idx) => (
        <div key={idx} style={{ width: cellSize, height: cellSize, background: COLOR_PALETTE[color] || color || '#FFFFFF' }} />
      ))}
    </div>
  );
}

export default function DesignReviewPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [rating, setRating] = useState('');
  const [comment, setComment] = useState('');

  const { data: designs = [], isLoading } = useQuery(
    'designs',
    () => api.get('/design').then(r => r.data)
  );

  const rateMut = useMutation(
    ({ id, rating, comment }) => api.put(`/design/${id}/rate`, { rating: parseInt(rating), comment }),
    {
      onSuccess: () => {
        toast.success('Design avaliado!');
        qc.invalidateQueries('designs');
        setSelected(null); setRating(''); setComment('');
      },
      onError: () => toast.error('Erro ao avaliar')
    }
  );

  return (
    <Layout title="Design Review — PixelStudio">
      {selected && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Avaliar PixelArt</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="flex justify-center mb-5">
              <PixelCanvas canvasData={selected.canvas_data ? JSON.parse(selected.canvas_data) : null} size={240} />
            </div>
            <div className="text-slate-300 text-sm mb-4 text-center">
              <strong>{selected.student_name}</strong> — {selected.assignment_title}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Nota (0–100)</label>
                <input type="number" min="0" max="100" value={rating} onChange={e => setRating(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-lg font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 focus:outline-none" />
                <div className="flex justify-between text-xs mt-1 text-slate-500">
                  <span>0 = Não entregue</span><span>50 = Regular</span><span>100 = Excelente</span>
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Comentário (opcional)</label>
                <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                  placeholder="Ótima composição! / Tente usar mais cores..."
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-pink-500 focus:outline-none resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSelected(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm">Cancelar</button>
                <button onClick={() => rateMut.mutate({ id: selected.id, rating, comment })}
                  disabled={!rating || rateMut.isLoading}
                  className="flex-1 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                  {rateMut.isLoading ? 'Salvando...' : '🎨 Avaliar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
      ) : designs.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🎨</div>
          <div className="text-slate-400">Nenhum design enviado ainda.</div>
          <div className="text-slate-500 text-sm mt-1">Alunos enviam via /pixelstudio no Minecraft</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {designs.map(d => (
            <div key={d.id} className="bg-slate-900 border border-slate-800 hover:border-pink-700/40 rounded-2xl p-4 transition-all">
              <div className="flex justify-center mb-3">
                <PixelCanvas canvasData={d.canvas_data ? JSON.parse(d.canvas_data) : null} size={180} />
              </div>
              <div className="text-white font-medium text-sm truncate">{d.student_name}</div>
              <div className="text-slate-400 text-xs mt-0.5 truncate">{d.assignment_title}</div>
              <div className="flex items-center justify-between mt-3">
                {d.teacher_rating != null ? (
                  <div>
                    <span className={`text-lg font-bold ${d.teacher_rating >= 70 ? 'text-green-400' : d.teacher_rating >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {d.teacher_rating}/100
                    </span>
                    {d.teacher_comment && <div className="text-slate-500 text-xs mt-0.5 line-clamp-1">{d.teacher_comment}</div>}
                  </div>
                ) : (
                  <span className="text-xs text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded-full">Aguardando avaliação</span>
                )}
                <button onClick={() => setSelected(d)}
                  className="px-3 py-1.5 bg-pink-700 hover:bg-pink-600 text-white text-xs rounded-lg transition-colors font-medium">
                  {d.teacher_rating != null ? '✏️ Reeditar' : '🎨 Avaliar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
