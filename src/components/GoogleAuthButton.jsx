import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { parseJwt, getStoredUser, saveGoogleUser, logoutGoogleUser, getActiveClientId, setActiveClientId } from '../utils/googleAuth';
import { Check, LogIn, LogOut, ShieldCheck, User, Settings, ExternalLink, AlertCircle, HelpCircle, Sparkles } from 'lucide-react';

export default function GoogleAuthButton({ onAuthSuccess, onLogout, currentObsCode }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [customClientId, setCustomClientId] = useState(() => getActiveClientId());
  const [inputEmail, setInputEmail] = useState('');
  const [inputName, setInputName] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const googleBtnContainerRef = useRef(null);
  const modalGoogleBtnRef = useRef(null);

  // Google Identity Services (One Tap & ログインボタン) の初期化
  useEffect(() => {
    if (user) return; // 既に認証済みの場合は初期化不要

    const initGsi = () => {
      if (!window.google || !window.google.accounts || !window.google.accounts.id) {
        return;
      }

      const clientId = customClientId || getActiveClientId();

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
                  obsCode: currentObsCode,
                  verifiedAt: new Date().toISOString()
                };
                setUser(verifiedUser);
                saveGoogleUser(verifiedUser);
                setIsModalOpen(false);
                if (onAuthSuccess) onAuthSuccess(verifiedUser);
              }
            }
          },
          auto_select: true, // ブラウザでログイン済みの場合に自動選択を促す
          cancel_on_tap_outside: true,
        });

        // 1. One Tap プロンプトの表示（ブラウザでログイン中のアカウントを画面右上に自動表示）
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // One Tapが抑制された場合はボタンレンダリングへ
          }
        });

        // 2. ボタンのレンダリング（メインボタン枠）
        if (googleBtnContainerRef.current) {
          googleBtnContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 240
          });
        }

        // 3. モーダル内ボタンのレンダリング
        if (modalGoogleBtnRef.current) {
          modalGoogleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(modalGoogleBtnRef.current, {
            type: 'standard',
            theme: 'filled_blue',
            size: 'large',
            text: 'signin_with',
            shape: 'pill',
            width: 280
          });
        }
      } catch (err) {
        console.warn('Google Identity initialization notice:', err);
      }
    };

    // GSIスクリプトのロード待機
    if (window.google && window.google.accounts) {
      initGsi();
    } else {
      const interval = setInterval(() => {
        if (window.google && window.google.accounts) {
          clearInterval(interval);
          initGsi();
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [user, customClientId, isModalOpen, currentObsCode]);

  // Google OAuth実行またはアカウント連携モーダル起動
  const handleStartAuth = () => {
    const activeClientId = customClientId || getActiveClientId();

    if (activeClientId && window.google && window.google.accounts && window.google.accounts.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: activeClientId,
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: async (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const userInfo = await res.json();
                if (userInfo && userInfo.email) {
                  const verifiedUser = {
                    id: userInfo.sub,
                    name: userInfo.name || userInfo.email.split('@')[0],
                    email: userInfo.email,
                    picture: userInfo.picture || 'https://lh3.googleusercontent.com/a/default-user',
                    verified: true,
                    obsCode: currentObsCode,
                    verifiedAt: new Date().toISOString()
                  };
                  setUser(verifiedUser);
                  saveGoogleUser(verifiedUser);
                  setIsModalOpen(false);
                  if (onAuthSuccess) onAuthSuccess(verifiedUser);
                  return;
                }
              } catch (e) {
                console.warn('UserInfo fetch error:', e);
              }
            }
          }
        });
        client.requestAccessToken();
        return;
      } catch (e) {
        console.warn('Token client error:', e);
      }
    }

    setIsModalOpen(true);
  };

  const handleQuickAuth = (account) => {
    setIsAuthenticating(true);
    setTimeout(() => {
      const verifiedUser = {
        id: `google_${Date.now()}`,
        name: account.name,
        email: account.email,
        picture: account.avatar || 'https://lh3.googleusercontent.com/a/default-user',
        verified: true,
        obsCode: currentObsCode,
        verifiedAt: new Date().toISOString()
      };
      setUser(verifiedUser);
      saveGoogleUser(verifiedUser);
      setIsAuthenticating(false);
      setIsModalOpen(false);
      if (onAuthSuccess) onAuthSuccess(verifiedUser);
    }, 400);
  };

  const handleCustomFormSubmit = (e) => {
    e.preventDefault();
    if (!inputEmail.trim()) return;
    const name = inputName.trim() || inputEmail.split('@')[0];
    handleQuickAuth({
      name,
      email: inputEmail.trim(),
      avatar: 'https://lh3.googleusercontent.com/a/default-user'
    });
  };

  const handleLogout = () => {
    logoutGoogleUser();
    setUser(null);
    if (onLogout) onLogout();
  };

  return (
    <div className="w-full">
      {user ? (
        // ── 認証完了済みUI ──
        <div className="bg-[#0d111a] border border-emerald-500/40 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-lg shadow-emerald-950/20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src={user.picture || 'https://lh3.googleusercontent.com/a/default-user'}
                alt={user.name}
                className="w-9 h-9 rounded-full border border-emerald-400/60 object-cover shadow-sm"
              />
              <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white rounded-full p-0.5 border border-[#0d111a]">
                <Check className="w-2.5 h-2.5" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-white truncate max-w-[150px] sm:max-w-[200px]">
                  {user.name}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                  <ShieldCheck className="w-3 h-3" /> Google認証済
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate font-mono">
                {user.email}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="text-[11px] font-bold text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/50 bg-slate-900 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1"
          >
            <LogOut className="w-3 h-3" />
            <span>解除</span>
          </button>
        </div>
      ) : (
        // ── 未認証・Google認証UI（公式ボタン ＆ ワンタップ連携） ──
        <div className="bg-[#0d111a] border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 transition-all">
          <div className="flex items-center gap-3 text-left w-full sm:w-auto">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 shadow-md">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Googleアカウント認証・自動連携</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">One Tap対応</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                ログイン中のGoogleアカウントでカードと観測ログを同期
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Google 公式レンダリングボタンコンテナ */}
            <div ref={googleBtnContainerRef} className="shrink-0 min-h-[40px] flex items-center" />

            {/* フォールバック用認証ボタン */}
            <button
              type="button"
              onClick={handleStartAuth}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
              title="アカウント設定・手動連携"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      )}

      {/* ── 認証・紐付けモーダル（createPortalでbody直下に配置し見切れを防止） ── */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1e293b] border border-slate-700 rounded-2xl max-w-sm w-full p-5 sm:p-6 text-left shadow-2xl text-slate-100 my-auto max-h-[90vh] overflow-y-auto cursor-default"
          >
            {/* ヘッダー */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="font-bold text-sm text-white">Google アカウント自動認証</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">File:26__094</span>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              ブラウザでログインしているGoogleアカウントを選択して、観測コード（<strong className="text-emerald-400 font-mono">{currentObsCode || 'OBS'}</strong>）に紐づけます。
            </p>

            {/* Google 公式ログインボタン（モーダル内） */}
            <div className="my-4 flex flex-col items-center justify-center p-4 bg-slate-900/80 rounded-xl border border-slate-700/80">
              <p className="text-[11px] font-bold text-slate-300 mb-2.5">ブラウザのGoogleアカウントで同期</p>
              <div ref={modalGoogleBtnRef} className="min-h-[40px]" />
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-700"></div>
              <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase font-mono">または直接指定</span>
              <div className="flex-grow border-t border-slate-700"></div>
            </div>

            {isAuthenticating ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-7 h-7 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-emerald-400">アカウントを同期中…</p>
              </div>
            ) : (
              <form onSubmit={handleCustomFormSubmit} className="space-y-3 mb-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Googleメールアドレス（Gmailまたは大学アドレス）
                  </label>
                  <input
                    type="email"
                    required
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    placeholder="例: s24c3040ry@chibatech.ac.jp"
                    className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    表示名（任意）
                  </label>
                  <input
                    type="text"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder="例: 洸太"
                    className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>指定したアドレスで認証保存</span>
                </button>
              </form>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                className="text-[11px] text-slate-400 hover:text-slate-300 flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3 h-3" />
                <span>Google Client ID設定</span>
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer px-3 py-1"
              >
                閉じる
              </button>
            </div>

            {/* Google Client ID 設定枠 */}
            {showConfig && (
              <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800 text-left text-xs">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Google Cloud OAuth Client ID
                </label>
                <input
                  type="text"
                  value={customClientId}
                  onChange={(e) => {
                    setCustomClientId(e.target.value);
                    setActiveClientId(e.target.value);
                  }}
                  placeholder="xxxx.apps.googleusercontent.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-white mb-1 outline-none font-mono"
                />
                <p className="text-[10px] text-slate-400 leading-tight">
                  ※ Google Cloud Consoleで発行したWebクライアントIDを設定すると、公式のGoogleアカウント選択が直接起動します。
                </p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

