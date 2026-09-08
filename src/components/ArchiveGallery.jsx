import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  const word = (res.word || res.msg || res.publicComment || '').trim();
  const best = (res.best || res.highlightScene || '').trim();
  const impressions = (res.impressions || word || best || '').trim();
  const routeComment = (res.routeComment || '').trim();

  return {
    id: res.obsCode || `sheet-res-${idx}`,
    obsCode: res.obsCode || `OBS-${idx + 1}`,
    observerName: res.name || res.observerName || '観測者',
    grade: res.grade || 'その他',
    role: res.role || '観測者',
    customAvatar: res.avatar || res.customAvatar || null,
    avatar: res.avatar || res.customAvatar || null,
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
    best: best,
    word: word,
    highlightScene: best,
    publicComment: impressions,
    impressions: impressions,
    routeComment: routeComment,
    characterComments: res.characterComments || {},
    characterPrivateFlags: res.characterPrivateFlags || {},
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
        const uWord = (userCardData.word || userCardData.publicComment || '').trim();
        const uBest = (userCardData.best || userCardData.highlightScene || '').trim();
        const uImpressions = (userCardData.impressions || uWord || uBest || '').trim();

        list.unshift({
          id: `user-current`,
          obsCode: userCardData.obsCode || 'OBS-YOU',
          observerName: userCardData.observerName || userCardData.name || '観測者',
          grade: userCardData.grade || 'その他',
          role: userCardData.role || '観測者',
          customAvatar: userCardData.customAvatar || userCardData.avatar || null,
          avatar: userCardData.customAvatar || userCardData.avatar || null,
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
          best: uBest,
          word: uWord,
          highlightScene: uBest,
          publicComment: uImpressions,
          impressions: uImpressions,
          routeComment: (userCardData.routeComment || '').trim(),
          characterComments: userCardData.characterComments || {},
          characterPrivateFlags: userCardData.characterPrivateFlags || {},
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

// 各カードアイテム（ResultCard自身の幅検知スケールに任せて完全フィット表示）
function GalleryCardItem({ card, onSelect }) {
  return (
    <div
      onClick={() => onSelect(card)}
      className="group relative cursor-pointer overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl rounded-2xl flex justify-center"
    >
      <div className="w-full max-w-[560px] pointer-events-none">
        <ResultCard
          formData={card}
          showControls={false}
        />
      </div>
    </div>
  );
}

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
        const comment = (card.publicComment || card.word || card.best || card.impressions || '').toLowerCase();
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
            全観測者の戦歴カードを一覧表示しています。カードをタップすると等倍表示・画像保存・共有が可能です。
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
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 sm:p-3 mb-5 shadow-md space-y-2.5">
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

      {/* ── 📇 観測戦歴カード一覧（コンパクトなミニカードがびっしり並ぶ高密度ギャラリー） ── */}
      {filteredCards.length === 0 ? (
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl p-10 sm:p-14 text-center space-y-3 my-6">
          <div className="text-4xl">📂</div>
          <h4 className="text-base font-bold text-white">該当する観測カードが見つかりません</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            条件を変更して再検索するか、アンケートに回答してあなたの観測戦歴カードを展示してみましょう。
          </p>
        </div>
      ) : (
        <div 
          className="grid gap-2.5 sm:gap-3.5 justify-center w-full"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))'
          }}
        >
          {filteredCards.map((card, idx) => (
            <GalleryCardItem
              key={card.id || card.obsCode || idx}
              card={card}
              onSelect={setSelectedCard}
            />
          ))}
        </div>
      )}

      {/* ── 🔍 カード拡大表示モーダル（等倍・フルサイズResultCard） ── */}
      {selectedCard && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto"
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
