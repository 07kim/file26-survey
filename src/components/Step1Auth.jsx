import React, { useState, useEffect } from 'react';
import { UserCheck, ArrowRight, Sparkles, User, GraduationCap, MapPin, BookOpen, Check, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { OPTIONS, CAST_MEMBERS } from '../data/storyData';
import GoogleAuthButton from './GoogleAuthButton';
import { getStoredUser } from '../utils/googleAuth';

export default function Step1Auth({ formData, updateFormData, onNext, onPrev }) {
  const [realName, setRealName] = useState(formData.realName || '');
  const [nickname, setNickname] = useState(formData.observerName || '');
  const [grade, setGrade] = useState(formData.grade || '2年');
  const [customAvatar, setCustomAvatar] = useState(formData.customAvatar || '');
  
  const [role, setRole] = useState(formData.role || '一般参加者');
  const [route, setRoute] = useState(formData.route || '順路A（青／矢田 逞）');
  const [prep, setPrep] = useState(formData.prep || 'ざっと目を通した');

  const [errors, setErrors] = useState({});

  // 既にGoogle認証済みの場合は名前をプリフィル
  useEffect(() => {
    const user = getStoredUser();
    if (user && user.name) {
      if (!realName) setRealName(user.name);
      if (!nickname) setNickname(user.name);
      if (!customAvatar && user.picture) setCustomAvatar(user.picture);
    }
  }, []);

  const handleGoogleSuccess = (user) => {
    if (user && user.name) {
      if (!realName) setRealName(user.name);
      if (!nickname) setNickname(user.name);
      if (!customAvatar && user.picture) setCustomAvatar(user.picture);
      setErrors(prev => ({ ...prev, realName: '', nickname: '' }));
    }
  };

  const handleStart = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!realName.trim()) {
      newErrors.realName = '本名（氏名）を入力してください';
    }
    if (!nickname.trim()) {
      newErrors.nickname = 'ニックネーム または 観測者コードを入力してください';
    }
    if (!role) {
      newErrors.role = 'あなたの立場を選択してください';
    }
    if (!route) {
      newErrors.route = '手元にあった順路を選択してください';
    }
    if (!prep) {
      newErrors.prep = '事前配布物の読了状況を選択してください';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 選択されたアバター画像から推しキャストを自動解決
    const matchedCast = CAST_MEMBERS.find(c => c.avatar === customAvatar);

    updateFormData({
      realName: realName.trim(),
      observerName: nickname.trim(),
      grade: grade,
      observerRole: grade,
      customAvatar: customAvatar,
      favoriteCast: matchedCast ? matchedCast.id : formData.favoriteCast,
      role: role,
      route: route,
      prep: prep
    });
    onNext();
  };

  const handleQuickNickname = () => {
    const randomCode = `OBSERVER #${Math.floor(10 + Math.random() * 90)}`;
    setNickname(randomCode);
    setErrors(prev => ({ ...prev, nickname: '' }));
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 animate-fade-in">
      {/* 機密ファイル風ヘッダー */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 sm:p-8 relative overflow-hidden backdrop-blur-md shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#b8352f]/10 rounded-bl-full pointer-events-none" />
        
        <div className="flex items-center justify-between mb-3">
          <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold tracking-widest bg-[#b8352f]/20 text-[#ff716a] border border-[#b8352f]/40 shadow-sm">
            SECTION 01 ／ 観測者について
          </span>
          <span className="text-xs font-mono font-medium text-slate-400">EVENT_ID: 26_094</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          観測者 認証プロファイル
        </h2>
        <p className="text-slate-300 text-sm sm:text-[15px] leading-relaxed mb-5 text-pretty-ja">
          時空の歪みからのご帰還、お疲れ様でした。<br className="hidden sm:inline" />
          当日の基本情報とあなた自身の立場を記録します。
        </p>

        {/* Googleアカウント事前連携・自動プリフィル */}
        <div className="mb-6">
          <GoogleAuthButton
            currentObsCode="OBS-STEP1"
            onAuthSuccess={handleGoogleSuccess}
          />
        </div>

        <form onSubmit={handleStart} className="space-y-6">
          {/* ① 本名 & ニックネーム */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200 flex items-center gap-1.5 mb-1.5">
                <User className="w-3.5 h-3.5 text-[#ff4a42]" />
                本名（氏名） <span className="text-[#ff4a42] font-black">*</span>
              </label>
              <input
                type="text"
                value={realName}
                onChange={(e) => { setRealName(e.target.value); setErrors(prev => ({ ...prev, realName: '' })); }}
                placeholder="例: 千葉 太郎"
                className="w-full bg-slate-950/85 border border-slate-700 focus:border-[#ff4a42] focus:ring-2 focus:ring-[#ff4a42]/30 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition-all outline-none font-medium"
              />
              {errors.realName && <p className="text-rose-400 text-xs mt-1.5 font-bold">{errors.realName}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#ff4a42]" />
                  表示名（ニックネーム） <span className="text-[#ff4a42] font-black">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleQuickNickname}
                  className="text-xs text-amber-300 hover:text-amber-200 font-bold hover:underline font-mono flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> 自動発行
                </button>
              </div>
              <input
                type="text"
                value={nickname}
                onChange={(e) => { setNickname(e.target.value); setErrors(prev => ({ ...prev, nickname: '' })); }}
                placeholder="例: OBSERVER #042"
                className="w-full bg-slate-950/85 border border-slate-700 focus:border-[#ff4a42] focus:ring-2 focus:ring-[#ff4a42]/30 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition-all outline-none font-medium"
              />
              <p className="text-xs text-slate-300 mt-1.5 leading-snug">
                ※ Google認証を行っても、カードや掲示板にはこのニックネームが表示されます。
              </p>
              {errors.nickname && <p className="text-rose-400 text-xs mt-1.5 font-bold">{errors.nickname}</p>}
            </div>
          </div>

          {/* アイコン（アバター）選択 */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#ff4a42]" />
                観測者アイコン（推しキャラ選択）
              </label>
              <span className="text-[11px] text-slate-500 font-mono">カードや掲示板に反映</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              あなたの推しキャラクターや Google アイコンをタップして設定できます。
            </p>

            <div className="flex flex-wrap gap-2.5 items-center">
              {/* Googleアバター（認証済みの場合） */}
              {getStoredUser()?.picture && (
                <button
                  type="button"
                  onClick={() => setCustomAvatar(getStoredUser().picture)}
                  className={`relative p-1 rounded-full border-2 transition-all cursor-pointer ${
                    customAvatar === getStoredUser().picture
                      ? 'border-[#b8352f] ring-2 ring-[#b8352f]/40 scale-105 bg-[#b8352f]/20'
                      : 'border-slate-700 hover:border-slate-500 opacity-70 hover:opacity-100'
                  }`}
                  title="Googleアイコン"
                >
                  <img
                    src={getStoredUser().picture}
                    alt="Google"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {customAvatar === getStoredUser().picture && (
                    <span className="absolute -top-1 -right-1 bg-[#b8352f] text-white rounded-full p-0.5 shadow">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </button>
              )}

              {/* キャストアイコン一覧 */}
              {CAST_MEMBERS.map((cast) => {
                const isSelected = customAvatar === cast.avatar;
                return (
                  <button
                    key={cast.id}
                    type="button"
                    onClick={() => setCustomAvatar(cast.avatar)}
                    className={`relative p-0.5 rounded-full border-2 transition-all cursor-pointer group ${
                      isSelected
                        ? 'border-[#ff4a42] ring-2 ring-[#ff4a42]/50 scale-110 shadow-lg shadow-[#ff4a42]/30 z-10'
                        : 'border-slate-700 hover:border-slate-400 opacity-75 hover:opacity-100'
                    }`}
                    title={`${cast.lastName}（${cast.name}）`}
                  >
                    <img
                      src={cast.avatar}
                      alt={cast.name}
                      className="w-10 h-10 rounded-full object-cover bg-slate-900"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 bg-[#ff4a42] text-white rounded-full p-0.5 shadow">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                    <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none bg-slate-900/90 px-1 rounded border border-slate-800">
                      {cast.lastName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ② 立場 */}
          <div>
            <label className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200 flex items-center gap-1.5 mb-2">
              <GraduationCap className="w-3.5 h-3.5 text-[#ff4a42]" />
              あなたの立場 <span className="text-[#ff4a42] font-black">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {OPTIONS.role.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => { setRole(r); setErrors(prev => ({ ...prev, role: '' })); }}
                  className={`py-3 px-3 rounded-lg text-xs sm:text-[13px] font-bold border transition-all text-center flex items-center justify-between cursor-pointer ${
                    role === r
                      ? 'bg-[#b8352f] text-white border-[#ff4a42] shadow-md ring-2 ring-[#ff4a42]/30'
                      : 'bg-slate-950/85 text-slate-300 border-slate-700/80 hover:border-slate-500 hover:text-white'
                  }`}
                >
                  <span>{r}</span>
                  {role === r && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              ))}
            </div>
            {errors.role && <p className="text-rose-400 text-xs mt-1.5 font-bold">{errors.role}</p>}
          </div>

          {/* ③ 当日手元にあった「順路」 */}
          <div>
            <div className="mb-2">
              <label className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#ff4a42]" />
                当日、手元にあった「順路」 <span className="text-[#ff4a42] font-black">*</span>
              </label>
              <p className="text-xs text-slate-400 mt-0.5">※ お渡しした道具に入っていた、色つきの地図です。</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {OPTIONS.route.map((rt) => (
                <button
                  key={rt}
                  type="button"
                  onClick={() => { setRoute(rt); setErrors(prev => ({ ...prev, route: '' })); }}
                  className={`py-3 px-3.5 rounded-lg text-xs sm:text-[13px] font-bold border transition-all text-left flex items-center justify-between cursor-pointer leading-snug ${
                    route === rt
                      ? 'bg-[#b8352f] text-white border-[#ff4a42] shadow-md ring-2 ring-[#ff4a42]/30'
                      : 'bg-slate-950/85 text-slate-300 border-slate-700/80 hover:border-slate-500 hover:text-white'
                  }`}
                >
                  <span className="text-pretty-ja">{rt}</span>
                  {route === rt && <Check className="w-4 h-4 shrink-0 ml-2" />}
                </button>
              ))}
            </div>
            {errors.route && <p className="text-rose-400 text-xs mt-1.5 font-bold">{errors.route}</p>}
          </div>

          {/* ④ 事前配布物の読了度 */}
          <div>
            <label className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200 flex items-center gap-1.5 mb-2">
              <BookOpen className="w-3.5 h-3.5 text-[#ff4a42]" />
              事前の配布物（あらすじ・相関図）は読みましたか <span className="text-[#ff4a42] font-black">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {OPTIONS.prep.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setPrep(p); setErrors(prev => ({ ...prev, prep: '' })); }}
                  className={`py-3 px-2.5 rounded-lg text-xs sm:text-[13px] font-bold border transition-all text-center flex items-center justify-between cursor-pointer ${
                    prep === p
                      ? 'bg-[#b8352f] text-white border-[#ff4a42] shadow-md ring-2 ring-[#ff4a42]/30'
                      : 'bg-slate-950/85 text-slate-300 border-slate-700/80 hover:border-slate-500 hover:text-white'
                  }`}
                >
                  <span className="truncate">{p}</span>
                  {prep === p && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              ))}
            </div>
            {errors.prep && <p className="text-rose-400 text-xs mt-1.5 font-bold">{errors.prep}</p>}
          </div>

          {/* ナビゲーションボタン */}
          <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-800">
            {onPrev && (
              <button
                type="button"
                onClick={onPrev}
                className="px-5 py-3 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-mono font-bold transition-all cursor-pointer"
              >
                ← 戻る
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-[#b8352f] hover:bg-[#a12e29] text-white font-bold py-3.5 px-6 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-[#b8352f]/20 hover:shadow-xl transition-all group cursor-pointer"
            >
              <span>次へ：周回キャスト追跡</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

