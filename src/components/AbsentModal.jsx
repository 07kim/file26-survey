import React from 'react';
import { Sparkles, X, ArrowRight } from 'lucide-react';

export default function AbsentModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      {/* ちっちゃいウィンドウ（体験案内モーダル） */}
      <div 
        className="relative w-full max-w-sm bg-slate-900/95 border border-amber-500/60 rounded-2xl p-6 text-center shadow-[0_0_30px_rgba(245,158,11,0.25)] animate-scale-up text-white"
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

        {/* アイコン */}
        <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mx-auto mb-3 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]">
          <Sparkles className="w-6 h-6" />
        </div>

        {/* タイトル */}
        <h3 className="text-base font-bold text-white mb-2 tracking-tight">
          体験用モードのご案内
        </h3>

        {/* ユーザー指定のメッセージ */}
        <div className="bg-slate-800/80 border border-amber-500/30 rounded-xl p-3.5 mb-4 text-left">
          <p className="text-xs text-amber-200 font-medium leading-relaxed">
            参加した雰囲気で、適当にフォーム答えてください。ランダムに答えて大丈夫です。フォームの内容とか、フォームのシステムを見て楽しんでください。
          </p>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed mb-5">
          ※ 氏名と学年のみ必須です。その他の設問はすべて任意となっており、未選択のままでも送信できます。
        </p>

        {/* OK / 閉じるボタン */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:brightness-110 shadow-md shadow-amber-950 transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>フォームを体験する</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
