import React, { useState, useEffect } from 'react';
import { CAST_MEMBERS } from '../data/storyData';
import { sheetApi } from '../services/sheetApi';
import { Heart, MessageSquare, Send, CheckCircle2, User, Flame, Award, Star, Share2, X } from 'lucide-react';

export default function CharacterRoom({ userAnswers, serverResponses = [], onSetFavoriteCast, onUpdateFormData }) {
  const [selectedCharId, setSelectedCharId] = useState(() => {
    return userAnswers?.favoriteCast || userAnswers?.loop1 || 'sakurai';
  });

  // ユーザーの回答データ（推し・追跡対象）と同期
  useEffect(() => {
    if (userAnswers?.favoriteCast) {
      setSelectedCharId(userAnswers.favoriteCast);
    } else if (userAnswers?.loop1) {
      setSelectedCharId(userAnswers.loop1);
    }
    if (userAnswers?.name) setAuthorName(userAnswers.name);
    if (userAnswers?.grade) setAuthorGrade(userAnswers.grade);
  }, [userAnswers?.favoriteCast, userAnswers?.loop1, userAnswers?.name, userAnswers?.grade]);

  // スプレッドシートのアンケート回答に含まれるキャスト宛てメッセージ ＋ ユーザー送信メッセージ
  const [messages, setMessages] = useState({});
  const [authorName, setAuthorName] = useState(userAnswers?.name || '');
  const [authorGrade, setAuthorGrade] = useState(userAnswers?.grade || '一般');
  const [inputText, setInputText] = useState('');
  const [isPrivateMsg, setIsPrivateMsg] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [likedMap, setLikedMap] = useState(() => {
    try {
      const raw = localStorage.getItem('file26_char_liked_map');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('file26_char_liked_map', JSON.stringify(likedMap));
    } catch (e) {}
  }, [likedMap]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // スプレッドシートの回答データからキャスト別メッセージを集約（ダミーデータは完全排除）
  useEffect(() => {
    const map = {};

    // 初期化
    CAST_MEMBERS.forEach(c => {
      map[c.id] = [];
    });

    // 1. スプレッドシートから取得した全参加者のキャスト別メッセージ（非公開設定は除外）
    if (serverResponses && serverResponses.length > 0) {
      serverResponses.forEach(res => {
        const comments = res.characterComments || {};
        Object.entries(comments).forEach(([castId, val]) => {
          const isPrivate = typeof val === 'object' && val !== null ? !!val.isPrivate : false;
          const text = (typeof val === 'object' && val !== null ? (val.text || '') : String(val || '')).trim();
          if (!isPrivate && text && map[castId]) {
            map[castId].push({
              id: `res-${res.obsCode || Math.random()}-${castId}`,
              author: res.name || res.observerName || '観測者',
              grade: res.grade || '一般',
              text: text,
              isPrivate: false,
              likes: 0,
              time: res.timestamp ? new Date(res.timestamp).toLocaleDateString('ja-JP') : '記録済'
            });
          }
        });
      });
    }

    // 2. ユーザー自身の現在の入力がある場合（非公開の場合は自分だけに表示）
    if (userAnswers?.characterComments) {
      Object.entries(userAnswers.characterComments).forEach(([castId, val]) => {
        const isPrivate = typeof val === 'object' && val !== null ? !!val.isPrivate : !!userAnswers.characterPrivateFlags?.[castId];
        const text = (typeof val === 'object' && val !== null ? (val.text || '') : String(val || '')).trim();
        if (text && map[castId]) {
          // 重複チェック
          const exists = map[castId].some(m => m.text === text && m.author === (userAnswers.name || '観測者'));
          if (!exists) {
            map[castId].unshift({
              id: `user-self-${castId}`,
              author: userAnswers.name || '観測者 (あなた)',
              grade: userAnswers.grade || '一般',
              text: text,
              isPrivate: isPrivate,
              likes: 0,
              time: 'たった今',
              isMe: true
            });
          }
        }
      });
    }

    setMessages(map);
  }, [serverResponses, userAnswers]);

  const selectedChar = CAST_MEMBERS.find(c => c.id === selectedCharId) || CAST_MEMBERS[0];
  const charMessages = messages[selectedCharId] || [];
  const isFavorite = userAnswers?.favoriteCast === selectedCharId;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText) return;

    const myName = authorName.trim() || '観測者 (あなた)';
    const myGrade = authorGrade || '一般';

    const newMsg = {
      id: `msg-${Date.now()}`,
      author: myName,
      grade: myGrade,
      text: cleanText,
      isPrivate: isPrivateMsg,
      likes: 1,
      time: 'たった今',
      isMe: true
    };

    setMessages(prev => ({
      ...prev,
      [selectedCharId]: [newMsg, ...(prev[selectedCharId] || [])]
    }));

    // 親コンポーネントのアンケートデータと同期
    if (onUpdateFormData) {
      onUpdateFormData({
        characterComments: {
          ...(userAnswers?.characterComments || {}),
          [selectedCharId]: {
            text: cleanText,
            isPrivate: isPrivateMsg
          }
        },
        characterPrivateFlags: {
          ...(userAnswers?.characterPrivateFlags || {}),
          [selectedCharId]: isPrivateMsg
        }
      });
    }

    setInputText('');
    setSubmitSuccess(true);

    // 公開設定の場合のみクラウド（時空通信 / CROSSTALKシート）への永続化保存
    if (!isPrivateMsg) {
      try {
        await sheetApi.postCrossTalk({
          name: myName,
          grade: myGrade,
          category: 'cast_note',
          targetRoutes: [selectedCharId],
          targetCast: selectedCharId,
          message: cleanText,
          stamps: { resonance: 1, chills: 0 },
          stampUsers: { resonance: [myName], chills: [] }
        });
      } catch (err) {
        console.warn('Failed to post cast message to server:', err);
      }
    }

    setTimeout(() => {
      setSubmitSuccess(false);
      setIsModalOpen(false);
      setIsPrivateMsg(false);
    }, 1200);
  };

  const handleLikeMsg = (msgId) => {
    if (likedMap[msgId]) return;
    setLikedMap(prev => ({ ...prev, [msgId]: true }));
    setMessages(prev => ({
      ...prev,
      [selectedCharId]: (prev[selectedCharId] || []).map(m => 
        m.id === msgId ? { ...m, likes: m.likes + 1 } : m
      )
    }));
  };

  const handleCopyDirectLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', 'characters');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url.toString()).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      });
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const totalMsgsCount = Object.values(messages).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="max-w-5xl mx-auto p-2 sm:p-4 animate-fadeIn text-left pb-20">
      {/* ── ヘッダーバー ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-sm">📜</span>
            <h2 className="font-cinzel text-lg sm:text-xl font-black text-white tracking-tight">
              登場キャラ紹介 ＆ メッセージ
            </h2>
            <span className="text-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono px-2 py-0.5 rounded-full font-bold">
              計 {totalMsgsCount} 通
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            全キャラのプロフィールと、参加者から届いたメッセージを閲覧できます。
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyDirectLink}
          className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer shadow-sm self-start sm:self-auto shrink-0 bg-amber-500/10 border-amber-500/30 text-amber-300 hover:text-white"
        >
          {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copiedLink ? 'URLをコピーしました！' : 'このページのURLを共有'}</span>
        </button>
      </div>

      {/* ── キャスト選択トレイ（横スクロール） ── */}
      <div className="mb-4 bg-slate-900/80 p-2 sm:p-2.5 rounded-2xl border border-slate-800">
        <div className="text-[10px] font-mono text-slate-400 font-bold uppercase mb-1.5 px-1 flex items-center justify-between">
          <span>キャラを選ぶ:</span>
          <span className="text-[9px] text-slate-500 lowercase">左右にスクロール可能</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {CAST_MEMBERS.filter(c => c.isSelectable !== false).map(cast => {
            const isSelected = selectedCharId === cast.id;
            const count = (messages[cast.id] || []).length;

            return (
              <button
                key={cast.id}
                type="button"
                onClick={() => setSelectedCharId(cast.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500/80 text-white shadow-md ring-1 ring-amber-400/50 scale-105'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <img
                  src={cast.avatar}
                  alt={cast.name}
                  className={`w-6 h-6 rounded-full object-cover border ${isSelected ? 'border-amber-400' : 'border-slate-700'}`}
                />
                <div className="text-left">
                  <div className="text-xs font-bold leading-none">{cast.lastName || cast.name}</div>
                  <div className="text-[9px] font-mono text-amber-400/80 mt-0.5">{count}通</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 選択中キャストの紹介バー ── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-5 shadow-lg flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-md shrink-0">
          <img src={selectedChar.avatar} alt={selectedChar.name} className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 text-center sm:text-left min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            <h3 className="text-base sm:text-lg font-black text-white">{selectedChar.name}</h3>
            <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
              {selectedChar.generation} ｜ {selectedChar.grade}
            </span>
            <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40">
              {selectedChar.role}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-serif mb-2">
            {selectedChar.desc}
          </p>

          <div className="flex items-center justify-center sm:justify-start gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 text-white font-bold text-xs shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{selectedChar.lastName}へ電報手記を送る</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 電報手記メッセージ一覧 ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold text-slate-400 font-mono">
            MESSAGES TO {selectedChar.lastName.toUpperCase()} ({charMessages.length}件)
          </h4>
        </div>

        {charMessages.length === 0 ? (
          <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-2">
            <div className="text-3xl">✉️</div>
            <p className="text-xs text-slate-400">
              まだ {selectedChar.name} 宛ての電報メッセージはありません。<br />
              アンケート回答または上のボタンから最初の熱い手記を届けましょう！
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {charMessages.map(msg => (
              <div
                key={msg.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between shadow-md hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-white">{msg.author}</span>
                      <span className="text-[10px] font-mono text-slate-400">({msg.grade})</span>
                      {msg.isMe && (
                        <span className="text-[9px] bg-amber-500 text-black font-black px-1.5 rounded">YOU</span>
                      )}
                      {msg.isPrivate && (
                        <span className="text-[9px] bg-amber-950/80 border border-amber-600/60 text-amber-300 font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                          🔒 非公開(運営・キャスト宛)
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{msg.time}</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-serif whitespace-pre-wrap">
                    “{msg.text}”
                  </p>
                </div>

                <div className="pt-2 mt-2 border-t border-slate-800/60 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleLikeMsg(msg.id)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border transition-all cursor-pointer ${
                      likedMap[msg.id]
                        ? 'bg-rose-500/20 border-rose-400 text-rose-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Heart className="w-3 h-3 text-rose-400" fill={likedMap[msg.id] ? "currentColor" : "none"} />
                    <span>{msg.likes}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 電報送信モーダル ── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  {selectedChar.name} へ電報を送る
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">お名前</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="名無しの観測者"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">学年・属性</label>
                  <input
                    type="text"
                    value={authorGrade}
                    onChange={(e) => setAuthorGrade(e.target.value)}
                    placeholder="2年"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">電報メッセージ</label>
                <textarea
                  rows={4}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`${selectedChar.lastName}への感想や印象に残った場面などをご自由に入力…`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {/* ── 公開 / 非公開 トグルスイッチ ── */}
              <div className={`p-3 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 ${
                isPrivateMsg 
                  ? 'bg-amber-950/20 border-amber-500/40 ring-1 ring-amber-500/20' 
                  : 'bg-slate-950/90 border-slate-800'
              }`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 transition-colors ${
                    isPrivateMsg ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {isPrivateMsg ? '🔒' : '🌐'}
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-white">
                        {isPrivateMsg ? '非公開で送る（運営・キャスト宛）' : '全体公開で送る'}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        isPrivateMsg ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {isPrivateMsg ? '🔒 非公開' : '🌐 公開'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                      {isPrivateMsg 
                        ? '全体掲示板には出ず、運営とキャストのみに届けられます' 
                        : 'このキャラの部屋や時空通信ボードに掲載されます'}
                    </p>
                  </div>
                </div>

                {/* 視覚的トグルスイッチ */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isPrivateMsg}
                  onClick={() => setIsPrivateMsg(!isPrivateMsg)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isPrivateMsg ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                  title={isPrivateMsg ? 'クリックして公開に変更' : 'クリックして非公開に変更'}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isPrivateMsg ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800 cursor-pointer"
                >
                  閉じる
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow hover:brightness-110 cursor-pointer"
                >
                  {submitSuccess ? '送信しました！' : (isPrivateMsg ? '🔒 非公開で投函する' : '🌐 電報を投函する')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
