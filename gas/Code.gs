/**
 * =========================================================================
 * File:26__094 観測データベース (Google Apps Script)
 * クリーンアーキテクチャ設計（ルーター・コントローラー・DBヘルパー構成）
 * =========================================================================
 * 
 * 【設定手順】
 * 1. Google スプレッドシートを新規作成（名前例:「File:26_094 観測ログDB」）
 * 2. メニュー「拡張機能」>「Apps Script」を開く
 * 3. 既存コードをすべて消去し、このファイルの内容を貼り付けて保存（⌘+S / Ctrl+S）
 * 4. 関数「initSpreadsheet」を選択して「実行」（初回は権限承認ダイアログが出ます）
 * 5. 右上「デプロイ」>「新しいデプロイ」をクリック
 *    - 種類の選択:「ウェブアプリ」
 *    - 次のユーザーとして実行:「自分」
 *    - アクセスできるユーザー:「全員」 (Anyone) ※重要
 * 6. 発行されたURL（https://script.google.com/macros/s/.../exec）を
 *    フロントエンド（src/App.jsx の CONFIG.ENDPOINT）に設定します。
 */

// フォーム認証キー
const FORM_KEY = "kanso-26094-xyz";

// シート名定数
const SHEETS = {
  SURVEY: "アンケート回答",
  CROSSTALK: "時空通信",
  CAST_NOTES: "キャスト手記",
  DRAFTS: "途中保存進捗",
  REPLIES: "返信ログ",
  BUGS: "不具合報告"
};

// =========================================================================
// 1. 初回セットアップ & スキーマ定義
// =========================================================================

function initSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1-1. アンケート回答シート
  let surveySheet = ss.getSheetByName(SHEETS.SURVEY);
  if (!surveySheet) {
    surveySheet = ss.insertSheet(SHEETS.SURVEY, 0);
  }
  const surveyHeaders = [
    "タイムスタンプ",
    "観測コード",
    "ニックネーム",
    "実名",
    "Googleメール",
    "Google表示名",
    "学年・属性",
    "役割",
    "1周目ルート",
    "1周目すれ違い",
    "2周目ルート",
    "2周目すれ違い",
    "3周目ルート",
    "3周目すれ違い",
    "観測シーン数",
    "観測網羅率",
    "観測シーン一覧",
    "心残りシーン",
    "推しキャスト",
    "総合満足度",
    "演劇-体験軸",
    "上演時間感",
    "次回参加意向",
    "次回希望役割",
    "最も印象的なシーン手記（忘れられない場面・セリフ）",
    "あなたの言葉・記憶（感想タイトル）",
    "改善点・要望",
    "全体メッセージ",
    "キャスト別メッセージ(JSON)",
    "同期率",
    "リアクション(JSON)",
    "全体の感想(自由記述)",
    "事前配布物・資料確認状況",
    "選択ルート感想・考察",
    "感想（非公開）"
  ];
  surveySheet.getRange(1, 1, 1, surveyHeaders.length).setValues([surveyHeaders]);
  surveySheet.getRange(1, 1, 1, surveyHeaders.length).setFontWeight("bold").setBackground("#1e293b").setFontColor("#38bdf8");
  surveySheet.setFrozenRows(1);

  // 1-2. 時空通信（掲示板）シート
  let talkSheet = ss.getSheetByName(SHEETS.CROSSTALK);
  if (!talkSheet) {
    talkSheet = ss.insertSheet(SHEETS.CROSSTALK, 1);
  }
  const talkHeaders = [
    "投稿日時",
    "メッセージID",
    "観測コード",
    "ニックネーム",
    "Googleメール",
    "宛先ルート(JSON)",
    "タグ・カテゴリ",
    "メッセージ本文",
    "1周目",
    "2周目",
    "3周目",
    "同期率",
    "推しキャスト",
    "スタンプ数(JSON)",
    "スタンプ送信者(JSON)",
    "返信リスト(JSON)",
    "引用情報(JSON)"
  ];
  talkSheet.getRange(1, 1, 1, talkHeaders.length).setValues([talkHeaders]);
  talkSheet.getRange(1, 1, 1, talkHeaders.length).setFontWeight("bold").setBackground("#0f172a").setFontColor("#34d399");
  talkSheet.setFrozenRows(1);

  // 1-3. 返信ログシート
  let repliesSheet = ss.getSheetByName(SHEETS.REPLIES);
  if (!repliesSheet) {
    repliesSheet = ss.insertSheet(SHEETS.REPLIES, 2);
  }
  const repliesHeaders = [
    "返信日時",
    "返信ID",
    "親ポストID",
    "投稿者名",
    "観測コード",
    "Googleメール",
    "返信本文",
    "周回情報(JSON)"
  ];
  repliesSheet.getRange(1, 1, 1, repliesHeaders.length).setValues([repliesHeaders]);
  repliesSheet.getRange(1, 1, 1, repliesHeaders.length).setFontWeight("bold").setBackground("#064e3b").setFontColor("#6ee7b7");
  repliesSheet.setFrozenRows(1);

  // 1-4. キャスト手記シート
  let notesSheet = ss.getSheetByName(SHEETS.CAST_NOTES);
  if (!notesSheet) {
    notesSheet = ss.insertSheet(SHEETS.CAST_NOTES, 3);
  }
  const notesHeaders = [
    "手記ID",
    "キャストID",
    "キャスト名",
    "タイトル",
    "本文",
    "公開日時",
    "アンロック条件",
    "キャストメッセージ"
  ];
  notesSheet.getRange(1, 1, 1, notesHeaders.length).setValues([notesHeaders]);
  notesSheet.getRange(1, 1, 1, notesHeaders.length).setFontWeight("bold").setBackground("#1e1b4b").setFontColor("#c084fc");
  notesSheet.setFrozenRows(1);

  // デフォルトシート（シート1）の削除
  const defaultSheet = ss.getSheetByName("シート1");
  if (defaultSheet && ss.getSheets().length > 4) {
    ss.deleteSheet(defaultSheet);
  }

  Logger.log("✅ File:26_094 スプレッドシートDBの初期化が完了しました！");
}

// =========================================================================
// 2. HTTP ルーター (doGet / doPost)
// =========================================================================

function doGet(e) {
  try {
    const action = (e.parameter && e.parameter.action) || "getAll";
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const repliesMap = ReplyController.getAllGroupedByPostId(ss);

    switch (action) {
      case "getAll":
        return responseJSON({
          ok: true,
          surveys: SurveyController.getAll(ss, repliesMap),
          crossTalk: CrossTalkController.getAll(ss, repliesMap),
          castNotes: CastNotesController.getAll(ss),
          replies: repliesMap
        });

      case "getResponses":
      case "getSurveys":
        return responseJSON({
          ok: true,
          responses: SurveyController.getAll(ss, repliesMap),
          replies: repliesMap
        });

      case "getCrossTalk":
        return responseJSON({
          ok: true,
          messages: CrossTalkController.getAll(ss, repliesMap),
          replies: repliesMap
        });

      case "getCastNotes":
        return responseJSON({
          ok: true,
          notes: CastNotesController.getAll(ss)
        });

      case "getDraft":
        return responseJSON({
          ok: true,
          draft: DraftController.get(ss, e.parameter.email)
        });

      default:
        return responseJSON({ ok: true, status: "File:26_094 DB Online", action: action });
    }
  } catch (error) {
    return responseJSON({ ok: false, error: error.toString() }, 500);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // 10秒排他ロック

    const rawData = e.postData.contents;
    const body = JSON.parse(rawData);

    // 認証キー検証
    if (body.key !== FORM_KEY) {
      return responseJSON({ ok: false, error: "Unauthorized form key" }, 403);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = body.action || "submitSurvey";

    switch (action) {
      case "submitSurvey":
        return responseJSON(SurveyController.create(ss, body.data));

      case "saveDraft":
        return responseJSON(DraftController.save(ss, body.data));

      case "postCrossTalk":
        return responseJSON(CrossTalkController.create(ss, body.data));

      case "editCrossTalk":
        return responseJSON(CrossTalkController.update(ss, body.data));

      case "deleteCrossTalk":
        return responseJSON(CrossTalkController.delete(ss, body.data));

      case "postReply":
        return responseJSON(ReplyController.add(ss, body.data));

      case "deleteReply":
        return responseJSON(ReplyController.delete(ss, body.data));

      case "editSurveyPost":
        return responseJSON(SurveyController.updatePost(ss, body.data));

      case "deleteSurveyPost":
        return responseJSON(SurveyController.deletePost(ss, body.data));

      case "toggleReaction":
        return responseJSON(ReactionController.toggle(ss, body.data));

      case "reportBug":
        return responseJSON(BugController.create(ss, body.data));

      case "initDatabase":
        initSpreadsheet();
        return responseJSON({ ok: true, message: "Database initialized" });

      default:
        return responseJSON({ ok: false, error: "Unknown action: " + action }, 400);
    }
  } catch (error) {
    return responseJSON({ ok: false, error: error.toString() }, 500);
  } finally {
    lock.releaseLock();
  }
}

// =========================================================================
// 3. コントローラー層 (ビジネスロジック)
// =========================================================================

/**
 * 下書き自動保存・進捗同期コントローラー
 */
const DraftController = {
  get: function(ss, email) {
    if (!email) return null;
    const sheet = ss.getSheetByName(SHEETS.DRAFTS);
    if (!sheet) return null;
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return null;

    const targetEmail = email.toString().trim().toLowerCase();
    for (let i = rows.length - 1; i >= 1; i--) {
      const r = rows[i];
      if ((r[0] || "").toString().trim().toLowerCase() === targetEmail) {
        return {
          email: r[0],
          name: r[1],
          step: Number(r[2]) || 1,
          answers: DBHelper.parseJSON(r[3], null),
          updatedAt: r[4]
        };
      }
    }
    return null;
  },

  save: function(ss, d) {
    if (!d || !d.email) return { ok: false, error: "email is required" };
    let sheet = ss.getSheetByName(SHEETS.DRAFTS);
    if (!sheet) {
      sheet = ss.insertSheet(SHEETS.DRAFTS);
      const headers = ["Googleメール", "ニックネーム", "進捗ステップ", "回答JSON", "更新日時"];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#1e293b").setFontColor("#38bdf8");
    }

    const rows = sheet.getDataRange().getValues();
    const targetEmail = d.email.toString().trim().toLowerCase();
    let targetRowIndex = -1;

    for (let i = 1; i < rows.length; i++) {
      if ((rows[i][0] || "").toString().trim().toLowerCase() === targetEmail) {
        targetRowIndex = i + 1;
        break;
      }
    }

    const newRow = [
      targetEmail,
      d.name || "",
      Number(d.step) || 1,
      JSON.stringify(d.answers || {}),
      new Date()
    ];

    if (targetRowIndex > 0) {
      sheet.getRange(targetRowIndex, 1, 1, newRow.length).setValues([newRow]);
    } else {
      sheet.appendRow(newRow);
    }

    return { ok: true, message: "下書きをクラウドに自動保存しました", step: d.step };
  }
};

/**
 * アンケート & 観測戦歴カード コントローラー
 */
const SurveyController = {
  getAll: function(ss, repliesMap = {}) {
    const sheet = ss.getSheetByName(SHEETS.SURVEY);
    if (!sheet) return [];
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return [];

    const list = [];
    for (let i = rows.length - 1; i >= 1; i--) {
      const r = rows[i];
      list.push({
        timestamp: r[0],
        obsCode: r[1],
        name: r[2],
        observerName: r[2],
        realName: r[3],
        googleEmail: r[4],
        googleName: r[5],
        grade: r[6],
        role: r[7],
        loop1: r[8],
        loop1Seen: r[9] ? r[9].toString().split(",") : [],
        loop2: r[10],
        loop2Seen: r[11] ? r[11].toString().split(",") : [],
        loop3: r[12],
        loop3Seen: r[13] ? r[13].toString().split(",") : [],
        sceneCount: Number(r[14]) || 0,
        sceneRate: r[15],
        scenes: r[16] ? r[16].toString().split(",") : [],
        missed: r[17] ? r[17].toString().split(",") : [],
        favoriteCast: r[18],
        overall: r[19],
        matrix: r[20],
        length: r[21],
        again: r[22],
        futureRoles: r[23],
        best: r[24] || "",
        word: r[25] || "",
        improve: r[26] || "",
        msg: r[27] || "",
        characterComments: DBHelper.parseJSON(r[28], {}),
        syncRate: Number(r[29]) || 90,
        reactions: DBHelper.parseJSON(r[30], { resonance: 0, chills: 0, users: [] }),
        impressions: r[31] || "",
        prep: r[32] || "",
        routeComment: r[33] || "",
        privateImpressions: r[34] || ""
      });
    }
    return list;
  },

  create: function(ss, d) {
    const sheet = ss.getSheetByName(SHEETS.SURVEY) || ss.insertSheet(SHEETS.SURVEY);
    const rows = sheet.getDataRange().getValues();

    let targetRowIndex = -1; // 1-based 行番号（2以上なら更新対象）
    let existingReactions = null;

    const email = (d.googleEmail || "").toString().trim().toLowerCase();
    const realName = (d.realName || "").toString().trim();
    const grade = (d.grade || "").toString().trim();
    const obsCode = (d.obsCode || "").toString().trim();

    // 既存行の検索（最新のものから逆順検索して同一回答者を特定）
    if (rows.length > 1) {
      for (let i = rows.length - 1; i >= 1; i--) {
        const r = rows[i];
        const rObsCode = (r[1] || "").toString().trim();
        const rNickName = (r[2] || "").toString().trim();
        const rRealName = (r[3] || "").toString().trim();
        const rEmail = (r[4] || "").toString().trim().toLowerCase();
        const rGrade = (r[6] || "").toString().trim();

        // 判定1: Googleメールアドレスが一致（最優先・100%同一アカウント）
        if (email && rEmail && email === rEmail) {
          targetRowIndex = i + 1;
          existingReactions = r[30];
          break;
        }

        // 判定2: 実名（氏名） かつ 学年・属性 が一致（氏名が空でない場合）
        if (realName && rRealName && realName === rRealName && grade && rGrade && grade === rGrade) {
          targetRowIndex = i + 1;
          existingReactions = r[30];
          break;
        }

        // 判定3: 観測コード かつ 実名 が一致
        if (obsCode && rObsCode && obsCode === rObsCode && realName && rRealName && realName === rRealName) {
          targetRowIndex = i + 1;
          existingReactions = r[30];
          break;
        }

        // 判定4: 実名（氏名）が完全一致（実名が入力されている場合）
        if (realName && rRealName && realName === rRealName) {
          targetRowIndex = i + 1;
          existingReactions = r[30];
          break;
        }

        // 判定5: 観測コード（ObsCode）かつ ニックネームが一致
        if (obsCode && rObsCode && obsCode === rObsCode && d.name && rNickName && d.name.trim() === rNickName) {
          targetRowIndex = i + 1;
          existingReactions = r[30];
          break;
        }
      }
    }

    const isUpdate = targetRowIndex > 0;
    const now = new Date();
    // 既存のリアクション（いいね・共鳴等）があれば引き継ぐ
    const parsedReactions = existingReactions 
      ? DBHelper.parseJSON(existingReactions, d.reactions || { resonance: 0, chills: 0, users: [] })
      : (d.reactions || { resonance: 0, chills: 0, users: [] });

    // マトリクス評価のフォーマット
    const matrixStr = typeof d.matrix === 'object' && d.matrix !== null 
      ? (Object.keys(d.matrix).map(k => `${k}=${d.matrix[k]}`).join(", ") || JSON.stringify(d.matrix))
      : (d.matrix || "");

    // 既存の30列の順序を完全維持＋末尾（31列目）に全体の感想、32列目に事前配布物を配置
    const newRow = [
      now,
      d.obsCode || ("OBS-" + Utilities.getUuid().substring(0, 6).toUpperCase()),
      d.name || d.observerName || "観測者",
      d.realName || "",
      d.googleEmail || "",
      d.googleName || "",
      d.grade || "一般",
      d.role || "観測者",
      d.loop1 || (d.loopTrack && d.loopTrack.loop1) || "",
      Array.isArray(d.loop1Seen) ? d.loop1Seen.join(",") : (d.loop1Seen || ""),
      d.loop2 || (d.loopTrack && d.loopTrack.loop2) || "",
      Array.isArray(d.loop2Seen) ? d.loop2Seen.join(",") : (d.loop2Seen || ""),
      d.loop3 || (d.loopTrack && d.loopTrack.loop3) || "",
      Array.isArray(d.loop3Seen) ? d.loop3Seen.join(",") : (d.loop3Seen || ""),
      d.sceneCount || 0,
      (d.sceneRate !== undefined ? d.sceneRate + "%" : ""),
      Array.isArray(d.scenes) ? d.scenes.join(",") : (d.scenes || ""),
      Array.isArray(d.missed) ? d.missed.join(",") : (d.missed || ""),
      d.favoriteCast || "",
      d.overall || "",
      matrixStr,
      d.length || "",
      d.again || "",
      d.futureRoles || "",
      d.best || "",
      d.word || "",
      d.improve || "",
      d.msg || "",
      JSON.stringify(d.characterComments || {}),
      d.syncRate || 90,
      JSON.stringify(parsedReactions),
      d.impressions || "",
      d.prep || "",
      d.routeComment || "",
      d.privateImpressions || ""
    ];

    if (isUpdate) {
      sheet.getRange(targetRowIndex, 1, 1, newRow.length).setValues([newRow]);
      return { 
        ok: true, 
        message: "アンケート回答を最新の内容で上書き更新しました", 
        obsCode: newRow[1], 
        isUpdate: true 
      };
    } else {
      sheet.appendRow(newRow);
      return { 
        ok: true, 
        message: "アンケートを正常に記録しました（新規）", 
        obsCode: newRow[1], 
        isUpdate: false 
      };
    }
  },

  updatePost: function(ss, data) {
    const sheet = ss.getSheetByName(SHEETS.SURVEY);
    if (!sheet) return { ok: false, error: "Survey sheet not found" };
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return { ok: false, error: "No survey records" };

    const { obsCode, googleEmail, postType, targetCast, message, isPrivate } = data;
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const matchCode = obsCode && r[1] && r[1].toString().trim() === obsCode.toString().trim();
      const matchEmail = googleEmail && r[4] && r[4].toString().trim().toLowerCase() === googleEmail.toString().trim().toLowerCase();

      if (matchCode || matchEmail) {
        const rowIdx = i + 1;
        if (postType === 'comment') {
          sheet.getRange(rowIdx, 32).setValue(message !== undefined ? message : r[31]); // routeComment (32列目)
        } else if (postType === 'scene') {
          sheet.getRange(rowIdx, 25).setValue(message !== undefined ? message : r[24]); // best (25列目)
        } else if (postType === 'cast' && targetCast) {
          const charComments = DBHelper.parseJSON(r[28], {});
          const currentVal = charComments[targetCast];
          const currentText = typeof currentVal === 'object' && currentVal !== null ? (currentVal.text || '') : String(currentVal || '');
          const newText = message !== undefined ? message : currentText;
          const currentIsPrivate = typeof currentVal === 'object' && currentVal !== null ? !!currentVal.isPrivate : false;
          const newIsPrivate = isPrivate !== undefined ? !!isPrivate : currentIsPrivate;

          charComments[targetCast] = {
            text: newText,
            isPrivate: newIsPrivate
          };
          sheet.getRange(rowIdx, 29).setValue(JSON.stringify(charComments));
        } else if (postType === 'msg') {
          sheet.getRange(rowIdx, 28).setValue(message !== undefined ? message : r[27]); // msg (28列目)
        }
        return { ok: true, message: "アンケート感想ログ（公開設定/本文）を更新しました" };
      }
    }
    return { ok: false, error: "Target survey response not found" };
  },

  deletePost: function(ss, data) {
    const sheet = ss.getSheetByName(SHEETS.SURVEY);
    if (!sheet) return { ok: false, error: "Survey sheet not found" };
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return { ok: false, error: "No survey records" };

    const { obsCode, googleEmail, postType, targetCast } = data;
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const matchCode = obsCode && r[1] && r[1].toString().trim() === obsCode.toString().trim();
      const matchEmail = googleEmail && r[4] && r[4].toString().trim().toLowerCase() === googleEmail.toString().trim().toLowerCase();

      if (matchCode || matchEmail) {
        const rowIdx = i + 1;
        if (postType === 'comment') {
          sheet.getRange(rowIdx, 26).setValue(""); // word (26列目)
          sheet.getRange(rowIdx, 32).setValue(""); // routeComment (32列目)
        } else if (postType === 'scene') {
          sheet.getRange(rowIdx, 25).setValue(""); // best (25列目)
        } else if (postType === 'cast' && targetCast) {
          const charComments = DBHelper.parseJSON(r[28], {});
          delete charComments[targetCast];
          sheet.getRange(rowIdx, 29).setValue(JSON.stringify(charComments));
        } else if (postType === 'msg') {
          sheet.getRange(rowIdx, 28).setValue(""); // msg (28列目)
        }
        return { ok: true, message: "アンケート感想ログを削除しました" };
      }
    }
    return { ok: false, error: "Target survey response not found" };
  }
};

/**
 * 返信（リプライ）一元管理コントローラー
 */
const ReplyController = {
  getAllGroupedByPostId: function(ss) {
    const sheet = ss.getSheetByName(SHEETS.REPLIES);
    const map = {};
    if (!sheet) return map;

    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return map;

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const postId = r[2];
      if (!postId) continue;

      const replyObj = {
        timestamp: r[0],
        id: r[1],
        postId: postId,
        name: r[3],
        observerName: r[3],
        obsCode: r[4],
        googleEmail: r[5],
        message: r[6],
        loopTrack: DBHelper.parseJSON(r[7], null)
      };

      if (!map[postId]) {
        map[postId] = [];
      }
      map[postId].push(replyObj);
    }
    return map;
  },

  add: function(ss, data) {
    let sheet = ss.getSheetByName(SHEETS.REPLIES);
    if (!sheet) {
      sheet = ss.insertSheet(SHEETS.REPLIES);
      const repliesHeaders = [
        "返信日時", "返信ID", "親ポストID", "投稿者名", "観測コード", "Googleメール", "返信本文", "周回情報(JSON)"
      ];
      sheet.appendRow(repliesHeaders);
    }

    const replyId = data.id || ("rep-" + Utilities.getUuid());
    const now = new Date();
    const newReply = {
      id: replyId,
      postId: data.postId,
      name: data.name || data.observerName || "観測者",
      obsCode: data.obsCode || "",
      googleEmail: data.googleEmail || "",
      message: data.message || "",
      timestamp: now.toISOString(),
      loopTrack: data.loopTrack || null
    };

    // 1. REPLIESシートに追加
    const newRow = [
      now,
      replyId,
      data.postId,
      newReply.name,
      newReply.obsCode,
      newReply.googleEmail,
      newReply.message,
      JSON.stringify(newReply.loopTrack)
    ];
    sheet.appendRow(newRow);

    // 2. CROSSTALKシートに該当ポストがあれば念のため16列目のJSONも同期
    const talkSheet = ss.getSheetByName(SHEETS.CROSSTALK);
    if (talkSheet) {
      const talkRows = talkSheet.getDataRange().getValues();
      for (let i = 1; i < talkRows.length; i++) {
        if (talkRows[i][1] === data.postId) {
          let replies = DBHelper.parseJSON(talkRows[i][15], []);
          replies.push(newReply);
          talkSheet.getRange(i + 1, 16).setValue(JSON.stringify(replies));
          break;
        }
      }
    }

    return { ok: true, message: "返信を正常に記録しました", reply: newReply };
  },

  delete: function(ss, data) {
    const { postId, replyId } = data;
    const sheet = ss.getSheetByName(SHEETS.REPLIES);
    if (sheet) {
      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][1] === replyId || (rows[i][2] === postId && rows[i][1] === replyId)) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
    }

    // CROSSTALKシート側も同期
    const talkSheet = ss.getSheetByName(SHEETS.CROSSTALK);
    if (talkSheet && postId) {
      const talkRows = talkSheet.getDataRange().getValues();
      for (let i = 1; i < talkRows.length; i++) {
        if (talkRows[i][1] === postId) {
          let replies = DBHelper.parseJSON(talkRows[i][15], []);
          const filtered = replies.filter(r => r.id !== replyId);
          talkSheet.getRange(i + 1, 16).setValue(JSON.stringify(filtered));
          break;
        }
      }
    }

    return { ok: true, message: "返信を削除しました" };
  }
};

/**
 * 時空通信（クロストーク掲示板）コントローラー
 */
const CrossTalkController = {
  getAll: function(ss, repliesMap = {}) {
    const sheet = ss.getSheetByName(SHEETS.CROSSTALK);
    if (!sheet) return [];
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return [];

    const list = [];
    for (let i = rows.length - 1; i >= 1; i--) {
      const r = rows[i];
      const postId = r[1];
      const sheetReplies = DBHelper.parseJSON(r[15], []);
      const mappedReplies = repliesMap[postId] || sheetReplies;

      list.push({
        timestamp: r[0],
        id: postId,
        obsCode: r[2],
        observerName: r[3],
        name: r[3],
        googleEmail: r[4],
        targetRoutes: DBHelper.parseJSON(r[5], ["all"]),
        category: r[6] || "general",
        publicComment: r[7] || "",
        message: r[7] || "",
        loopTrack: { loop1: r[8] || "sakurai", loop2: r[9] || "jinnai", loop3: r[10] || "yada" },
        syncRate: Number(r[11]) || 85,
        favoriteCast: r[12] || r[8] || "sakurai",
        stamps: DBHelper.parseJSON(r[13], { resonance: 0, chills: 0 }),
        stampUsers: DBHelper.parseJSON(r[14], { resonance: [], chills: [] }),
        replies: mappedReplies,
        quote: DBHelper.parseJSON(r[16], null)
      });
    }
    return list;
  },

  create: function(ss, p) {
    const sheet = ss.getSheetByName(SHEETS.CROSSTALK) || ss.insertSheet(SHEETS.CROSSTALK);
    const postId = p.id || ("msg-" + Utilities.getUuid());
    const loopTrack = p.loopTrack || {};

    const newRow = [
      new Date(),
      postId,
      p.obsCode || "",
      p.observerName || p.name || "観測者",
      p.googleEmail || "",
      JSON.stringify(p.targetRoutes || ["all"]),
      p.category || "general",
      p.message || p.publicComment || "",
      loopTrack.loop1 || p.loop1 || "",
      loopTrack.loop2 || p.loop2 || "",
      loopTrack.loop3 || p.loop3 || "",
      p.syncRate || 85,
      p.favoriteCast || loopTrack.loop1 || "",
      JSON.stringify(p.stamps || { resonance: 0, chills: 0 }),
      JSON.stringify(p.stampUsers || { resonance: [], chills: [] }),
      JSON.stringify(p.replies || []),
      JSON.stringify(p.quote || null)
    ];
    sheet.appendRow(newRow);
    return { ok: true, message: "時空通信にポストしました", id: postId };
  },

  update: function(ss, data) {
    const sheet = ss.getSheetByName(SHEETS.CROSSTALK);
    if (!sheet) return { ok: false, error: "Sheet not found" };

    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][1] === data.id) {
        const rowIdx = i + 1;
        if (data.targetRoutes) {
          sheet.getRange(rowIdx, 6).setValue(JSON.stringify(data.targetRoutes)); // targetRoutes (6列目: インデックス5)
        }
        if (data.category) {
          sheet.getRange(rowIdx, 7).setValue(data.category); // category (7列目: インデックス6)
        }
        if (data.message !== undefined) {
          sheet.getRange(rowIdx, 8).setValue(data.message); // message (8列目: インデックス7)
        }
        if (data.quote !== undefined) {
          sheet.getRange(rowIdx, 17).setValue(JSON.stringify(data.quote || null)); // quote (17列目: インデックス16)
        }
        return { ok: true, message: "投稿を更新しました" };
      }
    }
    return { ok: false, error: "Post not found" };
  },

  delete: function(ss, data) {
    const sheet = ss.getSheetByName(SHEETS.CROSSTALK);
    if (!sheet) return { ok: false, error: "Sheet not found" };

    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][1] === data.id) {
        sheet.deleteRow(i + 1);
        return { ok: true, message: "投稿を削除しました" };
      }
    }
    return { ok: false, error: "Post not found" };
  }
};

/**
 * リアクション（❤️/⚡）コントローラー
 */
const ReactionController = {
  toggle: function(ss, data) {
    const { targetType, targetId, obsCode, stampKey, userName } = data;

    if (targetType === "crosstalk") {
      const sheet = ss.getSheetByName(SHEETS.CROSSTALK);
      if (!sheet) return { ok: false, error: "Sheet not found" };

      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][1] === targetId) {
          let stamps = DBHelper.parseJSON(rows[i][13], { resonance: 0, chills: 0 });
          let stampUsers = DBHelper.parseJSON(rows[i][14], { resonance: [], chills: [] });

          const users = stampUsers[stampKey] || [];
          const existingIndex = users.indexOf(userName);

          if (existingIndex >= 0) {
            // 取り消し
            users.splice(existingIndex, 1);
            stamps[stampKey] = Math.max(0, (stamps[stampKey] || 1) - 1);
          } else {
            // 追加
            users.push(userName);
            stamps[stampKey] = (stamps[stampKey] || 0) + 1;
          }

          stampUsers[stampKey] = users;
          sheet.getRange(i + 1, 14).setValue(JSON.stringify(stamps));
          sheet.getRange(i + 1, 15).setValue(JSON.stringify(stampUsers));

          return { ok: true, stamps: stamps, stampUsers: stampUsers, active: existingIndex < 0 };
        }
      }
    } else if (targetType === "survey") {
      const sheet = ss.getSheetByName(SHEETS.SURVEY);
      if (!sheet) return { ok: false, error: "Survey sheet not found" };

      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        const rObsCode = (rows[i][1] || "").toString().trim();
        if ((obsCode && rObsCode === obsCode.trim()) || rows[i][1] === targetId) {
          let reactions = DBHelper.parseJSON(rows[i][30], { resonance: 0, chills: 0, users: [] });
          const users = reactions.users || [];
          const existingIndex = users.indexOf(userName);

          if (existingIndex >= 0) {
            // 取り消し
            users.splice(existingIndex, 1);
            reactions[stampKey] = Math.max(0, (reactions[stampKey] || 1) - 1);
          } else {
            // 追加
            users.push(userName);
            reactions[stampKey] = (reactions[stampKey] || 0) + 1;
          }
          reactions.users = users;

          sheet.getRange(i + 1, 31).setValue(JSON.stringify(reactions));
          return { ok: true, reactions: reactions, active: existingIndex < 0 };
        }
      }
    }
    return { ok: false, error: "Target not found" };
  }
};

/**
 * キャスト手記 コントローラー
 */
const CastNotesController = {
  getAll: function(ss) {
    const sheet = ss.getSheetByName(SHEETS.CAST_NOTES);
    if (!sheet) return [];
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return [];

    const list = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      list.push({
        id: r[0],
        castId: r[1],
        castName: r[2],
        title: r[3],
        content: r[4],
        date: r[5],
        unlockCondition: r[6],
        message: r[7]
      });
    }
    return list;
  }
};

/**
 * 不具合・バグ報告コントローラー
 */
const BugController = {
  create: function(ss, data) {
    let sheet = ss.getSheetByName(SHEETS.BUGS);
    if (!sheet) {
      sheet = ss.insertSheet(SHEETS.BUGS);
      const headers = [
        "日時", "報告者名", "不具合内容", "発生タブ", "ステップ番号", "ブラウザ情報", "画面サイズ", "URL", "ステータス"
      ];
      sheet.appendRow(headers);
    }

    const now = new Date();
    const newRow = [
      now,
      data.name || "匿名",
      data.message || "",
      data.currentTab || "survey",
      data.currentStep || 0,
      data.userAgent || "",
      data.screenSize || "",
      data.url || "",
      "未対応"
    ];

    sheet.appendRow(newRow);
    return { ok: true, message: "バグ報告を受理しました" };
  }
};

// =========================================================================
// 4. DB ヘルパーユーティリティ
// =========================================================================

const DBHelper = {
  parseJSON: function(str, fallback) {
    if (!str) return fallback;
    try {
      return JSON.parse(str);
    } catch (e) {
      return fallback;
    }
  }
};

function responseJSON(data, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
