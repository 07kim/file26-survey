import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, ArrowLeft, Heart, FileText, CheckCircle2, ShieldAlert, Terminal, Loader2 } from 'lucide-react';

export default function Step6Message({ formData, updateFormData, onSubmit, onPrev, isSubmitting }) {
  const [highlightScene, setHighlightScene] = useState(formData.highlightScene || '');
  const [characterMsg, setCharacterMsg] = useState(formData.characterMsg || '');
  const [publicComment, setPublicComment] = useState(formData.publicComment || '');
  const [submissionLogs, setSubmissionLogs] = useState([]);

  // 送信開始時のターミナル診断ログ演出（添付HTMLを再現）
  useEffect(() => {
    if (isSubmitting) {
      setSubmissionLogs([]);
      const steps = [
        { title: "① 観測プロトコル暗号化", status: "ok", detail: `OBSERVER: ${formData.observerName || 'UNKNOWN'} / ID: 26__094` },
        { title: "② トークン同期（GET Nonce）", status: "ok", detail: "nonce_token: " + Math.random().toString(36).slice(2) + "..." },
        { title: "③ 観測ログ送信（POST / Sheet同期）", status: "ok", detail: `ROUTE: ${formData.primaryRoute} / SYNC: ${formData.syncRate}%` },
        { title: "④ 時空アーカイブ記録完了", status: "ok", detail: "STATUS: 200 OK - すべての観測データが正常に同期されました" }
      ];

      steps.forEach((step, index) => {
        setTimeout(() => {
          setSubmissionLogs(prev => [...prev, step]);
        }, (index + 1) * 350);
      });
    }
  }, [isSubmitting]);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateFormData({
      highlightScene,
      characterMsg,
      publicComment: publicComment || highlightScene || '素晴らしいイマーシブ体験でした！'
    });
    onSubmit();
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 animate-fadeIn">
      {/* 設問ヘッダー */}
      <div className="text-center mb-6">
        <span className="text-xs font-mono-code font-bold uppercase tracking-widest text-[#ff4a42] bg-[#b8352f]/20 px-2.5 py-1 rounded-sm border border-[#b8352f]/40">
          QUESTION 05 (FINAL)
        </span>
        <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-white mt-2">
          観測ログ最終記録（感想・手記）
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          あなたの記憶をテキストとしてアーカイブします。短文でも自由にご記入ください。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-slate-900/90 rounded-2xl classified-border p-6 mb-6 backdrop-blur-md">
        {/* ① 印象に残ったシーン */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 transition-all focus-within:border-[#ff4a42]/50">
          <label className="text-xs font-bold font-mono-code uppercase tracking-wider text-slate-200 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#ff4a42]" />
            最も心に残ったシーン・事件の瞬間
          </label>
          <textarea
            value={highlightScene}
            onChange={(e) => setHighlightScene(e.target.value)}
            placeholder="例: 討議室で七瀬と櫻井が出会った瞬間 / 研修室3のPCが起動した時 / 暗がりで物音がした瞬間 など"
            className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-[#b8352f] focus:bg-slate-950 focus:ring-2 focus:ring-[#b8352f]/20 rounded-lg p-3.5 text-xs sm:text-sm text-amber-50 placeholder:text-slate-500 font-medium transition-all outline-none min-h-[75px] leading-relaxed"
            style={{ fontFamily: 'var(--mincho)' }}
          />
        </div>

        {/* ② キャラクターへのメッセージ */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 transition-all focus-within:border-pink-500/50">
          <label className="text-xs font-bold font-mono-code uppercase tracking-wider text-slate-200 mb-1.5 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-pink-400" />
            追いかけたキャラクター・役者へのメッセージ（任意）
          </label>
          <textarea
            value={characterMsg}
            onChange={(e) => setCharacterMsg(e.target.value)}
            placeholder="例: 矢田のまっすぐな目に引き込まれました / 下山田の怪演が最高にリアルでした！"
            className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-pink-500 focus:bg-slate-950 focus:ring-2 focus:ring-pink-500/20 rounded-lg p-3.5 text-xs sm:text-sm text-amber-50 placeholder:text-slate-500 font-medium transition-all outline-none min-h-[65px] leading-relaxed"
            style={{ fontFamily: 'var(--mincho)' }}
          />
        </div>

        {/* ③ 集合知・時空掲示板に残すメッセージ */}
        <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800/80">
          <label className="text-xs font-bold font-mono-code uppercase tracking-wider text-slate-200 mb-1 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
            他の観測者へのひとこと（クロストーク掲示板に掲載）
          </label>
          <p className="text-[11.5px] text-slate-400 mb-2.5 leading-relaxed">
            回答後、他のルートを体験した参加者と共有されます。「あの時〇〇どうだった？」などの問いかけも大歓迎です！
          </p>
          <input
            type="text"
            value={publicComment}
            onChange={(e) => setPublicComment(e.target.value)}
            placeholder="例: 順路B通った人、鷺坂の最後の選択どうなったか教えてほしい！"
            className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-amber-50 placeholder:text-slate-500 outline-none font-medium"
            style={{ fontFamily: 'var(--mincho)' }}
          />
        </div>

        {/* 送信中ターミナルログ表示（添付HTMLのログボックスを再現） */}
        {isSubmitting && (
          <div className="bg-slate-950 text-slate-200 rounded-xl p-4 font-mono-code text-xs border border-slate-700 animate-fadeIn shadow-2xl">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400 text-[11px]">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Terminal className="w-3.5 h-3.5" /> ARCHIVE_TRANSMISSION
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <Loader2 className="w-3 h-3 animate-spin" /> 送信中…
              </span>
            </div>
            <div className="space-y-2">
              {submissionLogs.map((log, i) => (
                <div key={i} className="animate-fadeIn">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-bold">{log.title}</span>
                    <span className="text-emerald-400 font-bold">OK</span>
                  </div>
                  <pre className="text-[10px] text-slate-400 bg-slate-900 p-1.5 rounded mt-0.5 whitespace-pre-wrap break-all border border-slate-800">
                    {log.detail}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 送信ボタン */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#b8352f] hover:bg-[#a12e29] text-white font-bold py-3.5 px-6 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-[#b8352f]/20 hover:shadow-xl transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>データを時空アーカイブに同期中…</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>観測ログを送信 ＆ 戦歴レポートを発行する</span>
              </>
            )}
          </button>
        </div>
      </form>

      <div className="flex items-center justify-start">
        <button
          type="button"
          onClick={onPrev}
          disabled={isSubmitting}
          className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" /> 戻る
        </button>
      </div>
    </div>
  );
}
