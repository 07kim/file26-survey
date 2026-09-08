import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Sparkles, MapPin, Eye, Compass, HelpCircle } from 'lucide-react';
import { SCENES, TOTAL_SCENES } from '../data/storyData';

export default function Step3SceneObservation({ formData, updateFormData, onNext, onPrev }) {
  const [selectedScenes, setSelectedScenes] = useState(formData.scenes || []);
  const [missedScene, setMissedScene] = useState(formData.missed || '');
  const [error, setError] = useState('');

  const toggleScene = (id) => {
    setError('');
    if (selectedScenes.includes(id)) {
      setSelectedScenes(selectedScenes.filter(s => s !== id));
    } else {
      setSelectedScenes([...selectedScenes, id]);
    }
  };

  const count = selectedScenes.length;
  const rate = Math.round((count / TOTAL_SCENES) * 100);

  const getMeterMessage = () => {
    if (count === 0) return 'まだ何も選ばれていません。';
    if (rate < 20) return `${count}件。あなたはこの世界のごく一部を見ました。`;
    if (rate < 40) return `${count}件。特定の人物の足跡をしっかり追った形跡があります。`;
    if (rate < 65) return `${count}件。全体の半分近くを目撃しました。多くの真実に触れています。`;
    if (rate < 85) return `${count}件。驚異的な観測率です。複数の世界線を立体的に把握しています。`;
    return `${count}件。ほぼすべてを目撃した特異点。あなたが見たものが世界の全貌です。`;
  };

  const handleContinue = () => {
    if (selectedScenes.length === 0) {
      setError('観測できた場面を1つ以上選択してください');
      return;
    }

    updateFormData({
      scenes: selectedScenes,
      sceneCount: count,
      sceneRate: rate,
      missed: missedScene
    });
    onNext();
  };

  // 選択しなかったシーン一覧（心残りな場面の選択肢用）
  const unselectedScenes = [];
  SCENES.forEach(g => {
    g.items.forEach(item => {
      if (!selectedScenes.includes(item.id)) {
        unselectedScenes.push({
          id: item.id,
          label: `${g.loop} ${item.time}／${item.place}／${item.title}（${item.desc}）`
        });
      }
    });
  });

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 animate-fade-in text-left">
      {/* 設問ヘッダー */}
      <div className="text-center mb-6">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#ff716a] bg-[#b8352f]/20 px-3 py-1 rounded border border-[#b8352f]/40 shadow-sm">
          SECTION 03 ／ 場面の観測
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
          あなたが「実際に見た場面」
        </h2>
        <p className="text-sm sm:text-[15px] text-slate-300 mt-2 text-pretty-ja max-w-xl mx-auto leading-relaxed">
          当てはまるものをすべて選んでください（複数選択可）。その場に居合わせた、扉の隙間から見た、なども含みます。
        </p>
      </div>

      {/* 31シーンチップグリッド（周回別） */}
      <div className="space-y-6 mb-8">
        {SCENES.map((group) => (
          <div key={group.loop} className="bg-slate-900/85 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
            <div className="flex items-baseline gap-2 mb-3 pb-2 border-b border-slate-800">
              <span className="font-extrabold text-white text-base sm:text-lg">{group.loop}</span>
              <span className="text-xs font-mono text-slate-300 tracking-wider">｜ {group.label}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {group.items.map((item) => {
                const isSelected = selectedScenes.includes(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleScene(item.id)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#b8352f]/25 border-[#ff4a42] text-white shadow-md ring-2 ring-[#ff4a42]/40'
                        : 'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-slate-600 hover:bg-slate-900'
                    }`}
                  >
                    <span className="text-xs font-mono font-bold text-amber-400 pt-0.5 min-w-[32px]">
                      {item.time}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-[13px] font-bold flex items-center justify-between">
                        <span className="text-white text-pretty-ja">{item.place} ｜ {item.title}</span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-[#ff4a42] text-white flex items-center justify-center text-[10px] ml-1.5 shrink-0 shadow-sm">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-300 mt-1 leading-snug text-pretty-ja">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 📊 観測率メーター（固定表示風） */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl mb-8 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-[#ff4a42]" />
            リアルタイム観測率
          </span>
          <span className="text-lg font-mono font-extrabold text-white">
            <span className="text-amber-400">{rate}</span> %
            <span className="text-xs text-slate-400 font-normal ml-2">({count} / {TOTAL_SCENES} 場面)</span>
          </span>
        </div>

        {/* プログレスバー */}
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80 p-0.5 mb-2">
          <div
            className="h-full bg-gradient-to-r from-[#b8352f] via-amber-500 to-emerald-400 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${rate}%` }}
          />
        </div>

        <p className="text-xs text-slate-300 font-medium">
          {getMeterMessage()}
        </p>
      </div>

      {/* 💔 観測できなくて最も心残りな場面（セレクトボックス） */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 mb-8">
        <label className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-1.5">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          観測できなくて、最も心残りな場面はどれですか（任意）
        </label>
        <p className="text-[11px] text-slate-400 mb-3">
          選ばなかった場面のうち、「本当は見たかった」「気になる」場面があれば教えてください。
        </p>
        <select
          value={missedScene}
          onChange={(e) => setMissedScene(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-[#b8352f]"
        >
          <option value="">— とくにない ／ すべて満足 —</option>
          {unselectedScenes.map(s => (
            <option key={s.id} value={s.label}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs text-center font-bold">
          {error}
        </div>
      )}

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
          <span>次へ：観測強度 ＆ 評価</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
