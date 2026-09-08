import React from 'react';
import { Play, Sparkles, AlertCircle, Info, Shield } from 'lucide-react';
import GoogleAuthButton from './GoogleAuthButton';

export default function Step0Welcome({ onStart }) {
  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-12 px-4 animate-fade-in text-center">
      {/* キッカー ＆ フォルダタグ */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#b8352f]/15 border border-[#b8352f]/40 text-[#ff716a] text-xs font-mono font-semibold tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(184,53,47,0.2)]">
        <Sparkles className="w-3.5 h-3.5" />
        <span>IMMERSIVE THEATER ARCHIVE</span>
      </div>

      <div className="text-2xl sm:text-4xl font-orbitron font-extrabold tracking-tight text-white mb-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <span className="text-[#ff4a42] drop-shadow-[0_0_12px_rgba(255,74,66,0.3)]">File:26__094</span>
        <span className="text-slate-300 font-normal text-lg sm:text-2xl">／ 観測記録提出</span>
      </div>

      {/* プロローグテキスト */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl mb-8 text-left space-y-4 font-serif-subtle text-slate-100 leading-relaxed text-sm sm:text-[15px] text-pretty-ja">
        <p className="leading-loose">
          <span className="text-amber-300 font-mono font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">2026/9/4 09:04</span>、シャトレーゼホテル韮崎の森。<br className="hidden sm:inline" />
          あの日あなたは<strong className="text-white font-bold tracking-wider text-base sm:text-[17px]">「観測者」</strong>でした。
        </p>
        <p className="text-slate-200 leading-loose">
          存在せず、声を聞かれず、誰にも触れられない。<br className="hidden sm:inline" />
          しかし世界は、<span className="text-[#ff716a] font-bold border-b border-[#ff4a42]/70 pb-0.5">観測されたぶんだけ</span>存在します。
        </p>
        <p className="text-slate-300 leading-relaxed">
          あなたが何を見たのか、どの運命の分岐に立ち会ったのかを教えてください。
        </p>
      </div>

      {/* 🔐 Googleアカウント事前認証エリア */}
      <div className="mb-8">
        <GoogleAuthButton
          currentObsCode="OBS-INITIAL"
        />
      </div>

      {/* 注意書き・ルール */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 sm:p-5 mb-8 text-left text-xs sm:text-[13px] text-slate-300 space-y-2.5 font-mono">
        <div className="flex items-center gap-2 text-white font-bold mb-1.5 text-sm">
          <Info className="w-4 h-4 text-[#ff4a42]" />
          <span>観測記録の提出要綱</span>
        </div>
        <ul className="list-disc list-inside space-y-1.5 pl-1 text-slate-300 leading-relaxed text-pretty-ja">
          <li>所要時間：約3分（自由記述を除く）／ ニックネームでの参加も可能です</li>
          <li>回答データは、次回企画のクオリティ向上および世界線同期に使用されます</li>
          <li>回答完了後、あなたの観測ログを刻んだ<strong className="text-amber-300 font-bold">「戦歴カード（画像保存可）」</strong>が発行されます</li>
        </ul>
      </div>

      {/* 開始ボタン */}
      <button
        type="button"
        onClick={onStart}
        className="w-full sm:w-auto sm:min-w-[320px] px-8 py-4 bg-gradient-to-r from-[#b8352f] to-[#dc2626] hover:from-[#d13b35] hover:to-[#ef4444] text-white font-extrabold text-base sm:text-lg rounded-xl shadow-[0_0_30px_rgba(184,53,47,0.45)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 mx-auto cursor-pointer border border-red-400/40 group"
      >
        <span>黒いマスクを外す</span>
        <Play className="w-5 h-5 fill-white group-hover:translate-x-1 transition-transform" />
      </button>

      <p className="text-slate-400 text-xs font-mono mt-4">
        ＞ 観測は終了しました。記録の提出を開始してください。
      </p>
    </div>
  );
}
