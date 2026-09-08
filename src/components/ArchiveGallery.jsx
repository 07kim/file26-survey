import React, { useState, useEffect, useMemo } from 'react';
import { CAST_MEMBERS, calculateTitle, TOTAL_SCENES } from '../data/storyData';
import { sheetApi } from '../services/sheetApi';
import ResultCard from './ResultCard';
import {
  Filter,
  Search,
  Award,
  Heart,
  Eye,
  Layers,
  ArrowRight,
  X,
  Share2,
  CheckCircle2,
  Zap,
  Sparkles,
  User,
  Compass,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

const findCastIdByName = (nameStr) => {
  if (!nameStr) return '';
  const c = CAST_MEMBERS.find(x => 
    nameStr.includes(x.name.split(' ')[0]) || 
    nameStr.includes(x.lastName || x.name) || 
    x.id === nameStr
  );
  return c ? c.id : nameStr;
};

const mapResponseToCardData = (res, idx) => {
  const l1 = findCastIdByName(res.loop1) || res.loop1 || 'sakurai';
  const l2 = findCastIdByName(res.loop2) || res.loop2 || 'jinnai';
  const l3 = findCastIdByName(res.loop3) || res.loop3 || 'yada';
  const fav = findCastIdByName(res.favoriteCast) || res.favoriteCast || l1;

  const scenesList = Array.isArray(res.scenes)
    ? res.scenes
    : (res.scenes ? res.scenes.toString().split(',').filter(Boolean) : []);

  const sceneCount = scenesList.length || Number(res.sceneCount) || 4;
  const syncRate = Number(res.overall) || Number(res.syncRate) || 85;

  return {
    id: res.obsCode || `sheet-res-${idx}`,
    obsCode: res.obsCode || `OBS-${idx + 1}`,
    observerName: res.name || res.observerName || '観測者',
    grade: res.grade || 'その他',
    role: res.role || '観測者',
    loopTrack: { loop1: l1, loop2: l2, loop3: l3 },
    loop1Seen: Array.isArray(res.loop1Seen) ? res.loop1Seen.map(findCastIdByName).filter(Boolean) : [],
    loop2Seen: Array.isArray(res.loop2Seen) ? res.loop2Seen.map(findCastIdByName).filter(Boolean) : [],
    loop3Seen: Array.isArray(res.loop3Seen) ? res.loop3Seen.map(findCastIdByName).filter(Boolean) : [],
    favoriteCast: fav,
    scenes: scenesList,
    sceneCount: sceneCount,
    sceneTotal: TOTAL_SCENES,
    sceneRate: Math.round((sceneCount / TOTAL_SCENES) * 100),
    syncRate: syncRate,
    best: (res.best || res.highlightScene || '').trim(),
    word: (res.word || res.msg || res.publicComment || '').trim(),
    highlightScene: (res.best || res.word || '').trim(),
    publicComment: (res.word || res.msg || res.best || '').trim(),
    characterComments: res.characterComments || {},
    stamps: res.reactions || { chills: 0, heart: 0 },
    stampUsers: { chills: [], heart: [] },
    time: res.timestamp ? new Date(res.timestamp).toLocaleDateString('ja-JP') : '記録済',
    isUser: false
  };
};

export default function ArchiveGallery({ userCardData, serverResponses = [] }) {
  const [cards, setCards] = useState([]);
  const [filterLoop, setFilterLoop] = useState('all');
  const [filterCast, setFilterCast] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  // スプレッドシートの全回答データを読み込み（特定のカードを特別扱いせず一覧に並べる）
  useEffect(() => {
    const list = [];
    const seenCodes = new Set();

    // 1. スプレッドシートからの全参加者データ
    if (serverResponses && serverResponses.length > 0) {
      serverResponses.forEach((res, idx) => {
        const item = mapResponseToCardData(res, idx);
        if (item.obsCode) seenCodes.add(item.obsCode);
        list.push(item);
      });
    }

    // 2. ユーザー自身の最新提出データ（まだスプレッドシートに反映されていない場合の追加）
    if (userCardData && (userCardData.observerName || userCardData.name)) {
      const uCode = userCardData.obsCode;
      if (!uCode || !seenCodes.has(uCode)) {
        const loopTrack = userCardData.loopTrack || {
          loop1: userCardData.primaryRoute || userCardData.loop1 || 'sakurai',
          loop2: userCardData.loop2 || 'jinnai',
          loop3: userCardData.loop3 || 'yada'
        };
        const syncRate = Number(userCardData.syncRate) || Number(userCardData.overall) || 90;
        const scenesList = Array.isArray(userCardData.scenes) ? userCardData.scenes : [];
        const sceneCount = scenesList.length || userCardData.sceneCount || 4;

        list.unshift({
          id: `user-current`,
          obsCode: userCardData.obsCode || 'OBS-YOU',
          observerName: userCardData.observerName || userCardData.name || '観測者',
          grade: userCardData.grade || 'その他',
          role: userCardData.role || '観測者',
          loopTrack: loopTrack,
          loop1Seen: userCardData.loop1Seen || [],
          loop2Seen: userCardData.loop2Seen || [],
          loop3Seen: userCardData.loop3Seen || [],
          favoriteCast: userCardData.favoriteCast || loopTrack.loop1,
          scenes: scenesList,
          sceneCount: sceneCount,
          sceneTotal: TOTAL_SCENES,
          sceneRate: Math.round((sceneCount / TOTAL_SCENES) * 100),
          syncRate: syncRate,
          best: (userCardData.best || userCardData.highlightScene || '').trim(),
          word: (userCardData.word || userCardData.publicComment || '').trim(),
          highlightScene: (userCardData.best || userCardData.word || '').trim(),
          publicComment: (userCardData.word || userCardData.best || '').trim(),
          characterComments: userCardData.characterComments || {},
          stamps: { chills: 0, heart: 0 },
          stampUsers: { chills: [], heart: [] },
          time: 'たった今',
          isUser: false
        });
      }
    }

    setCards(list);
  }, [userCardData, serverResponses]);

  // 手動再読み込み
  const handleReload = async () => {
    setIsLoading(true);
    const data = await sheetApi.fetchAllData();
    if (data.ok && data.surveys) {
      const list = [];
      data.surveys.forEach((res, idx) => {
        list.push(mapResponseToCardData(res, idx));
      });
      setCards(list);
    }
    setIsLoading(false);
  };

  // フィルタリング処理
  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      if (filterLoop !== 'all') {
        const loopNum = Number(filterLoop);
        if (loopNum === 1 && !card.loopTrack?.loop1) return false;
        if (loopNum === 2 && !card.loopTrack?.loop2) return false;
        if (loopNum === 3 && !card.loopTrack?.loop3) return false;
      }

      if (filterCast !== 'all') {
        const hasCast = 
          card.loopTrack?.loop1 === filterCast ||
          card.loopTrack?.loop2 === filterCast ||
          card.loopTrack?.loop3 === filterCast ||
          card.favoriteCast === filterCast;
        if (!hasCast) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (card.observerName || '').toLowerCase();
        const code = (card.obsCode || '').toLowerCase();
        const comment = (card.publicComment || card.word || card.best || '').toLowerCase();
        if (!name.includes(q) && !code.includes(q) && !comment.includes(q)) return false;
      }

      return true;
    });
  }, [cards, filterLoop, filterCast, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto py-2 sm:py-4 px-2 sm:px-4 text-left text-slate-100 min-h-screen animate-fadeIn pb-24">
      {/* ── ヘッダータイトルバー ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5">
              <span>観測アーカイブ・戦歴ライセンス展示</span>
              <span className="text-xs font-mono font-normal text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {cards.length} 柱の観測ログ
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            全観測者が提出した世界線の観測戦歴カード（アンケート回答記録）を一覧で閲覧・鑑賞できます。
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleReload}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="最新アーカイブを同期"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>再同期</span>
          </button>
        </div>
      </div>

      {/* ── 検索 ＆ 絞り込みコントロールバー ── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 sm:p-3 mb-6 shadow-md space-y-2.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* 検索入力 */}
          <div className="relative w-full sm:flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="観測者名、ObsCode、感想キーワードで検索…"
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* キャスト絞り込み */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <select
              value={filterCast}
              onChange={(e) => setFilterCast(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 shrink-0 cursor-pointer w-full sm:w-auto"
            >
              <option value="all">全キャスト軌跡</option>
              {CAST_MEMBERS.filter(c => c.isSelectable !== false).map(c => (
                <option key={c.id} value={c.id}>{c.lastName || c.name} ルート</option>
              ))}
            </select>

            {(searchQuery.trim() || filterCast !== 'all' || filterLoop !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterCast('all');
                  setFilterLoop('all');
                }}
                className="text-xs text-rose-300 hover:text-white px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-xl cursor-pointer flex items-center gap-1 shrink-0"
              >
                <X className="w-3 h-3" />
                <span>クリア</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 📇 観測戦歴カード一覧（均等な縮尺で一覧表示） ── */}
      {filteredCards.length === 0 ? (
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl p-10 sm:p-14 text-center space-y-3 my-6">
          <div className="text-4xl">📂</div>
          <h4 className="text-base font-bold text-white">該当する観測カードが見つかりません</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            条件を変更して再検索するか、アンケートに回答してあなたの観測戦歴カードを展示してみましょう。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 sm:gap-8">
          {filteredCards.map((card, idx) => {
            const cast1 = CAST_MEMBERS.find(c => c.id === card.loopTrack?.loop1) || CAST_MEMBERS[0];
            const favCast = CAST_MEMBERS.find(c => c.id === card.favoriteCast) || cast1;
            const titleInfo = calculateTitle(card.loopTrack || { loop1: 'sakurai', loop2: 'jinnai', loop3: 'nanase' }, card.syncRate || 85);

            return (
              <div
                key={card.id || idx}
                onClick={() => setSelectedCard(card)}
                className="group relative bg-[#0d1017] border border-slate-800 hover:border-slate-600 rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                {/* 装飾アクセントライン */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />

                <div>
                  {/* カード上部：公式バッジ ＆ 観測ID */}
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[9.5px] font-bold tracking-wider bg-[#b8352f] text-white px-2 py-0.5 rounded">
                        OBSERVATION RECORD
                      </span>
                      <span className="text-[10.5px] font-mono text-slate-400">
                        FILE:26_094
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                      ID: {card.obsCode}
                    </span>
                  </div>

                  {/* 観測者名 ＆ 称号 */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-400 font-semibold tracking-wider">
                        観測者名
                      </div>
                      <div className="text-base sm:text-lg font-black text-white truncate flex items-center gap-2">
                        <span>{card.observerName || '名無しの観測者'}</span>
                        <span className="text-[10px] text-slate-400 font-normal px-1.5 py-0.5 bg-white/5 border border-white/10 rounded">
                          {card.grade || '一般'}
                        </span>
                      </div>
                    </div>

                    {/* 称号 */}
                    <div className="shrink-0 px-2.5 py-1 bg-red-950/40 border border-red-800/40 rounded-lg flex items-center gap-1.5 text-red-300 text-xs font-serif font-bold">
                      <Award className="w-3.5 h-3.5 text-red-400" />
                      <span>〖 {titleInfo.name} 〗</span>
                    </div>
                  </div>

                  {/* キャスト画像 ＆ ルート情報 */}
                  <div className="grid grid-cols-[68px_1fr] gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-2.5 mb-3">
                    <img
                      src={favCast?.avatar || cast1.avatar}
                      alt={favCast?.name || ''}
                      className="w-[68px] h-[86px] object-cover rounded-lg border border-white/15 bg-slate-950 shrink-0"
                    />
                    <div className="min-w-0 flex flex-col justify-between py-0.5 text-xs">
                      <div>
                        <div className="text-[10.5px] text-slate-400 mb-1">
                          追跡ルート軌跡:
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-200">
                          <span className="px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-sky-300">
                            1周: {card.loopTrack?.loop1 ? (CAST_MEMBERS.find(c => c.id === card.loopTrack.loop1)?.lastName || card.loopTrack.loop1) : '櫻井'}
                          </span>
                          <span>→</span>
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300">
                            2周: {card.loopTrack?.loop2 ? (CAST_MEMBERS.find(c => c.id === card.loopTrack.loop2)?.lastName || card.loopTrack.loop2) : '陣内'}
                          </span>
                          <span>→</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                            3周: {card.loopTrack?.loop3 ? (CAST_MEMBERS.find(c => c.id === card.loopTrack.loop3)?.lastName || card.loopTrack.loop3) : '矢田'}
                          </span>
                        </div>
                      </div>

                      {/* 同期率 & シーン */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2 font-mono">
                        <div>
                          同期率: <span className="font-bold text-emerald-400">{card.syncRate || 85}%</span>
                        </div>
                        <div>
                          目撃シーン: <span className="font-bold text-sky-400">{card.sceneCount || 4}箇所</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 観測者の感想・手記抜粋 */}
                  {(card.publicComment || card.word || card.best) && (
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 font-serif leading-relaxed line-clamp-2 mb-2">
                      “{card.publicComment || card.word || card.best}”
                    </div>
                  )}
                </div>

                {/* カード下部バー */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 mt-2">
                  <span className="font-mono text-[10.5px]">
                    記録日: {card.time || '記録済'}
                  </span>
                  <div className="inline-flex items-center gap-1 text-emerald-400 group-hover:text-emerald-300 text-xs font-bold transition-colors">
                    <span>ライセンス証を拡大</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 🔍 カード拡大表示モーダル（原寸大のResultCard） ── */}
      {selectedCard && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl relative my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 閉じるボタン */}
            <button
              type="button"
              onClick={() => setSelectedCard(null)}
              className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pt-2">
              <ResultCard
                formData={selectedCard}
                showControls={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
