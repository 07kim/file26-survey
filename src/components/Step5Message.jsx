import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, ArrowLeft, Heart, FileText, CheckCircle2, ShieldAlert, Terminal, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { generateObsCode, TOTAL_SCENES } from '../data/storyData';

export default function Step5Message({ formData, updateFormData, onSubmit, onPrev, isSubmitting }) {
  const [routeComment, setRouteComment] = useState(formData.routeComment || '');
  const [best, setBest] = useState(formData.best || formData.highlightScene || '');
  const [word, setWord] = useState(formData.word || '');
  const [improve, setImprove] = useState(formData.improve || '');
  const [msg, setMsg] = useState(formData.msg || formData.characterMsg || '');
  const [publicComment, setPublicComment] = useState(formData.publicComment || '');
  const [submissionLogs, setSubmissionLogs] = useState([]);

  // 送信開始時のターミナル診断ログ演出
  useEffect(() => {
    if (isSubmitting) {
      setSubmissionLogs([]);
      const code = generateObsCode(formData.loopTrack, formData.sceneCount);
      const steps = [
        { title: "① 観測プロトコル暗号化", status: "ok", detail: `OBSERVER: ${formData.observerName || 'UNKNOWN'} / CODE: ${code}` },
        { title: "② トークン同期（GET Nonce）", status: "ok", detail: "nonce_token: " + Math.random().toString(36).slice(2) + "..." },
        { title: "③ 観測ログ送信（POST / Sheet同期）", status: "ok", detail: `RATE: ${formData.sceneRate || 0}% / SYNC: ${formData.syncRate || 85}%` },
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
      routeComment,
      best,
      word,
      improve,
      msg,
      highlightScene: best,
      characterMsg: msg,
      publicComment: publicComment || word || best || '素晴らしいイマーシブ体験でした！'
    });
    onSubmit();
  };

  const rate = formData.sceneRate !== undefined ? formData.sceneRate : Math.round(((formData.scenes?.length || 0) / TOTAL_SCENES) * 100);
  const obsCode = generateObsCode(formData.loopTrack, formData.scenes?.length || 0);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 animate-fade-in text-left">
      {/* 設問ヘッダー */}
      <div className="text-center mb-6">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#ff716a] bg-[#b8352f]/20 px-3 py-1 rounded border border-[#b8352f]/40 shadow-sm">
          SECTION 05 ／ 自由記述 ＆ 提出確認
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
          観測ログ最終記録（感想・手記）
        </h2>
        <p className="text-sm sm:text-[15px] text-slate-300 mt-2 text-pretty-ja max-w-xl mx-auto leading-relaxed">
          あなたの記憶と言葉をアーカイブします。短文でも自由にご記入ください。
        </p>
      </div>

      {/* 📋 提出内容の確認プレビュー */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 mb-6 backdrop-blur-md shadow-xl">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            観測ログ概要プレビュー
          </span>
          <span className="text-xs font-mono font-bold text-[#ff716a] bg-[#b8352f]/20 px-2.5 py-0.5 rounded border border-[#b8352f]/40">
            {obsCode}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs sm:text-[13px]">
          <div>
            <span className="text-slate-400 block text-xs font-mono">観測者名</span>
            <span className="text-white font-bold">{formData.observerName || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-xs font-mono">立場 ＆ 順路</span>
            <span className="text-white font-bold">{formData.role || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-xs font-mono">観測率 ＆ 場面数</span>
            <span className="text-amber-400 font-bold">{rate}%（{formData.scenes?.length || 0} 場面）</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-slate-900/90 rounded-2xl border border-slate-800 p-6 mb-6 backdrop-blur-md">
        {/* ⓪ 観測ルート専用の感想・考察 */}
        {formData.loopTrack && (
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 transition-all focus-within:border-amber-500/50">
            <label className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200 mb-1.5 flex items-center gap-1.5">
              <span className="text-sm">🧭</span>
              選択ルートの体験感想・考察（任意）
            </label>
            <p className="text-xs text-slate-400 mb-2.5 leading-relaxed">あなたが選んだ追跡ルート（1〜3周目）ならではの展開や面白かったポイント</p>
            <textarea
              value={routeComment}
              onChange={(e) => setRouteComment(e.target.value)}
              placeholder="例: 1周目で矢田を追い、2周目で陣内側を見たことで事件の真相が立体的に理解できて鳥肌が立った、など"
              className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-lg p-3.5 text-xs sm:text-sm text-amber-50 placeholder:text-slate-500 transition-all outline-none min-h-[70px] font-medium leading-relaxed"
              style={{ fontFamily: 'var(--mincho)' }}
            />
          </div>
        )}

        {/* ① 最も心に残った場面・忘れられない瞬間 */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 transition-all focus-within:border-amber-500/50">
          <label className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#ff4a42]" />
            最も心に残った場面・忘れられない瞬間
          </label>
          <p className="text-xs text-slate-400 mb-2.5 leading-relaxed">あの部屋で何を見たか、どの瞬間に息を呑んだか、など</p>
          <textarea
            value={best}
            onChange={(e) => setBest(e.target.value)}
            placeholder="例: 討議室で七瀬と櫻井が出会った瞬間 / 研修室3のPCが起動した時 / 下山田の迫真の独白 など"
            className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-[#ff4a42] focus:ring-2 focus:ring-[#ff4a42]/20 rounded-lg p-3.5 text-xs sm:text-sm text-amber-50 placeholder:text-slate-500 transition-all outline-none min-h-[75px] font-medium leading-relaxed"
            style={{ fontFamily: 'var(--mincho)' }}
          />
        </div>

        {/* ② 体験直後、最初に出た言葉 */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 transition-all focus-within:border-amber-500/50">
          <label className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200 mb-1.5 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            体験直後、最初に出た言葉（ひとこと）
          </label>
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="例: 「ヤバかった」「もう1回最初から見たい」「鳥肌立った…」"
            className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 rounded-lg p-3 text-xs sm:text-sm text-amber-50 placeholder:text-slate-500 transition-all outline-none font-medium"
            style={{ fontFamily: 'var(--mincho)' }}
          />
        </div>

        {/* ③ もっと良くできたと思う点・改善要望 */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 transition-all focus-within:border-emerald-500/50">
          <label className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200 mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-emerald-400" />
            もっと良くできたと思う点・改善のご要望
          </label>
          <p className="text-xs text-slate-400 mb-2.5 leading-relaxed">順路の分かりやすさ、音響、ルール説明、空間構成など率直にお聞かせください</p>
          <textarea
            value={improve}
            onChange={(e) => setImprove(e.target.value)}
            placeholder="例: 順路の案内がもう少し分かりやすいと迷わなかった / 2階の物音の演出がもっと大きくても良かった など"
            className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg p-3.5 text-xs sm:text-sm text-white placeholder:text-slate-500 transition-all outline-none min-h-[65px] font-medium leading-relaxed"
          />
        </div>

        {/* ④ 演者・スタッフへのメッセージ */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 transition-all focus-within:border-pink-500/50">
          <label className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200 mb-1.5 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-pink-400" />
            演者・スタッフへのメッセージ（任意）
          </label>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="例: 矢田のまっすぐな目に引き込まれました！ / 下山田の怪演が最高にリアルでした！制作お疲れ様でした。"
            className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 rounded-lg p-3.5 text-xs sm:text-sm text-amber-50 placeholder:text-slate-500 transition-all outline-none min-h-[65px] font-medium leading-relaxed"
            style={{ fontFamily: 'var(--mincho)' }}
          />
        </div>

        {/* ⑤ クロストーク掲示板への掲載ひとこと */}
        <div className="bg-slate-950/90 rounded-xl p-4 border border-slate-800">
          <label className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200 mb-1 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
            他の観測者へのひとこと（クロストーク掲示板に掲載）
          </label>
          <p className="text-xs text-slate-300 mb-2 leading-relaxed">
            回答後、他のルートを体験した参加者と共有されます。「あの時〇〇どうだった？」などの問いかけも大歓迎です！
          </p>
          <input
            type="text"
            value={publicComment}
            onChange={(e) => setPublicComment(e.target.value)}
            placeholder="例: 順路B通った人、鷺坂の最後の選択どうなったか教えてほしい！"
            className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 rounded-lg px-3.5 py-3 text-xs sm:text-sm text-white placeholder:text-slate-400 outline-none font-medium"
          />
        </div>

        {/* 送信中ターミナルログ表示 */}
        {isSubmitting && (
          <div className="bg-slate-950 text-slate-200 rounded-xl p-4 font-mono text-xs border border-slate-700 animate-fade-in shadow-2xl">
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
                <div key={i} className="animate-fade-in">
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
                <span>観測ログを提出 ＆ 戦歴カードを発行する</span>
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
