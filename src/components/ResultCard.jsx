import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { calculateTitle, CAST_MEMBERS, generateObsCode, TOTAL_SCENES } from '../data/storyData';
import { Download, Award, AlertCircle, CheckCircle2, Share2, Copy, Layers, ExternalLink, HelpCircle, User, LogIn, Check, ShieldCheck } from 'lucide-react';
import GoogleAuthButton from './GoogleAuthButton';
import { getStoredUser } from '../utils/googleAuth';

export default function ResultCard({ formData, onScrollToBoard, onReEdit, showControls = true }) {
  const cardRef = useRef(null);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [generatedImgUrl, setGeneratedImgUrl] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showImgModal, setShowImgModal] = useState(false);
  const [currentLocalUser, setCurrentLocalUser] = useState(() => getStoredUser());

  // 自分のカード（回答直後やisUser指定時）かどうかを判定
  const isMyCard = formData.isUser === true;
  const cardGoogleUser = isMyCard ? currentLocalUser : (formData.googleUser || null);
  const isGoogleVerified = Boolean(formData.googleVerified || formData.googleEmail || (isMyCard && currentLocalUser));
  const cardAvatarImg = formData.customAvatar || formData.avatar || (isMyCard ? currentLocalUser?.picture : formData.googlePicture) || null;
  const cardObserverName = formData.observerName || formData.name || (isMyCard ? currentLocalUser?.name : null) || '名無しの観測者';

  const loopTrack = formData.loopTrack || {
    loop1: formData.primaryRoute || 'sakurai',
    loop2: 'jinnai',
    loop3: 'nanase'
  };

  const titleInfo = calculateTitle(loopTrack, formData.syncRate || 85);

  const getCast = (id) => CAST_MEMBERS.find(c => c.id === id) || CAST_MEMBERS[0];
  const cast1 = getCast(loopTrack.loop1);
  const cast2 = getCast(loopTrack.loop2 || loopTrack.loop1);
  const cast3 = getCast(loopTrack.loop3 || loopTrack.loop2 || loopTrack.loop1);

  // 観測対象（推し）キャストの解決
  const favCast = (formData.favoriteCast && CAST_MEMBERS.find(c => c.id === formData.favoriteCast)) ||
                  (formData.customAvatar && CAST_MEMBERS.find(c => c.avatar === formData.customAvatar)) ||
                  null;
  const primaryCast = favCast || cast1;
  const isDedicatedFav = Boolean(favCast);
  const [favImg, setFavImg] = useState(primaryCast?.avatar || null);

  // キャスト画像をData URL形式で保持
  const [cast1Img, setCast1Img] = useState(cast1.avatar);
  const [cast2Img, setCast2Img] = useState(cast2.avatar);
  const [cast3Img, setCast3Img] = useState(cast3.avatar);

  useEffect(() => {
    const toDataUrl = async (url) => {
      if (!url || url.startsWith('data:')) return url;
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.warn('Image convert error:', e);
        return url;
      }
    };

    if (cast1?.avatar) toDataUrl(cast1.avatar).then(setCast1Img);
    if (cast2?.avatar) toDataUrl(cast2.avatar).then(setCast2Img);
    if (cast3?.avatar) toDataUrl(cast3.avatar).then(setCast3Img);
    if (primaryCast?.avatar) toDataUrl(primaryCast.avatar).then(setFavImg);
  }, [cast1?.avatar, cast2?.avatar, cast3?.avatar, primaryCast?.avatar]);

  const sceneCount = formData.scenes?.length || formData.sceneCount || 0;
  const sceneRate = formData.sceneRate !== undefined ? formData.sceneRate : Math.round((sceneCount / TOTAL_SCENES) * 100);
  const obsCode = generateObsCode(loopTrack, sceneCount);

  // 推しへのメッセージまたは感想・手記
  const favMessage = favCast ? (formData.characterComments?.[favCast.id] || '') : '';
  const displayQuote = favMessage || formData.impressions || formData.routeComment || formData.highlightScene || formData.best || formData.word || '';

  // 未観測ヒントの算出
  const getUnobservedHint = (route) => {
    switch (route) {
      case 'yada':
        return {
          target: "順路C（櫻井 康佑の叶わぬ恋）",
          desc: "100年後の未来で櫻井が七瀬と交わした約束や、渡辺の動きをまだ目撃していない可能性があります。"
        };
      case 'sagisaka':
        return {
          target: "順路D（下山田 恵悠の欲望と葛藤）",
          desc: "未来を知ってしまった下山田が何を持ち帰り、どう暴走したのかを他の観測者に聞いてみましょう。"
        };
      case 'sakurai':
        return {
          target: "順路A（矢田 逞の事件解決）",
          desc: "研修室3のPCで矢田と陣内の間で何が起きていたのか、タイムマシンの真相を解き明かしましょう。"
        };
      case 'shimoyamada':
      case 'uzawa':
        return {
          target: "順路B（鷺坂 のののバタフライエフェクト）",
          desc: "事件の発端となった学友会の過去や、鷺坂のうっかり行動の真意を共有してもらいましょう。"
        };
      default:
        return {
          target: "個別キャラクターの密談ログ",
          desc: "あなたの直感探索とは別に、各部屋で交わされていたキャラクターたちの密談ログを他の観測者から集めましょう。"
        };
    }
  };

  const unobserved = getUnobservedHint(loopTrack.loop1);

  // どんなデバイスでも比率を固定するための動的スケール管理
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [cardHeight, setCardHeight] = useState(680);

  useEffect(() => {
    const updateSizeAndScale = () => {
      if (containerRef.current) {
        const availableWidth = containerRef.current.offsetWidth;
        const targetWidth = 560; // 黄金比カード基準幅
        const newScale = availableWidth < targetWidth ? (availableWidth / targetWidth) : 1;
        setScale(newScale);
      }
      if (cardRef.current) {
        // カード本来の高さ（transform適用前）を取得
        const rawHeight = cardRef.current.offsetHeight;
        if (rawHeight > 0) {
          setCardHeight(rawHeight);
        }
      }
    };

    updateSizeAndScale();
    const resizeObserver = new ResizeObserver(updateSizeAndScale);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    if (cardRef.current) resizeObserver.observe(cardRef.current);
    window.addEventListener('resize', updateSizeAndScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSizeAndScale);
    };
  }, []);

  // 画像生成処理（デバイス比率に左右されない完全固定比率レンダリング）
  const generateCanvas = async () => {
    if (!cardRef.current) return null;
    try {
      // 一時的なクローン要素を作成して常に560px固定幅でレンダリング
      const clone = cardRef.current.cloneNode(true);
      clone.style.transform = 'none';
      clone.style.position = 'fixed';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.width = '560px';
      clone.style.maxWidth = '560px';
      clone.style.zIndex = '-999';
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 2,
        width: 560,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#07080a',
        logging: false,
        imageTimeout: 15000
      });

      document.body.removeChild(clone);
      return canvas;
    } catch (e) {
      console.error('html2canvas error:', e);
      // フォールバック
      try {
        const canvas = await html2canvas(cardRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#07080a',
          logging: false
        });
        return canvas;
      } catch (err) {
        return null;
      }
    }
  };

  const handleSaveImage = async () => {
    setIsGeneratingImg(true);
    const canvas = await generateCanvas();
    if (!canvas) {
      setIsGeneratingImg(false);
      return;
    }

    const dataUrl = canvas.toDataURL('image/png');
    setGeneratedImgUrl(dataUrl);

    const link = document.createElement('a');
    link.download = `File26_094_OBSERVATION_${obsCode}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsGeneratingImg(false);
    setDownloadSuccess(true);
    setShowImgModal(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleCopyLink = () => {
    const text = `【File:26_094 観測記録】\n観測者: ${formData.observerName || 'OBSERVER'}\n称号: 〖${titleInfo.name}〗\n観測率: ${sceneRate}%\n観測コード: ${obsCode}\nhttps://file26-survey.vercel.app`;
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // レーダーチャート（文字が見切れないよう余白を確保した140x140座標系）
  const radar = titleInfo.radar;
  const center = 70;
  const maxR = 38;
  const pIntuition = { x: center, y: center - (radar.intuition / 100) * maxR };
  const pReasoning = { x: center + (radar.reasoning / 100) * maxR, y: center };
  const pMobility = { x: center, y: center + (radar.mobility / 100) * maxR };
  const pImmersion = { x: center - (radar.immersion / 100) * maxR, y: center };
  const radarPolygon = `${pIntuition.x},${pIntuition.y} ${pReasoning.x},${pReasoning.y} ${pMobility.x},${pMobility.y} ${pImmersion.x},${pImmersion.y}`;

  return (
    <div ref={containerRef} style={{ maxWidth: '560px', width: '100%', margin: '0 auto', textAlign: 'left' }}>
      
      {/* 📜 デバイス比率固定スケーリングコンテナ */}
      <div style={{
        height: `${cardHeight * scale}px`,
        width: '100%',
        position: 'relative',
        marginBottom: '16px',
        transition: 'height 0.15s ease-out'
      }}>
        <div 
          ref={cardRef}
          style={{
            width: '560px',
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: `translateX(-50%) scale(${scale})`,
            transformOrigin: 'top center',
            background: '#12151c',
            borderRadius: '16px',
            padding: '24px 20px',
            color: '#eae7e2',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
            boxSizing: 'border-box'
          }}
        >
        {/* ── CARD INNER FRAME ── */}
        <div style={{
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '18px 16px 16px',
          background: '#0d1017',
          position: 'relative'
        }}>

          {/* 1. カード最上部：公式ヘッダー ＆ 観測コード */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', background: '#b8352f', color: '#fff', padding: '3px 8px', borderRadius: '4px' }}>
                OBSERVATION RECORD
              </span>
              <span style={{ fontSize: '11px', fontFamily: 'var(--gothic)', letterSpacing: '0.15em', color: '#94a3b8' }}>
                FILE:26_094
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', letterSpacing: '0.1em', color: '#e2e8f0', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', padding: '3px 10px', borderRadius: '4px' }}>
                ID: {obsCode}
              </div>
            </div>
          </div>

          {/* 2. 観測者名 ＆ 称号 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            padding: '14px 16px',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '0.12em', fontWeight: 600 }}>
                    観測者名
                  </span>
                  {isGoogleVerified && (
                    <span style={{
                      fontSize: '9.5px',
                      color: '#34d399',
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontWeight: 700
                    }}>
                      <ShieldCheck style={{ width: '11px', height: '11px' }} />
                      <span>Google認証済</span>
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                  {cardAvatarImg && (
                    <img
                      src={cardAvatarImg}
                      alt=""
                      style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #ff4a42', background: '#0f172a' }}
                    />
                  )}
                  <span style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--gothic)', color: '#ffffff' }}>
                    {cardObserverName}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.04)' }}>
                    {formData.grade || '一般'}
                  </span>
                </div>
              </div>

              {/* 獲得称号 */}
              <div style={{
                padding: '6px 14px',
                background: 'rgba(184, 53, 47, 0.15)',
                border: '1px solid rgba(184, 53, 47, 0.4)',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <Award style={{ width: '15px', height: '15px', color: '#f87171' }} />
                <span style={{ fontFamily: 'var(--mincho)', fontWeight: 700, fontSize: '14px', color: '#fff', letterSpacing: '0.04em' }}>
                  〖 {titleInfo.name} 〗
                </span>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.65, margin: '8px 0 0', fontFamily: 'var(--mincho)' }}>
              {titleInfo.desc}
            </p>
          </div>

          {/* 3. 追跡キャスト ＆ メッセージ */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            padding: '14px',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '16px', alignItems: 'center' }}>
              
              {/* ポートレート写真 */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '100px',
                  height: '125px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: '#0a0d14'
                }}>
                  <img
                    src={favImg || primaryCast.avatar}
                    crossOrigin="anonymous"
                    alt={primaryCast.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center 10%',
                      display: 'block'
                    }}
                  />
                </div>
              </div>

              {/* キャスト情報 */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#cbd5e1', letterSpacing: '0.12em', fontWeight: 700 }}>
                    主な観測対象（推し）
                  </span>
                  {isDedicatedFav && (
                    <span style={{
                      fontSize: '9.5px',
                      color: '#fde047',
                      background: 'rgba(234, 179, 8, 0.2)',
                      border: '1px solid rgba(234, 179, 8, 0.4)',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontWeight: 700
                    }}>
                      ★ 推し設定
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--gothic)', marginTop: '2px' }}>
                  {primaryCast.name}
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px', fontWeight: 500 }}>
                  <span>{primaryCast.generation}</span> ｜ {primaryCast.role}
                </div>
                <div style={{ fontSize: '12.5px', color: '#f1f5f9', fontFamily: 'var(--mincho)', fontStyle: 'italic', marginTop: '6px', lineHeight: 1.55 }}>
                  「{primaryCast.tagline}」
                </div>
              </div>
            </div>

            {/* 💬 推しへのメッセージ・手記 */}
            {favMessage && (
              <div style={{
                marginTop: '12px',
                padding: '12px 14px',
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px' }}>💬</span>
                  <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: '10.5px', letterSpacing: '0.08em' }}>
                    {primaryCast.name} への観測手記・メッセージ
                  </span>
                </div>
                <div style={{
                  fontSize: '12.5px',
                  color: '#fffbeb',
                  lineHeight: 1.7,
                  fontFamily: 'var(--mincho)',
                  whiteSpace: 'pre-wrap'
                }}>
                  “{favMessage}”
                </div>
              </div>
            )}
          </div>

          {/* 4. 周回追跡タイムライン ＆ レーダーチャート */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 110px',
            gap: '10px',
            marginBottom: '14px'
          }}>
            {/* 3周回タイムライン */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '10px'
            }}>
              <div style={{ fontSize: '9.5px', letterSpacing: '0.12em', color: '#cbd5e1', fontWeight: 700, marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>周回ルート</span>
                <span style={{ color: '#f1f5f9' }}>全3周</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {[cast1, cast2, cast3].map((c, i) => (
                  <div key={i} style={{ border: '1px solid rgba(255, 255, 255, 0.08)', background: '#121620', padding: '6px 4px', borderRadius: '4px', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '9px', color: '#cbd5e1', fontWeight: 600, marginBottom: '3px' }}>
                      {i + 1}周目
                    </span>
                    <div style={{ width: '100%', aspectRatio: '3/3.6', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '4px' }}>
                      <img
                        src={i===0 ? cast1Img : i===1 ? cast2Img : cast3Img}
                        crossOrigin="anonymous"
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 12%', display: 'block' }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>{c.name.split(' ')[0]}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* レーダーチャート ＆ 観測率 */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="92" height="92" viewBox="0 0 140 140" style={{ overflow: 'visible' }}>
                <polygon points="70,32 108,70 70,108 32,70" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
                <polygon points="70,51 89,70 70,89 51,70" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
                <line x1="70" y1="32" x2="70" y2="108" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="2,2" />
                <line x1="32" y1="70" x2="108" y2="70" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="2,2" />
                <polygon points={radarPolygon} fill="rgba(184, 53, 47, 0.4)" stroke="#ff4a42" strokeWidth="1.5" />
                <text x="70" y="22" textAnchor="middle" fontSize="10" fill="#f1f5f9" fontWeight="bold">直感</text>
                <text x="113" y="74" textAnchor="start" fontSize="10" fill="#f1f5f9" fontWeight="bold">考察</text>
                <text x="70" y="124" textAnchor="middle" fontSize="10" fill="#f1f5f9" fontWeight="bold">行動</text>
                <text x="27" y="74" textAnchor="end" fontSize="10" fill="#f1f5f9" fontWeight="bold">没入</text>
              </svg>
              <div style={{ textAlign: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '9.5px', color: '#cbd5e1', display: 'block', fontWeight: 600 }}>観測率</span>
                <span style={{ fontWeight: 800, color: '#f87171', fontSize: '13.5px' }}>{sceneRate}%</span>
              </div>
            </div>
          </div>

          {/* 5. 👁️ 忘れられない場面・セリフ（最も印象的なシーン手記） */}
          {(formData.best || formData.highlightScene) && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              padding: '12px 14px',
              marginBottom: '12px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                <span style={{ fontSize: '11px' }}>👁️</span>
                <span style={{ fontSize: '10px', color: '#38bdf8', letterSpacing: '0.08em', fontWeight: 800 }}>
                  忘れられない場面・セリフ
                </span>
              </div>
              <div style={{
                fontSize: '12.5px',
                fontFamily: 'var(--mincho)',
                color: '#f0f9ff',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap'
              }}>
                “{formData.best || formData.highlightScene}”
              </div>
            </div>
          )}

          {/* 6. 📜 観測者の言葉・全体の感想・考察 */}
          {(formData.impressions || formData.routeComment || formData.word) && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              padding: '12px 14px',
              marginBottom: '14px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                <span style={{ fontSize: '11px' }}>📜</span>
                <span style={{ fontSize: '10px', color: '#fbbf24', letterSpacing: '0.08em', fontWeight: 800 }}>
                  {formData.word ? `感想：${formData.word}` : '観測者の感想・手記'}
                </span>
              </div>
              {formData.impressions && (
                <div style={{
                  fontSize: '12.5px',
                  fontFamily: 'var(--mincho)',
                  color: '#fffbeb',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                  marginBottom: formData.routeComment ? '10px' : '0'
                }}>
                  {formData.impressions}
                </div>
              )}
              {formData.routeComment && (
                <div style={{
                  borderTop: formData.impressions ? '1px dashed rgba(245, 158, 11, 0.2)' : 'none',
                  paddingTop: formData.impressions ? '8px' : '0',
                  marginTop: formData.impressions ? '8px' : '0'
                }}>
                  <div style={{ fontSize: '9.5px', color: '#38bdf8', fontWeight: 700, marginBottom: '4px', letterSpacing: '0.05em' }}>
                    🧭 選択ルートの考察・所感:
                  </div>
                  <div style={{
                    fontSize: '12px',
                    fontFamily: 'var(--mincho)',
                    color: '#e2e8f0',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {formData.routeComment}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 6. 未観測ピース */}
          <div style={{
            borderTop: '1px dashed rgba(255, 255, 255, 0.15)',
            paddingTop: '10px',
            fontSize: '11px'
          }}>
            <div style={{ color: '#e2e8f0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
              <AlertCircle style={{ width: '13px', height: '13px', color: '#ff4a42' }} />
              <span>未観測ピース</span>
            </div>
            <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '12px' }}>{unobserved.target}</div>
            <div style={{ color: '#cbd5e1', fontSize: '11.5px', lineHeight: 1.55, marginTop: '2px' }}>{unobserved.desc}</div>
          </div>

          {/* 7. カードフッター */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '14px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '9px',
            color: '#64748b',
            letterSpacing: '0.08em',
          }}>
            <span>2026/09/04 CHATERAISE HOTEL</span>
            <span>CIT STUDENT COUNCIL #24</span>
          </div>

        </div>
      </div>
      </div>

      {/* ── 共有・保存・アクションボタングループ ── */}
      {showControls && (
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        
        {/* メイン: 画像保存ボタン */}
        <button
          type="button"
          className="btn primary"
          onClick={handleSaveImage}
          disabled={isGeneratingImg}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '8px', 
            fontSize: '13.5px',
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            color: '#fff',
            fontWeight: '700',
            borderRadius: '10px',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
            cursor: 'pointer'
          }}
        >
          <Download style={{ width: '16px', height: '16px' }} />
          <span>{isGeneratingImg ? '画像生成中…' : '観測記録カード画像を保存する'}</span>
        </button>

        {/* サブ: 共有リンクコピー ＆ テキストコピー */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              const url = new URL(window.location.origin + window.location.pathname);
              url.searchParams.set('tab', 'card');
              url.searchParams.set('name', cardObserverName);
              url.searchParams.set('grade', formData.grade || '一般');
              if (formData.customAvatar) url.searchParams.set('avatar', formData.customAvatar);
              url.searchParams.set('l1', loopTrack.loop1 || 'yada');
              url.searchParams.set('l2', loopTrack.loop2 || 'jinnai');
              url.searchParams.set('l3', loopTrack.loop3 || 'yada');
              if (formData.favoriteCast) url.searchParams.set('fav', formData.favoriteCast);
              url.searchParams.set('sync', String(formData.syncRate || 85));
              if (formData.word) url.searchParams.set('w', formData.word);

              if (navigator.clipboard) {
                navigator.clipboard.writeText(url.toString()).then(() => {
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2500);
                });
              } else {
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2500);
              }
            }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.15)', color: '#cbd5e1', borderRadius: '8px' }}
          >
            <Share2 style={{ width: '14px', height: '14px' }} />
            <span>{copySuccess ? 'コピー完了！' : 'カード共有URL'}</span>
          </button>

          <button
            type="button"
            className="btn ghost"
            onClick={handleCopyLink}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.15)', color: '#cbd5e1', borderRadius: '8px' }}
          >
            <Copy style={{ width: '14px', height: '14px' }} />
            <span>テキストコピー</span>
          </button>
        </div>

        {/* 📝 回答再編集ボタン */}
        {onReEdit && (
          <button
            type="button"
            className="btn ghost"
            onClick={onReEdit}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              padding: '9px 14px',
              background: 'rgba(245, 158, 11, 0.08)',
              borderColor: 'rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <span>📝</span>
            <span>アンケート回答内容を再編集・更新</span>
          </button>
        )}
      </div>
      )}

      {downloadSuccess && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          background: 'rgba(127, 209, 168, 0.15)',
          border: '1px solid var(--ok)',
          color: 'var(--ok)',
          fontSize: '12px',
          textAlign: 'center',
          borderRadius: '4px'
        }}>
          ✓ 画像を保存しました。スマホの方は下の画像を長押ししても保存できます。
        </div>
      )}

      {/* スマホ長押し保存モーダル */}
      {showImgModal && generatedImgUrl && (
        <div 
          onClick={() => setShowImgModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            cursor: 'pointer'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#15171b',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              maxWidth: '420px',
              width: '100%',
              padding: '16px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
              📱 画像を長押しして保存
            </div>
            <p style={{ fontSize: '11px', color: 'var(--dim)', margin: '0 0 12px' }}>
              画像を長押しして「画像を保存」または「写真に追加」を選択してください。
            </p>
            <img 
              src={generatedImgUrl} 
              alt="戦歴カード" 
              style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.15)' }} 
            />
            <button
              type="button"
              className="btn ghost big"
              onClick={() => setShowImgModal(false)}
              style={{ marginTop: '12px' }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
