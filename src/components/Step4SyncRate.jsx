import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Gauge, Sparkles, ArrowRight, ArrowLeft, Smartphone, Radio } from 'lucide-react';

export default function Step4SyncRate({ formData, updateFormData, onNext, onPrev }) {
  const [syncRate, setSyncRate] = useState(formData.syncRate || 85);
  const [storyRate, setStoryRate] = useState(formData.storyRate || 90);
  const [terminalRate, setTerminalRate] = useState(formData.terminalRate || 80);

  const handleSyncChange = (val) => {
    setSyncRate(val);
    if (val >= 100) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#b8352f', '#f59e0b', '#0f172a']
      });
    }
  };

  const handleContinue = () => {
    updateFormData({ syncRate, storyRate, terminalRate });
    onNext();
  };

  // ノイズ不透明度の計算 (値が高いほどクリアになる)
  const noiseOpacity = Math.max(0, (100 - syncRate) / 100);

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 animate-fadeIn">
      {/* 設問ヘッダー */}
      <div className="text-center mb-6">
        <span className="text-xs font-mono-code font-bold uppercase tracking-widest text-[#ff4a42] bg-[#b8352f]/20 px-2.5 py-1 rounded-sm border border-[#b8352f]/40">
          QUESTION 03
        </span>
        <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-white mt-2">
          世界線への『同期率（没入度評価）』
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          スライダーを動かして、あなたの熱量と体験の解像度をチャージしてください。
        </p>
      </div>

      {/* インタラクティブ・モニター＆ゲージ */}
      <div className="bg-slate-900/90 rounded-2xl classified-border p-6 mb-6 backdrop-blur-md">
        {/* モニターシミュレーター */}
        <div className="relative h-28 sm:h-32 bg-slate-950 rounded-xl overflow-hidden flex flex-col items-center justify-center text-center p-4 border border-slate-800 mb-6 shadow-inner">
          {/* 砂嵐ノイズオーバーレイ */}
          <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-200"
            style={{ 
              opacity: noiseOpacity,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.3'/%3E%3C/svg%3E")`
            }}
          />

          <span className="text-[10px] font-mono-code uppercase tracking-widest text-slate-400 relative z-10">
            QUANTUM SYNC STATUS
          </span>
          <div className="font-orbitron font-extrabold text-3xl sm:text-4xl text-white my-1 tracking-wider relative z-10">
            {syncRate}<span className="text-base text-amber-400 ml-1">%</span>
          </div>
          <p className="text-xs text-slate-300 font-medium relative z-10">
            {syncRate >= 95 ? (
              <span className="text-amber-300 font-bold flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> 完全同期達成（世界線の特異点に到達）
              </span>
            ) : syncRate >= 70 ? (
              '高精度観測完了（強い臨場感と没入を検出）'
            ) : (
              '部分観測（まだ見ぬ真実が存在します）'
            )}
          </p>

          {/* 100%時のスタンプ */}
          {syncRate >= 100 && (
            <div className="absolute top-2 right-2 rotate-12 border-2 border-amber-400 text-amber-400 font-mono-code text-[10px] font-extrabold px-2 py-0.5 rounded-sm bg-slate-950/80 shadow-md">
              MAX CONVERGENCE
            </div>
          )}
        </div>

        {/* スライダー群 */}
        <div className="space-y-6">
          {/* ① 全体の没入度・同期率 */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-slate-200 mb-2">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[#ff4a42]" />
                全体の没入感・ワクワク度
              </span>
              <span className="font-mono-code text-sm text-[#ff4a42] font-black">{syncRate}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={syncRate}
              onChange={(e) => handleSyncChange(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-[#b8352f]"
            />
          </div>

          {/* ② ストーリー・演出の衝撃度 */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-slate-200 mb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                ストーリー展開・時空歪みの衝撃度
              </span>
              <span className="font-mono-code text-sm text-amber-400 font-black">{storyRate}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={storyRate}
              onChange={(e) => setStoryRate(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* ③ iPad端末・ギミックの面白さ */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-slate-200 mb-2">
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                iPadOS端末（LINK・資料QR・ハッキング等）の操作体験
              </span>
              <span className="font-mono-code text-sm text-sky-400 font-black">{terminalRate}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={terminalRate}
              onChange={(e) => setTerminalRate(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>
        </div>
      </div>

      {/* ナビゲーションボタン */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="px-4 py-2.5 rounded-lg text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> 戻る
        </button>

        <button
          type="button"
          onClick={handleContinue}
          className="px-6 py-3 rounded-lg text-xs sm:text-sm font-bold bg-[#b8352f] hover:bg-[#a12e29] text-white shadow-lg shadow-[#b8352f]/20 hover:shadow-xl flex items-center gap-2 transition-all cursor-pointer"
        >
          <span>次へ（感情スタンプへ）</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
