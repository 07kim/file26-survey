import React, { useState } from 'react';
import ResultCard from './ResultCard';
import { Share2, Check, Download, ArrowRight, Edit3, ShieldAlert, Award } from 'lucide-react';
import { CAST_MEMBERS } from '../data/storyData';

export default function CardShareView({ cardData, onGoToSurvey, onNewResponse, onGoToCrosstalk, onGoToCharacters }) {
  const [copied, setCopied] = useState(false);

  // カードデータ（URL引数またはprops）
  const finalCardData = cardData || {
    observerName: 'OBSERVER #094',
    grade: '2年',
    loopTrack: { loop1: 'yada', loop2: 'jinnai', loop3: 'yada' },
    loop1Seen: ['sakurai', 'nanase'],
    loop2Seen: ['sagisaka'],
    loop3Seen: ['shimoyamada', 'watanabe'],
    favoriteCast: 'yada',
    scenes: ['s1', 's2', 's3', 's4', 's6', 's8', 's10'],
    sceneCount: 7,
    sceneRate: 70,
    syncRate: 94,
    primaryRoute: 'yada',
    role: '観測者',
    route: '矢田ルート',
    best: '研修室3でPCが起動した瞬間',
    word: 'あの日あなたは「観測者」だった',
    highlightScene: '研修室3でPCが起動した瞬間',
    publicComment: 'あの日あなたは「観測者」だった'
  };

  const handleCopyShareLink = () => {
    // 現在のカードの共有URLを作成
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('tab', 'card');
    url.searchParams.set('name', finalCardData.observerName || 'OBSERVER');
    url.searchParams.set('grade', finalCardData.grade || '一般');
    if (finalCardData.customAvatar) url.searchParams.set('avatar', finalCardData.customAvatar);
    url.searchParams.set('l1', finalCardData.loopTrack?.loop1 || 'yada');
    url.searchParams.set('l2', finalCardData.loopTrack?.loop2 || 'jinnai');
    url.searchParams.set('l3', finalCardData.loopTrack?.loop3 || 'yada');
    if (finalCardData.favoriteCast) url.searchParams.set('fav', finalCardData.favoriteCast);
    url.searchParams.set('sync', String(finalCardData.syncRate || 85));
    if (finalCardData.word) url.searchParams.set('w', finalCardData.word);

    if (navigator.clipboard) {
      navigator.clipboard.writeText(url.toString()).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }).catch(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 px-2 sm:px-4 text-center animate-fadeIn">
      {/* 上部バッジ ＆ タイトル */}
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-widest text-[#ff716a] bg-[#b8352f]/15 px-3.5 py-1 rounded-full mb-2 border border-[#b8352f]/40 shadow-[0_0_12px_rgba(184,53,47,0.25)]">
          <Award className="w-3.5 h-3.5" /> OFFICIAL OBSERVER LICENSE SHOWCASE
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          File:26__094 観測戦歴ライセンスカード
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-lg mx-auto">
          観測者 <strong className="text-white font-bold">{finalCardData.observerName}</strong> が体験した世界線の観測記録・周回タイムラインです。
        </p>
      </div>

      {/* 📇 戦歴カード本体 */}
      <div className="mb-4">
        <ResultCard
          formData={finalCardData}
          onScrollToBoard={onGoToCrosstalk}
          onReEdit={onGoToSurvey}
          onNewResponse={onNewResponse}
        />
      </div>
    </div>
  );
}
