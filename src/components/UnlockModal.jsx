import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Unlock, X, Check } from 'lucide-react';

export default function UnlockModal({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      // 画面上部（ヘッダータブ周辺）に向けてクラッカーを弾けさせる演出
      try {
        // 左上から
        confetti({
          particleCount: 40,
          angle: 60,
          spread: 55,
          origin: { x: 0.2, y: 0.15 },
          colors: ['#38bdf8', '#fbbf24', '#34d399', '#f43f5e', '#a855f7']
        });
        // 右上から
        confetti({
          particleCount: 40,
          angle: 120,
          spread: 55,
          origin: { x: 0.8, y: 0.15 },
          colors: ['#38bdf8', '#fbbf24', '#34d399', '#f43f5e', '#a855f7']
        });
        // 中央上部からシャワー
        setTimeout(() => {
          confetti({
            particleCount: 60,
            spread: 100,
            origin: { x: 0.5, y: 0.1 },
            colors: ['#38bdf8', '#fbbf24', '#34d399', '#f43f5e', '#a855f7']
          });
        }, 150);
      } catch (e) {
        console.warn('Confetti error:', e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      {/* ちっちゃいウィンドウ（連絡だけのシンプルモーダル） */}
      <div 
        className="relative w-full max-w-sm bg-slate-900/95 border border-emerald-500/60 rounded-2xl p-6 text-center shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-scale-up text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 閉じるボタン */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          title="閉じる"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 鍵が開くアイコン */}
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center mx-auto mb-3 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)] animate-bounce">
          <Unlock className="w-6 h-6" />
        </div>

        {/* メッセージ */}
        <h3 className="text-lg font-bold text-white mb-1.5 tracking-tight">
          他タブが解放されました
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed mb-5">
          上部メニューから「感想」「キャラ」「みんなのカード」が閲覧可能です。
        </p>

        {/* OKボタン */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 shadow-md shadow-emerald-950 transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4" />
          <span>OK</span>
        </button>
      </div>
    </div>
  );
}
