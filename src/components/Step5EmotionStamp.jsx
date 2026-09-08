import React, { useState } from 'react';
import { EMOTIONS } from '../data/storyData';
import { Sparkles, ArrowRight, ArrowLeft, Stamp, RotateCcw } from 'lucide-react';

export default function Step5EmotionStamp({ formData, updateFormData, onNext, onPrev }) {
  const [stampCounts, setStampCounts] = useState(formData.emotions || {});
  const [stampedList, setStampedList] = useState([]);

  const handleStamp = (emotion) => {
    const currentCount = stampCounts[emotion.id] || 0;
    const nextCount = currentCount + 1;
    setStampCounts({ ...stampCounts, [emotion.id]: nextCount });

    // ランダムな位置・角度で画面にスタンプを刻印
    const newStamp = {
      id: `${emotion.id}-${Date.now()}-${Math.random()}`,
      icon: emotion.icon,
      label: emotion.label,
      color: emotion.color,
      x: Math.random() * 80 + 10, // 10% - 90%
      y: Math.random() * 70 + 15, // 15% - 85%
      rotate: Math.floor(Math.random() * 30) - 15 // -15deg ~ +15deg
    };

    setStampedList(prev => [...prev.slice(-15), newStamp]);
  };

  const handleClearStamps = () => {
    setStampCounts({});
    setStampedList([]);
  };

  const handleContinue = () => {
    updateFormData({ emotions: stampCounts });
    onNext();
  };

  const totalStampCount = Object.values(stampCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 animate-fadeIn">
      {/* 設問ヘッダー */}
      <div className="text-center mb-6">
        <span className="text-xs font-mono-code font-bold uppercase tracking-widest text-[#ff4a42] bg-[#b8352f]/20 px-2.5 py-1 rounded-sm border border-[#b8352f]/40">
          QUESTION 04
        </span>
        <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-white mt-2">
          感情スタンプ連打（バイブス刻印）
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          当てはまる感情ボタンをタップ（連打OK！）して、あなたの熱量を刻み込んでください。
        </p>
      </div>

      {/* スタンプ刻印キャンバスボード */}
      <div className="relative h-44 sm:h-52 bg-slate-950 rounded-2xl border-2 border-dashed border-slate-800 overflow-hidden mb-6 p-4 flex flex-col justify-between shadow-inner">
        {/* スタンプが押された時のビジュアルエフェクト */}
        {stampedList.map((st) => (
          <div
            key={st.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 select-none animate-scaleUp pointer-events-none z-20"
            style={{
              left: `${st.x}%`,
              top: `${st.y}%`,
              transform: `translate(-50%, -50%) rotate(${st.rotate}deg)`
            }}
          >
            <div 
              className="px-2.5 py-1 rounded-md text-xs font-bold shadow-md flex items-center gap-1 border border-white/40 backdrop-blur-xs"
              style={{ backgroundColor: st.color, color: '#fff' }}
            >
              <span>{st.icon}</span>
              <span>{st.label}</span>
            </div>
          </div>
        ))}

        {stampedList.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <Stamp className="w-8 h-8 mb-1.5 opacity-40 text-slate-600" />
            <p className="text-xs">下の感情ボタンをタップすると、ここにスタンプが刻印されます</p>
          </div>
        )}

        <div className="flex justify-between items-center z-10 w-full mt-auto">
          <span className="text-[11px] font-mono-code font-bold text-slate-300 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-700 shadow-xs">
            TOTAL STAMPS: {totalStampCount}
          </span>
          {totalStampCount > 0 && (
            <button
              type="button"
              onClick={handleClearStamps}
              className="text-[11px] text-slate-400 hover:text-white font-mono-code flex items-center gap-1 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-700 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> クリア
            </button>
          )}
        </div>
      </div>

      {/* 感情ボタン一覧 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-8">
        {EMOTIONS.map((emotion) => {
          const count = stampCounts[emotion.id] || 0;
          return (
            <button
              key={emotion.id}
              type="button"
              onClick={() => handleStamp(emotion)}
              className="relative p-3 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-900 hover:border-slate-700 active:scale-95 transition-all text-left flex items-center justify-between cursor-pointer shadow-md group"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl group-hover:scale-110 transition-transform">{emotion.icon}</span>
                <span className="text-xs font-bold text-slate-200">{emotion.label}</span>
              </div>
              {count > 0 && (
                <span 
                  className="text-[11px] font-mono-code font-bold px-1.5 py-0.5 rounded-full text-white shadow-xs"
                  style={{ backgroundColor: emotion.color }}
                >
                  +{count}
                </span>
              )}
            </button>
          );
        })}
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
          <span>次へ（感想・メッセージへ）</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
