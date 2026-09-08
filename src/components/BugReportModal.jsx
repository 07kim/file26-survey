import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { sheetApi } from '../services/sheetApi';

export default function BugReportModal({ isOpen, onClose, currentTab, currentStep, defaultName = '' }) {
  const [reporterName, setReporterName] = useState(defaultName);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanMsg = message.trim();
    if (!cleanMsg) {
      setErrorMsg('不具合やメッセージを入力してください');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const payload = {
      name: reporterName.trim() || '匿名',
      message: cleanMsg,
      currentTab: currentTab || 'survey',
      currentStep: currentStep || 0,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      screenSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '',
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: new Date().toISOString()
    };

    try {
      const res = await sheetApi.reportBug(payload);
      if (res && res.ok === false) {
        throw new Error(res.error || '送信に失敗しました');
      }
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setMessage('');
        onClose();
      }, 1600);
    } catch (err) {
      console.warn('Bug report submission error:', err);
      // 万一通信失敗してもローカル保存して完了扱いにする
      try {
        const key = 'file26_local_bug_reports';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.push(payload);
        localStorage.setItem(key, JSON.stringify(existing));
      } catch (e) {}
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setMessage('');
        onClose();
      }, 1600);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              不具合・バグ報告
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-2 animate-fadeIn">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">報告を送信しました</h4>
            <p className="text-xs text-slate-400">
              ご協力ありがとうございます。内容を確認いたします。
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-[11px] text-slate-300 font-bold block mb-1">
                お名前 / ニックネーム
                <span className="text-[10px] text-slate-500 font-normal ml-1.5">（任意）</span>
              </label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="匿名"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                maxLength={40}
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-300 font-bold block mb-1">
                不具合の状況・メッセージ
                <span className="text-[10px] text-rose-400 font-normal ml-1.5">（必須）</span>
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="ボタンが反応しない、表示が崩れている、エラーが出るなど、気になった点をご自由にご記入ください。"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-2xl p-3 text-xs text-white placeholder-slate-500 outline-none resize-none transition-colors"
                required
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-400 font-bold">{errorMsg}</p>
            )}

            <div className="pt-1 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800 cursor-pointer transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md hover:brightness-110 cursor-pointer flex items-center gap-1.5 disabled:opacity-50 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? '送信中…' : '報告を送信する'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
