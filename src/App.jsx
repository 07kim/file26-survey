import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  CAST_MEMBERS,
  OPTIONS,
  MATRIX,
  ROUTE_COLOR,
  WORDS,
  SCENES,
  TOTAL_SCENES,
  generateObsCode
} from './data/storyData';
import Header from './components/Header';
import ResultCard from './components/ResultCard';
import ArchiveGallery from './components/ArchiveGallery';
import CrossTalkBoard from './components/CrossTalkBoard';
import CharacterRoom from './components/CharacterRoom';
import CardShareView from './components/CardShareView';
import AdminDashboard from './components/AdminDashboard';
import GoogleAuthButton from './components/GoogleAuthButton';
import { sheetApi } from './services/sheetApi';
import { Map as MapIcon, X as CloseIcon, ZoomIn } from 'lucide-react';

const CONFIG = {
  ENDPOINT: "https://script.google.com/macros/s/AKfycbzSIoQ0twEVCQvCAslmO-ka1FMUEwzv5ONeS2mKmJoPr_LdWAuV89EhzkGHe-iftQ5L/exec",
  FORM_KEY: "kanso-26094-xyz",
  EVENT_ID: "26__094"
};

// 選択可能な人物リスト（森野などの非選択キャラクターを除く）
const SELECTABLE_PEOPLE = CAST_MEMBERS.filter(c => c.isSelectable !== false);

// 初期回答定義
const DEFAULT_ANSWERS = {
  role: "",
  grade: "",
  gradeOther: "",
  name: "",
  realName: "",
  prep: "",
  loop1: "",
  loop1Seen: [],
  loop2: "",
  loop2Seen: [],
  loop3: "",
  loop3Seen: [],
  routeComment: "", // ◈ 選択したルート専用の感想・考察（任意）
  privateImpressions: "", // ◈ Q15: 感想（非公開）
  impressions: "", // ◈ Q17: 全体の感想（自由記述・必須・公開）
  scenes: [],
  missed: "",
  overall: 50,
  matrix: {},
  length: "",
  lengthOther: "",
  again: "",
  againOther: "",
  futureRoles: [],
  futureRolesOther: "",
  best: "",
  word: "",
  improve: "",
  msg: "",
  characterComments: {},
  characterPrivateFlags: {},
  favoriteCast: "",
  hp: ""
};

// マトリクス評価データの安全なパース
const parseMatrixData = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === 'object' && parsed !== null) return parsed;
      } catch (e) {}
    }
    const obj = {};
    // カンマ、読点、改行、セミコロンで分割
    const parts = trimmed.split(/[,、;\n]\s*/);
    parts.forEach(part => {
      const [k, v] = part.split(/[=:=：]/);
      if (k && v) {
        const rawKey = k.trim();
        // 全角数字を半角に変換
        const numStr = v.trim().replace(/[０-５]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
        const score = Number(numStr);
        if (!isNaN(score) && score >= 1 && score <= 5) {
          // MATRIX定義と照合
          const matched = MATRIX.find(m => 
            m.key === rawKey || 
            m.label === rawKey || 
            rawKey.includes(m.label) || 
            (m.key === 'world' && (rawKey.includes('世界観') || rawKey.includes('空間'))) ||
            (m.key === 'act' && (rawKey === 'acting' || rawKey.includes('演者') || rawKey.includes('演技') || rawKey.includes('キャラクター'))) ||
            (m.key === 'story' && (rawKey.includes('物語') || rawKey.includes('ストーリー') || rawKey.includes('わかりやすさ'))) ||
            (m.key === 'guide' && (rawKey.includes('順路') || rawKey.includes('導線') || rawKey.includes('案内'))) ||
            (m.key === 'docs' && (rawKey.includes('配布物') || rawKey.includes('あらすじ') || rawKey.includes('相関図'))) ||
            (m.key === 'rule' && (rawKey.includes('観測者') || rawKey.includes('ルール'))) ||
            (m.key === 'ipad' && (rawKey.includes('iPad') || rawKey.includes('操作感') || rawKey.includes('端末')))
          );
          if (matched) {
            obj[matched.key] = score;
          } else if (rawKey) {
            obj[rawKey] = score;
          }
        }
      }
    });
    return obj;
  }
  return {};
};

// 次回希望役割データの安全なパース
const parseFutureRolesData = (raw) => {
  if (!raw) return { roles: [], other: '' };
  
  let roles = [];
  let otherText = '';

  const processItem = (item) => {
    if (!item) return;
    let s = item.toString().trim();
    if (!s) return;

    // （その他: 〇〇）の抽出
    const otherMatch = s.match(/[（(]その他[:：]?\s*(.*?)[）)]/);
    if (otherMatch) {
      otherText = otherMatch[1] ? otherMatch[1].trim() : '';
      s = s.replace(/[（(]その他[:：]?\s*.*?[）)]/, '').trim();
    }

    const tokens = s.split(/[,、]/).map(t => t.trim()).filter(Boolean);
    tokens.forEach(tok => {
      // 英語IDそのもののマッチ
      const byId = OPTIONS.futureRoles.find(opt => opt.id === tok);
      if (byId) {
        if (!roles.includes(byId.id)) roles.push(byId.id);
        return;
      }

      // 日本語ラベルまたは部分一致
      const matched = OPTIONS.futureRoles.find(opt => 
        opt.label === tok || 
        tok.includes(opt.label) || 
        (opt.id === 'participant' && tok.includes('参加者')) ||
        (opt.id === 'cast' && (tok.includes('演者') || tok.includes('キャスト'))) ||
        (opt.id === 'director' && (tok.includes('企画') || tok.includes('演出') || tok.includes('脚本'))) ||
        (opt.id === 'staff' && (tok.includes('スタッフ') || tok.includes('運営'))) ||
        (opt.id === 'tech' && (tok.includes('技術') || tok.includes('システム'))) ||
        (opt.id === 'design' && (tok.includes('デザイン') || tok.includes('美術'))) ||
        (opt.id === 'other' && tok.includes('その他'))
      );
      if (matched) {
        if (!roles.includes(matched.id)) roles.push(matched.id);
      } else if (tok === 'その他' || otherText) {
        if (!roles.includes('other')) roles.push('other');
      }
    });
  };

  if (Array.isArray(raw)) {
    raw.forEach(processItem);
  } else {
    processItem(raw);
  }

  if (otherText && !roles.includes('other')) {
    roles.push('other');
  }

  return { roles, other: otherText };
};

// 「その他（〇〇）」形式の選択肢データを安全にパース
const parseOptionWithOther = (raw) => {
  if (!raw) return { value: '', other: '' };
  const s = raw.toString().trim();
  const match = s.match(/^(?:その他|other)[（(](.*?)[）)]$/i) || s.match(/^(.*?)[（(](.*?)[）)]$/);
  if (match) {
    return { 
      value: 'その他', 
      other: match[2] ? match[2].trim() : (match[1] ? match[1].trim() : '') 
    };
  }
  if (s === 'その他') return { value: 'その他', other: '' };
  return { value: s, other: '' };
};

// characterCommentsからテキスト文字列と非公開フラグを安全に抽出
export const getCommentText = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val.text !== undefined) return String(val.text || '');
  return String(val);
};

export const getCommentIsPrivate = (val, fallback = false) => {
  if (typeof val === 'object' && val !== null && val.isPrivate !== undefined) {
    return Boolean(val.isPrivate);
  }
  return Boolean(fallback);
};

// answers内のcharacterCommentsとcharacterPrivateFlagsを常に正規化
export const sanitizeCharacterData = (rawComments = {}, rawFlags = {}) => {
  const cleanComments = {};
  const cleanFlags = { ...(rawFlags || {}) };

  if (rawComments && typeof rawComments === 'object') {
    Object.entries(rawComments).forEach(([cid, val]) => {
      cleanComments[cid] = getCommentText(val);
      if (typeof val === 'object' && val !== null && val.isPrivate !== undefined) {
        cleanFlags[cid] = Boolean(val.isPrivate);
      }
    });
  }
  return { comments: cleanComments, flags: cleanFlags };
};

export default function App() {
  // 回答状態（localStorageから自動復元：最新の編集内容を最優先で復元）
  const [answers, setAnswers] = useState(() => {
    try {
      const saved = localStorage.getItem('file26_survey_answers');
      if (saved) {
        const parsed = JSON.parse(saved);
        const { roles, other } = parseFutureRolesData(parsed.futureRoles);
        const gradeParsed = parseOptionWithOther(parsed.grade);
        const lengthParsed = parseOptionWithOther(parsed.length);
        const againParsed = parseOptionWithOther(parsed.again);
        const charData = sanitizeCharacterData(parsed.characterComments, parsed.characterPrivateFlags);
        return {
          ...DEFAULT_ANSWERS,
          ...parsed,
          grade: parsed.gradeOther ? parsed.grade : gradeParsed.value || parsed.grade || '',
          gradeOther: parsed.gradeOther || gradeParsed.other || '',
          length: parsed.lengthOther ? parsed.length : lengthParsed.value || parsed.length || '',
          lengthOther: parsed.lengthOther || lengthParsed.other || '',
          again: parsed.againOther ? parsed.again : againParsed.value || parsed.again || '',
          againOther: parsed.againOther || againParsed.other || '',
          matrix: parseMatrixData(parsed.matrix),
          futureRoles: roles.length > 0 ? roles : (Array.isArray(parsed.futureRoles) ? parsed.futureRoles : []),
          futureRolesOther: parsed.futureRolesOther || other || '',
          characterComments: charData.comments,
          characterPrivateFlags: charData.flags,
          overall: parsed.overall !== undefined && parsed.overall !== null && parsed.overall !== '' ? Number(parsed.overall) : 50
        };
      }
      const submitted = localStorage.getItem('file26_survey_submitted_answers');
      if (submitted) {
        const parsed = JSON.parse(submitted);
        const { roles, other } = parseFutureRolesData(parsed.futureRoles);
        const gradeParsed = parseOptionWithOther(parsed.grade);
        const lengthParsed = parseOptionWithOther(parsed.length);
        const againParsed = parseOptionWithOther(parsed.again);
        const charData = sanitizeCharacterData(parsed.characterComments, parsed.characterPrivateFlags);
        return {
          ...DEFAULT_ANSWERS,
          ...parsed,
          grade: parsed.gradeOther ? parsed.grade : gradeParsed.value || parsed.grade || '',
          gradeOther: parsed.gradeOther || gradeParsed.other || '',
          length: parsed.lengthOther ? parsed.length : lengthParsed.value || parsed.length || '',
          lengthOther: parsed.lengthOther || lengthParsed.other || '',
          again: parsed.againOther ? parsed.again : againParsed.value || parsed.again || '',
          againOther: parsed.againOther || againParsed.other || '',
          matrix: parseMatrixData(parsed.matrix),
          futureRoles: roles.length > 0 ? roles : (Array.isArray(parsed.futureRoles) ? parsed.futureRoles : []),
          futureRolesOther: parsed.futureRolesOther || other || '',
          characterComments: charData.comments,
          characterPrivateFlags: charData.flags,
          overall: parsed.overall !== undefined && parsed.overall !== null && parsed.overall !== '' ? Number(parsed.overall) : 50
        };
      }
    } catch (e) {
      console.error("Failed to load saved survey answers", e);
    }
    return DEFAULT_ANSWERS;
  });

  // 回答内容をlocalStorageにリアルタイム同期
  useEffect(() => {
    try {
      localStorage.setItem('file26_survey_answers', JSON.stringify(answers));
    } catch (e) {}
  }, [answers]);

  const [activeCommentChar, setActiveCommentChar] = useState(() => {
    return answers.favoriteCast || answers.loop1 || 'sakurai';
  });

  const [step, setStep] = useState(() => {
    try {
      const submitted = localStorage.getItem('file26_survey_submitted_answers');
      if (submitted) return 7; // 一度回答していたらカードモード(step 7)
    } catch (e) {}
    return 0;
  }); // 0=起動, 1..6, 7=完了
  const [currentTab, setCurrentTab] = useState('survey'); // 'survey' | 'card' | 'crosstalk' | 'characters' | 'gallery'
  const [theme] = useState('dark');
  const [warnMsg, setWarnMsg] = useState("");
  const [isGlitching, setIsGlitching] = useState(false);
  const [isShake, setIsShake] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fallbackData, setFallbackData] = useState(null);
  const [startedAt] = useState(Date.now());
  const [copySuccess, setCopySuccess] = useState(false);
  const [isMissedDropdownOpen, setIsMissedDropdownOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [sharedCardData, setSharedCardData] = useState(null);
  const [cloudSaveStatus, setCloudSaveStatus] = useState("saved"); // "saving" | "saved" | "idle"

  // スプレッドシートDBから取得したリアルデータ
  const [serverData, setServerData] = useState({
    surveys: [],
    crossTalk: [],
    castNotes: [],
    replies: {}
  });

  const hasInitialSynced = useRef(false);

  // スプレッドシートから全データを取得
  useEffect(() => {
    sheetApi.setEndpoint(CONFIG.ENDPOINT);
    sheetApi.fetchAllData().then(res => {
      if (res.ok) {
        const surveys = res.surveys || [];
        setServerData({
          surveys: surveys,
          crossTalk: res.crossTalk || [],
          castNotes: res.castNotes || [],
          replies: res.replies || {}
        });
        // 初回ロード時のみ、ログイン中のGoogleアカウントがあればクラウドから回答記録を復元
        if (!hasInitialSynced.current) {
          hasInitialSynced.current = true;
          syncUserFromCloud(surveys, false);
        }
      }
    });
  }, []);

  // Googleアカウントによるクラウド回答・進捗の自動復元（編集中の上書き・強制Step7戻りを防止）
  const syncUserFromCloud = async (surveysList, forceStepChange = true) => {
    try {
      const stored = localStorage.getItem('file26_google_user');
      if (!stored) return;
      const user = JSON.parse(stored);
      if (!user || !user.email) return;

      const userEmail = user.email.trim().toLowerCase();
      const list = surveysList || serverData.surveys || [];
      const found = list.find(s => s.googleEmail && s.googleEmail.toString().trim().toLowerCase() === userEmail);

      // キャストIDの逆引き（名前からIDへ）
      const findCastIdByName = (nameStr) => {
        if (!nameStr) return '';
        const c = CAST_MEMBERS.find(x => nameStr.includes(x.name.split(' ')[0]) || nameStr.includes(x.lastName || x.name));
        return c ? c.id : '';
      };

      // ユーザーがすでに回答編集中（step 1〜6）の場合は、回答内容やステップを勝手に上書き・強制遷移しない
      if (found) {
        // 1. 提出済み回答が存在する場合
        const parsedFutureRoles = parseFutureRolesData(found.futureRoles);
        const gradeParsed = parseOptionWithOther(found.grade);
        const lengthParsed = parseOptionWithOther(found.length);
        const againParsed = parseOptionWithOther(found.again);
        const restoredAnswers = {
          role: found.role || '',
          grade: gradeParsed.value || found.grade || '',
          gradeOther: gradeParsed.other || '',
          name: found.name || found.observerName || '',
          realName: found.realName || '',
          prep: found.prep || '',
          loop1: findCastIdByName(found.loop1) || found.loop1 || '',
          loop1Seen: Array.isArray(found.loop1Seen) ? found.loop1Seen.map(findCastIdByName).filter(Boolean) : [],
          loop2: findCastIdByName(found.loop2) || found.loop2 || '',
          loop2Seen: Array.isArray(found.loop2Seen) ? found.loop2Seen.map(findCastIdByName).filter(Boolean) : [],
          loop3: findCastIdByName(found.loop3) || found.loop3 || '',
          loop3Seen: Array.isArray(found.loop3Seen) ? found.loop3Seen.map(findCastIdByName).filter(Boolean) : [],
          routeComment: found.routeComment || '',
          impressions: found.impressions || (found.routeComment && found.impressions === undefined ? '' : found.impressions) || '',
          scenes: Array.isArray(found.scenes) ? found.scenes : (found.scenes ? found.scenes.toString().split(',') : []),
          missed: Array.isArray(found.missed) ? found.missed.join(',') : (found.missed || ''),
          overall: found.overall !== undefined && found.overall !== null && found.overall !== '' ? Number(found.overall) : 50,
          matrix: parseMatrixData(found.matrix),
          length: lengthParsed.value || found.length || '',
          lengthOther: lengthParsed.other || '',
          again: againParsed.value || found.again || '',
          againOther: againParsed.other || '',
          futureRoles: parsedFutureRoles.roles,
          futureRolesOther: parsedFutureRoles.other,
          best: found.best || '',
          word: found.word || '',
          improve: found.improve || '',
          msg: found.msg || '',
          characterComments: sanitizeCharacterData(found.characterComments, found.characterPrivateFlags).comments,
          characterPrivateFlags: sanitizeCharacterData(found.characterComments, found.characterPrivateFlags).flags,
          favoriteCast: findCastIdByName(found.favoriteCast) || found.favoriteCast || '',
          hp: ''
        };

        // 編集中（step 1〜6）の場合は、回答内容やステップを一切上書きしない
        setStep(currentStep => {
          if (currentStep === 0 || (forceStepChange && (currentStep === 7 || currentStep === 0))) {
            setAnswers(prev => ({ ...prev, ...restoredAnswers }));
            localStorage.setItem('file26_survey_answers', JSON.stringify(restoredAnswers));
            return 7;
          }
          return currentStep;
        });
      } else {
        // 2. 提出済みがない場合 ➔ サーバー上の下書き（途中進捗）を確認
        const draft = await sheetApi.getDraft(userEmail);
        if (draft && draft.answers && typeof draft.answers === 'object') {
          const draftRoles = parseFutureRolesData(draft.answers.futureRoles);
          const draftCharData = sanitizeCharacterData(draft.answers.characterComments, draft.answers.characterPrivateFlags);
          const sanitizedDraft = {
            ...DEFAULT_ANSWERS,
            ...draft.answers,
            matrix: parseMatrixData(draft.answers.matrix),
            futureRoles: draftRoles.roles.length > 0 ? draftRoles.roles : (Array.isArray(draft.answers.futureRoles) ? draft.answers.futureRoles : []),
            futureRolesOther: draft.answers.futureRolesOther || draftRoles.other || '',
            characterComments: draftCharData.comments,
            characterPrivateFlags: draftCharData.flags,
            overall: draft.answers.overall !== undefined && draft.answers.overall !== null && draft.answers.overall !== '' ? Number(draft.answers.overall) : 50
          };
          setStep(currentStep => {
            if (currentStep === 0 || (forceStepChange && (currentStep === 7 || currentStep === 0))) {
              setAnswers(prev => ({ ...prev, ...sanitizedDraft }));
              localStorage.setItem('file26_survey_answers', JSON.stringify(sanitizedDraft));
              return Math.max(1, Math.min(6, Number(draft.step) || 1));
            }
            return currentStep;
          });
        }
      }
    } catch (err) {
      console.warn("Cloud sync error:", err);
    }
  };

  // Googleログイン時のみ明示的に同期（無限storageループを完全根絶）
  useEffect(() => {
    const handleGoogleLogin = () => {
      syncUserFromCloud(serverData.surveys, true);
    };
    window.addEventListener('google-user-login', handleGoogleLogin);
    return () => {
      window.removeEventListener('google-user-login', handleGoogleLogin);
    };
  }, [serverData.surveys]);

  // ☁️ クラウド自動保存（Googleログイン中かつStep1〜6の回答中、デバウンス1.8秒で自動保存）
  useEffect(() => {
    if (step < 1 || step > 6) return;
    const stored = localStorage.getItem('file26_google_user');
    if (!stored) return;

    let user = null;
    try {
      user = JSON.parse(stored);
    } catch (e) {}
    if (!user || !user.email) return;

    setCloudSaveStatus("saving");
    const timer = setTimeout(async () => {
      try {
        await sheetApi.saveDraft({
          email: user.email,
          name: answers.name || answers.realName || user.name || '観測者',
          step: step,
          answers: answers
        });
        setCloudSaveStatus("saved");
      } catch (e) {
        setCloudSaveStatus("idle");
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [answers, step]);

  // テーマのDOM反映（常にダークモード）
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
    localStorage.setItem('file26_theme', 'dark');
  }, []);

  const handleToggleTheme = () => {
    // ダークモード固定
  };

  // URLパラメータ（?tab=card 等）からの初期タブ・共有カードデータの読み取り
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') || params.get('mode') || params.get('view');
    const isCardMode = params.get('card') || tabParam === 'card';

    // 共有URLにカードパラメータが含まれている場合の抽出（実際にパラメータが存在する場合のみ）
    if (params.get('name') && params.get('l1')) {
      const parsedData = {
        observerName: params.get('name') || 'OBSERVER #094',
        grade: params.get('grade') || '2年',
        customAvatar: params.get('avatar') || '',
        loopTrack: {
          loop1: params.get('l1') || 'yada',
          loop2: params.get('l2') || 'jinnai',
          loop3: params.get('l3') || 'yada'
        },
        loop1Seen: ['sakurai', 'nanase'],
        loop2Seen: ['sagisaka'],
        loop3Seen: ['shimoyamada', 'watanabe'],
        favoriteCast: params.get('fav') || params.get('l1') || 'yada',
        scenes: ['s1', 's2', 's3', 's4', 's6', 's8', 's10'],
        sceneCount: 7,
        sceneRate: 70,
        syncRate: Number(params.get('sync')) || 94,
        primaryRoute: params.get('l1') || 'yada',
        role: '観測者',
        route: '特異点観測ルート',
        best: params.get('w') || 'あの日、確かに存在した世界線の記憶',
        word: params.get('w') || '観測されたぶんだけ世界は存在する',
        highlightScene: params.get('w') || '観測されたぶんだけ世界は存在する',
        publicComment: params.get('w') || '観測されたぶんだけ世界は存在する'
      };
      setSharedCardData(parsedData);
    }

    if (tabParam) {
      if (['card', 'license', 'share'].includes(tabParam.toLowerCase())) {
        setCurrentTab('card');
      } else if (['crosstalk', 'community', 'board', 'talk'].includes(tabParam.toLowerCase())) {
        setCurrentTab('crosstalk');
      } else if (['characters', 'cast', 'room', 'character'].includes(tabParam.toLowerCase())) {
        setCurrentTab('characters');
      } else if (['gallery', 'archive'].includes(tabParam.toLowerCase())) {
        setCurrentTab('gallery');
      } else if (['admin', 'manage', 'dashboard', 'console'].includes(tabParam.toLowerCase())) {
        setCurrentTab('admin');
      } else if (['survey', 'form', 'log'].includes(tabParam.toLowerCase())) {
        setCurrentTab('survey');
      }
    }
  }, []);

  const [toastAlert, setToastAlert] = useState("");
  const showToast = (msg) => {
    setToastAlert(msg);
    setTimeout(() => setToastAlert(""), 3500);
  };

  // 🕵️‍♂️ 640157 入力によるバイパスアンロック判定
  const [isBypassUnlocked, setIsBypassUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem('file26_admin_auth') === 'true' || localStorage.getItem('file26_bypass_unlock') === 'true';
    } catch (e) {
      return false;
    }
  });

  // アンケート入力欄に「640157」が入力された瞬間に検知して全タブをアンロック
  useEffect(() => {
    const checkPass = '640157';
    const hasCode = Object.values(answers || {}).some(val => {
      if (typeof val === 'string' && val.trim() === checkPass) return true;
      if (typeof val === 'object' && val !== null) {
        return Object.values(val).some(nested => typeof nested === 'string' && nested.trim() === checkPass);
      }
      return false;
    });

    if (hasCode && !isBypassUnlocked) {
      setIsBypassUnlocked(true);
      try {
        sessionStorage.setItem('file26_admin_auth', 'true');
        localStorage.setItem('file26_bypass_unlock', 'true');
      } catch (e) {}
      showToast("🔓 管理コード『640157』が認証されました。全タブのロックを解除しました！");
    }
  }, [answers, isBypassUnlocked]);

  // 観測記録提出済みかどうかの判定（提出完了、過去提出済、共有カード閲覧、管理者、640157バイパス）
  const isSurveyCompleted = (
    step === 7 ||
    Boolean(sharedCardData) ||
    Boolean(localStorage.getItem('file26_survey_submitted_answers')) ||
    isBypassUnlocked ||
    sessionStorage.getItem('file26_admin_auth') === 'true' ||
    localStorage.getItem('file26_bypass_unlock') === 'true'
  );

  const handleTabChange = (newTab) => {
    // 観測記録未提出時は他のタブへのアクセスを制限（640157認証済みの場合はフリーアクセス）
    if (!isSurveyCompleted && !['survey', 'card', 'admin'].includes(newTab)) {
      showToast("🔒 アンケートを送信すると、感想やキャラ紹介、写真が解放されます。");
      return;
    }

    if (newTab === 'survey') {
      try {
        const submitted = localStorage.getItem('file26_survey_submitted_answers');
        if (submitted && step === 0) {
          setStep(7); // 回答済みならカード画面で表示
        }
      } catch (e) {}
    }

    setCurrentTab(newTab);
    const url = new URL(window.location.href);
    if (newTab === 'survey') {
      url.searchParams.delete('tab');
      url.searchParams.delete('mode');
      url.searchParams.delete('view');
    } else {
      url.searchParams.set('tab', newTab);
    }
    window.history.replaceState(null, '', url.toString());
  };

  // アクセントカラーの連動
  const setAccent = (c) => {
    const r = document.documentElement.style;
    r.setProperty("--accent", c);
    r.setProperty("--accent-soft", hexA(c, 0.2));
  };

  const hexA = (h, a) => {
    const m = h.replace("#", "");
    const n = parseInt(m, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };

  // バリデーション（全項目をしっかり回答してもらう方式）
  const validate = (n) => {
    if (n === 1) {
      if (!answers.role) return "Q01：ご来場区分が選ばれていません";
      if (!answers.realName || !answers.realName.trim()) return "Q02：氏名（お名前）を入力してください";
      if (!answers.grade) return "Q03：学年・所属を選択してください";
      if (answers.grade === "その他" && (!answers.gradeOther || !answers.gradeOther.trim())) return "Q03：学年・所属の具体的内容を入力してください";
      if (!answers.prep) return "Q04：配布物についてお答えください";
    }
    if (n === 2) {
      if (!answers.loop1) return "Q05：1周目の追跡対象が選ばれていません";
      if (!answers.loop2) return "Q06：2周目の追跡対象が選ばれていません";
      if (!answers.loop3) return "Q07：3周目の追跡対象が選ばれていません";
    }
    if (n === 3) {
      if (answers.scenes.length === 0) return "Q08：観測できた場面をひとつ以上選んでください";
    }
    if (n === 4) {
      if (answers.overall === null || answers.overall === undefined) return "Q10：観測強度のつまみを動かしてください";
      const rest = MATRIX.filter(m => !answers.matrix[m.key]);
      if (rest.length) return `Q11：「${rest[0].label}」が未評価です`;
      if (!answers.length) return "Q12：体験時間についてお答えください";
      if (!answers.again) return "Q13：次回の参加意向をお答えください";
      if (!answers.futureRoles || answers.futureRoles.length === 0) return "Q14：次回参加・関わり方の希望役割を選んでください";
    }
    if (n === 5) {
      if (!answers.word?.trim()) {
        return "Q16：公開用感想の「タイトル」を入力してください";
      }
      if (!answers.impressions?.trim()) {
        return "Q16：公開用感想の「自由記述」を入力してください";
      }
      if (!answers.best?.trim()) {
        return "Q17：いちばん忘れられない場面・セリフを入力してください";
      }
      if (!answers.favoriteCast) {
        return "Q19：最も心惹かれた人物（推しキャラ）を1人選んでください";
      }
    }
    return "";
  };

  // 全ステップの完全バリデーション（全項目が埋まっているか検証）
  const validateAll = () => {
    for (let s = 1; s <= 5; s++) {
      const err = validate(s);
      if (err) {
        return { step: s, message: err };
      }
    }
    return null;
  };

  const showStep = (n, glitch = false) => {
    setWarnMsg("");
    setStep(n);
    window.scrollTo({ top: 0, behavior: "instant" });
    if (glitch) {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 430);
    }
  };

  // 途中保存（下書き）機能
  const handleSaveDraft = () => {
    try {
      localStorage.setItem('file26_survey_answers', JSON.stringify(answers));
      showToast("💾 入力内容を一時保存しました！後からいつでも再開できます");
    } catch (e) {
      showToast("⚠️ 保存に失敗しました");
    }
  };

  const handleNext = () => {
    // 🕵️‍♂️ 裏技ギミック: 氏名(realName) または ニックネーム(name) に「640157」を入れて「次へ」を押した場合
    if (
      (answers.realName && answers.realName.trim() === '640157') ||
      (answers.name && answers.name.trim() === '640157')
    ) {
      sessionStorage.setItem('file26_admin_auth', 'true');
      setWarnMsg("");
      showToast("🔑 管理者アクセスコードが認証されました。管理ダッシュボードへ移動します…");
      setTimeout(() => {
        handleTabChange('admin');
      }, 400);
      return;
    }

    if (step === 6) {
      // 送信前に全ステップの未入力項目を網羅チェック
      const missing = validateAll();
      if (missing) {
        showStep(missing.step, true);
        setWarnMsg(missing.message);
        showToast(`⚠️ 未回答の項目があります：SECTION 0${missing.step}（${missing.message}）`);
        setIsShake(true);
        setTimeout(() => setIsShake(false), 420);
        return;
      }
      handleSubmit();
      return;
    }

    const miss = validate(step);
    if (miss) {
      setWarnMsg(miss);
      showToast(`⚠️ ${miss}`);
      setIsShake(true);
      setTimeout(() => setIsShake(false), 420);
      return;
    }
    showStep(step + 1, false);
  };

  const handlePrev = () => {
    setWarnMsg("");
    showStep(step - 1, false);
  };

  const nameOf = (castId) => {
    const c = CAST_MEMBERS.find(x => x.id === castId);
    return c ? c.name : "—";
  };

  const namesOf = (ids) => {
    if (!ids || ids.length === 0) return "";
    return ids.map(id => {
      const c = CAST_MEMBERS.find(x => x.id === id);
      return c ? c.name.split(' ')[0] : id;
    }).filter(Boolean).join("、");
  };

  const obsCode = generateObsCode(
    { loop1: answers.loop1, loop2: answers.loop2, loop3: answers.loop3 },
    answers.scenes.length
  );

  const sceneRate = Math.round((answers.scenes.length / TOTAL_SCENES) * 100);

  // 送信処理
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const payload = {
      eventId: CONFIG.EVENT_ID,
      obsCode: obsCode,
      role: answers.role,
      grade: answers.grade === "その他" ? (answers.gradeOther ? `その他（${answers.gradeOther}）` : "その他") : answers.grade || "その他",
      route: "",
      prep: answers.prep,
      loop1: nameOf(answers.loop1),
      loop1Seen: namesOf(answers.loop1Seen),
      loop2: nameOf(answers.loop2),
      loop2Seen: namesOf(answers.loop2Seen),
      loop3: nameOf(answers.loop3),
      loop3Seen: namesOf(answers.loop3Seen),
      sceneCount: answers.scenes.length,
      sceneTotal: TOTAL_SCENES,
      sceneRate: sceneRate,
      scenes: answers.scenes.join(","),
      missed: answers.missed || "",
      overall: answers.overall,
      matrix: answers.matrix,
      length: answers.length === "その他" ? (answers.lengthOther ? `その他（${answers.lengthOther}）` : "その他") : answers.length,
      again: answers.again === "その他" ? (answers.againOther ? `その他（${answers.againOther}）` : "その他") : answers.again,
      futureRoles: (answers.futureRoles || []).map(rId => {
        const found = OPTIONS.futureRoles.find(f => f.id === rId);
        return found ? found.label : rId;
      }).join(",") + (answers.futureRolesOther ? `（その他: ${answers.futureRolesOther}）` : ""),
      routeComment: answers.routeComment || "",
      impressions: answers.impressions || "",
      best: answers.best || "",
      word: answers.word || "",
      improve: answers.improve || "",
      msg: answers.msg || "",
      characterComments: (() => {
        const formatted = {};
        Object.entries(answers.characterComments || {}).forEach(([cid, val]) => {
          const text = typeof val === 'object' && val !== null ? val.text : val;
          const isPrivate = typeof val === 'object' && val !== null ? !!val.isPrivate : !!answers.characterPrivateFlags?.[cid];
          if (text && String(text).trim()) {
            formatted[cid] = {
              text: String(text).trim(),
              isPrivate: isPrivate
            };
          }
        });
        return formatted;
      })(),
      characterPrivateFlags: answers.characterPrivateFlags || {},
      favoriteCast: nameOf(answers.favoriteCast),
      name: answers.name,
      realName: answers.realName,
      // Google アカウント認証連携情報
      googleEmail: localStorage.getItem('file26_google_user') ? JSON.parse(localStorage.getItem('file26_google_user')).email : '',
      googleName: localStorage.getItem('file26_google_user') ? JSON.parse(localStorage.getItem('file26_google_user')).name : '',
      googleVerified: localStorage.getItem('file26_google_user') ? true : false,
      googleUser: localStorage.getItem('file26_google_user') ? JSON.parse(localStorage.getItem('file26_google_user')) : null
    };

    if (!/^https:\/\/script\.google\.com\//.test(CONFIG.ENDPOINT)) {
      // 未設定/テストモード
      setTimeout(() => {
        try {
          localStorage.setItem('file26_survey_submitted_answers', JSON.stringify(payload));
        } catch (e) {}
        setIsSubmitting(false);
        showToast("観測記録を提出しました。他タブ（感想・キャラ手記・カード一覧）が解放されました。");
        showStep(7, false);
      }, 600);
      return;
    }

    try {
      const r = await fetch(CONFIG.ENDPOINT, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          key: CONFIG.FORM_KEY,
          hp: answers.hp,
          elapsed: Date.now() - startedAt,
          data: payload
        })
      });
      const j = await r.json().catch(() => ({ ok: r.ok }));
      if (!j.ok) throw new Error(j.error || "ng");
      try {
        localStorage.setItem('file26_survey_submitted_answers', JSON.stringify(payload));
      } catch (e) {}
      setIsSubmitting(false);
      if (j.isUpdate) {
        showToast("回答記録を最新の内容に更新しました。全タブが閲覧可能です。");
      } else {
        showToast("観測記録を提出しました。他タブ（感想・キャラ手記・カード一覧）が解放されました。");
      }
      showStep(7, false);
    } catch (err) {
      setFallbackData(payload);
      setWarnMsg("送信に失敗しました。通信環境をご確認のうえ、もう一度お試しください。");
      setIsSubmitting(false);
    }
  };

  // 別の回答を新しく送信する
  const handleNewResponse = () => {
    const ok = window.confirm(
      '別の回答を新しく送信しますか？\n\n現在の回答ログとは別に、新しい観測ログ（別のルートや回答内容）を最初から作成・送信できます。'
    );
    if (!ok) return;

    let gUser = null;
    try {
      const raw = localStorage.getItem('file26_google_user');
      if (raw) gUser = JSON.parse(raw);
    } catch (e) {}

    const newAnswers = {
      ...DEFAULT_ANSWERS,
      name: gUser?.name || '',
      email: gUser?.email || '',
      grade: gUser ? '4年' : '',
      googleUser: gUser
    };

    setAnswers(newAnswers);
    try {
      localStorage.setItem('file26_survey_answers', JSON.stringify(newAnswers));
      localStorage.removeItem('file26_survey_submitted_answers');
    } catch (e) {}

    showStep(1, false);
    setCurrentTab('survey');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getWordForValue = (v) => {
    let w = WORDS[0][1];
    for (let i = 0; i < WORDS.length; i++) {
      if (v >= WORDS[i][0]) w = WORDS[i][1];
    }
    return w;
  };

  // 未選択シーン（心残り）
  const unselectedScenes = [];
  SCENES.forEach(g => {
    g.items.forEach(item => {
      if (!answers.scenes.includes(item.id)) {
        unselectedScenes.push({
          id: item.id,
          loop: g.loop,
          time: item.time,
          place: item.place,
          title: item.title,
          desc: item.desc,
          casts: item.casts || [],
          label: `${g.loop} ${item.time}／${item.place}／${item.title}`
        });
      }
    });
  });

  return (
    <>
      {/* 🔒 トースト通知（ヘッダー直下に表示） */}
      {toastAlert && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[99999] bg-slate-900/95 border border-sky-500/50 text-sky-200 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-2xl shadow-2xl flex items-start gap-2 backdrop-blur-md pointer-events-none max-w-[96vw] leading-snug">
          <span className="text-left break-words">{toastAlert}</span>
        </div>
      )}

      {/* ── 最上部 機密ポータルナビゲーションヘッダー ───────────────────────── */}
      <Header
        currentStep={step}
        totalSteps={6}
        currentTab={currentTab}
        setTab={handleTabChange}
        isUnlocked={isSurveyCompleted}
      />

      <div className={currentTab === 'survey' && step < 7 ? 'wrap' : 'wrap-wide'}>
        {/* 観測記録タブ（回答前ならアンケートフォーム、回答完了後または共有時は戦歴カード） */}
        {(currentTab === 'card' && sharedCardData) || (currentTab === 'survey' && step === 7) || (currentTab === 'card' && step === 7) ? (
          <div style={{ paddingTop: '10px' }}>
            <CardShareView
              cardData={sharedCardData || (step === 7 ? {
                observerName: answers.name || 'OBSERVER',
                grade: answers.grade || 'その他',
                loopTrack: { loop1: answers.loop1, loop2: answers.loop2, loop3: answers.loop3 },
                loop1Seen: answers.loop1Seen,
                loop2Seen: answers.loop2Seen,
                loop3Seen: answers.loop3Seen,
                favoriteCast: answers.favoriteCast,
                scenes: answers.scenes,
                sceneCount: answers.scenes.length,
                sceneRate: sceneRate,
                syncRate: answers.overall,
                primaryRoute: answers.loop1,
                role: answers.role,
                route: answers.route,
                best: answers.best,
                word: answers.word,
                highlightScene: answers.best || answers.word,
                publicComment: answers.word || answers.best
              } : null)}
              onGoToSurvey={() => {
                setStep(1);
                handleTabChange('survey');
              }}
              onNewResponse={handleNewResponse}
              onGoToCrosstalk={() => handleTabChange('crosstalk')}
              onGoToCharacters={() => handleTabChange('characters')}
            />
          </div>
        ) : currentTab === 'gallery' ? (
          <div style={{ paddingTop: '10px' }}>
            <ArchiveGallery
              serverResponses={serverData.surveys}
              userCardData={step === 7 ? {
                obsCode: obsCode,
                observerName: answers.name || 'OBSERVER',
                grade: answers.grade || 'その他',
                loopTrack: { loop1: answers.loop1, loop2: answers.loop2, loop3: answers.loop3 },
                scenes: answers.scenes,
                syncRate: answers.overall,
                best: answers.best,
                word: answers.word,
                stamps: {}
              } : null}
            />
          </div>
        ) : currentTab === 'crosstalk' ? (
          <div style={{ paddingTop: '10px' }}>
            {(() => {
              let gUser = null;
              try {
                const raw = localStorage.getItem('file26_google_user');
                if (raw) gUser = JSON.parse(raw);
              } catch (e) {}
              return (
                <CrossTalkBoard
                  serverPosts={serverData.crossTalk}
                  serverResponses={serverData.surveys}
                  serverReplies={serverData.replies || {}}
                  onGoToAdmin={() => handleTabChange('admin')}
                  onUpdateFormData={setAnswers}
                  formData={{
                    obsCode: obsCode,
                    observerName: answers.name || 'OBSERVER',
                    name: answers.name || '',
                    googleEmail: gUser?.email || '',
                    googlePicture: gUser?.picture || '',
                    grade: answers.grade || 'その他',
                    primaryRoute: answers.loop1,
                    loopTrack: { loop1: answers.loop1, loop2: answers.loop2, loop3: answers.loop3 },
                    favoriteCast: answers.favoriteCast,
                    syncRate: answers.overall,
                    publicComment: answers.impressions || answers.word || answers.best || answers.routeComment || '',
                    characterComments: answers.characterComments || {}
                  }}
                />
              );
            })()}
          </div>
        ) : currentTab === 'characters' ? (
          <div style={{ paddingTop: '10px' }}>
            <CharacterRoom
              userAnswers={{
                ...answers,
                obsCode: obsCode || (localStorage.getItem('file26_survey_submitted_answers') ? JSON.parse(localStorage.getItem('file26_survey_submitted_answers')).obsCode : ''),
                googleEmail: localStorage.getItem('file26_google_user') ? JSON.parse(localStorage.getItem('file26_google_user')).email : '',
              }}
              serverResponses={serverData.surveys}
              onSetFavoriteCast={(newFav) => {
                setAnswers(prev => ({ ...prev, favoriteCast: newFav }));
              }}
              onUpdateFormData={(updates) => {
                setAnswers(prev => ({ ...prev, ...updates }));
                // サーバーレスポンス側のキャッシュも即時更新してタイムラグをゼロにする
                if (updates.characterComments) {
                  setServerData(prev => ({
                    ...prev,
                    surveys: (prev.surveys || []).map(s => {
                      const isMe = (obsCode && s.obsCode === obsCode) || (answers.name && s.name === answers.name);
                      if (isMe) {
                        return {
                          ...s,
                          characterComments: {
                            ...(s.characterComments || {}),
                            ...updates.characterComments
                          }
                        };
                      }
                      return s;
                    })
                  }));
                }
              }}
            />
          </div>
        ) : currentTab === 'admin' ? (
          <div style={{ paddingTop: '10px' }}>
            <AdminDashboard
              endpoint={CONFIG.ENDPOINT}
              onBackToTop={() => handleTabChange('survey')}
            />
          </div>
        ) : (
          <div className={isGlitching ? "glitching" : ""}>
            {/* ═══ S0 起動 ═══ */}
            {step === 0 && (
              <section className="scr s0-container" id="s0">
                <div className="kicker">IMMERSIVE THEATER</div>
                <div className="folder"><span className="ic"></span>File:26__094</div>
                <p className="lede">
                  <span>2026/9/4 09:44、</span><span>シャトレーゼホテル韮崎の森。</span><br />
                  <span>あの日あなたは</span><span>「観測者」でした。</span><br />
                  <span>存在せず、</span><span>声を聞かれず、</span><span>誰にも触れられない。</span><br /><br />
                  <span>しかし世界は、</span><span><em>観測されたぶんだけ</em>存在します。</span><br />
                  <span>あなたが何を見たのか、</span><span>教えてください。</span>
                </p>
                <div className="rule" style={{ textAlign: "left" }}>
                  ・あなたが見た世界線の記録を教えてください<br />
                  ・提出後、周回ログを刻んだ「観測戦歴カード」が発行されます
                </div>
                <button
                  className="btn big"
                  type="button"
                  onClick={() => showStep(1, false)}
                >
                  黒いマスクを外す
                </button>
                <p className="tiny" style={{ textAlign: "center", marginTop: "14px" }}>
                  ＞ 観測は終了しました。記録の提出をお願いします。
                </p>
              </section>
            )}

            {/* ☁️ Googleフォーム風 クラウド自動保存ステータスバー ＆ 編集案内 */}
            {step >= 1 && step <= 6 && (
              <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* ── 🚀 回答進捗ステップナビゲーション（ワンクリックで自由移動） ── */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '12px',
                  padding: '6px',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: '4px'
                  }}>
                    {[
                      { num: 1, label: '観測者' },
                      { num: 2, label: '追跡' },
                      { num: 3, label: '場面' },
                      { num: 4, label: '評価' },
                      { num: 5, label: '感想' },
                      { num: 6, label: '確認' }
                    ].map(s => {
                      const isActive = step === s.num;
                      const isPast = step > s.num;
                      return (
                        <button
                          key={s.num}
                          type="button"
                          onClick={() => showStep(s.num, false)}
                          style={{
                            padding: '8px 2px',
                            borderRadius: '8px',
                            border: isActive
                              ? '1px solid #38bdf8'
                              : isPast
                              ? '1px solid rgba(56, 189, 248, 0.3)'
                              : '1px solid rgba(255, 255, 255, 0.05)',
                            background: isActive
                              ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.35), rgba(2, 132, 199, 0.45))'
                              : isPast
                              ? 'rgba(56, 189, 248, 0.08)'
                              : 'rgba(255, 255, 255, 0.02)',
                            color: isActive ? '#ffffff' : isPast ? '#bae6fd' : '#64748b',
                            fontSize: '11px',
                            fontWeight: isActive ? 800 : 600,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px',
                            transition: 'all 0.15s ease',
                            minWidth: '0'
                          }}
                          title={`SECTION 0${s.num}（${s.label}）へ移動`}
                        >
                          <span style={{
                            fontSize: '10px',
                            fontFamily: 'monospace',
                            color: isActive ? '#38bdf8' : isPast ? '#7dd3fc' : '#475569',
                            fontWeight: 700
                          }}>
                            {isPast && !isActive ? '✓ S' + s.num : 'S' + s.num}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%'
                          }}>
                            {s.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {Boolean(typeof window !== 'undefined' && localStorage.getItem('file26_survey_submitted_answers')) && (
                  <div style={{
                    padding: '4px 8px',
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px'
                  }}>
                    <span style={{ fontSize: '10.5px', color: '#fbbf24', fontWeight: 600 }}>
                      📝 回答内容を再編集中
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(7)}
                      style={{
                        padding: '2px 8px',
                        background: 'rgba(245, 158, 11, 0.2)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        borderRadius: '4px',
                        color: '#fbbf24',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      カード画面に戻る →
                    </button>
                  </div>
                )}

                <div style={{
                  padding: '4px 10px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(56, 189, 248, 0.15)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  backdropFilter: 'blur(6px)'
                }}>
                  {(() => {
                    let user = null;
                    try {
                      const st = localStorage.getItem('file26_google_user');
                      if (st) user = JSON.parse(st);
                    } catch (e) {}

                    return user ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                          {user.picture ? (
                            <img src={user.picture} alt="" style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid #38bdf8' }} />
                          ) : (
                            <span style={{ fontSize: '11px' }}>👤</span>
                          )}
                          <span style={{ fontSize: '10.5px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.email}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          <span style={{
                            display: 'inline-block',
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            background: cloudSaveStatus === 'saving' ? '#fbbf24' : '#34d399'
                          }}></span>
                          <span style={{ fontSize: '10px', color: cloudSaveStatus === 'saving' ? '#fbbf24' : '#34d399', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {cloudSaveStatus === 'saving' ? '保存中…' : '保存完了'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px', color: '#94a3b8' }}>
                        <span>💡 自動保存中</span>
                        <span style={{ color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#34d399' }}></span>
                          保存済み
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ═══ S1 観測者情報 ═══ */}
            {step === 1 && (
              <section className="scr" id="s1">
                <div className="sec-title">SECTION 01 ／ 観測者について</div>

                <h2 className="q"><span className="no">QUESTION 01 ／ 必須</span>本公演へのご来場区分を教えてください。</h2>
                <div className="opts grid2">
                  {OPTIONS.role.map(v => (
                    <div
                      key={v}
                      className={`opt ${answers.role === v ? "sel" : ""}`}
                      onClick={() => setAnswers(prev => ({ ...prev, role: v }))}
                    >
                      <span className="mk"></span><span>{v}</span>
                    </div>
                  ))}
                </div>

                <h2 className="q"><span className="no">QUESTION 02 ／ 必須</span>氏名（お名前）を教えてください。</h2>
                <input
                  type="text"
                  value={answers.realName}
                  onChange={(e) => setAnswers(prev => ({ ...prev, realName: e.target.value }))}
                  placeholder="例）山田 太郎"
                  maxLength="50"
                />

                <h2 className="q"><span className="no">QUESTION 03 ／ 必須</span>学年を教えてください。</h2>
                <div className="grade-group">
                  {OPTIONS.grade.map(v => (
                    <button
                      key={v}
                      type="button"
                      className={`grade-btn ${answers.grade === v ? "sel" : ""}`}
                      onClick={() => setAnswers(prev => ({ ...prev, grade: answers.grade === v ? "" : v }))}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                {answers.grade === "その他" && (
                  <div style={{ marginTop: "10px" }}>
                    <textarea
                      rows="2"
                      value={answers.gradeOther}
                      onChange={(e) => setAnswers(prev => ({ ...prev, gradeOther: e.target.value }))}
                      placeholder="例）大学院生、一般、卒業生 など（改行可）"
                      maxLength="100"
                      style={{ width: '100%', resize: 'vertical' }}
                    />
                  </div>
                )}

                <h2 className="q"><span className="no">QUESTION 04 ／ 必須</span>事前の配布物（あらすじ・相関図）は読みましたか。</h2>
                <div className="opts">
                  {OPTIONS.prep.map(v => (
                    <div
                      key={v}
                      className={`opt ${answers.prep === v ? "sel" : ""}`}
                      onClick={() => setAnswers(prev => ({ ...prev, prep: v }))}
                    >
                      <span className="mk"></span><span>{v}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ═══ S2 追跡ログ ═══ */}
            {step === 2 && (
              <section className="scr" id="s2">
                <div className="sec-title">SECTION 02 ／ 追跡ログ</div>
                <p className="help" style={{ marginTop: "14px" }}>
                  世界は3回、同じ9時44分に戻りました。<br />
                  あなたはそれぞれの周で、誰を追いましたか。
                </p>

                {/* 1周目 */}
                <h2 className="q"><span className="no">QUESTION 05 ／ 必須</span>1周目、いちばん長く追いかけた人。</h2>
                <div className="people">
                  {SELECTABLE_PEOPLE.map(p => (
                    <div
                      key={p.id}
                      className={`pc ${answers.loop1 === p.id ? "sel" : ""}`}
                      onClick={() => {
                        setAnswers(prev => ({ ...prev, loop1: p.id }));
                        if (ROUTE_COLOR[p.id]) setAccent(ROUTE_COLOR[p.id]);
                      }}
                    >
                      {p.avatar ? (
                        <>
                          <img src={p.avatar} alt={p.name} loading="lazy" />
                          <span className="nm">{p.name}<small>{p.role || p.generation}</small></span>
                        </>
                      ) : (
                        <div className="pc none">
                          {p.name}<small>{p.role}</small>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* 1周目：見かけたキャラ（複数選択） */}
                <div className="sub-seen-box">
                  <div className="sub-seen-label">
                    <span>👁️</span>
                    <span>1周目で見かけた・通りかかった人物<b>（複数選択可・任意）</b></span>
                  </div>
                  <div className="sub-chips">
                    {SELECTABLE_PEOPLE.filter(p => p.id !== 'sound' && p.id !== 'free').map(p => {
                      const isSeen = answers.loop1Seen?.includes(p.id);
                      return (
                        <div
                          key={`l1-seen-${p.id}`}
                          className={`sub-chip ${isSeen ? "sel" : ""}`}
                          onClick={() => {
                            setAnswers(prev => ({
                              ...prev,
                              loop1Seen: isSeen
                                ? prev.loop1Seen.filter(id => id !== p.id)
                                : [...(prev.loop1Seen || []), p.id]
                            }));
                          }}
                        >
                          {p.avatar && <img src={p.avatar} alt="" />}
                          <span>{p.name.split(' ')[0]}</span>
                          <span className="check-icon" style={{ opacity: isSeen ? 1 : 0 }}>✓</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2周目 */}
                <h2 className="q"><span className="no">QUESTION 06 ／ 必須</span>2周目、いちばん長く追いかけた人。</h2>
                <div className="people">
                  {SELECTABLE_PEOPLE.map(p => (
                    <div
                      key={p.id}
                      className={`pc ${answers.loop2 === p.id ? "sel" : ""}`}
                      onClick={() => setAnswers(prev => ({ ...prev, loop2: p.id }))}
                    >
                      {p.avatar ? (
                        <>
                          <img src={p.avatar} alt={p.name} loading="lazy" />
                          <span className="nm">{p.name}<small>{p.role || p.generation}</small></span>
                        </>
                      ) : (
                        <div className="pc none">
                          {p.name}<small>{p.role}</small>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* 2周目：見かけたキャラ（複数選択） */}
                <div className="sub-seen-box">
                  <div className="sub-seen-label">
                    <span>👁️</span>
                    <span>2周目で見かけた・通りかかった人物<b>（複数選択可・任意）</b></span>
                  </div>
                  <div className="sub-chips">
                    {SELECTABLE_PEOPLE.filter(p => p.id !== 'sound' && p.id !== 'free').map(p => {
                      const isSeen = answers.loop2Seen?.includes(p.id);
                      return (
                        <div
                          key={`l2-seen-${p.id}`}
                          className={`sub-chip ${isSeen ? "sel" : ""}`}
                          onClick={() => {
                            setAnswers(prev => ({
                              ...prev,
                              loop2Seen: isSeen
                                ? prev.loop2Seen.filter(id => id !== p.id)
                                : [...(prev.loop2Seen || []), p.id]
                            }));
                          }}
                        >
                          {p.avatar && <img src={p.avatar} alt="" />}
                          <span>{p.name.split(' ')[0]}</span>
                          <span className="check-icon" style={{ opacity: isSeen ? 1 : 0 }}>✓</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3周目 */}
                <h2 className="q"><span className="no">QUESTION 07 ／ 必須</span>3周目、いちばん長く追いかけた人。</h2>
                <div className="people">
                  {SELECTABLE_PEOPLE.map(p => (
                    <div
                      key={p.id}
                      className={`pc ${answers.loop3 === p.id ? "sel" : ""}`}
                      onClick={() => setAnswers(prev => ({ ...prev, loop3: p.id }))}
                    >
                      {p.avatar ? (
                        <>
                          <img src={p.avatar} alt={p.name} loading="lazy" />
                          <span className="nm">{p.name}<small>{p.role || p.generation}</small></span>
                        </>
                      ) : (
                        <div className="pc none">
                          {p.name}<small>{p.role}</small>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* 3周目：見かけたキャラ（複数選択） */}
                <div className="sub-seen-box" style={{ marginBottom: '8px' }}>
                  <div className="sub-seen-label">
                    <span>👁️</span>
                    <span>3周目で見かけた・通りかかった人物<b>（複数選択可・任意）</b></span>
                  </div>
                  <div className="sub-chips">
                    {SELECTABLE_PEOPLE.filter(p => p.id !== 'sound' && p.id !== 'free').map(p => {
                      const isSeen = answers.loop3Seen?.includes(p.id);
                      return (
                        <div
                          key={`l3-seen-${p.id}`}
                          className={`sub-chip ${isSeen ? "sel" : ""}`}
                          onClick={() => {
                            setAnswers(prev => ({
                              ...prev,
                              loop3Seen: isSeen
                                ? prev.loop3Seen.filter(id => id !== p.id)
                                : [...(prev.loop3Seen || []), p.id]
                            }));
                          }}
                        >
                          {p.avatar && <img src={p.avatar} alt="" />}
                          <span>{p.name.split(' ')[0]}</span>
                          <span className="check-icon" style={{ opacity: isSeen ? 1 : 0 }}>✓</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ◈ 選択された周回ルート専用の感想・考察 */}
                {(answers.loop1 || answers.loop2 || answers.loop3) && (
                  <div style={{
                    marginTop: '20px',
                    padding: '16px 18px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '15px' }}>🧭</span>
                        <span style={{ fontSize: '12.5px', color: '#fbbf24', fontWeight: 800, letterSpacing: '0.06em' }}>
                          選択ルートの体験感想・考察（任意）
                        </span>
                      </div>
                      <span className="badge-public" style={{ margin: 0 }}>🌐 全体に公開</span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '11px', color: '#cbd5e1' }}>あなたの観測ルート:</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
                        1周目: {nameOf(answers.loop1)}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '11px' }}>→</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.35)' }}>
                        2周目: {nameOf(answers.loop2)}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '11px' }}>→</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.35)' }}>
                        3周目: {nameOf(answers.loop3)}
                      </span>
                    </div>

                    <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: '0 0 10px', lineHeight: 1.5 }}>
                      この3回の追跡順で見てどう感じたか、視点が変わって面白かったことやルートのつながりについての感想・考察をご自由にご記入ください。<br />
                      <span style={{ color: '#34d399', fontWeight: 700 }}>※ みんなのカード掲示板やタイムライン等で他の観測者にも公開されます。</span>
                    </p>

                    <textarea
                      rows="3"
                      value={answers.routeComment || ''}
                      onChange={(e) => setAnswers(prev => ({ ...prev, routeComment: e.target.value }))}
                      placeholder="例）1周目と2周目で視点が変わって面白かった / この順番で追ったことで物語の裏側が分かった など"
                      style={{
                        width: '100%',
                        background: 'rgba(0, 0, 0, 0.7)',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        color: '#fffbeb',
                        fontSize: '13px',
                        lineHeight: 1.65,
                        fontFamily: 'var(--mincho)'
                      }}
                    />
                  </div>
                )}
              </section>
            )}

            {/* ═══ S3 観測シーン ═══ */}
            {step === 3 && (
              <section className="scr" id="s3">
                <div className="sec-title">SECTION 03 ／ 観測できた場面</div>
                <h2 className="q" style={{ marginTop: "14px" }}><span className="no">QUESTION 08 ／ 必須</span>観測できた場面をすべてチェックしてください。</h2>
                <p className="help" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span>
                    あなたが実際に「観測」できた場面をすべて選んでください。<br />
                    ここに挙がっているのは、あの日この建物で同時に起きていたことの一部です。
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsMapModalOpen(true)}
                    style={{
                      alignSelf: 'flex-start',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      borderRadius: '6px',
                      color: '#fbbf24',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <MapIcon style={{ width: '14px', height: '14px' }} />
                    <span>会場MAP（見取り図）を確認する</span>
                  </button>
                </p>

                <div id="scenes">
                  {SCENES.map(g => (
                    <div key={g.loop} className="loopwrap">
                      <div className="loophead">
                        <b>{g.loop}</b>
                        <span>{g.label}</span>
                      </div>
                      <div className="chips">
                        {g.items.map(item => {
                          const isSel = answers.scenes.includes(item.id);
                          return (
                            <div
                              key={item.id}
                              role="button"
                              tabIndex={0}
                              aria-pressed={isSel}
                              className={`chip ${isSel ? "sel" : ""}`}
                              onClick={() => {
                                setAnswers(prev => ({
                                  ...prev,
                                  scenes: isSel
                                    ? prev.scenes.filter(s => s !== item.id)
                                    : [...prev.scenes, item.id]
                                }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  setAnswers(prev => ({
                                    ...prev,
                                    scenes: isSel
                                      ? prev.scenes.filter(s => s !== item.id)
                                      : [...prev.scenes, item.id]
                                  }));
                                }
                              }}
                              style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}
                            >
                              <span className="t">{item.time}</span>
                              <div className="b" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
                                  <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--fg)', lineHeight: 1.25, letterSpacing: '0.01em' }}>
                                    {item.title}
                                  </span>
                                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--dim)', letterSpacing: '0.03em' }}>
                                    {item.place}
                                  </span>
                                </div>
                                {item.desc && (
                                  <em style={{ fontStyle: 'normal', fontSize: '11.5px', color: 'var(--dim)', lineHeight: 1.35 }}>
                                    {item.desc}
                                  </em>
                                )}
                              </div>
                              {item.casts?.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', alignSelf: 'center', flexShrink: 0, paddingLeft: '10px' }}>
                                  {item.casts.map((cId, idx) => {
                                    const c = CAST_MEMBERS.find(x => x.id === cId);
                                    if (!c || !c.avatar) return null;
                                    return (
                                      <img
                                        key={cId}
                                        src={c.avatar}
                                        alt={c.name}
                                        title={c.name}
                                        style={{
                                          width: '52px',
                                          height: '52px',
                                          borderRadius: '50%',
                                          objectFit: 'cover',
                                          objectPosition: 'center 15%',
                                          border: '2px solid rgba(255, 255, 255, 0.7)',
                                          marginLeft: idx > 0 ? '-18px' : '0',
                                          background: '#0f172a',
                                          boxShadow: '0 3px 8px rgba(0,0,0,0.5)',
                                          zIndex: item.casts.length - idx
                                        }}
                                      />
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="meter">
                  <div className="lab">
                    <span>OBSERVATION RATE ／ 観測率</span>
                    <b><span>{sceneRate}</span>%</b>
                  </div>
                  <div className="track">
                    <i style={{ width: `${sceneRate}%` }}></i>
                  </div>
                  <div className="tiny" style={{ marginTop: "7px" }}>
                    {answers.scenes.length === 0
                      ? "まだ何も選ばれていません。"
                      : sceneRate < 20
                      ? `${answers.scenes.length}件。あなたはこの世界のごく一部を見ました。`
                      : sceneRate < 40
                      ? `${answers.scenes.length}件。特定の人物の足跡をしっかり追った形跡があります。`
                      : sceneRate < 65
                      ? `${answers.scenes.length}件。全体の半分近くを目撃しました。多くの真実に触れています。`
                      : sceneRate < 85
                      ? `${answers.scenes.length}件。驚異的な観測率です。複数の世界線を立体的に把握しています。`
                      : `${answers.scenes.length}件。ほぼすべてを目撃した特異点。あなたが見たものが世界の全貌です。`}
                  </div>
                </div>

                <h2 className="q"><span className="no">QUESTION 09 ／ 任意</span>観測できなくて、いちばん心残りな場面。</h2>
                <p className="help">上で選ばなかった場面から、ひとつだけ。</p>
                
                <div className="custom-select-wrap">
                  <div
                    className={`custom-select-trigger ${answers.missed ? 'has-val' : ''} ${isMissedDropdownOpen ? 'open' : ''}`}
                    onClick={() => setIsMissedDropdownOpen(true)}
                  >
                    <div className="custom-select-text" style={{ flex: 1, minWidth: 0 }}>
                      {answers.missed ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                          <span className="custom-select-badge">心残り</span>
                          <span className="custom-select-label" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {answers.missed}
                          </span>
                          {(() => {
                            let matchedCasts = [];
                            for (const g of SCENES) {
                              for (const item of g.items) {
                                if (`${g.loop} ${item.time}／${item.place}／${item.title}` === answers.missed) {
                                  matchedCasts = item.casts || [];
                                  break;
                                }
                              }
                            }
                            if (matchedCasts.length === 0) return null;
                            return (
                              <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', flexShrink: 0 }}>
                                {matchedCasts.map((cId, idx) => {
                                  const c = CAST_MEMBERS.find(x => x.id === cId);
                                  if (!c || !c.avatar) return null;
                                  return (
                                    <img
                                      key={cId}
                                      src={c.avatar}
                                      alt={c.name}
                                      style={{
                                        width: '26px',
                                        height: '26px',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        objectPosition: 'center 15%',
                                        border: '1.5px solid rgba(255, 255, 255, 0.5)',
                                        marginLeft: idx > 0 ? '-8px' : '0',
                                        background: '#0f172a'
                                      }}
                                    />
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <span className="custom-select-placeholder">未選択（タップして場面を選択）</span>
                      )}
                    </div>
                    <div className="custom-select-icons">
                      {answers.missed && (
                        <span
                          className="custom-select-clear"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAnswers(prev => ({ ...prev, missed: "" }));
                          }}
                          title="選択解除"
                        >
                          ✕
                        </span>
                      )}
                      <span className="custom-select-arrow">
                        ▼
                      </span>
                    </div>
                  </div>

                  {/* ── 場面選択モーダルシート（Portalで最前面に展開し、フッター被りを完全防止） ── */}
                  {isMissedDropdownOpen && typeof document !== 'undefined' && createPortal(
                    <div
                      style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 99999,
                        background: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(6px)',
                        WebkitBackdropFilter: 'blur(6px)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        padding: '0'
                      }}
                      onClick={() => setIsMissedDropdownOpen(false)}
                    >
                      <div
                        style={{
                          width: '100%',
                          maxWidth: '600px',
                          maxHeight: '82vh',
                          background: '#0f172a',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderTopLeftRadius: '20px',
                          borderTopRightRadius: '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.8)',
                          overflow: 'hidden',
                          animation: 'slideUpModal 0.25s ease-out'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* モーダルヘッダー */}
                        <div style={{
                          padding: '16px 20px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'rgba(15, 23, 42, 0.95)'
                        }}>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>◈</span>
                              <span>心残りな未観測場面を選択</span>
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                              未観測の場面（全{unselectedScenes.length}件）から1つ選べます
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsMissedDropdownOpen(false)}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'rgba(255, 255, 255, 0.1)',
                              border: 'none',
                              color: '#fff',
                              fontSize: '15px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            ✕
                          </button>
                        </div>

                        {/* モーダルリストエリア */}
                        <div style={{
                          padding: '12px 16px',
                          overflowY: 'auto',
                          WebkitOverflowScrolling: 'touch',
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}>
                          {/* 未選択（解除）オプション */}
                          <div
                            style={{
                              padding: '12px 14px',
                              borderRadius: '10px',
                              background: !answers.missed ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                              border: !answers.missed ? '1.5px solid #f59e0b' : '1px dashed rgba(255, 255, 255, 0.15)',
                              color: !answers.missed ? '#fbbf24' : '#cbd5e1',
                              fontSize: '13px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                            onClick={() => {
                              setAnswers(prev => ({ ...prev, missed: "" }));
                              setIsMissedDropdownOpen(false);
                            }}
                          >
                            <span>選択しない（未選択のままにする）</span>
                            {!answers.missed && <span style={{ fontSize: '15px' }}>✓</span>}
                          </div>

                          {unselectedScenes.map(s => {
                            const isSelected = answers.missed === s.label;
                            return (
                              <div
                                key={s.id}
                                style={{
                                  padding: '12px 14px',
                                  borderRadius: '10px',
                                  background: isSelected ? 'linear-gradient(135deg, rgba(184, 53, 47, 0.2) 0%, rgba(30, 41, 59, 0.8) 100%)' : 'rgba(255, 255, 255, 0.04)',
                                  border: isSelected ? '1.5px solid #b8352f' : '1px solid rgba(255, 255, 255, 0.08)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '10px'
                                }}
                                onClick={() => {
                                  setAnswers(prev => ({ ...prev, missed: s.label }));
                                  setIsMissedDropdownOpen(false);
                                }}
                              >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                    <span style={{
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      background: s.loop.includes('1') ? 'rgba(245, 158, 11, 0.2)' : s.loop.includes('2') ? 'rgba(56, 189, 248, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                                      color: s.loop.includes('1') ? '#fbbf24' : s.loop.includes('2') ? '#38bdf8' : '#c084fc',
                                      border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}>
                                      {s.loop}
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--mono)' }}>
                                      {s.time}
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#cbd5e1' }}>
                                      {s.place}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: s.desc ? '2px' : '0' }}>
                                    {s.title}
                                  </div>
                                  {s.desc && (
                                    <div style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.4 }}>
                                      {s.desc}
                                    </div>
                                  )}
                                </div>
                                {s.casts?.length > 0 && (
                                  <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginLeft: 'auto', paddingLeft: '6px' }}>
                                    {s.casts.map((cId, idx) => {
                                      const c = CAST_MEMBERS.find(x => x.id === cId);
                                      if (!c || !c.avatar) return null;
                                      return (
                                        <img
                                          key={cId}
                                          src={c.avatar}
                                          alt={c.name}
                                          title={c.name}
                                          style={{
                                            width: '42px',
                                            height: '42px',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            objectPosition: 'center 15%',
                                            border: '2px solid rgba(255, 255, 255, 0.6)',
                                            marginLeft: idx > 0 ? '-14px' : '0',
                                            background: '#0f172a',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
                                            zIndex: s.casts.length - idx
                                          }}
                                        />
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* モーダルフッター */}
                        <div style={{
                          padding: '12px 20px calc(12px + env(safe-area-inset-bottom))',
                          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                          background: 'rgba(15, 23, 42, 0.95)'
                        }}>
                          <button
                            type="button"
                            onClick={() => setIsMissedDropdownOpen(false)}
                            style={{
                              width: '100%',
                              padding: '12px',
                              background: 'rgba(255, 255, 255, 0.1)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '13px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            閉じる
                          </button>
                        </div>
                      </div>
                    </div>,
                    document.body
                  )}
                </div>
              </section>
            )}

            {/* ═══ S4 評価 ═══ */}
            {step === 4 && (
              <section className="scr" id="s4">
                <div className="sec-title">SECTION 04 ／ 観測強度</div>

                <h2 className="q"><span className="no">QUESTION 10 ／ 必須</span>この体験に、どれだけ持っていかれましたか。</h2>
                <div className="slider">
                  <div className="sval">
                    {answers.overall !== undefined && answers.overall !== null ? answers.overall : 50}<small>/100</small>
                  </div>
                  <div className="sword">
                    {getWordForValue(answers.overall !== undefined && answers.overall !== null ? answers.overall : 50)}
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={answers.overall !== undefined && answers.overall !== null ? answers.overall : 50}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setAnswers(prev => {
                        const next = { ...prev, overall: val };
                        try { localStorage.setItem('file26_survey_answers', JSON.stringify(next)); } catch (err) {}
                        return next;
                      });
                    }}
                  />
                  <div className="ends">
                    <span>0 ／ 何も感じなかった</span>
                    <span>100 ／ 現実に戻れない</span>
                  </div>
                </div>

                <h2 className="q"><span className="no">QUESTION 11 ／ 必須</span>項目ごとの評価をお願いします。</h2>
                <div className="mx">
                  {MATRIX.map(m => (
                    <div key={m.key} className="row">
                      <div className="lb">{m.label}</div>
                      <div className="dots">
                        {[1, 2, 3, 4, 5].map(score => (
                          <button
                            key={score}
                            type="button"
                            className={answers.matrix && answers.matrix[m.key] === score ? "sel" : ""}
                            onClick={() => {
                              setAnswers(prev => {
                                const nextMatrix = { ...(prev.matrix || {}), [m.key]: score };
                                const next = { ...prev, matrix: nextMatrix };
                                try { localStorage.setItem('file26_survey_answers', JSON.stringify(next)); } catch (err) {}
                                return next;
                              });
                            }}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mxends">
                  <span>1 ／ 物足りない</span>
                  <span>5 ／ とてもよかった</span>
                </div>

                <h2 className="q"><span className="no">QUESTION 12 ／ 必須</span>体験時間の長さはどうでしたか。</h2>
                <div className="opts">
                  {OPTIONS.length.map(v => (
                    <div
                      key={v}
                      className={`opt ${answers.length === v ? "sel" : ""}`}
                      onClick={() => {
                        setAnswers(prev => {
                          const next = { ...prev, length: v };
                          try { localStorage.setItem('file26_survey_answers', JSON.stringify(next)); } catch (err) {}
                          return next;
                        });
                      }}
                    >
                      <span className="mk"></span><span>{v}</span>
                    </div>
                  ))}
                </div>
                {answers.length === "その他" && (
                  <div style={{ marginTop: "10px" }}>
                    <textarea
                      rows="2"
                      value={answers.lengthOther}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAnswers(prev => {
                          const next = { ...prev, lengthOther: val };
                          try { localStorage.setItem('file26_survey_answers', JSON.stringify(next)); } catch (err) {}
                          return next;
                        });
                      }}
                      placeholder="体験時間について具体的にご記入ください（改行可）"
                      maxLength="200"
                      style={{ width: '100%', resize: 'vertical' }}
                    />
                  </div>
                )}

                <h2 className="q"><span className="no">QUESTION 13 ／ 必須</span>次に「観測者」の募集があったら。</h2>
                <div className="opts">
                  {OPTIONS.again.map(v => (
                    <div
                      key={v}
                      className={`opt ${answers.again === v ? "sel" : ""}`}
                      onClick={() => {
                        setAnswers(prev => {
                          const next = { ...prev, again: v };
                          try { localStorage.setItem('file26_survey_answers', JSON.stringify(next)); } catch (err) {}
                          return next;
                        });
                      }}
                    >
                      <span className="mk"></span><span>{v}</span>
                    </div>
                  ))}
                </div>
                {answers.again === "その他" && (
                  <div style={{ marginTop: "10px" }}>
                    <textarea
                      rows="2"
                      value={answers.againOther}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAnswers(prev => {
                          const next = { ...prev, againOther: val };
                          try { localStorage.setItem('file26_survey_answers', JSON.stringify(next)); } catch (err) {}
                          return next;
                        });
                      }}
                      placeholder="次回参加についてご記入ください（改行可）"
                      maxLength="200"
                      style={{ width: '100%', resize: 'vertical' }}
                    />
                  </div>
                )}

                {/* ◈ 次回希望の立場・関わり方 */}
                <h2 className="q"><span className="no">QUESTION 14 ／ 必須</span>次回もし機会があれば、どの立場で参加・関わってみたいですか。</h2>
                <p className="help">当てはまるもの・興味があるものをすべて選んでください（複数選択可）。</p>
                <div className="future-roles-grid">
                  {OPTIONS.futureRoles.map(item => {
                    const isSel = (answers.futureRoles || []).includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`future-role-card ${isSel ? "sel" : ""}`}
                        onClick={() => {
                          setAnswers(prev => {
                            const cur = Array.isArray(prev.futureRoles) ? prev.futureRoles : [];
                            const nextRoles = isSel ? cur.filter(x => x !== item.id) : [...cur, item.id];
                            const next = { ...prev, futureRoles: nextRoles };
                            try { localStorage.setItem('file26_survey_answers', JSON.stringify(next)); } catch (err) {}
                            return next;
                          });
                        }}
                      >
                        <span className="future-role-icon">{item.icon}</span>
                        <div className="future-role-info">
                          <div className="future-role-name">
                            <span>{item.label}</span>
                            {isSel && <span className="future-role-check">✓</span>}
                          </div>
                          <div className="future-role-desc">{item.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {(answers.futureRoles || []).includes("other") && (
                  <div style={{ marginTop: "8px", marginBottom: "12px" }}>
                    <textarea
                      rows="2"
                      value={answers.futureRolesOther}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAnswers(prev => {
                          const next = { ...prev, futureRolesOther: val };
                          try { localStorage.setItem('file26_survey_answers', JSON.stringify(next)); } catch (err) {}
                          return next;
                        });
                      }}
                      placeholder="その他の希望役割をご記入ください（改行可）"
                      maxLength="200"
                      style={{ width: '100%', resize: 'vertical' }}
                    />
                  </div>
                )}
              </section>
            )}

            {/* ═══ S5 記憶の断片 ═══ */}
            {step === 5 && (
              <section className="scr" id="s5">
                <div className="sec-title">SECTION 05 ／ 記憶の断片（感想・メッセージ）</div>
                <p className="help" style={{ marginTop: "14px" }}>
                  あなたの体験した記憶と言葉をアーカイブします。<br />
                  <span style={{ color: '#ff716a', fontWeight: 700 }}>※ Q16（公開用の感想）、Q17、Q19（推しキャラ）は必須項目です。</span>
                </p>

                {/* Q15: 感想（非公開）── 運営・キャストのみ */}
                <h2 className="q">
                  <span className="no">QUESTION 15 ／ 任意</span>
                  感想。
                  <span className="badge-private">🔒 完全非公開（運営・キャストのみ）</span>
                </h2>
                <p className="help">
                  他の参加者には見せたくない個人的な感想や本音、運営・キャストへのメッセージなどがあればこちらにご記入ください。<br />
                  <span style={{ color: '#94a3b8', fontWeight: 700 }}>※ 他の観測者には一切公開されず、運営・キャストのみに直接届きます。</span>
                </p>
                <textarea
                  rows="4"
                  value={answers.msg || answers.privateImpressions}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAnswers(prev => ({ ...prev, msg: val, privateImpressions: val }));
                  }}
                  placeholder="例）率直な感想や本音、メッセージなどがあればご自由にお書きください"
                ></textarea>

                {/* Q16: 公開用の感想（タイトル & 自由記述） */}
                <h2 className="q">
                  <span className="no">QUESTION 16 ／ 必須</span>
                  公開用の感想。
                  <span className="badge-public">🌐 全体に公開</span>
                </h2>
                <p className="help">
                  他の観測者にも公開される感想です。物語の所感、全体の熱量、驚きや感動などを自由にお書きください。<br />
                  <span style={{ color: '#34d399', fontWeight: 700 }}>※ 戦歴ライセンスカードや「みんなのカード」掲示板・タイムラインに掲載され、他の参加者と想いを共有できます（ネタバレもOK！）。</span>
                </p>

                {/* タイトル（ひとこと） */}
                <div style={{ marginBottom: "18px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#38bdf8", marginBottom: "6px" }}>
                    ◈ タイトル（感想のひとこと）
                  </label>
                  <input
                    type="text"
                    value={answers.word}
                    onChange={(e) => setAnswers(prev => ({ ...prev, word: e.target.value }))}
                    placeholder="例）一言タイトルやキャッチコピー"
                    maxLength="80"
                  />
                </div>

                {/* 自由記述（全体の感想） */}
                <div style={{ marginBottom: "8px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#38bdf8", marginBottom: "6px" }}>
                    ◈ 自由記述（全体の感想）
                  </label>
                  <textarea
                    rows="4"
                    value={answers.impressions}
                    onChange={(e) => setAnswers(prev => ({ ...prev, impressions: e.target.value }))}
                    placeholder="例）物語を体験して感じたことや、全体の感想などをご自由にどうぞ"
                  ></textarea>
                </div>

                {/* Q17: いちばん忘れられない場面・セリフ（公開） */}
                <h2 className="q">
                  <span className="no">QUESTION 17 ／ 必須</span>
                  いちばん忘れられない場面・セリフ。
                  <span className="badge-public">🌐 全体に公開</span>
                </h2>
                <p className="help">
                  今回目撃した中で、最も心に残ったシーンや忘れられないセリフ。<br />
                  <span style={{ color: '#34d399', fontWeight: 700 }}>※ 「みんなのカード」タイムラインに名場面ポストとして共有されます。</span>
                </p>
                <textarea
                  rows="3"
                  value={answers.best}
                  onChange={(e) => setAnswers(prev => ({ ...prev, best: e.target.value }))}
                  placeholder="例）特に心に残ったシーンやセリフがあればご記入ください"
                ></textarea>

                {/* Q18: もっとこうしてほしかったこと（非公開） */}
                <h2 className="q">
                  <span className="no">QUESTION 18 ／ 任意</span>
                  もっとこうしてほしかったこと。
                  <span className="badge-private">🔒 非公開（運営のみ）</span>
                </h2>
                <p className="help">
                  分かりづらかった導線、待ち時間、音、暗さ、スタッフ対応など。<br />
                  <span style={{ color: '#94a3b8', fontWeight: 700 }}>※ 今後の運営改善のためのみに使用され、他の観測者には一切公開されません。</span>
                </p>
                <textarea
                  rows="3"
                  value={answers.improve}
                  onChange={(e) => setAnswers(prev => ({ ...prev, improve: e.target.value }))}
                  placeholder="例）導線や演出など、気になった点や改善点があればお書きください（空欄でも問題ありません）"
                ></textarea>

                {/* ◈ 最重要観測対象（推し人物） ＆ 推し専用手記 */}
                <h2 className="q"><span className="no">QUESTION 19 ／ 必須</span>観測を通して、最も心惹かれた人物（推しキャラ）。</h2>
                <p className="help">今回の体験で最も心に残った・惹かれたキャラクターを1人選んでください（戦歴カードにも刻まれます）。</p>
                
                <div className="fav-char-grid">
                  {SELECTABLE_PEOPLE.filter(p => p.id !== 'sound' && p.id !== 'free').map(p => {
                    const isFav = answers.favoriteCast === p.id;
                    const isTracked = answers.loop1 === p.id || answers.loop2 === p.id || answers.loop3 === p.id;
                    const isSeen = answers.loop1Seen?.includes(p.id) || answers.loop2Seen?.includes(p.id) || answers.loop3Seen?.includes(p.id);

                    return (
                      <div
                        key={`fav-${p.id}`}
                        className={`fav-char-card ${isFav ? 'sel' : ''}`}
                        onClick={() => {
                          const nextFav = isFav ? '' : p.id;
                          setAnswers(prev => ({ ...prev, favoriteCast: nextFav }));
                          if (nextFav) setActiveCommentChar(nextFav);
                        }}
                      >
                        {(isTracked || isSeen) && (
                          <span className="fav-badge">
                            {isTracked ? '追跡' : '目撃'}
                          </span>
                        )}
                        {isFav && <span className="fav-heart" style={{ color: '#ff716a' }}>★</span>}
                        {p.avatar && <img src={p.avatar} alt={p.name} />}
                        <div className="fav-name">{p.name}</div>
                        <div className="fav-role">{p.role || p.generation}</div>
                      </div>
                    );
                  })}
                </div>

                {/* ◈ 最推しキャラクター専用の手記・メッセージ入力枠 */}
                {answers.favoriteCast && (() => {
                  const favP = CAST_MEMBERS.find(c => c.id === answers.favoriteCast);
                  if (!favP) return null;
                  const favVal = getCommentText(answers.characterComments?.[favP.id]);
                  const isFavPrivate = getCommentIsPrivate(answers.characterComments?.[favP.id], answers.characterPrivateFlags?.[favP.id]);

                  return (
                    <div style={{
                      marginTop: '16px',
                      marginBottom: '24px',
                      padding: '16px 18px',
                      background: isFavPrivate 
                        ? 'linear-gradient(135deg, rgba(71, 85, 105, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%)'
                        : 'linear-gradient(135deg, rgba(184, 53, 47, 0.12) 0%, rgba(15, 23, 42, 0.85) 100%)',
                      border: isFavPrivate ? '2px solid rgba(244, 63, 94, 0.45)' : '2px solid rgba(184, 53, 47, 0.55)',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                      position: 'relative',
                      transition: 'all 0.3s ease'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {favP.avatar && (
                            <img
                              src={favP.avatar}
                              alt=""
                              style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center 15%', border: isFavPrivate ? '2px solid #f43f5e' : '2px solid #b8352f', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}
                            />
                          )}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                              <span style={{ fontSize: '11px', color: isFavPrivate ? '#fda4af' : '#ff716a', fontWeight: 800, letterSpacing: '0.08em' }}>
                                ◈ 最重要観測対象【{favP.name}】への手記 ＆ メッセージ
                              </span>
                            </div>
                            <div style={{ fontSize: '17px', fontWeight: 900, color: '#fff' }}>
                              {favP.name} <span style={{ fontSize: '12px', color: 'var(--dim)', fontWeight: 500 }}>（{favP.role}）</span>
                            </div>
                          </div>
                        </div>

                        {/* 視覚的トグルスイッチ（推し手記・位置固定設計） */}
                        <div
                          onClick={() => {
                            setAnswers(prev => ({
                              ...prev,
                              characterPrivateFlags: {
                                ...prev.characterPrivateFlags,
                                [favP.id]: !getCommentIsPrivate(prev.characterComments?.[favP.id], prev.characterPrivateFlags?.[favP.id])
                              }
                            }));
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            userSelect: 'none',
                            background: isFavPrivate ? 'rgba(225, 29, 72, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                            border: isFavPrivate ? '1.5px solid rgba(244, 63, 94, 0.6)' : '1.5px solid rgba(52, 211, 153, 0.5)',
                            padding: '4px 10px 4px 6px',
                            borderRadius: '24px',
                            transition: 'background-color 0.2s ease, border-color 0.2s ease',
                            boxShadow: isFavPrivate ? '0 0 12px rgba(225, 29, 72, 0.25)' : '0 0 12px rgba(16, 185, 129, 0.2)',
                            flexShrink: 0,
                            marginLeft: 'auto'
                          }}
                          title="クリックして公開/非公開を切り替え"
                        >
                          {/* スイッチ本体（トラック） */}
                          <div style={{
                            width: '38px',
                            height: '22px',
                            borderRadius: '20px',
                            background: isFavPrivate ? '#e11d48' : '#10b981',
                            position: 'relative',
                            transition: 'background-color 0.25s ease',
                            flexShrink: 0
                          }}>
                            {/* スライダーノブ */}
                            <div style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              background: '#ffffff',
                              position: 'absolute',
                              top: '3px',
                              left: isFavPrivate ? '19px' : '3px',
                              transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.5)'
                            }} />
                          </div>
                          {/* ラベル（幅を固定して位置ブレを防止） */}
                          <span style={{
                            width: '46px',
                            textAlign: 'center',
                            fontSize: '12px',
                            fontWeight: 800,
                            letterSpacing: '0.02em',
                            color: isFavPrivate ? '#fda4af' : '#6ee7b7'
                          }}>
                            {isFavPrivate ? '非公開' : '公開'}
                          </span>
                        </div>
                      </div>

                      <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '0 0 8px', lineHeight: 1.5 }}>
                        最推しキャストへの想い、刺さったセリフ・仕草、役者さんへのメッセージなどをどうぞ。<br />
                        {isFavPrivate ? (
                          <span style={{ color: '#fda4af', fontWeight: 700 }}>現在「非公開」設定です：他の観測者には公開されず、運営・キャストのみに届きます。</span>
                        ) : (
                          <span style={{ color: '#34d399', fontWeight: 700 }}>現在「公開」設定です：発行される「戦歴ライセンスカード」やタイムラインに掲載されます。</span>
                        )}
                      </p>
                      <textarea
                        rows="4"
                        value={favVal}
                        onChange={(e) => {
                          const newTxt = e.target.value;
                          setAnswers(prev => ({
                            ...prev,
                            characterComments: {
                              ...prev.characterComments,
                              [favP.id]: newTxt
                            }
                          }));
                        }}
                        placeholder={`【${favP.name}】へのメッセージや印象に残ったことなどをご自由にどうぞ`}
                        style={{
                          width: '100%',
                          background: 'rgba(0, 0, 0, 0.7)',
                          border: isFavPrivate ? '1.5px solid rgba(244, 63, 94, 0.45)' : '1.5px solid rgba(245, 158, 11, 0.45)',
                          borderRadius: '8px',
                          padding: '12px 14px',
                          color: '#fffbeb',
                          fontSize: '13.5px',
                          lineHeight: 1.7,
                          fontFamily: 'var(--mincho)'
                        }}
                      ></textarea>
                    </div>
                  );
                })()}

                {/* ◈ 他のキャラクターたちへのメッセージ・感想 */}
                <h2 className="q">
                  <span className="no">QUESTION 20 ／ 任意</span>
                  他のキャラクターたちへのメッセージ・観測手記。
                  <span className="badge-public">全体に公開（個別非公開可）</span>
                </h2>
                <p className="help">
                  推しキャラ以外の登場人物にも、心に残ったシーンや演技、伝えたい言葉があればご自由にどうぞ（何人に書いても・空欄でもOK）。<br />
                  <span style={{ color: '#94a3b8' }}>※ 各人物ごとに「非公開（運営宛）」への切り替えが可能です。</span>
                </p>
                
                <div className="char-comment-box">
                  {/* キャスト一覧グリッドセレクター */}
                  <div className="char-comment-grid">
                    {SELECTABLE_PEOPLE.filter(p => p.id !== 'sound' && p.id !== 'free').map(p => {
                      const isActive = (activeCommentChar || answers.favoriteCast || answers.loop1 || 'yada') === p.id;
                      const hasText = !!getCommentText(answers.characterComments?.[p.id]).trim();
                      const isFav = answers.favoriteCast === p.id;
                      const isTracked = answers.loop1 === p.id || answers.loop2 === p.id || answers.loop3 === p.id;
                      const isPrivate = getCommentIsPrivate(answers.characterComments?.[p.id], answers.characterPrivateFlags?.[p.id]);
                      
                      return (
                        <div
                          key={`btn-${p.id}`}
                          className={`char-grid-btn ${isActive ? 'active' : ''} ${hasText ? 'has-text' : ''}`}
                          onClick={() => setActiveCommentChar(p.id)}
                        >
                          {hasText && <span className="char-grid-badge">{isPrivate ? '密' : '✓'}</span>}
                          {p.avatar && <img src={p.avatar} alt="" />}
                          <div className="char-grid-info">
                            <span className="char-grid-name">
                              {p.name.split(' ')[0]}
                              {isFav && <span style={{ color: '#ff716a', fontWeight: 'bold' }}> ★</span>}
                              {isTracked && !isFav && ' ◈'}
                            </span>
                            <span className="char-grid-status">
                              {isFav ? '★最推し' : (hasText ? (isPrivate ? '非公開' : '公開中') : '未記入')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 選択中キャラクターの専用入力カード */}
                  {(() => {
                    const curCharId = activeCommentChar || answers.favoriteCast || answers.loop1 || 'yada';
                    const curChar = CAST_MEMBERS.find(c => c.id === curCharId) || CAST_MEMBERS[0];
                    const val = getCommentText(answers.characterComments?.[curCharId]);
                    const isPrivate = getCommentIsPrivate(answers.characterComments?.[curCharId], answers.characterPrivateFlags?.[curCharId]);
                    const isFav = answers.favoriteCast === curChar.id;

                    return (
                      <div className="char-input-card" style={isPrivate ? { borderColor: 'rgba(244, 63, 94, 0.55)', background: 'rgba(15, 23, 42, 0.95)', boxShadow: '0 4px 16px rgba(225, 29, 72, 0.15)' } : {}}>
                        <div className="char-input-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {curChar.avatar && <img src={curChar.avatar} alt="" />}
                            <div className="char-meta">
                              <b>
                                {curChar.name}
                                {isFav && <span style={{ color: '#ff716a', fontSize: '12px', marginLeft: '6px' }}>★ Q19最推し</span>}
                              </b>
                              <span>{curChar.role || curChar.generation} ｜ {curChar.tagline}</span>
                            </div>
                          </div>

                          {/* 視覚的トグルスイッチ（キャラ別手記・位置固定設計） */}
                          <div
                            onClick={() => {
                              setAnswers(prev => ({
                                ...prev,
                                characterPrivateFlags: {
                                  ...prev.characterPrivateFlags,
                                  [curCharId]: !getCommentIsPrivate(prev.characterComments?.[curCharId], prev.characterPrivateFlags?.[curCharId])
                                }
                              }));
                            }}
                            style={{
                              marginLeft: 'auto',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              cursor: 'pointer',
                              userSelect: 'none',
                              background: isPrivate ? 'rgba(225, 29, 72, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                              border: isPrivate ? '1.5px solid rgba(244, 63, 94, 0.6)' : '1.5px solid rgba(52, 211, 153, 0.5)',
                              padding: '4px 10px 4px 6px',
                              borderRadius: '24px',
                              transition: 'background-color 0.2s ease, border-color 0.2s ease',
                              boxShadow: isPrivate ? '0 0 10px rgba(225, 29, 72, 0.25)' : '0 0 10px rgba(16, 185, 129, 0.2)',
                              flexShrink: 0
                            }}
                            title="クリックして公開/非公開を切り替え"
                          >
                            {/* スイッチ本体（トラック） */}
                            <div style={{
                              width: '36px',
                              height: '20px',
                              borderRadius: '20px',
                              background: isPrivate ? '#e11d48' : '#10b981',
                              position: 'relative',
                              transition: 'background-color 0.25s ease',
                              flexShrink: 0
                            }}>
                              {/* スライダーノブ */}
                              <div style={{
                                width: '14px',
                                height: '14px',
                                borderRadius: '50%',
                                background: '#ffffff',
                                position: 'absolute',
                                top: '3px',
                                left: isPrivate ? '19px' : '3px',
                                transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.5)'
                              }} />
                            </div>
                            {/* ラベル（幅を固定して位置ブレを防止） */}
                            <span style={{
                              width: '42px',
                              textAlign: 'center',
                              fontSize: '11.5px',
                              fontWeight: 800,
                              letterSpacing: '0.02em',
                              color: isPrivate ? '#fda4af' : '#6ee7b7'
                            }}>
                              {isPrivate ? '非公開' : '公開'}
                            </span>
                          </div>
                        </div>

                        <p style={{ fontSize: '11px', margin: '4px 0 6px', color: isPrivate ? '#fda4af' : '#94a3b8' }}>
                          {isPrivate 
                            ? 'このメッセージは運営・キャストのみに届き、一般公開されません。'
                            : 'このメッセージは「みんなのカード」掲示板やタイムラインで他の観測者にも公開されます。'}
                        </p>

                        <textarea
                          rows="3"
                          value={val}
                          onChange={(e) => {
                            const newTxt = e.target.value;
                            setAnswers(prev => ({
                              ...prev,
                              characterComments: {
                                ...prev.characterComments,
                                [curCharId]: newTxt
                              }
                            }));
                          }}
                          placeholder={`【${curChar.name}】への一言や印象に残ったことなど`}
                          style={{
                            marginTop: '4px',
                            fontFamily: 'var(--mincho)',
                            color: '#fffbeb',
                            lineHeight: 1.7,
                            border: isPrivate ? '1px solid rgba(244, 63, 94, 0.4)' : undefined
                          }}
                        ></textarea>
                      </div>
                    );
                  })()}

                  {/* 記入済みキャラクターのサマリー */}
                  {(() => {
                    const writtenKeys = Object.keys(answers.characterComments || {}).filter(k => !!getCommentText(answers.characterComments[k]).trim());
                    if (writtenKeys.length === 0) return null;
                    return (
                      <div className="char-written-summary">
                        <span>◈ 記入済み（{writtenKeys.length}名）：</span>
                        {writtenKeys.map(k => {
                          const c = CAST_MEMBERS.find(x => x.id === k);
                          const isPriv = getCommentIsPrivate(answers.characterComments?.[k], answers.characterPrivateFlags?.[k]);
                          return (
                            <span key={k} className="char-written-pill" onClick={() => setActiveCommentChar(k)} style={{ cursor: 'pointer', border: isPriv ? '1px solid rgba(244,63,94,0.45)' : undefined, background: isPriv ? 'rgba(225,29,72,0.15)' : undefined }}>
                              {isPriv ? '🔒 ' : '🌐 '}{c ? c.name.split(' ')[0] : k} ✎
                            </span>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
                <label className="hp" aria-hidden="true">
                  お住まい
                  <input
                    type="text"
                    value={answers.hp}
                    onChange={(e) => setAnswers(prev => ({ ...prev, hp: e.target.value }))}
                    tabIndex="-1"
                    autoComplete="off"
                  />
                </label>
              </section>
            )}

            {/* ═══ S6 提出 ═══ */}
            {step === 6 && (
              <section className="scr" id="s6">
                <div className="sec-title">SECTION 06 ／ 記録の提出・カード発行</div>
                <h2 className="q"><span className="no">FINAL</span>この内容で提出し、戦歴カードを発行します。</h2>
                <div className="code">{obsCode}</div>

                {/* 🔐 Google連携促進・認証カード */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '20px',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px' }}>🛡️</span>
                      <b style={{ fontSize: '13.5px', color: '#f8fafc', letterSpacing: '0.03em' }}>
                        Google アカウント連携（推奨）
                      </b>
                    </div>
                    <span style={{
                      fontSize: '10px',
                      color: '#60a5fa',
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.35)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      letterSpacing: '0.02em'
                    }}>
                      公式認証バッジ付与
                    </span>
                  </div>
                  <p style={{ margin: '0 0 12px 0', fontSize: '12px', lineHeight: 1.55, color: '#94a3b8' }}>
                    連携すると発行される戦歴カードに「Google認証済」バッジが付与され、提出した観測ログの安全な保護や次回以降の自動入力が可能になります。
                  </p>
                  
                  <GoogleAuthButton
                    currentObsCode={obsCode}
                    onAuthSuccess={(user) => {
                      if (user && user.name && !answers.name) {
                        setAnswers(prev => ({ ...prev, name: user.name }));
                      }
                    }}
                  />
                </div>

                {/* 観測者名設定（ダークテーマ統一） */}
                <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '8px', padding: '14px 16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <b style={{ fontSize: '14px', color: 'var(--fg)', letterSpacing: '0.04em' }}>観測者名（ニックネーム）</b>
                    <span style={{ fontSize: '10px', color: 'var(--dim)', background: 'rgba(255,255,255,0.08)', padding: '2px 7px', borderRadius: '3px' }}>任意</span>
                  </div>
                  <p className="help" style={{ margin: '0 0 10px 0', fontSize: '12px', lineHeight: 1.5, color: 'var(--dim)' }}>
                    発行される戦歴カードや集合知掲示板に表示されます。
                  </p>
                  <input
                    type="text"
                    value={answers.name}
                    onChange={(e) => setAnswers(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例）タロウ"
                    maxLength="40"
                  />
                </div>

                <div className="sum">
                  <dl>
                    <dt>カード名義</dt><dd><b>{answers.name || '匿名'}</b> <span style={{ color: 'var(--dim)' }}>[{answers.grade || 'その他'}]</span></dd>
                    <dt>回答者氏名</dt><dd>{answers.realName ? `${answers.realName}（非公開）` : '—'}</dd>
                    <dt>Google連携</dt>
                    <dd>
                      {(() => {
                        try {
                          const stored = localStorage.getItem('file26_google_user');
                          if (stored) {
                            const u = JSON.parse(stored);
                            return (
                              <span style={{ color: '#34d399', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <span>🛡️ 連携済み</span>
                                <span style={{ fontSize: '11px', color: 'var(--dim)', fontWeight: 'normal' }}>
                                  ({u.name || u.email})
                                </span>
                              </span>
                            );
                          }
                        } catch (e) {}
                        return <span style={{ color: 'var(--dim)' }}>未連携（任意）</span>;
                      })()}
                    </dd>
                    <dt>区分</dt><dd>{answers.role || "—"}</dd>
                    <dt>追跡</dt>
                    <dd>
                      <div>1周目：<b>{nameOf(answers.loop1)}</b> {answers.loop1Seen?.length > 0 && <span style={{ color: 'var(--dim)', fontSize: '11px' }}>（目撃: {namesOf(answers.loop1Seen)}）</span>}</div>
                      <div>2周目：<b>{nameOf(answers.loop2)}</b> {answers.loop2Seen?.length > 0 && <span style={{ color: 'var(--dim)', fontSize: '11px' }}>（目撃: {namesOf(answers.loop2Seen)}）</span>}</div>
                      <div>3周目：<b>{nameOf(answers.loop3)}</b> {answers.loop3Seen?.length > 0 && <span style={{ color: 'var(--dim)', fontSize: '11px' }}>（目撃: {namesOf(answers.loop3Seen)}）</span>}</div>
                    </dd>
                    {answers.favoriteCast && (
                      <>
                        <dt>推し</dt>
                        <dd style={{ color: '#ff716a', fontWeight: 700 }}>
                          ◈ {nameOf(answers.favoriteCast)}
                        </dd>
                      </>
                    )}
                    <dt>観測率</dt><dd>{sceneRate}%（{answers.scenes.length} / {TOTAL_SCENES} 場面）</dd>
                    <dt>観測強度</dt><dd>{answers.overall} / 100</dd>
                    <dt>次回参加</dt><dd>{answers.again || "—"}</dd>
                    {answers.futureRoles?.length > 0 && (
                      <>
                        <dt>次回希望</dt>
                        <dd>
                          {answers.futureRoles.map(rId => {
                            const found = OPTIONS.futureRoles.find(f => f.id === rId);
                            return found ? `${found.icon} ${found.label}` : rId;
                          }).join("、")}
                          {answers.futureRolesOther && <span style={{ color: 'var(--dim)', fontSize: '11px' }}>（{answers.futureRolesOther}）</span>}
                        </dd>
                      </>
                    )}
                  </dl>
                </div>

                {fallbackData && (
                  <div id="fallback" style={{ marginTop: "14px" }}>
                    <p className="help">送信に失敗しました。下の内容をコピーして運営にお渡しください。</p>
                    <textarea rows="6" readOnly value={JSON.stringify(fallbackData, null, 2)}></textarea>
                    <button
                      className="btn ghost big"
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(fallbackData, null, 2));
                        setCopySuccess(true);
                        setTimeout(() => setCopySuccess(false), 2000);
                      }}
                      style={{ marginTop: "8px", flex: "none" }}
                    >
                      {copySuccess ? "コピーしました" : "コピーする"}
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* ═══ S7 完了 ═══ */}
            {step === 7 && (
              <section className="scr" id="s7" style={{ paddingTop: '24px', paddingBottom: '60px' }}>
                {/* 全タブ解放告知バナー */}
                <div style={{
                  maxWidth: '560px',
                  margin: '0 auto 24px',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 78, 59, 0.25) 100%)',
                  border: '1.5px solid rgba(52, 211, 153, 0.45)',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                  animation: 'pulse 3s infinite ease-in-out'
                }}>
                  <span style={{ fontSize: '20px', color: '#34d399', flexShrink: 0, fontWeight: 900 }}>◈</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#34d399', letterSpacing: '0.02em' }}>
                      他タブ（感想ボード・キャラクター手記・カード一覧）が解放されました
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#cbd5e1', marginTop: '2px', lineHeight: 1.4 }}>
                      上のヘッダーメニューから、他の観測者の感想やキャラクターの極秘手記、カードアーカイブを自由にご覧いただけます。
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <div className="kicker">OBSERVATION LOG</div>
                  <div className="big" style={{ fontFamily: 'var(--gothic)', fontWeight: 800, fontSize: 'clamp(28px, 8vw, 42px)', letterSpacing: '0.06em' }}>
                    FILE CLOSED
                  </div>
                  <div className="code" style={{ maxWidth: '320px', margin: '16px auto' }}>
                    {obsCode}
                  </div>
                  <p className="lede" style={{ marginTop: '16px', lineHeight: 2 }}>
                    <span>記録を受け取りました。</span><br />
                    <span>あなたが観測したぶんだけ、</span><span>あの日は確かに存在しました。</span><br /><br />
                    <span>ご参加、</span><span>ありがとうございました。</span>
                  </p>
                </div>

                {/* 📝 上部クイック再編集ボタン */}
                <div style={{ maxWidth: '560px', margin: '0 auto 16px', textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentTab('survey');
                      showStep(1, false);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '8px',
                      color: '#fbbf24',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <span>📝</span>
                    <span>回答内容を再編集・更新</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNewResponse}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      borderRadius: '8px',
                      color: '#38bdf8',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <span>➕</span>
                    <span>別の回答を新しく送信</span>
                  </button>
                </div>

                {/* 📇 発行された戦歴カード（共有・保存） */}
                <div>
                  <ResultCard
                    formData={{
                      observerName: answers.name || 'OBSERVER',
                      grade: answers.grade || 'その他',
                      loopTrack: { loop1: answers.loop1, loop2: answers.loop2, loop3: answers.loop3 },
                      loop1Seen: answers.loop1Seen,
                      loop2Seen: answers.loop2Seen,
                      loop3Seen: answers.loop3Seen,
                      favoriteCast: answers.favoriteCast,
                      scenes: answers.scenes,
                      sceneCount: answers.scenes.length,
                      sceneRate: sceneRate,
                      syncRate: answers.overall,
                      primaryRoute: answers.loop1,
                      role: answers.role,
                      route: answers.route,
                      routeComment: answers.routeComment,
                      impressions: answers.impressions,
                      best: answers.best,
                      word: answers.word,
                      highlightScene: answers.best || answers.word,
                      publicComment: answers.impressions || answers.word || answers.best
                    }}
                    onScrollToBoard={() => setCurrentTab('crosstalk')}
                    onReEdit={() => {
                      setCurrentTab('survey');
                      showStep(1, false);
                    }}
                    onNewResponse={handleNewResponse}
                  />
                </div>

                {/* 📝 回答内容の再編集案内カード */}
                <div style={{
                  marginTop: '16px',
                  padding: '14px 18px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>📝</span>
                      <span>回答内容をいつでも修正・再編集できます</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      選んだルートや感想、推しへのメッセージを後から変更して再送信できます。
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentTab('survey');
                      showStep(1, false);
                    }}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(245, 158, 11, 0.2)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '6px',
                      color: '#fbbf24',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    回答を編集する
                  </button>
                </div>

                {/* 💬 次の体験へ：2つのゲート案内 */}
                <div style={{ marginTop: '40px' }}>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: '8px 0 4px', letterSpacing: '0.04em' }}>
                      みんなの感想 ＆ キャラ紹介
                    </h3>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 14px' }}>
                      他の参加者の感想や、各キャラからのメッセージをお楽しみください。
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                    
                    {/* ゲート1: 感想掲示板 */}
                    <div 
                      onClick={() => handleTabChange('crosstalk')}
                      style={{
                        background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
                        border: '1.5px solid rgba(56, 189, 248, 0.35)',
                        borderRadius: '14px',
                        padding: '18px',
                        cursor: 'pointer',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                        transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.borderColor = '#38bdf8';
                        e.currentTarget.style.boxShadow = '0 12px 30px rgba(56, 189, 248, 0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.5)';
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 800, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)', padding: '2px 8px', borderRadius: '4px' }}>
                            みんなの感想 ＆ 交流
                          </span>
                          <span style={{ fontSize: '18px' }}>💬</span>
                        </div>
                        <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>
                          感想・メッセージ掲示板
                        </h4>
                        <p style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: 1.55, margin: '0 0 14px' }}>
                          他ルートの様子や、参加者の感想・メッセージをタイムラインで閲覧・投稿できます。
                        </p>
                      </div>

                      <div style={{
                        padding: '10px 14px',
                        background: 'linear-gradient(90deg, #0284c7, #2563eb)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12.5px',
                        fontWeight: 800,
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}>
                        <span>感想を見る</span>
                        <span>→</span>
                      </div>
                    </div>

                    {/* ゲート2: キャラ紹介ルーム */}
                    <div 
                      onClick={() => handleTabChange('characters')}
                      style={{
                        background: 'linear-gradient(145deg, #1c1917 0%, #292524 100%)',
                        border: '1.5px solid rgba(217, 119, 6, 0.35)',
                        borderRadius: '14px',
                        padding: '18px',
                        cursor: 'pointer',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                        transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.borderColor = '#d97706';
                        e.currentTarget.style.boxShadow = '0 12px 30px rgba(217, 119, 6, 0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = 'rgba(217, 119, 6, 0.35)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.5)';
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 800, color: '#fbbf24', background: 'rgba(217, 119, 6, 0.15)', border: '1px solid rgba(217, 119, 6, 0.4)', padding: '2px 8px', borderRadius: '4px' }}>
                            登場キャラ紹介 ＆ メッセージ
                          </span>
                          <span style={{ fontSize: '18px' }}>📜</span>
                        </div>
                        <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>
                          登場キャラ紹介 ＆ メッセージ
                        </h4>
                        <p style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: 1.55, margin: '0 0 14px' }}>
                          全キャラの写真、名セリフ、メッセージの閲覧や、推しキャラへのメッセージを投稿できます。
                        </p>
                      </div>

                      <div style={{
                        padding: '10px 14px',
                        background: 'linear-gradient(90deg, #d97706, #b8352f)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12.5px',
                        fontWeight: 800,
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}>
                        <span>キャラを見る</span>
                        <span>→</span>
                      </div>
                    </div>

                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* ── SECTION 03専用: 画面下部マップフローティングアイコン（MAP表示中は×に切り替わる） ───────── */}
      {step === 3 && currentTab === 'survey' && (
        <div
          style={{
            position: 'fixed',
            right: 'max(16px, calc((100vw - 680px) / 2 + 16px))',
            bottom: 'calc(80px + env(safe-area-inset-bottom))',
            zIndex: 100001
          }}
        >
          <button
            type="button"
            onClick={() => setIsMapModalOpen(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: isMapModalOpen
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(185, 28, 28, 0.95) 100%)'
                : 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
              color: isMapModalOpen ? '#fff' : '#fbbf24',
              border: isMapModalOpen ? '1.5px solid #f87171' : '1.5px solid rgba(245, 158, 11, 0.75)',
              boxShadow: isMapModalOpen
                ? '0 8px 24px rgba(0, 0, 0, 0.7), 0 0 16px rgba(239, 68, 68, 0.4)'
                : '0 8px 24px rgba(0, 0, 0, 0.7), 0 0 16px rgba(245, 158, 11, 0.35)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
            }}
            title={isMapModalOpen ? "MAPを閉じる" : "会場MAPを表示"}
            aria-label={isMapModalOpen ? "MAPを閉じる" : "会場MAPを表示"}
          >
            {isMapModalOpen ? (
              <CloseIcon style={{ width: '22px', height: '22px', color: '#fff' }} />
            ) : (
              <MapIcon style={{ width: '22px', height: '22px', color: '#fbbf24' }} />
            )}
          </button>
        </div>
      )}

      {/* ── 会場MAPフルスクリーン表示オーバーレイ（完全透過仕様・シンプルUI） ───────── */}
      {isMapModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0, 0, 0, 0.2)', // 極薄のタップ判定用背景（下の文字が完全に読める）
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeIn 0.15s ease-out'
          }}
          onClick={() => setIsMapModalOpen(false)}
        >
          {/* 画像表示エリア（完全透過背景で下の文字が透けて見える） */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              position: 'relative',
              touchAction: 'pinch-zoom'
            }}
            onClick={() => setIsMapModalOpen(false)}
          >
            <img
              src="/MAP.webp"
              alt="会場MAP"
              style={{
                maxWidth: '96%',
                maxHeight: 'calc(100vh - 80px)',
                objectFit: 'contain',
                opacity: 0.92,
                filter: 'drop-shadow(0 15px 30px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 12px rgba(255, 255, 255, 0.25))',
                cursor: 'default',
                pointerEvents: 'auto',
                transition: 'opacity 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.92';
              }}
              onClick={(e) => {
                // 画像タップ時も閉じるようにする
                e.stopPropagation();
                setIsMapModalOpen(false);
              }}
            />
          </div>
        </div>,
        document.body
      )}

      {/* ── 下部固定ナビゲーション ───────── */}
      {step >= 1 && step <= 6 && currentTab === 'survey' && (
        <div className="nav">
          <div className={`in ${isShake ? "shake" : ""}`}>
            {warnMsg && (
              <p className="warn" style={{ position: "absolute", left: 0, right: 0, top: "-24px" }}>
                {warnMsg}
              </p>
            )}
            <button
              className="btn ghost"
              type="button"
              onClick={handlePrev}
            >
              戻る
            </button>
            <button
              className="btn"
              type="button"
              disabled={isSubmitting}
              onClick={handleNext}
            >
              {isSubmitting
                ? "送信中…"
                : step === 6
                ? (typeof window !== 'undefined' && localStorage.getItem('file26_survey_submitted_answers') ? "回答内容を更新して送信" : "記録を送信する")
                : "次へ"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
