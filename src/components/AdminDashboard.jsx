import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  Filter,
  Download,
  Eye,
  User,
  Heart,
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  FileText,
  Mail,
  Award,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  X,
  Database,
  HelpCircle,
  CheckCircle2,
  Users,
  MessageSquare,
  Clock,
  ThumbsUp,
  Sliders,
  Compass
} from 'lucide-react';
import { CAST_MEMBERS, OPTIONS, MATRIX, SCENES } from '../data/storyData';

const ADMIN_PASSCODES = ['640157'];

export default function AdminDashboard({ endpoint, onBackToTop }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('file26_admin_auth') === 'true';
  });
  const [passcode, setPasscode] = useState('');
  const [passError, setPassError] = useState(false);
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState('ALL');
  const [filterCast, setFilterCast] = useState('ALL');
  const [selectedResponse, setSelectedResponse] = useState(null);
  
  // 表示モード: 'summary' (質問別) | 'individual' (個別回答) | 'table' (一覧テーブル)
  const [activeTab, setActiveTab] = useState('summary');
  const [individualIndex, setIndividualIndex] = useState(0);
  const [globalChartType, setGlobalChartType] = useState('pie'); // 'pie' | 'bar'

  // パスコード認証
  const handleLogin = (e) => {
    e.preventDefault();
    if (ADMIN_PASSCODES.includes(passcode.trim())) {
      setIsAuthenticated(true);
      sessionStorage.setItem('file26_admin_auth', 'true');
      setPassError(false);
    } else {
      setPassError(true);
    }
  };

  // ログアウト
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('file26_admin_auth');
  };

  // GASから回答データ取得
  const fetchResponses = async () => {
    if (!endpoint) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${endpoint}?action=getResponses`);
      const json = await res.json();
      if (json && json.ok && Array.isArray(json.responses)) {
        setResponses(json.responses);
        setLastFetched(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn('GAS Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchResponses();
    }
  }, [isAuthenticated, endpoint]);

  // フィルタリング（テーブル・検索用）
  const filteredResponses = useMemo(() => {
    return responses.filter((r) => {
      const matchSearch =
        !searchQuery ||
        (r.obsCode && r.obsCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.name && r.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.realName && r.realName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.googleEmail && r.googleEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.best && r.best.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.word && r.word.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.msg && r.msg.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchGrade = filterGrade === 'ALL' || r.grade === filterGrade;
      const matchCast = filterCast === 'ALL' || r.favoriteCast === filterCast;

      return matchSearch && matchGrade && matchCast;
    });
  }, [responses, searchQuery, filterGrade, filterCast]);

  // 統計・集計計算
  const stats = useMemo(() => {
    const count = responses.length;
    if (count === 0) {
      return { count: 0, avgRate: 0, googleAuthRate: 0, topCast: 'なし', gradeDist: {}, favCastDist: {} };
    }

    let totalRate = 0;
    let googleCount = 0;
    const gradeDist = {};
    const favCastDist = {};

    responses.forEach((r) => {
      const rateNum = parseInt(String(r.sceneRate || '0').replace('%', ''), 10) || 0;
      totalRate += rateNum;
      if (r.googleEmail) googleCount++;

      const g = r.grade || '未回答';
      gradeDist[g] = (gradeDist[g] || 0) + 1;

      const f = r.favoriteCast || 'なし';
      favCastDist[f] = (favCastDist[f] || 0) + 1;
    });

    let topCast = 'なし';
    let maxCastCount = 0;
    Object.entries(favCastDist).forEach(([c, cnt]) => {
      if (cnt > maxCastCount && c !== 'なし') {
        maxCastCount = cnt;
        topCast = c;
      }
    });

    return {
      count,
      avgRate: Math.round(totalRate / count),
      googleAuthRate: Math.round((googleCount / count) * 100),
      topCast: `${topCast} (${maxCastCount}票)`,
      gradeDist,
      favCastDist
    };
  }, [responses]);

  // CSVエクスポート
  const handleExportCSV = () => {
    if (responses.length === 0) return;
    const headers = [
      'タイムスタンプ', '観測コード', 'ニックネーム', '実名', 'Googleメール', 'Google表示名',
      '学年', '来場区分', '事前配布物', '1周目', '2周目', '3周目', '選択ルート感想・考察', '観測シーン数', '観測率', '推しキャスト',
      '🔒 Q15 感想（非公開）', '🌐 Q16 公開用感想タイトル', '🌐 Q16 公開用全体感想(自由記述)', '🌐 Q17 忘れられない場面セリフ', '🔒 Q18 改善点要望'
    ];


    const rows = responses.map((r) => [
      `"${r.timestamp || ''}"`,
      `"${r.obsCode || ''}"`,
      `"${r.name || ''}"`,
      `"${r.realName || ''}"`,
      `"${r.googleEmail || ''}"`,
      `"${r.googleName || ''}"`,
      `"${r.grade || ''}"`,
      `"${r.role || ''}"`,
      `"${r.prep || ''}"`,
      `"${r.loop1 || ''}"`,
      `"${r.loop2 || ''}"`,
      `"${r.loop3 || ''}"`,
      `"${(r.routeComment || '').replace(/"/g, '""')}"`,
      `"${r.sceneCount || ''}"`,
      `"${r.sceneRate || ''}"`,
      `"${r.favoriteCast || ''}"`,
      `"${r.overall || ''}"`,
      `"${r.length || ''}"`,
      `"${r.again || ''}"`,
      `"${r.futureRoles || ''}"`,
      `"${(r.privateImpressions || '').replace(/"/g, '""')}"`,
      `"${(r.word || '').replace(/"/g, '""')}"`,
      `"${(r.impressions || '').replace(/"/g, '""')}"`,
      `"${(r.best || '').replace(/"/g, '""')}"`,
      `"${(r.improve || '').replace(/"/g, '""')}"`,
      `"${(r.msg || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `File26__094_Survey_Responses_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── パスコードロック画面 ──
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl max-w-md w-full p-8 text-center shadow-2xl text-slate-100 animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-[#b8352f]/20 border border-[#b8352f]/40 flex items-center justify-center mx-auto mb-4 text-[#ff716a] shadow-[0_0_20px_rgba(184,53,47,0.3)]">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight mb-1">
            File:26__094 管理者コンソール
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            観測者アンケート・時空通信の全データを閲覧するにはアクセスキーを入力してください。
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="アクセスキーを入力"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-center tracking-widest text-white placeholder-slate-500 focus:outline-none focus:border-[#ff716a]"
                autoFocus
              />
              {passError && (
                <p className="text-[11px] text-rose-400 font-bold mt-2">
                  キーが正しくありません。
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-[#b8352f] to-[#7c3aed] text-white shadow-lg hover:brightness-110 transition-all cursor-pointer"
            >
              管理者ログイン
            </button>
          </form>

          {onBackToTop && (
            <button
              type="button"
              onClick={onBackToTop}
              className="mt-6 text-xs text-slate-500 hover:text-slate-300 underline cursor-pointer"
            >
              トップへ戻る
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentIndividual = responses[individualIndex] || null;

  return (
    <div className="max-w-7xl mx-auto py-5 px-3 sm:px-6 text-left animate-fadeIn">
      {/* ── 最上部ヘッダー ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#ff716a] bg-[#b8352f]/15 px-2.5 py-0.5 rounded border border-[#b8352f]/40">
              ADMINISTRATIVE CONSOLE
            </span>
            <span className="text-xs text-slate-400 font-mono">FILE:26__094 DB</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>観測ログ ＆ 全アンケート回答閲覧システム</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            スプレッドシートと完全同期。Googleフォームのように全ての回答・質問・個別のログを確認できます。
          </p>
        </div>

        {/* コントロールボタン */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={fetchResponses}
            disabled={isLoading}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isLoading ? '更新中…' : '最新データを取得'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={responses.length === 0}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-950/30"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV出力</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="text-xs font-bold text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/40 bg-slate-900 px-3 py-2 rounded-lg transition-all cursor-pointer"
          >
            ログアウト
          </button>
        </div>
      </div>

      {/* 📊 KPI サマリーカード */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-5">
        <div className="bg-[#0d121f] border border-slate-800 rounded-xl p-3.5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold">総回答数</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {stats.count} <span className="text-xs font-normal text-slate-400">名</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {lastFetched ? `最終同期: ${lastFetched}` : 'スプレッドシート連携'}
          </div>
        </div>

        <div className="bg-[#0d121f] border border-slate-800 rounded-xl p-3.5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold">平均観測網羅率</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-400 font-mono">
            {stats.avgRate}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">全10シーン基準</div>
        </div>

        <div className="bg-[#0d121f] border border-slate-800 rounded-xl p-3.5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold">Google認証率</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {stats.googleAuthRate}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">本人特定完了</div>
        </div>

        <div className="bg-[#0d121f] border border-slate-800 rounded-xl p-3.5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold">最多推しキャスト</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-base font-black text-white truncate">
            {stats.topCast}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">推しランキング1位</div>
        </div>
      </div>

      {/* ── 📑 Googleフォーム形式 モード切り替えタブ ── */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl mb-6 sticky top-14 z-30 backdrop-blur-md shadow-md">
        <div className="flex items-center gap-1 sm:gap-2 flex-1">
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'summary'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>📊 質問別サマリー ({responses.length}件)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('individual')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'individual'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>👤 個別回答モード</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'table'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>📑 一覧テーブル</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          1. 📊 質問別サマリーモード（Googleフォーム質問別集計＆全回答一覧）
         ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {responses.length === 0 ? (
            <div className="bg-[#0d121f] border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              {isLoading ? 'スプレッドシートからデータを読み込み中…' : '回答データがまだありません'}
            </div>
          ) : (
            <>
              {/* グラフ一括切り替えツールバー */}
              <div className="bg-[#0d121f] border border-slate-800 rounded-xl p-3 flex items-center justify-between shadow-sm">
                <div className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                  <span>📈 グラフ表示形式の一括切り替え:</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setGlobalChartType('pie')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      globalChartType === 'pie'
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🥧 円グラフ（パイ）</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGlobalChartType('bar')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      globalChartType === 'bar'
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>📊 棒グラフ（バー）</span>
                  </button>
                </div>
              </div>

              {/* Q01: 来場区分 */}
              <QuestionSummaryBlock
                qNo="Q01"
                title="本公演へのご来場区分"
                type="choice"
                data={responses}
                dataKey="role"
                options={OPTIONS.role}
                initialChartType={globalChartType}
              />

              {/* Q02: 氏名（実名） */}
              <QuestionSummaryBlock
                qNo="Q02"
                title="氏名（お名前）"
                type="text"
                data={responses}
                dataKey="realName"
                subKey="name"
              />

              {/* Q03: 学年・所属 */}
              <QuestionSummaryBlock
                qNo="Q03"
                title="学年・所属"
                type="choice"
                data={responses}
                dataKey="grade"
                options={OPTIONS.grade}
                initialChartType={globalChartType}
              />

              {/* Q04: 事前配布物 */}
              <QuestionSummaryBlock
                qNo="Q04"
                title="事前の配布物（あらすじ・相関図）の閲覧状況"
                type="choice"
                data={responses}
                dataKey="prep"
                options={OPTIONS.prep}
                initialChartType={globalChartType}
              />

              {/* Q05: 1周目追跡対象 */}
              <QuestionSummaryBlock
                qNo="Q05"
                title="1周目、いちばん長く追いかけた人"
                type="choice"
                data={responses}
                dataKey="loop1"
                castMode={true}
                initialChartType={globalChartType}
              />

              {/* Q06: 2周目追跡対象 */}
              <QuestionSummaryBlock
                qNo="Q06"
                title="2周目、いちばん長く追いかけた人"
                type="choice"
                data={responses}
                dataKey="loop2"
                castMode={true}
                initialChartType={globalChartType}
              />

              {/* Q07: 3周目追跡対象 */}
              <QuestionSummaryBlock
                qNo="Q07"
                title="3周目、いちばん長く追いかけた人"
                type="choice"
                data={responses}
                dataKey="loop3"
                castMode={true}
                initialChartType={globalChartType}
              />

              {/* Q08: 観測できた場面 */}
              <QuestionSummaryBlock
                qNo="Q08"
                title="観測できた場面・シーン（複数選択）"
                type="scenes"
                data={responses}
              />

              {/* Q10: 観測強度 */}
              <QuestionSummaryBlock
                qNo="Q10"
                title="観測強度（100点満点スライダー）"
                type="slider"
                data={responses}
                dataKey="overall"
              />

              {/* Q12: 体験時間について */}
              <QuestionSummaryBlock
                qNo="Q12"
                title="体験時間について"
                type="choice"
                data={responses}
                dataKey="length"
                options={OPTIONS.length}
                initialChartType={globalChartType}
              />

              {/* Q13: 次回の参加意向 */}
              <QuestionSummaryBlock
                qNo="Q13"
                title="次回の参加意向"
                type="choice"
                data={responses}
                dataKey="again"
                options={OPTIONS.again}
                initialChartType={globalChartType}
              />

              {/* Q14: 次回希望役割 */}
              <QuestionSummaryBlock
                qNo="Q14"
                title="次回公演での希望役割（複数選択）"
                type="futureRoles"
                data={responses}
              />

              {/* Q15: 感想のひとこと（タイトル） */}
              <QuestionSummaryBlock
                qNo="Q15"
                title="感想のひとこと（タイトル）"
                type="text"
                data={responses}
                dataKey="word"
                color="indigo"
              />

              {/* Q16: 全体の感想（自由記述） */}
              <QuestionSummaryBlock
                qNo="Q16"
                title="全体の感想（自由記述）"
                type="text"
                data={responses}
                dataKey="impressions"
                color="amber"
              />

              {/* 選択ルートの感想・考察（任意） */}
              <QuestionSummaryBlock
                qNo="S03"
                title="選択ルートの体験感想・考察（任意）"
                type="text"
                data={responses}
                dataKey="routeComment"
                color="amber"
              />

              {/* Q17: いちばん忘れられない場面・セリフ */}
              <QuestionSummaryBlock
                qNo="Q17"
                title="いちばん忘れられない場面・セリフ"
                type="text"
                data={responses}
                dataKey="best"
                color="sky"
              />

              {/* Q18: もっとこうしてほしかったこと */}
              <QuestionSummaryBlock
                qNo="Q18"
                title="もっとこうしてほしかったこと（改善点・要望）"
                type="text"
                data={responses}
                dataKey="improve"
                color="slate"
              />

              {/* Q19: 推しキャスト */}
              <QuestionSummaryBlock
                qNo="Q19"
                title="最も心惹かれた人物（推しキャラ）"
                type="choice"
                data={responses}
                dataKey="favoriteCast"
                castMode={true}
                initialChartType={globalChartType}
              />

              {/* Q20: キャスト別個別メッセージ */}
              <QuestionSummaryBlock
                qNo="Q20"
                title="各キャラクターへのメッセージ・観測手記"
                type="characterComments"
                data={responses}
              />

              {/* Q21: 運営・キャストへの非公開メッセージ */}
              <QuestionSummaryBlock
                qNo="Q21"
                title="運営・キャストへの非公開メッセージ"
                type="text"
                data={responses}
                dataKey="msg"
                color="emerald"
              />
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          2. 👤 個別回答モード（Googleフォーム個別回答ページャー）
         ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'individual' && (
        <div className="space-y-4 max-w-4xl mx-auto">
          {responses.length === 0 ? (
            <div className="bg-[#0d121f] border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              回答データがありません
            </div>
          ) : currentIndividual ? (
            <div className="space-y-4">
              {/* ページネーションコントロールバー */}
              <div className="bg-[#0d121f] border border-slate-800 rounded-2xl p-3 sm:p-4 flex items-center justify-between shadow-lg">
                <button
                  type="button"
                  onClick={() => setIndividualIndex((prev) => Math.max(0, prev - 1))}
                  disabled={individualIndex === 0}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>前の回答</span>
                </button>

                <div className="text-center">
                  <div className="text-sm font-black text-white font-mono">
                    回答 {individualIndex + 1} / {responses.length}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    提出日時: {currentIndividual.timestamp || '不明'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIndividualIndex((prev) => Math.min(responses.length - 1, prev + 1))}
                  disabled={individualIndex === responses.length - 1}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>次の回答</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* 個別回答用紙 */}
              <div className="bg-[#0d121f] border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
                {/* 観測者基本データカード */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-emerald-400 text-xs bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                        {currentIndividual.obsCode}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">
                        {currentIndividual.role || '参加者'} ｜ {currentIndividual.grade || '未回答'}
                      </span>
                    </div>
                    <h2 className="text-lg font-black text-white">
                      {currentIndividual.name || '名無しの観測者'}
                      {currentIndividual.realName && (
                        <span className="text-xs font-normal text-slate-400 ml-2">
                          （氏名: {currentIndividual.realName}）
                        </span>
                      )}
                    </h2>
                  </div>

                  {currentIndividual.googleEmail ? (
                    <div className="bg-slate-950 border border-emerald-500/40 px-3 py-2 rounded-xl flex items-center gap-2 text-xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-bold text-white font-mono">{currentIndividual.googleEmail}</div>
                        <div className="text-[10px] text-slate-400">Google認証済み観測者</div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                      Google未連携
                    </span>
                  )}
                </div>

                {/* 各質問と回答の一覧 */}
                <div className="space-y-4">
                  <IndividualItem label="Q01. ご来場区分" value={currentIndividual.role} />
                  <IndividualItem label="Q02. 氏名（お名前）" value={currentIndividual.realName} />
                  <IndividualItem label="Q03. 学年・所属" value={currentIndividual.grade} />
                  <IndividualItem label="Q04. 事前の配布物" value={currentIndividual.prep} />
                  <IndividualItem
                    label="Q05. 1周目の追跡人物"
                    value={
                      currentIndividual.loop1
                        ? `${currentIndividual.loop1} ${
                            currentIndividual.loop1Seen?.length
                              ? `（目撃: ${currentIndividual.loop1Seen.join(', ')}）`
                              : ''
                          }`
                        : '-'
                    }
                  />
                  <IndividualItem
                    label="Q06. 2周目の追跡人物"
                    value={
                      currentIndividual.loop2
                        ? `${currentIndividual.loop2} ${
                            currentIndividual.loop2Seen?.length
                              ? `（目撃: ${currentIndividual.loop2Seen.join(', ')}）`
                              : ''
                          }`
                        : '-'
                    }
                  />
                  <IndividualItem
                    label="Q07. 3周目の追跡人物"
                    value={
                      currentIndividual.loop3
                        ? `${currentIndividual.loop3} ${
                            currentIndividual.loop3Seen?.length
                              ? `（目撃: ${currentIndividual.loop3Seen.join(', ')}）`
                              : ''
                          }`
                        : '-'
                    }
                  />
                  <IndividualItem
                    label="Q08. 観測できた場面"
                    value={
                      Array.isArray(currentIndividual.scenes)
                        ? `${currentIndividual.scenes.length} 場面観測（${currentIndividual.sceneRate || '0%'}）`
                        : currentIndividual.scenes || '-'
                    }
                  />
                  <IndividualItem label="Q09. 心残りシーン" value={currentIndividual.missed || 'なし'} />
                  <IndividualItem
                    label="Q10. 観測強度"
                    value={`${currentIndividual.overall || 50} / 100`}
                  />
                  <IndividualItem label="Q12. 体験時間について" value={currentIndividual.length} />
                  <IndividualItem label="Q13. 次回の参加意向" value={currentIndividual.again} />
                  <IndividualItem label="Q14. 次回希望役割" value={currentIndividual.futureRoles} />
                  <IndividualItem
                    label="Q15. 感想のひとこと（タイトル）"
                    value={currentIndividual.word}
                    highlight="indigo"
                  />
                  <IndividualItem
                    label="Q16. 全体の感想（自由記述）"
                    value={currentIndividual.impressions || currentIndividual.routeComment}
                    highlight="amber"
                  />
                  <IndividualItem
                    label="S3. 選択ルート感想・考察"
                    value={currentIndividual.routeComment}
                    highlight="amber"
                  />
                  <IndividualItem
                    label="Q17. いちばん忘れられない場面・セリフ"
                    value={currentIndividual.best}
                    highlight="sky"
                  />
                  <IndividualItem
                    label="Q18. もっとこうしてほしかったこと（改善点）"
                    value={currentIndividual.improve}
                    highlight="slate"
                  />
                  <IndividualItem
                    label="Q19. 最も心惹かれた人物（推しキャラ）"
                    value={currentIndividual.favoriteCast}
                    highlight="rose"
                  />

                  {/* Q20: キャスト別メッセージ */}
                  {currentIndividual.characterComments &&
                    Object.keys(currentIndividual.characterComments).length > 0 && (
                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="text-xs font-bold text-rose-400">
                          Q20. キャスト個別へのメッセージ・手記:
                        </div>
                        <div className="space-y-2">
                          {Object.entries(currentIndividual.characterComments).map(([cid, val]) => {
                            const c = CAST_MEMBERS.find((x) => x.id === cid);
                            const isPriv = typeof val === 'object' && val !== null ? !!val.isPrivate : false;
                            const txt = typeof val === 'object' && val !== null ? val.text : String(val || '');
                            return (
                              <div key={cid} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                                <div className="flex items-center justify-between text-[11px] font-bold text-white mb-0.5">
                                  <span>{c ? c.name : cid}:</span>
                                  {isPriv ? (
                                    <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.5 rounded">🔒 非公開</span>
                                  ) : (
                                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">🌐 公開</span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-300 whitespace-pre-wrap">{txt}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  <IndividualItem
                    label="Q21. 運営・キャストへの非公開メッセージ"
                    value={currentIndividual.msg}
                    highlight="emerald"
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          3. 📑 回答一覧テーブルモード
         ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'table' && (
        <div className="space-y-4">
          {/* 検索・フィルターバー */}
          <div className="bg-[#0d121f] border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="観測コード、名前、手記を検索…"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 outline-none"
              >
                <option value="ALL">学年: すべて</option>
                <option value="1年">1年</option>
                <option value="2年">2年</option>
                <option value="3年">3年</option>
                <option value="4年">4年</option>
                <option value="大学院生">大学院生</option>
                <option value="教職員">教職員</option>
                <option value="学外一般">学外一般</option>
              </select>

              <select
                value={filterCast}
                onChange={(e) => setFilterCast(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 outline-none max-w-[140px] truncate"
              >
                <option value="ALL">推し: すべて</option>
                {CAST_MEMBERS.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* テーブル本体 */}
          <div className="bg-[#0d121f] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3.5">観測コード</th>
                    <th className="py-3 px-3.5">観測者名 / 実名</th>
                    <th className="py-3 px-3.5">Google認証</th>
                    <th className="py-3 px-3.5">学年</th>
                    <th className="py-3 px-3.5">ルート周回 (1/2/3)</th>
                    <th className="py-3 px-3.5">網羅率</th>
                    <th className="py-3 px-3.5">推しキャスト</th>
                    <th className="py-3 px-3.5">手記抜粋</th>
                    <th className="py-3 px-3.5 text-center">詳細</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredResponses.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-slate-500">
                        該当する回答データがありません
                      </td>
                    </tr>
                  ) : (
                    filteredResponses.map((r, i) => (
                      <tr
                        key={i}
                        onClick={() => setSelectedResponse(r)}
                        className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-3.5 font-mono font-bold text-emerald-400 whitespace-nowrap">
                          {r.obsCode || 'OBS-XXX'}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="font-bold text-white">{r.name || '名無し'}</div>
                          {r.realName && (
                            <div className="text-[10px] text-slate-500">（{r.realName}）</div>
                          )}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          {r.googleEmail ? (
                            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                              <ShieldCheck className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[120px]">{r.googleEmail}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-600">未連携</span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap text-slate-400">
                          {r.grade || '未回答'}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap font-mono text-[11px] text-slate-300">
                          {r.loop1 ? `${r.loop1.split(' ')[0]} → ${r.loop2 ? r.loop2.split(' ')[0] : '-'} → ${r.loop3 ? r.loop3.split(' ')[0] : '-'}` : '-'}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span className="font-bold text-sky-400 font-mono">{r.sceneRate || '0%'}</span>
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap font-bold text-rose-300">
                          {r.favoriteCast || 'なし'}
                        </td>
                        <td className="py-3 px-3.5 max-w-[200px] truncate text-slate-400">
                          {r.best || r.msg || '-'}
                        </td>
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedResponse(r);
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-1.5 rounded-md transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 詳細モーダル ── */}
      {selectedResponse && (
        <div
          onClick={() => setSelectedResponse(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#101726] border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 text-left shadow-2xl text-slate-100"
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-emerald-400 text-sm bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                    ID: {selectedResponse.obsCode}
                  </span>
                  <span className="text-xs text-slate-400">{selectedResponse.timestamp}</span>
                </div>
                <h3 className="text-lg font-black text-white">
                  {selectedResponse.name || '名無しの観測者'}
                  {selectedResponse.realName && (
                    <span className="text-xs font-normal text-slate-400 ml-2">（実名: {selectedResponse.realName}）</span>
                  )}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedResponse(null)}
                className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <IndividualItem label="Google認証" value={selectedResponse.googleEmail || '未認証'} />
              <IndividualItem label="来場区分" value={selectedResponse.role} />
              <IndividualItem label="学年" value={selectedResponse.grade} />
              <IndividualItem label="事前配布物" value={selectedResponse.prep} />
              <IndividualItem label="1周目ルート" value={selectedResponse.loop1} />
              <IndividualItem label="2周目ルート" value={selectedResponse.loop2} />
              <IndividualItem label="3周目ルート" value={selectedResponse.loop3} />
              <IndividualItem label="🔒 Q15 感想（非公開・運営宛）" value={selectedResponse.msg || selectedResponse.privateImpressions} highlight="rose" />
              <IndividualItem label="🌐 Q16 公開用感想（タイトル）" value={selectedResponse.word} highlight="indigo" />
              <IndividualItem label="🌐 Q16 公開用感想（自由記述）" value={selectedResponse.impressions} highlight="amber" />
              <IndividualItem label="🌐 Q17 いちばん忘れられない場面・セリフ" value={selectedResponse.best} highlight="sky" />
              <IndividualItem label="🔒 Q18 改善点・要望" value={selectedResponse.improve} highlight="slate" />
              <IndividualItem label="★ Q19 最も心惹かれた人物（推し）" value={selectedResponse.favoriteCast} highlight="rose" />
              <IndividualItem label="🧭 選択ルート感想・考察" value={selectedResponse.routeComment} highlight="teal" />
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-right">
              <button
                type="button"
                onClick={() => setSelectedResponse(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2 px-4 rounded-lg cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// グラフ用カラーパレット
const CHART_COLORS = [
  '#38bdf8', // sky-400
  '#34d399', // emerald-400
  '#fbbf24', // amber-400
  '#f43f5e', // rose-500
  '#a855f7', // purple-500
  '#6366f1', // indigo-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#10b981', // emerald-500
  '#8b5cf6', // violet-500
  '#94a3b8'  // slate-400
];

// ── 質問別集計＆全回答一覧コンポーネント（Googleフォーム風） ──
function QuestionSummaryBlock({
  qNo,
  title,
  type,
  data,
  dataKey,
  subKey,
  options,
  castMode,
  initialChartType = 'pie',
  color = 'slate'
}) {
  const [chartMode, setChartMode] = useState(initialChartType);

  // globalChartType が変わったときに追従
  useEffect(() => {
    setChartMode(initialChartType);
  }, [initialChartType]);

  // 選択肢集計の算出
  const summary = useMemo(() => {
    if (type === 'choice') {
      const counts = {};
      const total = data.length || 1;

      data.forEach((item) => {
        let val = item[dataKey];
        if (castMode && val) {
          val = val.split(' ')[0]; // 苗字抽出
        }
        val = val || '未回答';
        counts[val] = (counts[val] || 0) + 1;
      });

      return { counts, total };
    }
    return null;
  }, [data, dataKey, type, castMode]);

  // 自由記述回答の抽出
  const textAnswers = useMemo(() => {
    if (type === 'text') {
      return data
        .map((d) => {
          let text = d[dataKey];
          if (dataKey === 'impressions' && (!text || text.trim() === '')) {
            text = d.routeComment;
          }
          return {
            text: text,
            author: d.name || d.realName || '匿名観測者',
            realName: d.realName,
            grade: d.grade,
            obsCode: d.obsCode,
            googleEmail: d.googleEmail,
            time: d.timestamp
          };
        })
        .filter((d) => d.text && d.text.trim() !== '');
    }
    return [];
  }, [data, dataKey, type]);

  return (
    <div className="bg-[#0d121f] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 animate-fadeIn">
      {/* 設問ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-400/30">
            {qNo}
          </span>
          <h3 className="text-sm sm:text-base font-black text-white">{title}</h3>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-xs font-mono text-slate-400 font-bold">
            {type === 'text' ? `${textAnswers.length} 件の回答` : `${data.length} 件の回答`}
          </span>

          {/* グラフ切り替えトグル（選択式の場合のみ） */}
          {type === 'choice' && summary && (
            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setChartMode('pie')}
                title="円グラフで表示"
                className={`p-1.5 rounded-md text-xs transition-all cursor-pointer ${
                  chartMode === 'pie'
                    ? 'bg-sky-500 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <span className="text-[11px] font-bold px-1">🥧 円</span>
              </button>
              <button
                type="button"
                onClick={() => setChartMode('bar')}
                title="棒グラフで表示"
                className={`p-1.5 rounded-md text-xs transition-all cursor-pointer ${
                  chartMode === 'bar'
                    ? 'bg-sky-500 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <span className="text-[11px] font-bold px-1">📊 棒</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 選択肢別グラフ集計（円グラフ or 棒グラフ） */}
      {type === 'choice' && summary && (
        <div className="pt-2">
          {chartMode === 'pie' ? (
            /* 🥧 円グラフ（ドーナツチャート ＋ 凡例） */
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 py-2">
              {/* SVG ドーナツ */}
              <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {(() => {
                    const sortedEntries = Object.entries(summary.counts).sort((a, b) => b[1] - a[1]);
                    const radius = 38;
                    const circumference = 2 * Math.PI * radius;
                    let accumulatedOffset = 0;

                    return sortedEntries.map(([opt, count], i) => {
                      const strokeDasharray = `${(count / summary.total) * circumference} ${circumference}`;
                      const strokeDashoffset = -accumulatedOffset;
                      accumulatedOffset += (count / summary.total) * circumference;
                      const color = CHART_COLORS[i % CHART_COLORS.length];

                      return (
                        <circle
                          key={opt}
                          cx="50"
                          cy="50"
                          r={radius}
                          fill="transparent"
                          stroke={color}
                          strokeWidth="18"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-500 hover:opacity-80"
                        />
                      );
                    });
                  })()}
                </svg>
                {/* ドーナツ中央サマリー */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-black text-white font-mono">{summary.total}</span>
                  <span className="text-[10px] text-slate-400 font-bold">総回答</span>
                </div>
              </div>

              {/* 凡例リスト */}
              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(summary.counts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([opt, count], i) => {
                    const pct = Math.round((count / summary.total) * 100);
                    const color = CHART_COLORS[i % CHART_COLORS.length];
                    return (
                      <div
                        key={opt}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-bold text-slate-200 truncate">{opt}</span>
                        </div>
                        <div className="font-mono text-xs shrink-0 flex items-center gap-1.5">
                          <span className="font-bold text-white">{count}票</span>
                          <span className="text-slate-400 text-[11px]">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            /* 📊 棒グラフ（プログレスバー） */
            <div className="space-y-3">
              {Object.entries(summary.counts)
                .sort((a, b) => b[1] - a[1])
                .map(([opt, count], i) => {
                  const pct = Math.round((count / summary.total) * 100);
                  const color = CHART_COLORS[i % CHART_COLORS.length];
                  return (
                    <div key={opt} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                          <span>{opt}</span>
                        </span>
                        <span className="font-mono" style={{ color }}>
                          {count} 票 ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* 自由記述回答の全一覧（Googleフォーム風カードリスト） */}
      {type === 'text' && (
        <div className="space-y-2.5 pt-1 max-h-96 overflow-y-auto pr-1">
          {textAnswers.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">記述された回答はありません</div>
          ) : (
            textAnswers.map((ans, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white">{ans.author}</span>
                    {ans.realName && ans.realName !== ans.author && (
                      <span className="text-slate-500">（{ans.realName}）</span>
                    )}
                    {ans.grade && <span className="text-slate-500">[{ans.grade}]</span>}
                    {ans.googleEmail && (
                      <ShieldCheck className="w-3 h-3 text-emerald-400" title={ans.googleEmail} />
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">{ans.obsCode}</span>
                </div>
                <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-serif">
                  {ans.text}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 観測強度スライダー集計 */}
      {type === 'slider' && (
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: '平均点', val: Math.round(data.reduce((acc, d) => acc + (Number(d[dataKey]) || 50), 0) / (data.length || 1)) + ' 点' },
              { label: '最高点', val: Math.max(...data.map(d => Number(d[dataKey]) || 0)) + ' 点' },
              { label: '最低点', val: Math.min(...data.map(d => Number(d[dataKey]) || 0)) + ' 点' },
              { label: '80点以上の割合', val: Math.round((data.filter(d => (Number(d[dataKey]) || 0) >= 80).length / (data.length || 1)) * 100) + ' %' }
            ].map((st, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-bold mb-0.5">{st.label}</div>
                <div className="text-lg font-black text-sky-400 font-mono">{st.val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* キャスト別個別手記 */}
      {type === 'characterComments' && (
        <div className="space-y-3 pt-1 max-h-96 overflow-y-auto pr-1">
          {(() => {
            const allComments = [];
            data.forEach((d) => {
              if (d.characterComments && typeof d.characterComments === 'object') {
                Object.entries(d.characterComments).forEach(([cid, val]) => {
                  const isPriv = typeof val === 'object' && val !== null ? !!val.isPrivate : false;
                  const txt = (typeof val === 'object' && val !== null ? val.text : String(val || '')).trim();
                  if (txt) {
                    const c = CAST_MEMBERS.find((x) => x.id === cid);
                    allComments.push({
                      castName: c ? c.name : cid,
                      castAvatar: c?.avatar,
                      text: txt,
                      isPrivate: isPriv,
                      author: d.name || d.realName || '観測者',
                      obsCode: d.obsCode
                    });
                  }
                });
              }
            });

            if (allComments.length === 0) {
              return <div className="text-center py-6 text-slate-500 text-xs">キャスト別の手記はありません</div>;
            }

            return allComments.map((cm, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-rose-300">
                    {cm.castAvatar && <img src={cm.castAvatar} className="w-4 h-4 rounded-full object-cover" />}
                    <span>【{cm.castName}】へ</span>
                    {cm.isPrivate ? (
                      <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.2 rounded">🔒 非公開</span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 rounded">🌐 公開</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">by {cm.author} ({cm.obsCode})</span>
                </div>
                <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{cm.text}</div>
              </div>
            ));
          })()}
        </div>
      )}

      {/* 希望役割集計 */}
      {type === 'futureRoles' && (
        <div className="space-y-2 pt-1">
          {(() => {
            const roleCounts = {};
            data.forEach((d) => {
              const str = d.futureRoles || '';
              str.split(',').forEach((r) => {
                const tr = r.trim();
                if (tr) roleCounts[tr] = (roleCounts[tr] || 0) + 1;
              });
            });

            return Object.entries(roleCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([role, cnt], i) => {
                const pct = Math.round((cnt / (data.length || 1)) * 100);
                const color = CHART_COLORS[i % CHART_COLORS.length];
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        <span>{role}</span>
                      </span>
                      <span className="font-mono" style={{ color }}>{cnt} 票 ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              });
          })()}
        </div>
      )}

      {/* 観測シーン集計 */}
      {type === 'scenes' && (
        <div className="space-y-2 pt-1">
          <div className="text-xs text-slate-400 mb-2">全観測者の総観測シーン割合:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
            {SCENES.flatMap((g) => g.items).map((sc, i) => {
              const matchedCount = data.filter((d) => {
                if (Array.isArray(d.scenes)) return d.scenes.includes(sc.id);
                if (typeof d.scenes === 'string') return d.scenes.includes(sc.id);
                return false;
              }).length;
              const pct = Math.round((matchedCount / (data.length || 1)) * 100);
              const color = CHART_COLORS[i % CHART_COLORS.length];

              return (
                <div key={sc.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-white">
                    <span className="truncate">{sc.title}</span>
                    <span className="font-mono shrink-0 ml-1" style={{ color }}>{matchedCount}票 ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 個別項目レンダリング ──
function IndividualItem({ label, value, highlight }) {
  if (!value && value !== 0) {
    value = '—';
  }

  const highlightClass =
    highlight === 'amber'
      ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
      : highlight === 'indigo'
      ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-200'
      : highlight === 'emerald'
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
      : highlight === 'rose'
      ? 'border-rose-500/40 bg-rose-500/10 text-rose-200 font-bold'
      : 'border-slate-800 bg-slate-900/70 text-slate-200';

  return (
    <div className={`p-3.5 rounded-xl border space-y-1 ${highlightClass}`}>
      <div className="text-[11px] font-bold text-slate-400">{label}</div>
      <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{String(value)}</div>
    </div>
  );
}
