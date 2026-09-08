import React, { useState } from 'react';
import { CAST_MEMBERS } from '../data/storyData';
import { ArrowRight, ArrowLeft, Check, Sparkles, User, ZoomIn, X } from 'lucide-react';

export default function Step2Route({ formData, updateFormData, onNext, onPrev }) {
  const [loop1, setLoop1] = useState(formData.loopTrack?.loop1 || '');
  const [loop2, setLoop2] = useState(formData.loopTrack?.loop2 || '');
  const [loop3, setLoop3] = useState(formData.loopTrack?.loop3 || '');
  const [currentLoopTab, setCurrentLoopTab] = useState(1); // 1 | 2 | 3
  const [previewImage, setPreviewImage] = useState(null);

  // 1周目・2周目・3周目すべて選択可能なキャスト（森野などの非選択キャラクターを除く）
  const allCasts = CAST_MEMBERS.filter(c => c.isSelectable !== false);

  const handleSelect = (castId) => {
    if (currentLoopTab === 1) {
      setLoop1(castId);
      setTimeout(() => setCurrentLoopTab(2), 250);
    } else if (currentLoopTab === 2) {
      setLoop2(castId);
      setTimeout(() => setCurrentLoopTab(3), 250);
    } else if (currentLoopTab === 3) {
      setLoop3(castId);
    }
  };

  const handleContinue = () => {
    if (!loop1) return;
    updateFormData({
      loopTrack: {
        loop1: loop1,
        loop2: loop2 || loop1,
        loop3: loop3 || loop2 || loop1
      },
      primaryRoute: loop1
    });
    onNext();
  };

  const activeCasts = allCasts;
  const currentSelected = currentLoopTab === 1 ? loop1 : currentLoopTab === 2 ? loop2 : loop3;

  const getCastById = (id) => CAST_MEMBERS.find(c => c.id === id) || CAST_MEMBERS[0];

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 animate-fadeIn text-left">
      {/* 設問ヘッダー */}
      <div className="text-center mb-6">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#ff716a] bg-[#b8352f]/20 px-3 py-1 rounded border border-[#b8352f]/40 shadow-sm">
          SECTION 02 ／ 周回キャスト追跡
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
          周回ごとの『追跡対象』
        </h2>
        <p className="text-sm sm:text-[15px] text-slate-300 mt-2 text-pretty-ja max-w-xl mx-auto leading-relaxed">
          1周目・2周目・3周目で、あなたがメインに追いかけた人物や行動を選択してください。
        </p>
      </div>

      {/* 🧭 周回進行タイムラインバー */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 mb-6 shadow-md backdrop-blur-md">
        <div className="text-[10px] font-mono-code font-bold text-slate-400 mb-2.5 uppercase flex items-center justify-between">
          <span>OBSERVATION TIMELINE</span>
          <span className="text-amber-400 font-bold">STEP {currentLoopTab} / 3</span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {/* 1周目 */}
          <div 
            onClick={() => setCurrentLoopTab(1)}
            className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer text-left relative ${
              currentLoopTab === 1
                ? 'bg-[#b8352f]/20 text-white border-[#b8352f] shadow-sm ring-2 ring-[#b8352f]/40'
                : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <div className="text-[9px] font-mono-code font-bold text-amber-400 mb-1">LOOP 1（1周目）</div>
            {loop1 ? (
              <div className="flex items-center gap-2">
                <img 
                  src={getCastById(loop1).avatar} 
                  alt="" 
                  className="w-8 h-8 rounded-lg object-cover border border-white/20 shrink-0 bg-slate-900" 
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate leading-tight text-white">{getCastById(loop1).name}</div>
                  <div className="text-[9px] text-slate-400 truncate">{getCastById(loop1).generation}</div>
                </div>
              </div>
            ) : (
              <div className="text-xs font-medium text-slate-500 py-1">未選択</div>
            )}
          </div>

          {/* 2周目 */}
          <div 
            onClick={() => setCurrentLoopTab(2)}
            className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer text-left relative ${
              currentLoopTab === 2
                ? 'bg-[#b8352f]/20 text-white border-[#b8352f] shadow-sm ring-2 ring-[#b8352f]/40'
                : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <div className="text-[9px] font-mono-code font-bold text-amber-400 mb-1">LOOP 2（2周目）</div>
            {loop2 ? (
              <div className="flex items-center gap-2">
                <img 
                  src={getCastById(loop2).avatar} 
                  alt="" 
                  className="w-8 h-8 rounded-lg object-cover border border-white/20 shrink-0 bg-slate-900" 
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate leading-tight text-white">{getCastById(loop2).name}</div>
                  <div className="text-[9px] text-slate-400 truncate">{getCastById(loop2).generation}</div>
                </div>
              </div>
            ) : (
              <div className="text-xs font-medium text-slate-500 py-1">未選択 (任意)</div>
            )}
          </div>

          {/* 3周目 */}
          <div 
            onClick={() => setCurrentLoopTab(3)}
            className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer text-left relative ${
              currentLoopTab === 3
                ? 'bg-[#b8352f]/20 text-white border-[#b8352f] shadow-sm ring-2 ring-[#b8352f]/40'
                : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <div className="text-[9px] font-mono-code font-bold text-amber-400 mb-1">LOOP 3（3周目）</div>
            {loop3 ? (
              <div className="flex items-center gap-2">
                <img 
                  src={getCastById(loop3).avatar} 
                  alt="" 
                  className="w-8 h-8 rounded-lg object-cover border border-white/20 shrink-0 bg-slate-900" 
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate leading-tight text-white">{getCastById(loop3).name}</div>
                  <div className="text-[9px] text-slate-400 truncate">{getCastById(loop3).generation}</div>
                </div>
              </div>
            ) : (
              <div className="text-xs font-medium text-slate-500 py-1">未選択 (任意)</div>
            )}
          </div>
        </div>
      </div>

      {/* 🌟 キャスト苗字画像メインの選択グリッド */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#ff4a42]" />
            <span>
              {currentLoopTab === 1 && '【1周目】あなたがメインに追いかけた人物'}
              {currentLoopTab === 2 && '【2周目】あなたがメインに追いかけた人物'}
              {currentLoopTab === 3 && '【3周目】あなたがメインに追いかけた人物'}
            </span>
          </h3>
          <span className="text-[11px] font-mono-code text-slate-400">写真をタップして選択（全13名・スタイル）</span>
        </div>

        {/* キャスト画像グリッド */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
          {activeCasts.map((cast) => {
            const isSelected = currentSelected === cast.id;

            return (
              <div
                key={cast.id}
                onClick={() => handleSelect(cast.id)}
                className={`relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between group shadow-md ${
                  isSelected
                    ? 'border-[#b8352f] ring-4 ring-[#b8352f]/40 shadow-xl -translate-y-1 bg-slate-900'
                    : 'border-slate-800 hover:border-slate-600 hover:shadow-lg bg-slate-900/80 hover:bg-slate-900'
                }`}
              >
                {/* 選択チェックマーク */}
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-[#b8352f] text-white flex items-center justify-center shadow-lg z-20 animate-scaleUp">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}

                {/* キャスト画像エリア */}
                <div className="relative aspect-square w-full overflow-hidden bg-slate-950 flex items-center justify-center">
                  <img 
                    src={cast.avatar} 
                    alt={cast.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* 拡大プレビューボタン */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPreviewImage(cast.avatar); }}
                    className="absolute bottom-2 right-2 p-1.5 rounded-full bg-slate-950/80 text-white hover:bg-slate-900 z-10 cursor-pointer backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity border border-white/20"
                    title="写真を拡大表示"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>

                  <div className="absolute top-2 left-2">
                    <span 
                      className="text-[10px] font-mono-code font-black text-white px-2 py-0.5 rounded-sm shadow-xs"
                      style={{ backgroundColor: cast.color }}
                    >
                      {cast.generation} • {cast.grade}
                    </span>
                  </div>
                </div>

                {/* タイトル ＆ 説明 */}
                <div className="p-3 text-left bg-slate-900/90 border-t border-slate-800/80">
                  <h4 className="font-black text-white text-sm sm:text-base leading-snug">{cast.name}</h4>
                  <p className="text-[11px] font-bold text-slate-400 mt-0.5">{cast.role}</p>
                  <p className="text-[10px] text-slate-500 leading-tight mt-1 line-clamp-1">{cast.tagline}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🔍 画像拡大モーダル */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-fadeIn"
        >
          <div className="relative max-w-md w-full max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl border-2 border-white/20 bg-slate-900">
            <img src={previewImage} alt="キャスト画像" className="w-full h-auto max-h-[85vh] object-contain mx-auto block" />
            <p className="text-center text-xs text-white/80 py-2 font-mono-code">タップして閉じる</p>
          </div>
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
          disabled={!loop1}
          onClick={handleContinue}
          className={`px-6 py-3 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            loop1
              ? 'bg-[#b8352f] hover:bg-[#a12e29] text-white shadow-lg shadow-[#b8352f]/20 hover:shadow-xl'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <span>次へ：観測シーンの選択</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
