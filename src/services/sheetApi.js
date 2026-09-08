/**
 * =========================================================================
 * Google スプレッドシート (GAS) 連携 API サービスクライアント
 * =========================================================================
 */

const DEFAULT_CONFIG = {
  ENDPOINT: "https://script.google.com/macros/s/AKfycbzSIoQ0twEVCQvCAslmO-ka1FMUEwzv5ONeS2mKmJoPr_LdWAuV89EhzkGHe-iftQ5L/exec",
  FORM_KEY: "kanso-26094-xyz"
};

class SheetApiService {
  constructor() {
    this.endpoint = DEFAULT_CONFIG.ENDPOINT;
    this.key = DEFAULT_CONFIG.FORM_KEY;
  }

  setEndpoint(url) {
    if (url) this.endpoint = url;
  }

  /**
   * スプレッドシートから全データ（アンケート回答、時空通信、キャスト手記）を一括取得
   */
  async fetchAllData() {
    try {
      const url = `${this.endpoint}?action=getAll&t=${Date.now()}`;
      const res = await fetch(url, { method: 'GET', mode: 'cors' });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      return {
        ok: true,
        surveys: data.surveys || [],
        crossTalk: data.crossTalk || [],
        castNotes: data.castNotes || [],
        replies: data.replies || {}
      };
    } catch (error) {
      console.warn('[SheetAPI] fetchAllData fallback or offline:', error);
      return { ok: false, error: error.message, surveys: [], crossTalk: [], castNotes: [], replies: {} };
    }
  }

  /**
   * アンケート回答の送信
   */
  async submitSurvey(formData) {
    try {
      const body = {
        key: this.key,
        action: 'submitSurvey',
        data: formData
      };
      const res = await fetch(this.endpoint, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('[SheetAPI] submitSurvey failed:', error);
      return { ok: false, error: error.message };
    }
  }

  /**
   * 時空通信（クロストーク）への投稿
   */
  async postCrossTalk(postData) {
    try {
      const body = {
        key: this.key,
        action: 'postCrossTalk',
        data: postData
      };
      const res = await fetch(this.endpoint, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('[SheetAPI] postCrossTalk failed:', error);
      return { ok: false, error: error.message };
    }
  }

  /**
   * 時空通信の投稿を編集
   */
  async editCrossTalk(postData) {
    try {
      const body = {
        key: this.key,
        action: 'editCrossTalk',
        data: postData
      };
      const res = await fetch(this.endpoint, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      });
      return await res.json();
    } catch (error) {
      console.error('[SheetAPI] editCrossTalk failed:', error);
      return { ok: false, error: error.message };
    }
  }

  /**
   * 時空通信の投稿を削除
   */
  async deleteCrossTalk(deleteData) {
    try {
      const body = {
        key: this.key,
        action: 'deleteCrossTalk',
        data: deleteData
      };
      const res = await fetch(this.endpoint, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      });
      return await res.json();
    } catch (error) {
      console.error('[SheetAPI] deleteCrossTalk failed:', error);
      return { ok: false, error: error.message };
    }
  }

  /**
   * 時空通信への返信
   */
  async postReply(replyData) {
    try {
      const body = {
        key: this.key,
        action: 'postReply',
        data: replyData
      };
      const res = await fetch(this.endpoint, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('[SheetAPI] postReply failed:', error);
      return { ok: false, error: error.message };
    }
  }

  /**
   * 時空通信の返信を削除
   */
  async deleteReply(deleteData) {
    try {
      const body = {
        key: this.key,
        action: 'deleteReply',
        data: deleteData
      };
      const res = await fetch(this.endpoint, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      });
      return await res.json();
    } catch (error) {
      console.error('[SheetAPI] deleteReply failed:', error);
      return { ok: false, error: error.message };
    }
  }

  /**
   * アンケート回答由来の感想ポストを編集
   */
  async editSurveyPost(editData) {
    try {
      const body = {
        key: this.key,
        action: 'editSurveyPost',
        data: editData
      };
      const res = await fetch(this.endpoint, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      });
      return await res.json();
    } catch (error) {
      console.error('[SheetAPI] editSurveyPost failed:', error);
      return { ok: false, error: error.message };
    }
  }

  /**
   * アンケート回答由来の感想ポストを削除
   */
  async deleteSurveyPost(deleteData) {
    try {
      const body = {
        key: this.key,
        action: 'deleteSurveyPost',
        data: deleteData
      };
      const res = await fetch(this.endpoint, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      });
      return await res.json();
    } catch (error) {
      console.error('[SheetAPI] deleteSurveyPost failed:', error);
      return { ok: false, error: error.message };
    }
  }

  /**
   * リアクション（❤️/⚡）のトグル
   */
  async toggleReaction(reactionData) {
    try {
      const body = {
        key: this.key,
        action: 'toggleReaction',
        data: reactionData
      };
      const res = await fetch(this.endpoint, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('[SheetAPI] toggleReaction failed:', error);
      return { ok: false, error: error.message };
    }
  }

  /**
   * 下書きのクラウド自動保存
   */
  async saveDraft(draftData) {
    try {
      const body = {
        key: this.key,
        action: 'saveDraft',
        data: draftData
      };
      const res = await fetch(this.endpoint, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      });
      return await res.json();
    } catch (error) {
      console.warn('[SheetAPI] saveDraft failed:', error);
      return { ok: false, error: error.message };
    }
  }

  /**
   * 下書きのクラウド取得
   */
  async getDraft(email) {
    try {
      if (!email) return null;
      const url = `${this.endpoint}?action=getDraft&email=${encodeURIComponent(email)}&t=${Date.now()}`;
      const res = await fetch(url, { method: 'GET', mode: 'cors' });
      if (!res.ok) return null;
      const json = await res.json();
      return json && json.ok ? json.draft : null;
    } catch (error) {
      console.warn('[SheetAPI] getDraft failed:', error);
      return null;
    }
  }
}

export const sheetApi = new SheetApiService();
export default sheetApi;
