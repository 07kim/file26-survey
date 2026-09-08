import React, { useEffect, useState } from 'react';
import { MessageCircle, ScrollText, Layers, ArrowRight, X, ShieldCheck, Sparkles, Terminal } from 'lucide-react';

export default function UnlockModal({ isOpen, onClose, onNavigateTab }) {
  const [stepVisible, setStepVisible] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setStepVisible(0);
      const timers = [
        setTimeout(() => setStepVisible(1), 200),
        setTimeout(() => setStepVisible(2), 600),
        setTimeout(() => setStepVisible(3), 1000),
        setTimeout(() => setStepVisible(4), 1400),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const UNLOCK_ITEMS = [
    {
      id: 'crosstalk',
      icon: MessageCircle,
      tag: 'PROTOCOL 01',
      color: '#0284c7',
      bg: 'rgba(2, 132, 199, 0.15)',
      border: 'rgba(2, 132, 199, 0.4)',
      title: '感想 ＆ 考察ボード',
      desc: '他の観測者たちの生の声、目撃した場面ごとの考察・タイムラインが閲覧可能です。'
    },
    {
      id: 'characters',
      icon: ScrollText,
      tag: 'PROTOCOL 02',
      color: '#d97706',
      bg: 'rgba(217, 119, 6, 0.15)',
      border: 'rgba(217, 119, 6, 0.4)',
      title: 'キャラクター極秘手記',
      desc: '登場人物たちが抱えていた本当の想いや、事件の裏側に残された独白記録を解読できます。'
    },
    {
      id: 'gallery',
      icon: Layers,
      tag: 'PROTOCOL 03',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.15)',
      border: 'rgba(16, 185, 129, 0.4)',
      title: 'みんなの戦歴カード',
      desc: '全観測者の周回ルート・観測率・獲得称号が刻まれたライセンスカード一覧を公開。'
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900/95 border border-emerald-500/50 rounded-2xl p-5 sm:p-7 shadow-[0_0_50px_rgba(16,185,129,0.25)] text-left overflow-hidden">
        
        {/* 背景の走査線・サイバーエフェクト */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 animate-pulse" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 閉じるボタン */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          title="閉じる"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ヘッダー演出 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[11px] font-mono font-bold tracking-widest uppercase mb-2.5 shadow-sm animate-bounce">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ACCESS PROTOCOL LEVEL 2 UNLOCKED</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <span>全機密アーカイブ 解放完了</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-md mx-auto leading-relaxed text-pretty-ja">
            観測ログの提出が完了しました。暗号化されていた他観測者のデータおよび極秘手記へのアクセス権が付与されました。
          </p>
        </div>

        {/* 解放された3つの機能カード */}
        <div className="space-y-2.5 mb-6">
          {UNLOCK_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            const isShown = stepVisible >= idx + 1;

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (onNavigateTab) onNavigateTab(item.id);
                  onClose();
                }}
                className={`group p-3 sm:p-3.5 rounded-xl border transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 ${
                  isShown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                }`}
                style={{
                  background: item.bg,
                  borderColor: item.border
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform"
                    style={{ background: 'rgba(0, 0, 0, 0.4)', color: item.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded" style={{ background: 'rgba(0,0,0,0.3)', color: item.color }}>
                        {item.tag}
                      </span>
                      <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-[11.5px] text-slate-300 mt-0.5 line-clamp-1">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold shrink-0 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all" style={{ color: item.color }}>
                  <span className="hidden sm:inline">開く</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>

        {/* フッターアクション */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:text-white transition-all cursor-pointer text-center"
          >
            完了画面（ライセンスカード）を確認する
          </button>
          <button
            type="button"
            onClick={() => {
              if (onNavigateTab) onNavigateTab('crosstalk');
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-900/40 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>感想ボードを今すぐ見に行く</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
