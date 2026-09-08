import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Activity, Star, Clock, CheckCircle2, Flame, Sparkles } from 'lucide-react';
import { MATRIX, OPTIONS, WORDS, EMOTIONS } from '../data/storyData';

export default function Step4Evaluation({ formData, updateFormData, onNext, onPrev }) {
  const [overall, setOverall] = useState(formData.syncRate !== undefined ? formData.syncRate : 85);
  const [matrix, setMatrix] = useState(formData.matrix || {
    world: 5,
    act: 5,
    story: 4,
    guide: 4,
    docs: 4,
    rule: 5
  });
  const [length, setLength] = useState(formData.length || 'ちょうどよかった');
  const [again, setAgain] = useState(formData.again || '絶対に参加する');
  
  // 感情スタンプ（連打可能）
  const [stamps, setStamps] = useState(formData.stamps || {
    chills: 12,
    touching: 8,
    heartbeat: 15,
    brain: 6,
    breathe: 10,
    glitch: 9,
    running: 5,
    terminal: 7
  });
  const [burstEmoji, setBurstEmoji] = useState(null);
  const [errors, setErrors] = useState({});

  // スライダーの値に応じた言葉の算出
  const getWordForValue = (v) => {
    let w = WORDS[0][1];
    for (let i = 0; i < WORDS.length; i++) {
      if (v >= WORDS[i][0]) w = WORDS[i][1];
    }
    return w;
  };

  const handleMatrixSelect = (key, score) => {
    setMatrix(prev => ({ ...prev, [key]: score }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const handleStampTap = (emotionId, icon) => {
    setStamps(prev => ({
      ...prev,
      [emotionId]: (prev[emotionId] || 0) + 1
    }));
    setBurstEmoji({ icon, key: Math.random() });
    setTimeout(() => setBurstEmoji(null), 800);
  };

  const handleContinue = () => {
    const newErrors = {};
    MATRIX.forEach(m => {
      if (!matrix[m.key]) {
        newErrors[m.key] = `「${m.label}」を評価してください`;
      }
    });

    if (!length) newErrors.length = '体験時間を選択してください';
    if (!again) newErrors.again = '次回参加の意向を選択してください';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    updateFormData({
      syncRate: overall,
      overall: overall,
      matrix: matrix,
      length: length,
      again: again,
      stamps: stamps
    });
    onNext();
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 animate-fade-in text-left">
      {/* 設問ヘッダー */}
      <div className="text-center mb-6">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#ff716a] bg-[#b8352f]/20 px-3 py-1 rounded border border-[#b8352f]/40 shadow-sm">
          SECTION 04 ／ 観測強度 ＆ 評価
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
          体験の深度と項目別評価
        </h2>
        <p className="text-sm sm:text-[15px] text-slate-300 mt-2 text-pretty-ja max-w-xl mx-auto leading-relaxed">
          直感的な同期度合いと、公演各要素の評価をお聞かせください。
        </p>
      </div>

      <div className="space-y-6 mb-8">
        {/* ① 観測強度スライダー（0〜100%） */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#ff4a42]" />
              QUESTION 09 ／ 観測強度（没入度）
            </span>
            <span className="text-2xl sm:text-3xl font-orbitron font-black text-amber-400">
              {overall}<span className="text-xs text-slate-300 font-normal ml-1">/ 100</span>
            </span>
          </div>

          <div className="text-center mb-5 h-8 flex items-center justify-center">
            <span className="text-sm sm:text-base font-bold text-[#ff716a] tracking-wider px-4 py-1.5 rounded-full bg-[#b8352f]/15 border border-[#ff4a42]/40 shadow-sm">
              「{getWordForValue(overall)}」
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={overall}
            onChange={(e) => setOverall(Number(e.target.value))}
            className="w-full h-2.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-[#ff4a42] border border-slate-800"
          />

          <div className="flex justify-between text-xs text-slate-300 font-mono mt-2.5 font-medium">
            <span>0%（外側から眺めていた）</span>
            <span>50%</span>
            <span>100%（まだ現実に戻れない）</span>
          </div>
        </div>

        {/* ② 項目別5段階マトリクス評価 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400" />
              QUESTION 10 ／ 項目別評価（1:不満 〜 5:大満足）
            </span>
          </div>

          <div className="space-y-4 divide-y divide-slate-800/80">
            {MATRIX.map((m) => {
              const currentScore = matrix[m.key] || 0;

              return (
                <div key={m.key} className="pt-3.5 first:pt-0">
                  <div className="text-xs sm:text-sm font-bold text-slate-100 mb-2">
                    {m.label}
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => handleMatrixSelect(m.key, score)}
                        className={`py-2.5 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                          currentScore === score
                            ? 'bg-[#b8352f] text-white border-[#ff4a42] shadow-md ring-2 ring-[#ff4a42]/30'
                            : 'bg-slate-950/85 border-slate-700/80 text-slate-300 hover:border-slate-500 hover:text-white'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  {errors[m.key] && (
                    <p className="text-rose-400 text-[11px] mt-1">{errors[m.key]}</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-xs text-slate-300 font-mono mt-4 pt-3 border-t border-slate-800 font-medium">
            <span>1: 不満・改善が必要</span>
            <span>3: 普通</span>
            <span>5: 非常に満足・素晴らしい</span>
          </div>
        </div>

        {/* ③ 体験時間 ＆ 次回参加意向 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 体験時間 */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
            <label className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200 flex items-center gap-1.5 mb-2.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              体験全体の時間について
            </label>
            <div className="space-y-2">
              {OPTIONS.length.map((len) => (
                <button
                  key={len}
                  type="button"
                  onClick={() => setLength(len)}
                  className={`w-full py-2.5 px-3.5 rounded-lg text-xs sm:text-[13px] font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                    length === len
                      ? 'bg-[#b8352f] text-white border-[#ff4a42] shadow-sm ring-2 ring-[#ff4a42]/30'
                      : 'bg-slate-950/85 text-slate-300 border-slate-700/80 hover:border-slate-500 hover:text-white'
                  }`}
                >
                  <span>{len}</span>
                  {length === len && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* 次回参加意向 */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
            <label className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200 flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ff4a42]" />
              次回公演への参加意向
            </label>
            <div className="space-y-2">
              {OPTIONS.again.map((ag) => (
                <button
                  key={ag}
                  type="button"
                  onClick={() => setAgain(ag)}
                  className={`w-full py-2.5 px-3.5 rounded-lg text-xs sm:text-[13px] font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                    again === ag
                      ? 'bg-[#b8352f] text-white border-[#ff4a42] shadow-sm ring-2 ring-[#ff4a42]/30'
                      : 'bg-slate-950/85 text-slate-300 border-slate-700/80 hover:border-slate-500 hover:text-white'
                  }`}
                >
                  <span>{ag}</span>
                  {again === ag && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ④ 感情スタンプ連打（現行の熱狂機能） */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
              感情ログスタンプ（連打可能）
            </span>
            <span className="text-xs font-mono font-bold text-amber-300">タップで感情カウントUP</span>
          </div>
          <p className="text-xs text-slate-300 mb-3 leading-relaxed">
            体験中に感じた感情をタップしてください。複数回タップで熱狂度を送信できます。
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {EMOTIONS.map((emo) => {
              const currentCount = stamps[emo.id] || 0;
              return (
                <button
                  key={emo.id}
                  type="button"
                  onClick={() => handleStampTap(emo.id, emo.icon)}
                  className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-800/80 hover:border-slate-700 active:scale-95 transition-all text-left flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg group-hover:scale-125 transition-transform">{emo.icon}</span>
                    <span className="text-xs font-bold text-slate-300">{emo.label}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {currentCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 連打アニメーションエフェクト */}
          {burstEmoji && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-ping">
              <span className="text-6xl">{burstEmoji.icon}</span>
            </div>
          )}
        </div>
      </div>

      {/* ナビゲーションボタン */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
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
          className="px-6 py-3 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer bg-[#b8352f] hover:bg-[#a12e29] text-white shadow-lg shadow-[#b8352f]/20 hover:shadow-xl"
        >
          <span>次へ：詳細レポート ＆ メッセージ</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
