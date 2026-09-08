import React, { useState } from 'react';
import { ROOMS } from '../data/storyData';
import { MapPin, Navigation, ArrowRight, ArrowLeft, RotateCcw, Footprints, Layers } from 'lucide-react';

export default function Step3MapTrack({ formData, updateFormData, onNext, onPrev }) {
  const [visitedRooms, setVisitedRooms] = useState(formData.visitedRooms || ['hall']);

  const handleToggleRoom = (roomId) => {
    if (visitedRooms.includes(roomId)) {
      setVisitedRooms(visitedRooms.filter(id => id !== roomId));
    } else {
      setVisitedRooms([...visitedRooms, roomId]);
    }
  };

  const handleReset = () => {
    setVisitedRooms(['hall']);
  };

  const handleContinue = () => {
    updateFormData({ visitedRooms });
    onNext();
  };

  const floor1Rooms = ROOMS.filter(r => r.floor === '1F');
  const floor2Rooms = ROOMS.filter(r => r.floor === '2F');

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 animate-fadeIn">
      {/* 設問ヘッダー */}
      <div className="text-center mb-6">
        <span className="text-xs font-mono-code font-bold uppercase tracking-widest text-[#ff4a42] bg-[#b8352f]/20 px-2.5 py-1 rounded-sm border border-[#b8352f]/40">
          QUESTION 02
        </span>
        <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-white mt-2">
          あなたの『観測軌跡（移動ログ）』
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          館内で訪れた部屋や立ち止まった場所をタップして、あなたの足跡を繋げてください。
        </p>
      </div>

      {/* マップ操作エリア */}
      <div className="bg-slate-900/90 rounded-2xl classified-border p-4 sm:p-6 mb-6 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Footprints className="w-4 h-4 text-[#ff4a42]" />
            <span className="text-xs font-bold font-mono-code text-slate-200">
              TRACE LOG: {visitedRooms.length} 箇所 観測
            </span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] text-slate-400 hover:text-white font-mono-code flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> リセット
          </button>
        </div>

        {/* 観測ルートの順番バッジ表示 */}
        <div className="flex flex-wrap items-center gap-1.5 mb-6 p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 min-h-[44px]">
          {visitedRooms.map((id, index) => {
            const room = ROOMS.find(r => r.id === id);
            return (
              <React.Fragment key={id}>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#b8352f] text-white px-2 py-0.5 rounded-sm shadow-xs">
                  <span className="font-mono-code text-[10px] opacity-80">{index + 1}.</span>
                  {room ? room.name : id}
                </span>
                {index < visitedRooms.length - 1 && (
                  <span className="text-slate-600 text-xs">➔</span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* 1階エリア */}
        <div className="mb-5">
          <div className="flex items-center gap-1.5 text-xs font-mono-code font-bold text-amber-400 mb-2">
            <Layers className="w-3.5 h-3.5" /> 1F エリア（大ホール / 研修室）
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {floor1Rooms.map((room) => {
              const isVisited = visitedRooms.includes(room.id);
              const visitIndex = visitedRooms.indexOf(room.id);

              return (
                <div
                  key={room.id}
                  onClick={() => handleToggleRoom(room.id)}
                  className={`relative p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    isVisited
                      ? 'bg-[#b8352f]/20 border-[#b8352f] ring-1 ring-[#b8352f]/40 shadow-xs'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{room.name}</span>
                    {isVisited ? (
                      <span className="w-4 h-4 rounded-full bg-[#b8352f] text-white text-[10px] font-mono-code font-bold flex items-center justify-center">
                        {visitIndex + 1}
                      </span>
                    ) : (
                      <MapPin className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{room.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2階エリア */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-mono-code font-bold text-amber-400 mb-2">
            <Layers className="w-3.5 h-3.5" /> 2F エリア（討議室）
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {floor2Rooms.map((room) => {
              const isVisited = visitedRooms.includes(room.id);
              const visitIndex = visitedRooms.indexOf(room.id);

              return (
                <div
                  key={room.id}
                  onClick={() => handleToggleRoom(room.id)}
                  className={`relative p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    isVisited
                      ? 'bg-[#b8352f]/20 border-[#b8352f] ring-1 ring-[#b8352f]/40 shadow-xs'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{room.name}</span>
                    {isVisited ? (
                      <span className="w-4 h-4 rounded-full bg-[#b8352f] text-white text-[10px] font-mono-code font-bold flex items-center justify-center">
                        {visitIndex + 1}
                      </span>
                    ) : (
                      <MapPin className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{room.desc}</p>
                </div>
              );
            })}
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
          <span>次へ（同期率ゲージへ）</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
