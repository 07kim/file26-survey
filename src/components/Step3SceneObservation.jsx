import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Sparkles, MapPin, Eye, Compass, HelpCircle } from 'lucide-react';
import { SCENES, TOTAL_SCENES, CAST_MEMBERS } from '../data/storyData';

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
      {/* 機密ファイル風ヘッダー */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 sm:p-8 relative overflow-hidden backdrop-blur-md shadow-2xl mb-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#b8352f]/10 rounded-bl-full pointer-events-none" />
        
        <div className="flex items-center justify-between mb-3">
          <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold tracking-widest bg-[#b8352f]/20 text-[#ff716a] border border-[#b8352f]/40 shadow-sm">
            SECTION 03 ／ 場面観測ログ
          </span>
          <span className="text-xs font-mono font-medium text-slate-400">TOTAL: {TOTAL_SCENES} SCENES</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          観測できた場面の特定
        </h2>
        <p className="text-slate-300 text-sm sm:text-[15px] leading-relaxed text-pretty-ja">
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
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-sm sm:text-base font-extrabold text-white leading-tight text-pretty-ja">
                            {item.title}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400 tracking-wider">
                            {item.place}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-[#ff4a42] text-white flex items-center justify-center text-[10px] ml-1 shrink-0 shadow-sm">
                              ✓
                            </span>
                          )}
                        </div>
                      </div>
                      {item.desc && (
                        <div className="text-xs text-slate-300 leading-snug text-pretty-ja mt-1">
                          {item.desc}
                        </div>
                      )}
                    </div>
                    {item.casts?.length > 0 && (
                      <div className="flex items-center ml-auto self-center shrink-0 pl-2">
                        {item.casts.map((cId, idx) => {
                          const c = CAST_MEMBERS.find(x => x.id === cId);
                          if (!c || !c.avatar) return null;
                          return (
                            <img
                              key={cId}
                              src={c.avatar}
                              alt={c.name}
                              title={c.name}
                              className="rounded-full object-cover border-2 border-slate-300 shadow-md"
                              style={{
                                width: '52px',
                                height: '52px',
                                objectPosition: 'center 15%',
                                marginLeft: idx > 0 ? '-18px' : '0',
                                zIndex: item.casts.length - idx
                              }}
                            />
                          );
                        })}
                      </div>
                    )}
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
