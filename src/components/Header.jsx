import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, FileText, MessageCircle, Layers, Edit3, Clock, ScrollText, Check, Award, ShieldCheck, User, LogOut, Lock, AlertCircle } from 'lucide-react';
import { getStoredUser, logoutGoogleUser, parseJwt, saveGoogleUser, getActiveClientId } from '../utils/googleAuth';
import BugReportModal from './BugReportModal';

export default function Header({ currentStep, totalSteps, currentTab, setTab, onEasterEgg, isUnlocked = true }) {
  const [tapCount, setTapCount] = useState(0);
  const [glitchActive, setGlitchActive] = useState(false);
  const [googleUser, setGoogleUser] = useState(() => getStoredUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const headerGoogleBtnRef = useRef(null);

  useEffect(() => {
    const handleStorage = () => {
      setGoogleUser(getStoredUser());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // モーダルオープン時のGoogleボタンレンダリング
  useEffect(() => {
    if (isAuthModalOpen && headerGoogleBtnRef.current && window.google?.accounts?.id) {
      const clientId = getActiveClientId();
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response && response.credential) {
              const decoded = parseJwt(response.credential);
              if (decoded) {
                const verifiedUser = {
                  id: decoded.sub || `google_${Date.now()}`,
                  name: decoded.name || decoded.email.split('@')[0] || 'Google観測者',
                  email: decoded.email,
                  picture: decoded.picture || 'https://lh3.googleusercontent.com/a/default-user',
                  verified: true,
                  obsCode: 'OBS-HEADER',
                  verifiedAt: new Date().toISOString()
                };
                setGoogleUser(verifiedUser);
                saveGoogleUser(verifiedUser);
                setIsAuthModalOpen(false);
                window.dispatchEvent(new Event('storage'));
                window.dispatchEvent(new CustomEvent('google-user-login', { detail: verifiedUser }));
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        headerGoogleBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(headerGoogleBtnRef.current, {
          type: 'standard',
          theme: 'filled_blue',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          width: 280
        });
      } catch (err) {
        console.warn('Google Identity button render error:', err);
      }
    }
  }, [isAuthModalOpen]);

  const handleLogoTap = () => {
    const next = tapCount + 1;
    setTapCount(next);
    if (next >= 4) {
      setGlitchActive(true);
      if (onEasterEgg) onEasterEgg();
      setTimeout(() => {
        setGlitchActive(false);
        setTapCount(0);
      }, 3000);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm transition-all">
      <div className="max-w-6xl mx-auto px-2.5 sm:px-4 py-1.5 sm:py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-3">
        {/* 上段（スマホ時）/ 左右（PC時）: ロゴ ＆ 右側アクション群 */}
        <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
          {/* 左側: タイトル & イースターエッグロゴ */}
          <div 
            onClick={handleLogoTap}
            className="flex items-center gap-2 cursor-pointer select-none group shrink-0"
            title="File:26__094 機密データアクセス"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-[#b8352f]/10 border border-[#b8352f]/30 flex items-center justify-center text-[#b8352f] group-hover:scale-105 transition-transform shadow-sm">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-orbitron font-extrabold tracking-wider text-xs sm:text-base text-slate-900">
                  File:26__094
                </span>
                <span className="text-[8.5px] sm:text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-[#b8352f] text-white tracking-widest shadow-xs">
                  PORTAL
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium hidden md:block">観測記録 ＆ 集合知ポータル</p>
            </div>
          </div>

          {/* スマホ時のみ上段右側に表示されるアクション群（PC時は非表示） */}
          <div className="flex sm:hidden items-center gap-1 shrink-0">
            {/* Google ログインユーザー状態 / ボタン */}
            {googleUser ? (
              <div className="flex items-center gap-1 bg-slate-50 border border-emerald-500/50 px-1.5 py-1 rounded-lg shadow-xs">
                <img
                  src={googleUser.picture || 'https://lh3.googleusercontent.com/a/default-user'}
                  alt={googleUser.name}
                  className="w-4 h-4 rounded-full object-cover border border-emerald-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    logoutGoogleUser();
                    setGoogleUser(null);
                    window.dispatchEvent(new Event('storage'));
                  }}
                  title="ログアウト"
                  className="text-slate-400 hover:text-rose-500 p-0.5 cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-bold bg-white border border-slate-200 text-slate-700 shadow-xs cursor-pointer hover:bg-slate-50"
                title="Googleアカウントでログイン"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>ログイン</span>
              </button>
            )}

            {/* バグ報告ボタン（スマホ） */}
            <button
              type="button"
              onClick={() => setIsBugModalOpen(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-bold bg-slate-50 border border-slate-200 hover:border-amber-500 text-slate-700 shadow-xs cursor-pointer hover:bg-amber-500/10 hover:text-amber-700 transition-colors"
              title="不具合・バグ報告"
            >
              <AlertCircle className="w-3 h-3 text-amber-600" />
              <span>バグ報告</span>
            </button>
          </div>
        </div>

        {/* 中央: メインナビゲーションタブ（スマホ時は下段全体にフィット、PC時は中央） */}
        <div className="w-full sm:w-auto flex items-center justify-center overflow-x-auto no-scrollbar py-0.5">
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start bg-slate-100/90 p-0.5 sm:p-1 rounded-xl border border-slate-200/90 shrink-0 gap-0.5 sm:gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => setTab('survey')}
              className={`flex-1 sm:flex-none px-2 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                currentTab === 'survey' || currentTab === 'card'
                  ? 'bg-gradient-to-r from-[#b8352f] to-[#7c3aed] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Award className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">アンケート</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('crosstalk')}
              className={`relative flex-1 sm:flex-none px-2 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                currentTab === 'crosstalk'
                  ? 'bg-[#0284c7] text-white shadow-sm'
                  : isUnlocked
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-sky-50 font-bold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title={!isUnlocked ? 'アンケート送信後に解放されます' : '感想'}
            >
              {!isUnlocked ? <Lock className="w-3 h-3 text-slate-400 shrink-0" /> : <MessageCircle className="w-3.5 h-3.5 shrink-0 text-[#0284c7]" />}
              <span className="whitespace-nowrap">感想</span>
              {isUnlocked && currentTab !== 'crosstalk' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] animate-ping shrink-0" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setTab('characters')}
              className={`relative flex-1 sm:flex-none px-2 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                currentTab === 'characters'
                  ? 'bg-[#d97706] text-white shadow-sm'
                  : isUnlocked
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-amber-50 font-bold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title={!isUnlocked ? 'アンケート送信後に解放されます' : 'キャラ'}
            >
              {!isUnlocked ? <Lock className="w-3 h-3 text-slate-400 shrink-0" /> : <ScrollText className="w-3.5 h-3.5 shrink-0 text-[#d97706]" />}
              <span className="whitespace-nowrap">キャラ</span>
              {isUnlocked && currentTab !== 'characters' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#d97706] animate-ping shrink-0" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setTab('gallery')}
              className={`relative flex-1 sm:flex-none px-2 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                currentTab === 'gallery'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : isUnlocked
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-emerald-50 font-bold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title={!isUnlocked ? 'アンケート送信後に解放されます' : 'みんなのカード'}
            >
              {!isUnlocked ? <Lock className="w-3 h-3 text-slate-400 shrink-0" /> : <Layers className="w-3.5 h-3.5 shrink-0 text-emerald-600" />}
              <span className="whitespace-nowrap">みんなのカード</span>
              {isUnlocked && currentTab !== 'gallery' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              )}
            </button>
          </div>
        </div>

        {/* PC時のみ表示される右側アクション群（スマホ時は非表示） */}
        <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Google ログインユーザー状態バッジ & ログアウト（ログイン時） */}
          {googleUser ? (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-emerald-500/40 px-2.5 py-1 rounded-lg shadow-xs">
              <img
                src={googleUser.picture || 'https://lh3.googleusercontent.com/a/default-user'}
                alt={googleUser.name}
                className="w-4 h-4 rounded-full object-cover border border-emerald-400"
              />
              <span className="text-[11px] font-bold text-slate-800 truncate max-w-[70px] sm:max-w-[120px]">
                {googleUser.name}
              </span>
              <button
                type="button"
                onClick={() => {
                  logoutGoogleUser();
                  setGoogleUser(null);
                  window.dispatchEvent(new Event('storage'));
                }}
                title="Googleアカウント連携を解除（ログアウト）"
                className="flex items-center gap-1 text-slate-400 hover:text-rose-600 transition-colors p-0.5 rounded cursor-pointer ml-1 text-[10px] font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">ログアウト</span>
              </button>
            </div>
          ) : (
            /* 未ログイン時の常時ログインボタン */
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white border border-slate-200 hover:border-[#b8352f] text-slate-700 shadow-xs transition-all cursor-pointer hover:bg-slate-50"
              title="Googleアカウントでログイン"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>ログイン</span>
            </button>
          )}

          {/* バグ報告ボタン（PC） */}
          <button
            type="button"
            onClick={() => setIsBugModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-50 border border-slate-200 hover:border-amber-500 text-slate-700 shadow-xs transition-all cursor-pointer hover:bg-amber-500/10 hover:text-amber-700"
            title="不具合・バグ報告"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>バグ報告</span>
          </button>
        </div>
      </div>

      {/* 🐛 バグ報告モーダル */}
      <BugReportModal
        isOpen={isBugModalOpen}
        onClose={() => setIsBugModalOpen(false)}
        currentTab={currentTab}
        currentStep={currentStep}
        defaultName={googleUser?.name || ''}
      />

      {/* 🔐 ヘッダー用 Google 認証モーダル（createPortalで画面中央に確実に配置し見切れを完全防止） */}
      {isAuthModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setIsAuthModalOpen(false)}
          className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-sm sm:max-w-md w-full p-5 sm:p-6 shadow-2xl relative text-left my-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Googleアカウント認証</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-lg font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <p className="text-xs sm:text-[13px] text-slate-300 mb-5 leading-relaxed">
              Googleアカウントでログインすると、観測記録の提出やライセンスカードの保存・復元がスムーズに行えます。<br />
              <span className="text-slate-400 text-xs mt-1.5 block">※ 認証後も表示名には入力したニックネームが最優先で適用されます。</span>
            </p>

            <div className="flex flex-col items-center justify-center gap-3 py-2">
              <div ref={headerGoogleBtnRef} className="min-h-[44px] flex items-center justify-center w-full" />
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* イースターエッグのグリッチ通知 */}
      {glitchActive && (
        <div className="bg-[#b8352f] text-white text-xs px-4 py-1.5 font-mono flex items-center justify-center gap-2 animate-bounce">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
          <span>[SYSTEM ALERT] 機密領域に侵入しました：隠されたログ「観測者よ、世界線を繋げ」</span>
        </div>
      )}
    </header>
  );
}

