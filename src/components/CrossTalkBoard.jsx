import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CAST_MEMBERS, calculateTitle } from '../data/storyData';
import { sheetApi } from '../services/sheetApi';
import ResultCard from './ResultCard';
import {
  MessageSquare,
  Users,
  Heart,
  Send,
  Share2,
  CheckCircle2,
  HelpCircle,
  Brain,
  MessageCircle,
  EyeOff,
  Zap,
  ArrowRight,
  Info,
  Search,
  Filter,
  Sparkles,
  CornerDownRight,
  Reply,
  Compass,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
  PenTool,
  X,
  Flame,
  Bookmark,
  Share,
  Layers,
  AtSign,
  Repeat2,
  Quote,
  Award,
  ExternalLink,
  ShieldCheck,
  User,
  RefreshCw,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle
} from 'lucide-react';

const CAST_NAME_MAP = {
  sakurai: '櫻井',
  yada: '矢田',
  sagisaka: '鷺坂',
  watanabe: '渡辺',
  shimoyamada: '下山田',
  nanase: '七瀬',
  jinnai: '陣内',
  fukazawa: '深澤',
  uzawa: '鵜沢',
  morino: '森野',
  ishihara: '石原',
  horikawa: '堀川'
};

const getDisplayName = (idOrName) => {
  if (!idOrName) return '';
  if (CAST_NAME_MAP[idOrName]) return CAST_NAME_MAP[idOrName];
  const found = CAST_MEMBERS.find(c => c.id === idOrName || c.name === idOrName || c.lastName === idOrName);
  if (found) return found.lastName || found.name.split(' ')[0];
  return idOrName;
};

const parseTargetRoute = (target) => {
  if (!target || target === 'all') {
    return { loop: null, label: '全観測者宛', isAll: true, cast: null, name: '全員' };
  }
  if (target.startsWith('loop1_')) {
    const cid = target.replace('loop1_', '');
    const cast = CAST_MEMBERS.find(c => c.id === cid) || null;
    const name = getDisplayName(cid);
    return { loop: 1, label: `【1周目: ${name}】追跡者宛`, shortLabel: `1周目:${name}`, castId: cid, cast, name };
  }
  if (target.startsWith('loop2_')) {
    const cid = target.replace('loop2_', '');
    const cast = CAST_MEMBERS.find(c => c.id === cid) || null;
    const name = getDisplayName(cid);
    return { loop: 2, label: `【2周目: ${name}】追跡者宛`, shortLabel: `2周目:${name}`, castId: cid, cast, name };
  }
  if (target.startsWith('loop3_')) {
    const cid = target.replace('loop3_', '');
    const cast = CAST_MEMBERS.find(c => c.id === cid) || null;
    const name = getDisplayName(cid);
    return { loop: 3, label: `【3周目: ${name}】追跡者宛`, shortLabel: `3周目:${name}`, castId: cid, cast, name };
  }
  const cast = CAST_MEMBERS.find(c => c.id === target) || null;
  const name = getDisplayName(target);
  return { loop: null, label: `【${name}】宛`, shortLabel: name, castId: target, cast, name };
};

const parseMultipleTargets = (targets) => {
  const list = Array.isArray(targets) ? targets : [targets || 'all'];
  if (list.length === 0 || list.includes('all')) {
    return { isAll: true, label: '全観測者宛', shortSummary: '全観測者宛', casts: [], items: [], count: 0 };
  }
  const items = list.map(t => parseTargetRoute(t));
  const casts = items.map(i => i.cast).filter(Boolean);

  let label = '';
  if (items.length === 1) {
    label = items[0].label;
  } else if (items.length === 2) {
    label = `【${items.map(i => i.shortLabel || i.name).join('・')}】宛`;
  } else {
    label = `【${items.slice(0, 2).map(i => i.shortLabel || i.name).join('・')}】ほか計${items.length}宛`;
  }

  return { isAll: false, label, shortSummary: label, casts, items, count: items.length };
};

// 投稿・返信の日時フォーマット（現在時刻・実時間）
export const formatPostTime = (timestamp, fallbackTime) => {
  if (!timestamp) {
    if (fallbackTime && fallbackTime !== 'たった今' && fallbackTime !== '記録済') return fallbackTime;
    return new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  }
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return fallbackTime || new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    } else {
      return `${d.getMonth() + 1}/${d.getDate()} ${d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`;
    }
  } catch (e) {
    return fallbackTime || '';
  }
};

export default function CrossTalkBoard({ formData = {}, serverPosts = [], serverResponses = [], serverReplies = {}, onGoToAdmin, onUpdateFormData }) {
  const myRouteId = formData.primaryRoute || formData.loopTrack?.loop1 || 'sakurai';
  const myLoop1 = formData.loopTrack?.loop1 || myRouteId;
  const myLoop2 = formData.loopTrack?.loop2 || 'jinnai';
  const myLoop3 = formData.loopTrack?.loop3 || 'yada';

  const myTargetKeys = useMemo(() => [
    'all',
    myLoop1,
    myLoop2,
    myLoop3,
    `loop1_${myLoop1}`,
    `loop2_${myLoop2}`,
    `loop3_${myLoop3}`
  ], [myLoop1, myLoop2, myLoop3]);

  // 相補的な問いかけヒントの算出
  const getComplementaryRoutes = (routeId) => {
    switch (routeId) {
      case 'yada':
        return [
          {
            cast: CAST_MEMBERS.find(c => c.id === 'sakurai') || CAST_MEMBERS[0],
            reason: '矢田が研修室3でPCを起動していた裏で、櫻井と七瀬が交わした密談の真相が分かります。',
            question: '櫻井ルートのクライマックス、大ホールでの最後の別れはどうなった？'
          },
          {
            cast: CAST_MEMBERS.find(c => c.id === 'sagisaka') || CAST_MEMBERS[2],
            reason: '矢田が手に入れた手がかりの発端となった、鷺坂のうっかり行動の全貌が分かります。',
            question: '討議室4で鷺坂が残したメモや資料の真の意味は何だった？'
          }
        ];
      case 'sakurai':
        return [
          {
            cast: CAST_MEMBERS.find(c => c.id === 'yada') || CAST_MEMBERS[1],
            reason: '櫻井が七瀬といた裏で、矢田たちがどうやってタイムマシンを復元したのかが繋がります。',
            question: '研修室3で矢田と深澤が解除したセキュリティコードは何だった？'
          },
          {
            cast: CAST_MEMBERS.find(c => c.id === 'shimoyamada') || CAST_MEMBERS[4],
            reason: '櫻井が未来に残ろうとした瞬間、下山田が未来の何を写真に収めていたのかが分かります。',
            question: '下山田が持ち帰ろうとした「未来の自分の資料」の真相は？'
          }
        ];
      default:
        return [
          {
            cast: CAST_MEMBERS.find(c => c.id === 'sakurai') || CAST_MEMBERS[0],
            reason: '100年後の未来で起きていた切ない出会いと別れの核心を知ることができます。',
            question: '櫻井ルートのクライマックス、大ホールでの最後の別れはどうなった？'
          },
          {
            cast: CAST_MEMBERS.find(c => c.id === 'yada') || CAST_MEMBERS[1],
            reason: 'タイムマシンの首謀者・森野の真意と、無限ループの切断プロセスが分かります。',
            question: 'PCに隠された森野の暗号メッセージの全容は何だった？'
          }
        ];
    }
  };

  const complementaryRecommendations = getComplementaryRoutes(myRouteId);

  const [timeline, setTimeline] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCast, setFilterCast] = useState('all');
  const [filterLoop, setFilterLoop] = useState('all');
  const [isFilterPickerOpen, setIsFilterPickerOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [isHintsOpen, setIsHintsOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [likedMap, setLikedMap] = useState(() => {
    try {
      const raw = localStorage.getItem('file26_liked_map');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('file26_liked_map', JSON.stringify(likedMap));
    } catch (e) {}
  }, [likedMap]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [replyInputMap, setReplyInputMap] = useState(() => {
    try {
      const raw = sessionStorage.getItem('file26_crosstalk_reply_drafts');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('file26_crosstalk_reply_drafts', JSON.stringify(replyInputMap));
    } catch (e) {}
  }, [replyInputMap]);

  const [replyOpenMap, setReplyOpenMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // 📇 観測戦歴カード ポップアップ表示状態
  const [viewingUserCard, setViewingUserCard] = useState(null);

  // 🔁 引用投稿（Quote Post）対象
  const [quoteTarget, setQuoteTarget] = useState(null);

  // 📍 引用元ジャンプ時のハイライト対象ポストID
  const [highlightedPostId, setHighlightedPostId] = useState(null);

  // 📝 投稿編集モーダル状態
  const [editingPost, setEditingPost] = useState(null);
  const [editDraftMessage, setEditDraftMessage] = useState('');
  const [editDraftCategory, setEditDraftCategory] = useState('question');
  const [editDraftTargets, setEditDraftTargets] = useState(['all']);
  const [editDraftTargetLoop, setEditDraftTargetLoop] = useState('1');

  // 🗑️ 投稿削除確認モーダル状態
  const [deletingPost, setDeletingPost] = useState(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // 投稿作成フォーム状態（sessionStorageで下書きを自動復元）
  const [draftMessage, setDraftMessage] = useState(() => {
    try {
      return sessionStorage.getItem('file26_crosstalk_draft_msg') || '';
    } catch (e) {
      return '';
    }
  });
  const [draftCategory, setDraftCategory] = useState(() => {
    try {
      return sessionStorage.getItem('file26_crosstalk_draft_cat') || 'question';
    } catch (e) {
      return 'question';
    }
  });
  const [draftTargets, setDraftTargets] = useState(() => {
    try {
      const raw = sessionStorage.getItem('file26_crosstalk_draft_targets');
      return raw ? JSON.parse(raw) : ['all'];
    } catch (e) {
      return ['all'];
    }
  });
  const [editorTargetLoop, setEditorTargetLoop] = useState('1'); // '1' | '2' | '3' | 'all'

  // 下書きのsessionStorageへのリアルタイム保存
  useEffect(() => {
    try {
      sessionStorage.setItem('file26_crosstalk_draft_msg', draftMessage);
      sessionStorage.setItem('file26_crosstalk_draft_cat', draftCategory);
      sessionStorage.setItem('file26_crosstalk_draft_targets', JSON.stringify(draftTargets));
    } catch (e) {}
  }, [draftMessage, draftCategory, draftTargets]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // スプレッドシートからの投稿データ ＆ アンケート回答感想を同期
  useEffect(() => {
    const list = [];
    const nowIso = new Date().toISOString();
    const seenCodes = new Set();

    let storedQuotes = {};
    try {
      const raw = localStorage.getItem('file26_quotes_map');
      if (raw) storedQuotes = JSON.parse(raw);
    } catch (e) {}

    const findCastIdByName = (nameStr) => {
      if (!nameStr) return '';
      const c = CAST_MEMBERS.find(x => nameStr.includes(x.name.split(' ')[0]) || nameStr.includes(x.lastName || x.name) || x.id === nameStr);
      return c ? c.id : nameStr;
    };

    // 1. ユーザー自身の現在の入力・回答がある場合（別々のポストとして生成）
    const myCode = formData.obsCode || 'OBS-USER';
    const myBaseData = {
      obsCode: myCode,
      name: formData.observerName || formData.name || '観測者 (あなた)',
      observerName: formData.observerName || formData.name || '観測者 (あなた)',
      grade: formData.grade || '2年',
      loopTrack: formData.loopTrack || { loop1: myRouteId, loop2: 'jinnai', loop3: 'yada' },
      syncRate: formData.syncRate || 85,
      targetRoutes: ['all'],
      favoriteCast: formData.favoriteCast || myRouteId,
      stamps: { chills: 0, resonance: 0 },
      stampUsers: { chills: [], resonance: [] },
      timestamp: nowIso,
      time: formatPostTime(nowIso),
      isMe: true,
      replies: []
    };

    // 1-A. ユーザーの感想ポスト
    const myCommentId = `my-${myCode}-comment`;
    const myCommentText = (formData.impressions || formData.routeComment || formData.word || '').trim();
    if (myCommentText) {
      list.push({
        ...myBaseData,
        id: myCommentId,
        category: 'comment',
        postType: '感想',
        word: formData.word || '',
        impressions: formData.impressions || '',
        routeComment: formData.routeComment || '',
        message: formData.impressions || formData.routeComment || formData.word,
        replies: serverReplies[myCommentId] || []
      });
    }

    // 1-B. ユーザーの忘れられない場面・セリフ ポスト
    const myBestId = `my-${myCode}-best`;
    const myBestText = (formData.best || '').trim();
    if (myBestText && myBestText !== myCommentText) {
      list.push({
        ...myBaseData,
        id: myBestId,
        category: 'scene',
        postType: '名場面・セリフ',
        best: myBestText,
        message: myBestText,
        replies: serverReplies[myBestId] || []
      });
    }

    // 2. スプレッドシートからの掲示板投稿 (CROSSTALK)
    if (serverPosts && serverPosts.length > 0) {
      serverPosts.forEach((post) => {
        const pReplies = serverReplies[post.id] || post.replies || [];
        const pQuote = post.quote || storedQuotes[post.id] || null;
        list.push({
          ...post,
          replies: pReplies,
          quote: pQuote,
          isMe: formData.obsCode ? post.obsCode === formData.obsCode : false,
          time: formatPostTime(post.timestamp, post.time)
        });
      });
    }

    // 3. スプレッドシートのアンケート回答 (SURVEY) から感想・名場面・推し手記をそれぞれ独立ポストとして統合
    if (serverResponses && serverResponses.length > 0) {
      serverResponses.forEach((resp, idx) => {
        const respCode = resp.obsCode || `OBS-RESP-${idx}`;
        const respFav = findCastIdByName(resp.favoriteCast) || '';
        const baseRespData = {
          obsCode: respCode,
          name: resp.name || resp.observerName || '観測者',
          observerName: resp.name || resp.observerName || '観測者',
          grade: resp.grade || '一般',
          loopTrack: {
            loop1: findCastIdByName(resp.loop1) || 'sakurai',
            loop2: findCastIdByName(resp.loop2) || 'jinnai',
            loop3: findCastIdByName(resp.loop3) || 'yada'
          },
          syncRate: Number(resp.overall) || 90,
          targetRoutes: ['all'],
          userFavoriteCast: respFav,
          favoriteCast: respFav,
          stamps: resp.reactions || { chills: 0, resonance: 0 },
          stampUsers: resp.reactions?.users ? { chills: resp.reactions.users, resonance: resp.reactions.users } : { chills: [], resonance: [] },
          timestamp: resp.timestamp || nowIso,
          time: formatPostTime(resp.timestamp || nowIso),
          isMe: formData.obsCode ? resp.obsCode === formData.obsCode : false
        };

        // 3-A. 全体の感想 / ひとこと ポスト
        const respCommentText = (resp.impressions || resp.routeComment || resp.word || '').trim();
        const surveyCommentId = `survey-${respCode}-comment`;
        if (respCommentText) {
          list.push({
            ...baseRespData,
            id: surveyCommentId,
            category: 'comment',
            postType: '感想',
            word: resp.word || '',
            impressions: resp.impressions || '',
            routeComment: resp.routeComment || '',
            message: resp.impressions || resp.routeComment || resp.word,
            replies: serverReplies[surveyCommentId] || []
          });
        }

        // 3-B. 忘れられない場面・セリフ ポスト（独立した1つのポスト）
        const respBestText = (resp.best || '').trim();
        const surveyBestId = `survey-${respCode}-best`;
        if (respBestText && respBestText !== respCommentText) {
          list.push({
            ...baseRespData,
            id: surveyBestId,
            category: 'scene',
            postType: '名場面・セリフ',
            best: respBestText,
            message: respBestText,
            replies: serverReplies[surveyBestId] || []
          });
        }

        // 3-C. 各キャストへのメッセージ ポスト（複数名分あればそれぞれ独立ポスト・非公開設定は除外）
        if (resp.characterComments && typeof resp.characterComments === 'object') {
          Object.keys(resp.characterComments).forEach(castKey => {
            const rawVal = resp.characterComments[castKey];
            const isPrivate = typeof rawVal === 'object' && rawVal !== null ? !!rawVal.isPrivate : false;
            const castMsg = (typeof rawVal === 'object' && rawVal !== null ? (rawVal.text || '') : String(rawVal || '')).trim();
            // 🔒 非公開設定のメッセージは公開タイムラインに表示しない
            if (isPrivate) return;
            if (castMsg && castMsg !== respCommentText && castMsg !== respBestText) {
              const targetCast = findCastIdByName(castKey) || castKey;
              const surveyCastPostId = `survey-${respCode}-cast-${targetCast}`;
              list.push({
                ...baseRespData,
                id: surveyCastPostId,
                category: 'favorite',
                targetCast: targetCast,
                favoriteCast: respFav,
                postType: `${getDisplayName(targetCast)} へのメッセージ`,
                message: castMsg,
                replies: serverReplies[surveyCastPostId] || []
              });
            }
          });
        }

        // 3-D. 演者・運営への全体メッセージ ポスト
        const respGeneralMsg = (resp.msg || '').trim();
        const surveyMsgId = `survey-${respCode}-msg`;
        if (respGeneralMsg && respGeneralMsg !== respCommentText && respGeneralMsg !== respBestText) {
          list.push({
            ...baseRespData,
            id: surveyMsgId,
            category: 'favorite',
            targetCast: 'all',
            favoriteCast: respFav,
            postType: '演者・運営へのメッセージ',
            message: respGeneralMsg,
            replies: serverReplies[surveyMsgId] || []
          });
        }
      });
    }

    setTimeline(list);
  }, [formData, serverPosts, serverResponses, serverReplies]);

  // 最新データの手動再取得
  const handleReload = async () => {
    setIsLoading(true);
    const res = await sheetApi.fetchAllData();
    if (res.ok) {
      const sPosts = res.crossTalk || [];
      const sResps = res.surveys || [];
      const sReps = res.replies || {};

      const list = [];
      const nowIso = new Date().toISOString();
      const findCastIdByName = (nameStr) => {
        if (!nameStr) return '';
        const c = CAST_MEMBERS.find(x => nameStr.includes(x.name.split(' ')[0]) || nameStr.includes(x.lastName || x.name) || x.id === nameStr);
        return c ? c.id : nameStr;
      };

      // 1. ローカル回答
      const myCode = formData.obsCode || 'OBS-USER';
      const myBaseData = {
        obsCode: myCode,
        name: formData.observerName || formData.name || '観測者 (あなた)',
        observerName: formData.observerName || formData.name || '観測者 (あなた)',
        grade: formData.grade || '2年',
        loopTrack: formData.loopTrack || { loop1: myRouteId, loop2: 'jinnai', loop3: 'yada' },
        syncRate: formData.syncRate || 85,
        targetRoutes: ['all'],
        favoriteCast: formData.favoriteCast || myRouteId,
        stamps: { chills: 0, resonance: 0 },
        stampUsers: { chills: [], resonance: [] },
        timestamp: nowIso,
        time: formatPostTime(nowIso),
        isMe: true
      };

      const myCommentId = `my-${myCode}-comment`;
      const myCommentText = (formData.impressions || formData.routeComment || formData.word || '').trim();
      if (myCommentText) {
        list.push({
          ...myBaseData,
          id: myCommentId,
          category: 'comment',
          postType: '感想',
          word: formData.word || '',
          impressions: formData.impressions || '',
          routeComment: formData.routeComment || '',
          message: formData.impressions || formData.routeComment || formData.word,
          replies: sReps[myCommentId] || []
        });
      }

      const myBestId = `my-${myCode}-best`;
      const myBestText = (formData.best || '').trim();
      if (myBestText && myBestText !== myCommentText) {
        list.push({
          ...myBaseData,
          id: myBestId,
          category: 'scene',
          postType: '名場面・セリフ',
          best: myBestText,
          message: myBestText,
          replies: sReps[myBestId] || []
        });
      }

      // 2. CROSSTALK
      let storedQuotes = {};
      try {
        const raw = localStorage.getItem('file26_quotes_map');
        if (raw) storedQuotes = JSON.parse(raw);
      } catch (e) {}

      sPosts.forEach((post) => {
        const pReplies = sReps[post.id] || post.replies || [];
        const pQuote = post.quote || storedQuotes[post.id] || null;
        list.push({
          ...post,
          replies: pReplies,
          quote: pQuote,
          isMe: formData.obsCode ? post.obsCode === formData.obsCode : false,
          time: formatPostTime(post.timestamp, post.time)
        });
      });

      // 3. SURVEY
      sResps.forEach((resp, idx) => {
        const respCode = resp.obsCode || `OBS-RESP-${idx}`;
        const respFav = findCastIdByName(resp.favoriteCast) || '';
        const baseRespData = {
          obsCode: respCode,
          name: resp.name || resp.observerName || '観測者',
          observerName: resp.name || resp.observerName || '観測者',
          grade: resp.grade || '一般',
          loopTrack: {
            loop1: findCastIdByName(resp.loop1) || 'sakurai',
            loop2: findCastIdByName(resp.loop2) || 'jinnai',
            loop3: findCastIdByName(resp.loop3) || 'yada'
          },
          syncRate: Number(resp.overall) || 90,
          targetRoutes: ['all'],
          userFavoriteCast: respFav,
          favoriteCast: respFav,
          stamps: resp.reactions || { chills: 0, resonance: 0 },
          stampUsers: resp.reactions?.users ? { chills: resp.reactions.users, resonance: resp.reactions.users } : { chills: [], resonance: [] },
          timestamp: resp.timestamp || nowIso,
          time: formatPostTime(resp.timestamp || nowIso),
          isMe: formData.obsCode ? resp.obsCode === formData.obsCode : false
        };

        const respCommentText = (resp.impressions || resp.routeComment || resp.word || '').trim();
        const surveyCommentId = `survey-${respCode}-comment`;
        if (respCommentText) {
          list.push({
            ...baseRespData,
            id: surveyCommentId,
            category: 'comment',
            postType: '感想',
            word: resp.word || '',
            impressions: resp.impressions || '',
            routeComment: resp.routeComment || '',
            message: resp.impressions || resp.routeComment || resp.word,
            replies: sReps[surveyCommentId] || []
          });
        }

        const respBestText = (resp.best || '').trim();
        const surveyBestId = `survey-${respCode}-best`;
        if (respBestText && respBestText !== respCommentText) {
          list.push({
            ...baseRespData,
            id: surveyBestId,
            category: 'scene',
            postType: '名場面・セリフ',
            best: respBestText,
            message: respBestText,
            replies: sReps[surveyBestId] || []
          });
        }

        if (resp.characterComments && typeof resp.characterComments === 'object') {
          Object.keys(resp.characterComments).forEach(castKey => {
            const rawVal = resp.characterComments[castKey];
            const isPrivate = typeof rawVal === 'object' && rawVal !== null ? !!rawVal.isPrivate : false;
            const castMsg = (typeof rawVal === 'object' && rawVal !== null ? (rawVal.text || '') : String(rawVal || '')).trim();
            // 🔒 非公開設定のメッセージは公開タイムラインに表示しない
            if (isPrivate) return;
            if (castMsg && castMsg !== respCommentText && castMsg !== respBestText) {
              const targetCast = findCastIdByName(castKey) || castKey;
              const surveyCastPostId = `survey-${respCode}-cast-${targetCast}`;
              list.push({
                ...baseRespData,
                id: surveyCastPostId,
                category: 'favorite',
                targetCast: targetCast,
                favoriteCast: respFav,
                postType: `${getDisplayName(targetCast)} へのメッセージ`,
                message: castMsg,
                replies: sReps[surveyCastPostId] || []
              });
            }
          });
        }

        const respGeneralMsg = (resp.msg || '').trim();
        const surveyMsgId = `survey-${respCode}-msg`;
        if (respGeneralMsg && respGeneralMsg !== respCommentText && respGeneralMsg !== respBestText) {
          list.push({
            ...baseRespData,
            id: surveyMsgId,
            category: 'favorite',
            targetCast: 'all',
            favoriteCast: respFav,
            postType: '演者・運営へのメッセージ',
            message: respGeneralMsg,
            replies: sReps[surveyMsgId] || []
          });
        }
      });

      setTimeline(list);
      showToast('最新の時空通信を同期しました');
    }
    setIsLoading(false);
  };

  // 宛先ルートGUI選択トグル（周回 × キャスト）
  const handleToggleTargetCast = (castId, loopMode = editorTargetLoop) => {
    const key = loopMode === 'all' ? castId : `loop${loopMode}_${castId}`;
    setDraftTargets(prev => {
      const withoutAll = prev.filter(k => k !== 'all');
      if (withoutAll.includes(key)) {
        const next = withoutAll.filter(k => k !== key);
        return next.length === 0 ? ['all'] : next;
      } else {
        return [...withoutAll, key];
      }
    });
  };

  // 宛先個別削除
  const handleRemoveTarget = (targetKey) => {
    setDraftTargets(prev => {
      const next = prev.filter(k => k !== targetKey);
      return next.length === 0 ? ['all'] : next;
    });
  };

  // 全員宛てにリセット
  const handleSetAllTargets = () => {
    setDraftTargets(['all']);
  };

  // 📇 観測戦歴カードを開く（アイコンや名前タップ時）
  const handleOpenUserCard = (post) => {
    if (!post) return;
    const list = serverResponses || [];
    const targetEmail = post.googleEmail ? post.googleEmail.toString().trim().toLowerCase() : '';
    const postObsCode = (post.obsCode || '').trim();
    const postName = (post.observerName || post.name || '').trim();

    // スプレッドシートから該当する観測者データを特定
    const found = list.find(s => 
      (targetEmail && s.googleEmail && s.googleEmail.toString().trim().toLowerCase() === targetEmail) ||
      (postObsCode && s.obsCode && s.obsCode.trim() === postObsCode) ||
      (postName && (s.name === postName || s.observerName === postName))
    );

    const findCastIdByName = (nameStr) => {
      if (!nameStr) return '';
      const c = CAST_MEMBERS.find(x => nameStr.includes(x.name.split(' ')[0]) || nameStr.includes(x.lastName || x.name) || x.id === nameStr);
      return c ? c.id : nameStr;
    };

    if (found) {
      const cardData = {
        obsCode: found.obsCode || post.obsCode || 'OBS-LOG',
        observerName: found.name || found.observerName || post.observerName || '観測者',
        grade: found.grade || post.grade || 'その他',
        role: found.role || '観測者',
        loopTrack: {
          loop1: findCastIdByName(found.loop1) || found.loop1 || post.loopTrack?.loop1 || 'sakurai',
          loop2: findCastIdByName(found.loop2) || found.loop2 || post.loopTrack?.loop2 || 'jinnai',
          loop3: findCastIdByName(found.loop3) || found.loop3 || post.loopTrack?.loop3 || 'yada'
        },
        loop1Seen: Array.isArray(found.loop1Seen) ? found.loop1Seen.map(findCastIdByName).filter(Boolean) : (post.loop1Seen || []),
        loop2Seen: Array.isArray(found.loop2Seen) ? found.loop2Seen.map(findCastIdByName).filter(Boolean) : (post.loop2Seen || []),
        loop3Seen: Array.isArray(found.loop3Seen) ? found.loop3Seen.map(findCastIdByName).filter(Boolean) : (post.loop3Seen || []),
        favoriteCast: findCastIdByName(found.favoriteCast) || found.favoriteCast || post.favoriteCast || '',
        scenes: Array.isArray(found.scenes) ? found.scenes : (found.scenes ? found.scenes.toString().split(',') : (post.scenes || ['s1', 's2'])),
        sceneCount: (Array.isArray(found.scenes) ? found.scenes.length : (found.scenes ? found.scenes.toString().split(',').length : 0)) || post.sceneCount || 4,
        syncRate: Number(found.overall) || post.syncRate || 85,
        best: found.best || post.best || found.word || post.message || '',
        word: found.word || post.word || post.message || post.publicComment || '',
        highlightScene: found.best || found.word || post.message || '',
        publicComment: post.message || post.publicComment || found.word || found.best || '',
        characterComments: found.characterComments || {}
      };
      setViewingUserCard(cardData);
    } else {
      // 投稿データからカード情報を復元
      const cardData = {
        obsCode: post.obsCode || 'OBS-LOG',
        observerName: post.observerName || post.name || '観測者',
        grade: post.grade || 'その他',
        role: '観測者',
        loopTrack: post.loopTrack || { loop1: 'sakurai', loop2: 'jinnai', loop3: 'yada' },
        loop1Seen: post.loop1Seen || [],
        loop2Seen: post.loop2Seen || [],
        loop3Seen: post.loop3Seen || [],
        favoriteCast: post.favoriteCast || post.loopTrack?.loop1 || 'sakurai',
        scenes: post.scenes || ['s1', 's2', 's3', 's4'],
        sceneCount: (post.scenes || []).length || 4,
        syncRate: post.syncRate || 85,
        best: post.best || post.message || '観測ログ',
        word: post.word || post.message || post.publicComment || 'あの日あなたは「観測者」だった',
        highlightScene: post.message || post.publicComment || '',
        publicComment: post.message || post.publicComment || '',
        characterComments: {}
      };
      setViewingUserCard(cardData);
    }
  };

  // 📍 引用されたポストをタップした時に引用元ポストへスムーズスクロール＆ハイライトジャンプ
  const handleJumpToQuotedPost = (quote) => {
    if (!quote) return;
    const targetId = quote.id || quote.targetPostId;

    // タイムライン内に対象のポストが存在するか確認
    const exactPost = timeline.find(p => p.id === targetId) || 
                      timeline.find(p => quote.obsCode && p.obsCode === quote.obsCode && (p.message === quote.message || p.word === quote.word || p.best === quote.message)) ||
                      timeline.find(p => quote.message && (p.message === quote.message || p.publicComment === quote.message));

    const effectiveId = exactPost ? exactPost.id : targetId;

    const performScroll = (elId) => {
      const el = document.getElementById(`post-${elId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedPostId(elId);
        showToast('📍 引用元のポストへジャンプしました');
        setTimeout(() => {
          setHighlightedPostId(null);
        }, 2800);
        return true;
      }
      return false;
    };

    // 1. まず現在のDOMで直接スクロールを試みる
    if (effectiveId && performScroll(effectiveId)) return;

    // 2. 現在のタブで隠れている場合は、「タイムライン（すべて）」タブに切り替えてスクロール
    if (exactPost) {
      setActiveTab('all');
      setTimeout(() => {
        if (!performScroll(exactPost.id)) {
          handleOpenUserCard(quote);
        }
      }, 150);
      return;
    }

    // 3. タイムライン上に見つからない場合（古いログ等）は戦歴カードモーダルを表示
    handleOpenUserCard(quote);
  };

  // 🔁 引用投稿モーダルを開く
  const handleQuote = (post) => {
    setQuoteTarget(post);
    setIsEditorOpen(true);
  };

  // 投稿作成・送信
  const handleCreatePost = async (e) => {
    e.preventDefault();
    const cleanText = draftMessage.trim();
    if (!cleanText) return;

    // 🕵️‍♂️ 裏技ギミック: 「640157」とだけポストした場合は管理画面へアクセス
    if (cleanText === '640157') {
      sessionStorage.setItem('file26_admin_auth', 'true');
      setDraftMessage('');
      setQuoteTarget(null);
      setIsEditorOpen(false);
      showToast('🔑 管理者アクセスコードが承認されました。管理ページへ移動します…');
      setTimeout(() => {
        if (onGoToAdmin) {
          onGoToAdmin();
        } else {
          const url = new URL(window.location.href);
          url.searchParams.set('tab', 'admin');
          window.location.href = url.toString();
        }
      }, 700);
      return;
    }

    const myName = formData.observerName || formData.name || '観測者';
    const nowIso = new Date().toISOString();
    const newPost = {
      id: `msg-${Date.now()}`,
      obsCode: formData.obsCode || 'OBS-USER',
      name: myName,
      observerName: myName,
      googleEmail: formData.googleEmail || '',
      targetRoutes: draftTargets,
      category: draftCategory,
      message: cleanText,
      publicComment: cleanText,
      // 🔁 引用情報
      quote: quoteTarget ? {
        id: quoteTarget.id,
        name: quoteTarget.observerName || quoteTarget.name || '観測者',
        observerName: quoteTarget.observerName || quoteTarget.name || '観測者',
        obsCode: quoteTarget.obsCode || '',
        message: quoteTarget.message || quoteTarget.publicComment || '',
        time: quoteTarget.time || formatPostTime(quoteTarget.timestamp),
        loopTrack: quoteTarget.loopTrack || null,
        favoriteCast: quoteTarget.favoriteCast || ''
      } : null,
      loopTrack: formData.loopTrack || { loop1: myLoop1, loop2: myLoop2, loop3: myLoop3 },
      syncRate: formData.syncRate || 85,
      favoriteCast: formData.favoriteCast || myLoop1,
      stamps: { chills: 0, resonance: 0 },
      stampUsers: { chills: [], resonance: [] },
      replies: [],
      timestamp: nowIso,
      time: formatPostTime(nowIso),
      isMe: true
    };

    // 引用情報のローカルキャッシュ保存
    if (newPost.quote) {
      try {
        const raw = localStorage.getItem('file26_quotes_map');
        const map = raw ? JSON.parse(raw) : {};
        map[newPost.id] = newPost.quote;
        localStorage.setItem('file26_quotes_map', JSON.stringify(map));
      } catch (e) {}
    }

    setTimeline(prev => [newPost, ...prev]);
    setDraftMessage('');
    setDraftTargets(['all']);
    setQuoteTarget(null);
    setIsEditorOpen(false);
    showToast('💬 感想を投稿しました！');

    await sheetApi.postCrossTalk(newPost);
  };

  // 自分の投稿かどうかを判定
  const isMyPost = (post) => {
    if (!post) return false;
    if (post.isMe) return true;
    if (post.id && typeof post.id === 'string' && post.id.startsWith('my-')) return true;
    if (formData.obsCode && post.obsCode && post.obsCode.trim() === formData.obsCode.trim()) return true;
    if (formData.googleEmail && post.googleEmail && post.googleEmail.trim().toLowerCase() === formData.googleEmail.trim().toLowerCase()) return true;
    return false;
  };

  // 📝 投稿編集モーダルを開く
  const handleOpenEdit = (post) => {
    setEditingPost(post);
    setEditDraftMessage(post.message || post.publicComment || '');
    setEditDraftTargets(post.targetRoutes && post.targetRoutes.length > 0 ? post.targetRoutes : ['all']);
    setEditDraftCategory(post.category || 'question');
  };

  // 編集用 宛先ルートGUI選択トグル
  const handleToggleEditTargetCast = (castId, loopMode = editDraftTargetLoop) => {
    const key = loopMode === 'all' ? castId : `loop${loopMode}_${castId}`;
    setEditDraftTargets(prev => {
      const withoutAll = prev.filter(k => k !== 'all');
      if (withoutAll.includes(key)) {
        const next = withoutAll.filter(k => k !== key);
        return next.length === 0 ? ['all'] : next;
      } else {
        return [...withoutAll, key];
      }
    });
  };

  // 編集用 宛先個別削除
  const handleRemoveEditTarget = (targetKey) => {
    setEditDraftTargets(prev => {
      const next = prev.filter(k => k !== targetKey);
      return next.length === 0 ? ['all'] : next;
    });
  };

  // 📝 投稿編集を保存
  const handleSaveEdit = async () => {
    if (!editingPost) return;
    const cleanText = (editDraftMessage || '').trim();
    if (!cleanText) {
      showToast('メッセージを入力してください');
      return;
    }
    setIsSubmittingAction(true);
    const targetId = editingPost.id;
    const postObsCode = editingPost.obsCode || formData.obsCode || '';
    const postEmail = editingPost.googleEmail || formData.googleEmail || '';

    // 1. ローカルタイムラインの即時更新
    setTimeline(prev => prev.map(p => {
      if (p.id === targetId) {
        return {
          ...p,
          message: cleanText,
          publicComment: cleanText,
          targetRoutes: editDraftTargets,
          category: editDraftCategory
        };
      }
      return p;
    }));

    // 2. 種類に応じたAPI呼び出し
    if (typeof targetId === 'string' && (targetId.startsWith('survey-') || targetId.startsWith('my-'))) {
      let postType = 'comment';
      let targetCast = '';
      if (editingPost.category === 'scene' || editingPost.best) {
        postType = 'scene';
      } else if (editingPost.category === 'favorite') {
        if (editingPost.targetCast && editingPost.targetCast !== 'all') {
          postType = 'cast';
          targetCast = editingPost.targetCast;
        } else {
          postType = 'msg';
        }
      }

      if (onUpdateFormData) {
        onUpdateFormData(prev => {
          const next = { ...prev };
          if (postType === 'comment') {
            next.impressions = cleanText;
            next.routeComment = cleanText;
            next.word = cleanText;
          } else if (postType === 'scene') {
            next.best = cleanText;
          } else if (postType === 'cast' && targetCast) {
            next.characterComments = { ...(next.characterComments || {}), [targetCast]: cleanText };
          } else if (postType === 'msg') {
            next.msg = cleanText;
          }
          return next;
        });
      }

      await sheetApi.editSurveyPost({
        obsCode: postObsCode,
        googleEmail: postEmail,
        postType,
        targetCast,
        message: cleanText
      });
    } else {
      await sheetApi.editCrossTalk({
        id: targetId,
        message: cleanText,
        targetRoutes: editDraftTargets,
        category: editDraftCategory,
        obsCode: postObsCode,
        googleEmail: postEmail
      });
    }

    setIsSubmittingAction(false);
    setEditingPost(null);
    showToast('✨ 投稿を更新しました');
  };

  // 🗑️ 投稿削除を実行
  const handleDeletePost = async () => {
    if (!deletingPost) return;
    setIsSubmittingAction(true);
    const targetId = deletingPost.id;
    const postObsCode = deletingPost.obsCode || formData.obsCode || '';
    const postEmail = deletingPost.googleEmail || formData.googleEmail || '';

    // 1. ローカルタイムラインから即時除外
    setTimeline(prev => prev.filter(p => p.id !== targetId));

    // 2. 種類に応じたAPI呼び出し
    if (typeof targetId === 'string' && (targetId.startsWith('survey-') || targetId.startsWith('my-'))) {
      let postType = 'comment';
      let targetCast = '';
      if (deletingPost.category === 'scene' || deletingPost.best) {
        postType = 'scene';
      } else if (deletingPost.category === 'favorite') {
        if (deletingPost.targetCast && deletingPost.targetCast !== 'all') {
          postType = 'cast';
          targetCast = deletingPost.targetCast;
        } else {
          postType = 'msg';
        }
      }

      if (onUpdateFormData) {
        onUpdateFormData(prev => {
          const next = { ...prev };
          if (postType === 'comment') {
            next.impressions = '';
            next.routeComment = '';
            next.word = '';
          } else if (postType === 'scene') {
            next.best = '';
          } else if (postType === 'cast' && targetCast) {
            const charComments = { ...(next.characterComments || {}) };
            delete charComments[targetCast];
            next.characterComments = charComments;
          } else if (postType === 'msg') {
            next.msg = '';
          }
          return next;
        });
      }

      await sheetApi.deleteSurveyPost({
        obsCode: postObsCode,
        googleEmail: postEmail,
        postType,
        targetCast
      });
    } else {
      await sheetApi.deleteCrossTalk({
        id: targetId,
        obsCode: postObsCode,
        googleEmail: postEmail
      });
    }

    setIsSubmittingAction(false);
    setDeletingPost(null);
    showToast('🗑️ 投稿を削除しました');
  };

  // 🗑️ 返信削除
  const handleDeleteReply = async (postId, replyId) => {
    if (!window.confirm('この返信を削除しますか？')) return;
    setTimeline(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          replies: (p.replies || []).filter(r => r.id !== replyId)
        };
      }
      return p;
    }));
    showToast('🗑️ 返信を削除しました');
    await sheetApi.deleteReply({ postId, replyId });
  };

  // ヒントから質問を作成
  const handleApplyHint = (hintQuestion, targetCastId) => {
    setDraftMessage(hintQuestion);
    setDraftCategory('question');
    if (targetCastId) {
      setDraftTargets([targetCastId]);
    }
    setIsHintsOpen(false);
    setIsEditorOpen(true);
  };

  // 返信の投稿
  const handleSendReply = async (postId) => {
    const text = (replyInputMap[postId] || '').trim();
    if (!text) return;

    const myName = formData.observerName || formData.name || '観測者';
    const nowIso = new Date().toISOString();
    const replyData = {
      id: `rep-${Date.now()}`,
      postId: postId,
      name: myName,
      observerName: myName,
      obsCode: formData.obsCode || '',
      googleEmail: formData.googleEmail || '',
      message: text,
      timestamp: nowIso,
      time: formatPostTime(nowIso),
      loopTrack: formData.loopTrack || null
    };

    setTimeline(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, replies: [...(p.replies || []), replyData] };
      }
      return p;
    }));

    setReplyInputMap(prev => ({ ...prev, [postId]: '' }));
    showToast('返信を投稿しました');

    await sheetApi.postReply({ postId, ...replyData });
  };

  // スタンプリアクション（トグル）
  const handleLike = async (postId, stampKey) => {
    const key = `${postId}-${stampKey}`;
    const isCurrentlyLiked = Boolean(likedMap[key]);
    const myName = formData.observerName || formData.name || 'あなた';

    setTimeline(prev => prev.map(item => {
      if (item.id === postId) {
        const currentCount = (item.stamps && item.stamps[stampKey]) || 0;
        const currentUsers = (item.stampUsers && item.stampUsers[stampKey]) || [];

        if (isCurrentlyLiked) {
          return {
            ...item,
            stamps: { ...item.stamps, [stampKey]: Math.max(0, currentCount - 1) },
            stampUsers: {
              ...(item.stampUsers || {}),
              [stampKey]: currentUsers.filter(u => u !== myName && u !== 'あなた')
            }
          };
        } else {
          return {
            ...item,
            stamps: { ...item.stamps, [stampKey]: currentCount + 1 },
            stampUsers: {
              ...(item.stampUsers || {}),
              [stampKey]: [...currentUsers.filter(u => u !== myName && u !== 'あなた'), 'あなた']
            }
          };
        }
      }
      return item;
    }));

    setLikedMap(prev => ({ ...prev, [key]: !isCurrentlyLiked }));
    showToast(isCurrentlyLiked ? 'リアクションを取り消しました' : stampKey === 'chills' ? '⚡ 鳥肌を送信しました' : '❤️ 共鳴を送信しました');

    const targetItem = timeline.find(item => item.id === postId);
    const isSurvey = Boolean(targetItem?.isSurvey || targetItem?.source === 'survey' || targetItem?.obsCode);

    await sheetApi.toggleReaction({
      targetType: isSurvey ? 'survey' : 'crosstalk',
      targetId: postId,
      obsCode: targetItem?.obsCode || '',
      stampKey: stampKey,
      userName: myName
    });
  };

  const hasActiveFilter = Boolean(searchQuery.trim() || filterCast !== 'all' || filterLoop !== 'all');
  const clearFilters = () => {
    setSearchQuery('');
    setFilterCast('all');
    setFilterLoop('all');
  };

  // フィルタリング
  const filteredPosts = useMemo(() => {
    return timeline.filter(item => {
      // 1. タブによる種別フィルター
      if (activeTab === 'forMe') {
        const targets = item.targetRoutes || ['all'];
        const isTargeted = targets.includes('all') || targets.some(t => myTargetKeys.includes(t));
        if (!isTargeted) return false;
      } else if (activeTab === 'questions') {
        if (item.category !== 'question') return false;
      } else if (activeTab === 'comments') {
        const isComment = item.category === 'comment' || item.postType === '感想' || (item.word && !item.best && item.category !== 'scene' && item.category !== 'favorite' && item.category !== 'cast_note');
        if (!isComment) return false;
      } else if (activeTab === 'scenes') {
        const isScene = item.category === 'scene' || item.postType === '名場面・セリフ' || Boolean(item.best);
        if (!isScene) return false;
      } else if (activeTab === 'castNotes') {
        const isCastNote = item.category === 'favorite' || item.category === 'cast_note' || Boolean(item.targetCast) || Boolean(item.isCastMessage);
        if (!isCastNote) return false;
      } else if (activeTab === 'myPosts') {
        if (!isMyPost(item)) return false;
      }

      // 2. 周回フィルター
      if (filterLoop !== 'all') {
        const loopNum = Number(filterLoop);
        const postLoop = item.loopTrack;
        if (!postLoop) return false;
        const loopMatch = 
          (loopNum === 1 && postLoop.loop1) ||
          (loopNum === 2 && postLoop.loop2) ||
          (loopNum === 3 && postLoop.loop3);
        if (!loopMatch) return false;
      }

      // 3. キャストフィルター
      if (filterCast !== 'all') {
        const targets = item.targetRoutes || ['all'];
        const postLoop = item.loopTrack || {};
        const matchesCast = 
          targets.includes(filterCast) ||
          targets.includes(`loop1_${filterCast}`) ||
          targets.includes(`loop2_${filterCast}`) ||
          targets.includes(`loop3_${filterCast}`) ||
          postLoop.loop1 === filterCast ||
          postLoop.loop2 === filterCast ||
          postLoop.loop3 === filterCast ||
          item.favoriteCast === filterCast ||
          item.targetCast === filterCast;
        if (!matchesCast) return false;
      }

      // 4. キーワード検索
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = (item.message || item.publicComment || item.word || item.best || item.impressions || item.routeComment || '').toLowerCase();
        const name = (item.observerName || item.name || '').toLowerCase();
        if (!text.includes(q) && !name.includes(q)) return false;
      }

      return true;
    });
  }, [timeline, activeTab, searchQuery, filterCast, filterLoop, myTargetKeys, isMyPost]);

  const tabs = useMemo(() => [
    { id: 'all', label: 'タイムライン', count: timeline.length },
    { 
      id: 'comments', 
      label: '全体の感想', 
      count: timeline.filter(p => p.category === 'comment' || p.postType === '感想' || (p.word && !p.best && p.category !== 'scene' && p.category !== 'favorite' && p.category !== 'cast_note')).length 
    },
    { 
      id: 'scenes', 
      label: '名場面・セリフ', 
      count: timeline.filter(p => p.category === 'scene' || p.postType === '名場面・セリフ' || Boolean(p.best)).length 
    },
    { 
      id: 'castNotes', 
      label: 'キャスト手記', 
      count: timeline.filter(p => p.category === 'favorite' || p.category === 'cast_note' || Boolean(p.targetCast) || Boolean(p.isCastMessage)).length 
    },
    { 
      id: 'questions', 
      label: '問いかけ', 
      count: timeline.filter(p => p.category === 'question').length 
    },
    { 
      id: 'forMe', 
      label: 'あなた宛', 
      count: timeline.filter(p => (p.targetRoutes || ['all']).includes('all') || (p.targetRoutes || []).some(t => myTargetKeys.includes(t))).length 
    },
    { 
      id: 'myPosts', 
      label: '自分の投稿', 
      count: timeline.filter(isMyPost).length 
    }
  ], [timeline, myTargetKeys, isMyPost]);

  return (
    <div className="max-w-6xl mx-auto py-1 sm:py-4 px-0 sm:px-4 text-left text-slate-100 pb-28 sm:pb-16 relative min-h-screen animate-fadeIn">
      {/* トースト（Portalで body 直下にヘッダー直下に表示） */}
      {toastMsg && createPortal(
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[99999] bg-sky-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-2xl shadow-2xl flex items-start gap-2 pointer-events-none max-w-[96vw] leading-snug">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="text-left break-words">{toastMsg}</span>
        </div>,
        document.body
      )}

      {/* ── タイトルバー（1行固定・折り返し防止） ── */}
      <div className="flex flex-nowrap items-center justify-between px-2 sm:px-1 py-1.5 mb-2 gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
        <h2 className="text-xs sm:text-base md:text-lg font-black text-white tracking-tight flex items-center gap-1.5 whitespace-nowrap min-w-0 shrink">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shrink-0" />
          <span className="whitespace-nowrap truncate">
            <span className="sm:hidden">みんなの感想広場</span>
            <span className="hidden sm:inline">みんなの感想 ＆ メッセージ広場</span>
          </span>
        </h2>

        <div className="flex flex-nowrap items-center gap-1 sm:gap-2 shrink-0">
          {/* 💡 質問ヒントボタン */}
          <button
            type="button"
            onClick={() => setIsHintsOpen(true)}
            className="px-2 py-1 sm:px-2.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-amber-200 transition-all flex items-center gap-1 cursor-pointer shadow-sm active:scale-95 whitespace-nowrap shrink-0"
            title="他ルートへの質問ヒントを表示"
          >
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 animate-pulse shrink-0" />
            <span className="whitespace-nowrap">ヒント</span>
          </button>

          <button
            type="button"
            onClick={handleReload}
            disabled={isLoading}
            className="p-1 sm:p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer shrink-0"
            title="最新データを受信"
          >
            <RefreshCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              const url = new URL(window.location.origin + window.location.pathname);
              url.searchParams.set('tab', 'crosstalk');
              if (navigator.clipboard) {
                navigator.clipboard.writeText(url.toString());
                setCopiedLink(true);
                showToast('広場のURLをコピーしました！');
                setTimeout(() => setCopiedLink(false), 2500);
              }
            }}
            className="px-2 py-1 sm:px-2.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold bg-slate-800/90 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          >
            {copiedLink ? <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" /> : <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-400 shrink-0" />}
            <span className="whitespace-nowrap">{copiedLink ? '済' : '共有'}</span>
          </button>
        </div>
      </div>

      {/* ── メインレイアウト（PC時は左タイムライン ＆ 右ヒントサイドバー） ── */}
      <div className="flex flex-col lg:flex-row items-start justify-center gap-5">
        
        {/* 左側: メインタイムライン */}
        <div className="w-full lg:max-w-2xl xl:max-w-3xl space-y-3 flex-1 min-w-0">
          {/* ✍️ 投稿トリガーバー */}
          <div
            onClick={() => setIsEditorOpen(true)}
            className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-2.5 sm:p-3.5 shadow-md flex items-center gap-2.5 sm:gap-3 cursor-pointer transition-all hover:bg-slate-900 group"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-sky-500/40 bg-slate-800 flex items-center justify-center text-xs font-bold text-sky-400 font-mono shrink-0">
              観測
            </div>
            <div className="flex-1 bg-slate-950/80 border border-slate-800/80 group-hover:border-slate-700 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-400 font-serif truncate">
              いまどうしてる？他ルートへの問いかけや感想をポスト…
            </div>
            <button
              type="button"
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow group-hover:brightness-110 flex items-center gap-1 sm:gap-1.5 shrink-0 cursor-pointer"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>ポスト</span>
            </button>
          </div>

          {/* ── タブバー ＆ 検索バー（横スクロール対応で全カテゴリに瞬時アクセス） ── */}
          <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-md overflow-hidden">
            <div className="flex flex-nowrap items-center px-1.5 sm:px-2 py-1.5 gap-1.5 border-b border-slate-800/60 overflow-x-auto no-scrollbar scroll-smooth">
              {tabs.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`py-1.5 px-2.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex flex-nowrap items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === t.id
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900 bg-slate-900/40 border border-transparent'
                  }`}
                >
                  <span className="whitespace-nowrap">{t.label}</span>
                  <span className={`text-[9.5px] sm:text-[10px] font-mono px-1.5 py-0.2 rounded-full shrink-0 ${
                    activeTab === t.id ? 'bg-black/40 text-white' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            {/* 検索バー */}
            <div className="px-2.5 py-2 bg-slate-900/60 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFilterPickerOpen(true)}
                className="flex-1 bg-slate-950/90 hover:bg-slate-950 border border-slate-800 hover:border-sky-500/60 rounded-full pl-3.5 pr-3 py-1.5 text-xs text-left text-slate-400 flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2 truncate">
                  <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-400 shrink-0" />
                  <span className="truncate">
                    {searchQuery.trim()
                      ? `検索: "${searchQuery}"`
                      : filterCast !== 'all' || filterLoop !== 'all'
                      ? '条件を変更して検索…'
                      : 'キーワード・キャスト・周回で検索…'}
                  </span>
                </div>
                <span className="text-[10px] bg-sky-500/15 text-sky-300 px-2 py-0.5 rounded-full font-bold border border-sky-500/30 shrink-0 ml-1">
                  🔍 検索・絞込
                </span>
              </button>

              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-rose-300 hover:text-white px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-full cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <X className="w-3 h-3" />
                  <span>解除</span>
                </button>
              )}
            </div>
          </div>

          {/* ── タイムライン一覧（Twitter風UIデザイン） ── */}
          <div className="space-y-3">
            {filteredPosts.length === 0 ? (
              <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl p-10 sm:p-14 text-center space-y-3 my-4">
                <div className="text-4xl">📡</div>
                <h4 className="text-sm sm:text-base font-bold text-white">該当する観測ログがまだありません</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  右下の「＋」ボタンや上の入力バーからメッセージを送信すると、スプレッドシートに記録され全観測者へ共有されます。
                </p>
              </div>
            ) : (
              filteredPosts.map(post => {
                const targetInfo = parseMultipleTargets(post.targetRoutes);
                const postName = post.observerName || post.name || '観測者';
                const postCode = post.obsCode || 'OBS-LOG';

                // 各投稿者固有のアバター解決（他人の投稿に自分のGoogleアイコンが混ざるのを防止）
                const resolveAvatar = () => {
                  if (post.customAvatar || post.avatar || post.googlePicture) {
                    return { type: 'img', src: post.customAvatar || post.avatar || post.googlePicture };
                  }
                  // スプレッドシート回答から探索
                  const matched = (serverResponses || []).find(s =>
                    (post.obsCode && s.obsCode === post.obsCode) ||
                    (post.googleEmail && s.googleEmail === post.googleEmail) ||
                    (s.name === postName || s.observerName === postName)
                  );
                  if (matched?.customAvatar || matched?.googlePicture) {
                    return { type: 'img', src: matched.customAvatar || matched.googlePicture };
                  }
                  const favCastId = post.userFavoriteCast || matched?.favoriteCast || post.favoriteCast || post.loopTrack?.loop1 || matched?.loop1;
                  const c = favCastId ? CAST_MEMBERS.find(x => x.id === favCastId || x.lastName === favCastId || x.name === favCastId) : null;
                  if (c?.avatar) {
                    return { type: 'img', src: c.avatar };
                  }
                  // イニシャルアバター
                  const colors = [
                    'from-sky-500 to-blue-600',
                    'from-emerald-500 to-teal-600',
                    'from-rose-500 to-pink-600',
                    'from-amber-500 to-orange-600',
                    'from-purple-500 to-indigo-600',
                    'from-cyan-500 to-sky-600'
                  ];
                  let hash = 0;
                  for (let i = 0; i < postName.length; i++) hash = postName.charCodeAt(i) + ((hash << 5) - hash);
                  const bg = colors[Math.abs(hash) % colors.length];
                  return { type: 'initial', initial: postName.charAt(0) || '観', bg };
                };

                const avatarInfo = resolveAvatar();
                const totalLikes = (post.stamps?.resonance || 0) + (post.stamps?.chills || 0) + (post.likes || 0);
                const isLiked = likedMap[`${post.id}-resonance`] || likedMap[`${post.id}-like`];
                const replyCount = (post.replies || []).length;

                return (
                  <div
                    key={post.id}
                    id={`post-${post.id}`}
                    className={`bg-[#0f141c]/95 border rounded-2xl p-3.5 sm:p-4 shadow-md transition-all duration-500 ${
                      highlightedPostId === post.id
                        ? 'border-sky-400 ring-2 ring-sky-400/70 bg-sky-950/40 shadow-sky-500/25 shadow-xl scale-[1.01]'
                        : 'border-slate-800/90 hover:border-slate-700/90'
                    }`}
                  >
                    {/* Twitter風 2カラムレイアウト（左: アバター、右: コンテンツ） */}
                    <div className="flex items-start gap-3">
                      {/* 左側: アバターアイコン（タップで戦歴カード表示） */}
                      <div
                        onClick={() => handleOpenUserCard(post)}
                        className="cursor-pointer shrink-0 group relative"
                        title="タップして観測戦歴カードを表示"
                      >
                        {avatarInfo.type === 'img' ? (
                          <img
                            src={avatarInfo.src}
                            alt={postName}
                            className="w-10 h-10 rounded-full object-cover border border-slate-700 group-hover:border-sky-400 group-hover:scale-105 transition-all shadow-sm"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${avatarInfo.bg} text-white font-bold text-sm flex items-center justify-center border border-white/20 group-hover:scale-105 transition-all shadow-sm`}>
                            {avatarInfo.initial}
                          </div>
                        )}
                      </div>

                      {/* 右側: メインツイートエリア */}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        {/* ユーザー情報ヘッダー */}
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            <span
                              onClick={() => handleOpenUserCard(post)}
                              className="font-bold text-white text-[13.5px] hover:underline cursor-pointer truncate"
                              title="タップして観測戦歴カードを表示"
                            >
                              {postName}
                            </span>
                            <span
                              onClick={() => handleOpenUserCard(post)}
                              className="text-slate-400 font-mono text-xs cursor-pointer hover:text-sky-400"
                            >
                              @{postCode}
                            </span>
                            <span className="text-slate-500 text-xs">·</span>
                            <span className="text-slate-400 font-mono text-xs">
                              {post.time}
                            </span>
                          </div>

                          {/* ⚙️ 自分の投稿の場合の編集・削除ボタン */}
                          {isMyPost(post) && (
                            <div className="flex items-center gap-1 shrink-0 ml-auto">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(post)}
                                className="px-2 py-1 text-slate-400 hover:text-sky-300 hover:bg-sky-500/15 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1 border border-transparent hover:border-sky-500/30"
                                title="投稿を編集"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-medium hidden sm:inline">編集</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingPost(post)}
                                className="px-2 py-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1 border border-transparent hover:border-rose-500/30"
                                title="投稿を削除"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-medium hidden sm:inline">削除</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 誰に対するなんなのかがひと目でわかる宛先・項目ヘッダー */}
                        <div className="text-[11.5px] font-mono flex items-center gap-1.5 flex-wrap text-slate-400">
                          {post.category === 'scene' ? (
                            <span>忘れられない場面・セリフ</span>
                          ) : post.category === 'favorite' ? (
                            (() => {
                              const targetCastId = post.targetCast || post.favoriteCast;
                              const targetMember = (targetCastId && targetCastId !== 'all') ? CAST_MEMBERS.find(x => x.id === targetCastId || x.lastName === targetCastId || x.name === targetCastId) : null;
                              return (
                                <span className="inline-flex items-center gap-1.5 text-slate-300">
                                  {targetMember?.avatar && (
                                    <img
                                      src={targetMember.avatar}
                                      alt={targetMember.name}
                                      className="w-4 h-4 rounded-full object-cover border border-slate-700 inline-block shrink-0"
                                    />
                                  )}
                                  <span>{targetMember ? `${targetMember.name} へのメッセージ` : (post.targetCast && post.targetCast !== 'all' ? `${getDisplayName(post.targetCast)} へのメッセージ` : '演者・運営へのメッセージ')}</span>
                                </span>
                              );
                            })()
                          ) : post.category === 'question' ? (
                            <span>宛先: {targetInfo.shortSummary}</span>
                          ) : post.category === 'theory' ? (
                            <span>考察</span>
                          ) : (
                            <span>全体の感想</span>
                          )}
                        </div>

                        {/* 感想タイトル (Q15: word が本文と別にある場合のみ、見出しとして表示) */}
                        {post.word && post.word !== post.message && (
                          <div className="text-[14px] font-bold text-white tracking-tight">
                            {post.word}
                          </div>
                        )}

                        {/* ポスト本文（不自然な色変化やイタリックをなくし、読みやすい標準テキストに統一） */}
                        <div className="text-[13.5px] text-slate-100 font-normal leading-relaxed whitespace-pre-wrap break-words font-serif">
                          {post.category === 'scene' ? `「${post.message}」` : post.message}
                        </div>

                        {/* 🔁 Twitter風 引用ツイートボックス（タップで該当ポストへスムーズスクロール） */}
                        {post.quote && (() => {
                          const qName = post.quote.observerName || post.quote.name || '観測者';
                          const qCode = post.quote.obsCode || '';
                          // 引用元投稿者のタイムライン上のポストを検索して推しキャラを取得
                          const qSourcePost = timeline.find(p => p.obsCode === qCode && (p.favoriteCast || p.targetCast));
                          const qFavCastId = qSourcePost?.favoriteCast || qSourcePost?.targetCast;
                          const qFavCast = qFavCastId && qFavCastId !== 'all'
                            ? CAST_MEMBERS.find(m => m.id === qFavCastId || m.lastName === qFavCastId || m.name === qFavCastId)
                            : null;
                          const qColors = [
                            'from-sky-500 to-blue-600',
                            'from-emerald-500 to-teal-600',
                            'from-violet-500 to-purple-600',
                            'from-rose-500 to-pink-600',
                            'from-amber-500 to-orange-600',
                          ];
                          let qHash = 0;
                          for (let i = 0; i < qName.length; i++) qHash = qName.charCodeAt(i) + ((qHash << 5) - qHash);
                          const qBg = qColors[Math.abs(qHash) % qColors.length];
                          return (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJumpToQuotedPost(post.quote);
                              }}
                              className="mt-2 rounded-2xl border border-slate-800/90 hover:border-sky-500/50 bg-slate-950/70 hover:bg-sky-950/30 p-3 transition-all cursor-pointer space-y-1.5 text-left group shadow-inner"
                              title="クリックして引用元のポストへジャンプ"
                            >
                              <div className="flex items-center gap-2 text-xs flex-wrap">
                                {qFavCast?.avatar ? (
                                  <img
                                    src={qFavCast.avatar}
                                    alt={qFavCast.name}
                                    className="w-5 h-5 rounded-full object-cover border border-slate-600 shrink-0"
                                    title={`推し: ${qFavCast.name}`}
                                  />
                                ) : (
                                  <div className={`w-5 h-5 rounded-full bg-gradient-to-tr ${qBg} text-white font-bold text-[10px] flex items-center justify-center shrink-0 border border-white/10`}>
                                    {qName.charAt(0) || '観'}
                                  </div>
                                )}
                                <span className="font-bold text-slate-200 group-hover:text-sky-300 transition-colors">
                                  {qName}
                                </span>
                                <span className="text-[11px] font-mono text-slate-400 shrink-0">
                                  @{qCode || 'OBS-LOG'}
                                </span>
                                <span className="text-slate-500 text-xs shrink-0">·</span>
                                <span className="text-[11px] font-mono text-slate-400 shrink-0">
                                  {post.quote.time || ''}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                                {post.quote.message}
                              </p>
                            </div>
                          );
                        })()}

                        {/* ── 🐦 Twitter (X) 完全準拠 アクションバー ── */}
                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between max-w-md text-slate-400">
                          {/* 1. 返信ボタン (Reply) */}
                          <button
                            type="button"
                            onClick={() => setReplyOpenMap(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                            className="flex items-center gap-1.5 hover:text-sky-400 group cursor-pointer transition-colors"
                            title="返信する"
                          >
                            <div className="p-1.5 rounded-full group-hover:bg-sky-500/10 transition-colors">
                              <MessageCircle className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-mono">{replyCount > 0 ? replyCount : ''}</span>
                          </button>

                          {/* 2. リツイート / 引用ボタン (Repost / Quote) */}
                          <button
                            type="button"
                            onClick={() => handleQuote(post)}
                            className="flex items-center gap-1.5 hover:text-emerald-400 group cursor-pointer transition-colors"
                            title="このポストを引用して投稿"
                          >
                            <div className="p-1.5 rounded-full group-hover:bg-emerald-500/10 transition-colors">
                              <Repeat2 className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-mono">引用</span>
                          </button>

                          {/* 3. いいねボタン (Like) */}
                          <button
                            type="button"
                            onClick={() => handleLike(post.id, 'resonance')}
                            className={`flex items-center gap-1.5 group cursor-pointer transition-colors ${
                              isLiked ? 'text-rose-500' : 'hover:text-rose-500'
                            }`}
                            title="いいね"
                          >
                            <div className="p-1.5 rounded-full group-hover:bg-rose-500/10 transition-colors">
                              <Heart
                                className="w-4 h-4 transition-transform active:scale-125"
                                fill={isLiked ? "currentColor" : "none"}
                              />
                            </div>
                            <span className="text-xs font-mono">{totalLikes > 0 ? totalLikes : ''}</span>
                          </button>
                        </div>

                        {/* ── 返信スレッド表示 ── */}
                        {replyOpenMap[post.id] && (
                          <div className="pt-2 border-t border-slate-800/40 space-y-2 animate-fadeIn">
                            {(post.replies || []).map((rep, idx) => {
                              const isMyReply = rep.obsCode === formData.obsCode || (formData.name && rep.name === formData.name);
                              return (
                                <div key={rep.id || idx} className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-xs space-y-1 group/rep">
                                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-white">{rep.name}</span>
                                      <span className="font-mono">{formatPostTime(rep.timestamp, rep.time)}</span>
                                    </div>
                                    {isMyReply && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteReply(post.id, rep.id)}
                                        className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                                        title="返信を削除"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-slate-200">{rep.message}</p>
                                </div>
                              );
                            })}

                            {/* 返信入力欄 */}
                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="text"
                                value={replyInputMap[post.id] || ''}
                                onChange={(e) => setReplyInputMap(prev => ({ ...prev, [post.id]: e.target.value }))}
                                placeholder="このログに返信…"
                                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleSendReply(post.id)}
                                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs cursor-pointer"
                              >
                                返信
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── 右側: 💡 PC版 問いかけヒント固定サイドバー ── */}
        <div className="hidden lg:block w-80 xl:w-96 sticky top-4 space-y-4 shrink-0">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white tracking-wide">
                他ルートへの問いかけヒント
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              あなたが追跡した【{getDisplayName(myRouteId)}】ルートと裏表の関係にある、他ルートの観測者へ聞くべき重要ピースです。
            </p>

            <div className="space-y-2.5 pt-1">
              {complementaryRecommendations.map((rec, i) => (
                <div
                  key={i}
                  className="bg-slate-950/90 border border-slate-800/80 hover:border-amber-500/50 p-3 rounded-xl space-y-2 transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={rec.cast.avatar}
                      alt={rec.cast.name}
                      className="w-7 h-7 rounded-full object-cover border border-amber-500/40"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-amber-300 truncate">
                        {rec.cast.name} 追跡者へ
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed font-serif">
                    “{rec.question}”
                  </p>

                  <button
                    type="button"
                    onClick={() => handleApplyHint(rec.question, rec.cast.id)}
                    className="w-full py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <span>この問いかけをポストに使う</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── 📌 画面右下 フローティング投稿ボタン（FAB） ── */}
      <button
        type="button"
        onClick={() => setIsEditorOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-2xl flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all group border border-sky-400/40"
        title="観測ログをポストする"
      >
        <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-200" />
      </button>

      {/* ── 💡 スマホ版 問いかけヒントモーダル ── */}
      {isHintsOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
          onClick={() => setIsHintsOpen(false)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">他ルートへの問いかけヒント</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHintsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <p className="text-xs text-slate-400 leading-relaxed">
                あなたが観測した【{getDisplayName(myRouteId)}】の裏で起きていた真実を、他ルートの追跡者に聞いてみましょう！
              </p>

              {complementaryRecommendations.map((rec, i) => (
                <div
                  key={i}
                  className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={rec.cast.avatar}
                      alt={rec.cast.name}
                      className="w-8 h-8 rounded-full object-cover border border-amber-500/40"
                    />
                    <div>
                      <div className="text-xs font-bold text-amber-300">
                        {rec.cast.name} 追跡者へ
                      </div>
                      <div className="text-[10px] text-slate-400">{rec.reason}</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 font-serif leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                    “{rec.question}”
                  </p>

                  <button
                    type="button"
                    onClick={() => handleApplyHint(rec.question, rec.cast.id)}
                    className="w-full py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>この問いかけをポストに使う</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsHintsOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* ── 🔍 検索・絞り込みポップアップ（モーダル） ── */}
      {isFilterPickerOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
          onClick={() => setIsFilterPickerOpen(false)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <Search className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs sm:text-sm font-bold text-white">ログ検索・絞り込み</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterPickerOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-2.5 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="キーワードや観測者名で検索…"
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-sky-500 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 gap-1 my-2 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
              {[
                { id: 'all', label: '全体', icon: '🌐' },
                { id: '1', label: '1周目', icon: '1️⃣' },
                { id: '2', label: '2周目', icon: '2️⃣' },
                { id: '3', label: '3周目', icon: '3️⃣' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterLoop(tab.id)}
                  className={`py-1 px-1 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    filterLoop === tab.id
                      ? 'bg-sky-500 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <span className="text-[10px]">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-0.5 py-1">
              <div className="text-[10px] font-bold text-slate-400 mb-1.5 flex items-center justify-between">
                <span>キャストで絞込:</span>
                {filterCast !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setFilterCast('all')}
                    className="text-sky-400 hover:underline text-[10px]"
                  >
                    選択解除
                  </button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterCast('all')}
                  className={`p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                    filterCast === 'all'
                      ? 'bg-sky-500/25 border-sky-400 text-white shadow ring-1 ring-sky-400'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center text-sm mb-1">
                    🌐
                  </div>
                  <span className="text-[10px] font-bold leading-tight">全員</span>
                </button>

                {CAST_MEMBERS.filter(c => c.isSelectable !== false).map(c => {
                  const isSelected = filterCast === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFilterCast(prev => prev === c.id ? 'all' : c.id)}
                      className={`p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center text-center relative group ${
                        isSelected
                          ? 'bg-sky-500/25 border-sky-400 text-white shadow ring-1 ring-sky-400'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <img
                        src={c.avatar}
                        alt={c.name}
                        className={`w-8 h-8 rounded-full object-cover mb-1 border ${
                          isSelected ? 'border-sky-400' : 'border-slate-700'
                        }`}
                      />
                      <span className="text-[10px] font-bold leading-tight truncate w-full">
                        {c.lastName || c.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2.5 mt-1 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <div className="min-w-0 flex-1 text-left">
                <div className="text-[11px] font-mono text-slate-300 truncate">
                  {filteredPosts.length} 件一致
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {hasActiveFilter && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 cursor-pointer"
                  >
                    クリア
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsFilterPickerOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow hover:brightness-110 cursor-pointer whitespace-nowrap"
                >
                  決定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ✍️ 新規投稿モーダル（メイン：超シンプル・本文中心設計） ── */}
      {isEditorOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
          onClick={() => setIsEditorOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white">観測ログをポスト</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3 flex-1 flex flex-col justify-between">
              {/* 🔁 引用中のポストプレビューカード */}
              {quoteTarget && (
                <div className="p-2.5 rounded-2xl bg-slate-950/90 border border-sky-500/40 relative animate-fadeIn">
                  <div className="flex items-center justify-between text-[11px] text-sky-300 mb-1">
                    <div className="flex items-center gap-1.5 font-bold truncate">
                      <Quote className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="truncate">{quoteTarget.observerName || quoteTarget.name || '観測者'} のポストを引用中</span>
                      <span className="text-[9.5px] font-mono text-slate-400 shrink-0">({quoteTarget.obsCode || ''})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setQuoteTarget(null)}
                      className="text-slate-400 hover:text-white p-0.5 rounded-full hover:bg-slate-800 cursor-pointer shrink-0 ml-1"
                      title="引用を解除"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2 font-serif leading-relaxed">
                    {quoteTarget.message || quoteTarget.publicComment}
                  </p>
                </div>
              )}

              {/* メッセージ本文（広々としたメイン入力欄） */}
              <div className="flex-1 min-h-[130px] flex flex-col">
                <textarea
                  rows={5}
                  value={draftMessage}
                  onChange={(e) => setDraftMessage(e.target.value)}
                  placeholder={quoteTarget ? "このポストへのコメントや感想を添えて引用ポスト…" : "いまどうしてる？他ルートへの問いかけや感想、考察を自由にポスト…"}
                  className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none font-sans leading-relaxed"
                  autoFocus
                  required
                />
              </div>

              {/* 宛先指定中のタグ表示（全員以外の場合のみコンパクトに表示） */}
              {!draftTargets.includes('all') && (
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-sky-500/30">
                  <span className="text-[10px] text-sky-300 font-bold">宛先:</span>
                  {draftTargets.map(targetKey => {
                    const parsed = parseTargetRoute(targetKey);
                    return (
                      <span
                        key={targetKey}
                        className="inline-flex items-center gap-1 pl-1.5 pr-1 py-0.5 rounded-md text-[10.5px] font-bold bg-sky-500/20 text-sky-200 border border-sky-400/40"
                      >
                        {parsed.cast?.avatar && (
                          <img src={parsed.cast.avatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                        )}
                        <span>{parsed.shortLabel || parsed.label}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTarget(targetKey)}
                          className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                  <button
                    type="button"
                    onClick={handleSetAllTargets}
                    className="text-[10px] text-slate-400 hover:text-sky-300 underline ml-auto cursor-pointer"
                  >
                    全員宛に戻す
                  </button>
                </div>
              )}

              {/* 下部ツールバー（宛先選択ボタン ＆ カテゴリ ＆ 送信） */}
              <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* 🎯 対象を選ぶボタン（別ウィンドウを開く） */}
                  <button
                    type="button"
                    onClick={() => setIsTargetModalOpen(true)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      draftTargets.includes('all')
                        ? 'bg-slate-950 hover:bg-slate-800 border-slate-700 text-slate-300'
                        : 'bg-sky-500/20 hover:bg-sky-500/30 border-sky-400 text-sky-200 shadow-sm'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    <span>
                      {draftTargets.includes('all') ? '対象を選ぶ (全員)' : `対象: ${draftTargets.length}件`}
                    </span>
                    <span className="text-[10px] text-sky-400">▾</span>
                  </button>

                  {/* カテゴリ切り替え */}
                  <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-full border border-slate-800">
                    {[
                      { id: 'question', label: '❓ 問いかけ' },
                      { id: 'theory', label: '💡 考察' },
                      { id: 'comment', label: '💬 感想' }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setDraftCategory(cat.id)}
                        className={`py-1 px-2 rounded-full text-[10.5px] font-bold transition-all cursor-pointer ${
                          draftCategory === cat.id
                            ? 'bg-sky-500 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 右側: キャンセル ＆ ポストボタン */}
                <div className="flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditorOpen(false);
                      setQuoteTarget(null);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={!draftMessage.trim()}
                    className="px-5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3 h-3" />
                    <span>{quoteTarget ? '引用ポスト' : 'ポスト'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 👥 宛先・対象選択サブモーダル（もう一段階のウィンドウ） ── */}
      {isTargetModalOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
          onClick={() => setIsTargetModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#101726] border border-slate-700 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3.5 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* サブヘッダー */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                <h4 className="text-sm font-bold text-white">宛先・対象を選択</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsTargetModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
              {/* 全員宛てトグル */}
              <button
                type="button"
                onClick={() => {
                  handleSetAllTargets();
                }}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  draftTargets.includes('all')
                    ? 'bg-sky-500/25 border-sky-400 text-white shadow'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>🌐</span>
                  <span>全観測者宛（全員へ公開）</span>
                </span>
                {draftTargets.includes('all') && <span className="text-sky-400">✓ 選択中</span>}
              </button>

              {/* 周回指定タブ */}
              <div className="space-y-1">
                <div className="text-[10.5px] font-bold text-slate-400">① 対象の周回を選択:</div>
                <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {[
                    { id: '1', label: '1周目' },
                    { id: '2', label: '2周目' },
                    { id: '3', label: '3周目' },
                    { id: 'all', label: '全周回' }
                  ].map(loopTab => (
                    <button
                      key={loopTab.id}
                      type="button"
                      onClick={() => setEditorTargetLoop(loopTab.id)}
                      className={`py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center ${
                        editorTargetLoop === loopTab.id
                          ? 'bg-sky-500 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      {loopTab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* キャストグリッド */}
              <div className="space-y-1">
                <div className="text-[10.5px] font-bold text-slate-400">
                  ② キャストをタップ（複数選択可）:
                </div>
                <div className="grid grid-cols-4 gap-1.5 max-h-52 overflow-y-auto pr-0.5">
                  {CAST_MEMBERS.filter(c => c.isSelectable !== false).map(c => {
                    const currentKey = editorTargetLoop === 'all' ? c.id : `loop${editorTargetLoop}_${c.id}`;
                    const isCurrentSelected = draftTargets.includes(currentKey);

                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleToggleTargetCast(c.id, editorTargetLoop)}
                        className={`p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center text-center relative ${
                          isCurrentSelected
                            ? 'bg-sky-500/25 border-sky-400 ring-1 ring-sky-400 text-white shadow'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <img
                          src={c.avatar}
                          alt={c.name}
                          className={`w-8 h-8 rounded-full object-cover mb-1 border ${
                            isCurrentSelected ? 'border-sky-300' : 'border-slate-700'
                          }`}
                        />
                        <span className="text-[10px] font-bold truncate w-full">
                          {c.lastName || c.name}
                        </span>
                        {isCurrentSelected && (
                          <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-sky-500 text-white rounded-full flex items-center justify-center text-[8.5px] font-bold">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 決定ボタン */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsTargetModalOpen(false)}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow hover:brightness-110 cursor-pointer"
              >
                宛先の選択を完了する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📝 投稿編集モーダル */}
      {editingPost && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => !isSubmittingAction && setEditingPost(null)}
          className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-3xl p-4 sm:p-6 max-w-lg w-full shadow-2xl text-left space-y-4 my-auto relative"
          >
            {/* ヘッダー */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-base text-white">投稿内容を編集</h3>
              </div>
              <button
                type="button"
                onClick={() => !isSubmittingAction && setEditingPost(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full bg-slate-800 border border-slate-700 cursor-pointer"
                disabled={isSubmittingAction}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 宛先・カテゴリ変更（CROSSTALK投稿の場合） */}
            {typeof editingPost.id === 'string' && !editingPost.id.startsWith('survey-') && !editingPost.id.startsWith('my-') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-300">カテゴリ</span>
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-full border border-slate-800">
                    {[
                      { id: 'question', label: '❓ 問いかけ' },
                      { id: 'theory', label: '💡 考察' },
                      { id: 'comment', label: '💬 感想' }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setEditDraftCategory(cat.id)}
                        className={`py-1 px-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          editDraftCategory === cat.id
                            ? 'bg-sky-500 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 本文入力エリア */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">メッセージ本文</label>
              <textarea
                rows={5}
                value={editDraftMessage}
                onChange={(e) => setEditDraftMessage(e.target.value)}
                placeholder="メッセージを入力…"
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none font-sans leading-relaxed"
                autoFocus
              />
            </div>

            {/* アクションボタン */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                disabled={isSubmittingAction}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSubmittingAction}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingAction ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>更新中…</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>更新を保存</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 🗑️ 投稿削除確認モーダル */}
      {deletingPost && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => !isSubmittingAction && setDeletingPost(null)}
          className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-rose-900/60 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl text-left space-y-4 my-auto relative"
          >
            {/* ヘッダー */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">投稿を削除しますか？</h3>
                <p className="text-xs text-slate-400">この操作を実行すると、広場から完全に削除されます。</p>
              </div>
            </div>

            {/* 削除対象プレビュー */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="text-[11px] font-bold text-slate-400">
                {deletingPost.postType || '投稿内容'}
              </div>
              <p className="line-clamp-3 leading-relaxed whitespace-pre-wrap text-slate-200">
                {deletingPost.message || deletingPost.publicComment || ''}
              </p>
            </div>

            {/* ボタン */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingPost(null)}
                disabled={isSubmittingAction}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleDeletePost}
                disabled={isSubmittingAction}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingAction ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>削除中…</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>完全に削除する</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 📇 観測戦歴カード ポップアップモーダル（createPortalで画面中央に美麗表示） */}
      {viewingUserCard && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setViewingUserCard(null)}
          className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-3xl w-full my-auto text-left relative"
          >
            <div className="flex items-center justify-between pb-2 mb-2 px-2 text-white">
              <div className="flex items-center gap-2">
                <span className="text-xl">📇</span>
                <span className="font-bold text-sm sm:text-base">観測戦歴ライセンスカード</span>
                <span className="text-xs font-mono text-sky-400 bg-sky-500/15 px-2 py-0.5 rounded-full border border-sky-400/30">
                  {viewingUserCard.observerName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingUserCard(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full bg-slate-900 border border-slate-700 hover:bg-slate-800 cursor-pointer transition-colors"
                title="閉じる"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ResultCard
              formData={viewingUserCard}
              onScrollToBoard={() => setViewingUserCard(null)}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
