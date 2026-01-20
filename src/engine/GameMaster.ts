import { GenSan } from '../characters/GenSan';
import { Boss } from '../characters/Boss'; // ★追加: Bossのインポート
import { AudioSystem } from './AudioSystem';
import { Fretboard } from './Fretboard';
import { LEVELS, Level, Mission, Dialogue } from '../game/LevelData';
import { TriggerType } from '@/types';

const NOTE_ORDER = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export class GameMaster {
    private gensan: GenSan;
    private boss: Boss; // ★追加: Bossインスタンス
    private audio: AudioSystem;
    private fretboard: Fretboard;

    // コールバック群
    private onTalk: (trigger: TriggerType, lastSpeechId?: string) => Promise<string>;
    private onClearCallback: (score: number, levelId: number, missionId: string) => void;
    // ★追加: シーン演出用コールバック
    private onScene: (aa: string, name: string, text: string) => Promise<void>;

    private currentLevel: Level | null = null;
    private currentMission: Mission | null = null;
    private currentLevelIndex = 0;
    private score = 0; // 現在のミッションスコア（クリア判定用）
    private totalScore = 0; // 累計スコア（表示・保存用）
    private isPlaying = false;

    private ui = {
        score: document.getElementById('score-display')!,
        level: document.getElementById('level-display')!,
        hpContainer: document.getElementById('boss-hp-container')!,
        hpBar: document.getElementById('boss-hp-bar')!
    };

    // ★追加: ボス戦 & 難易度用
    private bossHP = 0;
    private maxBossHP = 0;
    private difficulty: 'EASY' | 'HARD' = 'HARD';

    // ★追加: 記憶と状態管理
    private missHistory: Record<string, number> = {};
    private comboCount = 0;
    private lastSpeechId: string | null = null;

    constructor(
        gensan: GenSan,
        audio: AudioSystem,
        onTalk: (trigger: TriggerType, lastSpeechId?: string) => Promise<string>,
        onClear: (score: number, levelId: number, missionId: string) => void,
        // ★追加: 5つ目の引数 (main.tsからは渡されていますが、ここで受け取る必要があります)
        onScene: (aa: string, name: string, text: string) => Promise<void>
    ) {
        this.gensan = gensan;
        this.boss = new Boss(); // ★追加: Bossの生成
        this.audio = audio;
        this.onTalk = onTalk;
        this.onClearCallback = onClear;
        this.onScene = onScene; // ★保存

        this.fretboard = new Fretboard('fretboard-area', (note, el) => this.handleInput(note, el));
    }

    // ★重要: async をつけて非同期処理にします
    public async startGame(levelId: number, missionId: string, difficulty: 'EASY' | 'HARD') {
        // 難易度設定
        this.difficulty = difficulty;

        // 1. 盤面の初期化
        this.fretboard.reset();
        this.isPlaying = false; // 会話中は操作不可

        // 2. データロード
        this.currentLevel = LEVELS.find(l => l.id === levelId)!;
        this.currentMission = this.currentLevel.missions.find(m => m.id === missionId)!;
        this.currentLevelIndex = levelId - 1;

        this.score = 0;
        this.totalScore = parseInt(localStorage.getItem('scalegate_total_score') || '0', 10);

        // 状態リセット
        this.missHistory = {};
        this.comboCount = 0;
        this.lastSpeechId = null;

        // ボス戦初期化
        if (this.isBossMission()) {
            this.maxBossHP = this.difficulty === 'HARD' ? 10 : 5; // HARDは10回, EASYは5回ヒット
            this.bossHP = this.maxBossHP;
            if (this.ui.hpContainer) this.ui.hpContainer.style.display = 'block';
        } else {
            this.bossHP = 0;
            if (this.ui.hpContainer) this.ui.hpContainer.style.display = 'none';
        }

        // スタート時点でUIを更新し、ロード済みスコアを表示
        this.ui.score = document.getElementById('score-display')!;
        this.ui.level = document.getElementById('level-display')!;
        this.ui.score.innerText = `SCORE: ${this.totalScore}`;

        console.log(`Loading: ${this.currentLevel.title} - ${this.currentMission.title}`);

        // 3. 霧（フォーカス範囲）の設定
        if (this.currentMission.frets) {
            let [start, end] = this.currentMission.frets;

            // ★難易度調整: EASYなら範囲を狭める (最低4フレット幅)
            if (this.difficulty === 'EASY' && (end - start) > 4) {
                // 中央付近に寄せる
                const center = Math.floor((start + end) / 2);
                start = Math.max(start, center - 2);
                end = Math.min(end, center + 2);
            }

            this.fretboard.setFocusRange(start, end);
        } else {
            this.fretboard.setFocusRange(0, 12);
        }

        // 4. オープニング会話イベントの再生 (あれば)
        // ★ここがボス戦のトリガーになります
        if (this.currentMission.openingScript && this.currentMission.openingScript.length > 0) {
            await this.playScript(this.currentMission.openingScript);
        }

        // 5. 問題文の表示 (あれば)
        if (this.currentMission.questionText) {
            const hasBoss = this.currentMission.openingScript?.some(d => d.speaker === 'Boss');
            // ボス戦ならボスの顔、違えば弦さんの顔
            const aa = hasBoss ? this.boss.getAA('NORMAL') : this.gensan.speak('idle').aa;
            const name = "MISSION";

            await this.onScene(aa, name, this.currentMission.questionText);
        } else {
            // 問題文がない場合でも、開始の合図として軽く弦さんを表示
            await this.performSpeech('startup');
        }

        // ★追加: 復習セリフ (Stage 4以降)
        if (this.currentLevelIndex >= 3 && Math.random() < 0.3) {
            // 少し遅らせて発火
            setTimeout(() => {
                if (this.isPlaying) this.performSpeech('reminder');
            }, 2000);
        }

        // 6. 操作開始
        this.isPlaying = true;
        console.log("Game Start!");
    }

    /**
     * 会話スクリプトを順に再生する
     */
    private async playScript(script: Dialogue[]) {
        for (const line of script) {
            let aa = "";
            let name = "";

            if (line.speaker === 'Gen') {
                aa = this.gensan.speak('idle').aa;
                name = "弦さん";
            } else if (line.speaker === 'Boss') {
                aa = this.boss.getAA('NORMAL');
                name = "森の主";
            }

            // main.ts 側の描画関数を呼び出し、完了を待つ (await)
            await this.onScene(aa, name, line.text);
        }
    }

    private async handleInput(note: string, element: HTMLElement) {
        if (!this.isPlaying || !this.currentMission || !this.currentLevel) return;

        element.classList.remove('hit-anim', 'miss-anim');
        void element.offsetWidth;

        if (this.currentMission.targetNotes.includes(note)) {
            // --- 正解 ---
            // ★追加: コンボボーナス計算
            // 基本100 + コンボ数 * 10 (最大+200まで)
            const comboBonus = Math.min(this.comboCount * 10, 200);
            const addedScore = 100 + comboBonus;
            this.score += addedScore;

            // 累計スコア更新 & 即時保存
            this.totalScore += addedScore;
            localStorage.setItem('scalegate_total_score', this.totalScore.toString());

            this.audio.playTone(880, 'triangle');
            element.classList.add('hit-anim'); // CSSを updateしたので pop-up は自動でつかない、手動でやる

            // ポップアップ演出
            this.showPopup(element, "+100");

            // ボス戦ダメージ処理
            if (this.isBossMission()) {
                this.bossHP--;
                // 画面シェイク（ボスがダメージ食らった感）
                const gameScreen = document.getElementById('game-screen');
                if (gameScreen) {
                    gameScreen.classList.remove('shake-screen');
                    void gameScreen.offsetWidth;
                    gameScreen.classList.add('shake-screen');
                }

                // ★追加: ダメージボイス (たまに喋る)
                if (Math.random() < 0.3) {
                    this.performSpeech('damage');
                }
            }

            // コンボ加算
            this.comboCount++;

            if (this.comboCount >= 5) {
                // 5連続正解
                this.performSpeech('combo_5');
                // コンボは継続させる
            } else if (Math.random() < 0.1) {
                this.performSpeech('clear');
            }

        } else {
            // --- 不正解 ---
            this.comboCount = 0; // コンボリセット

            // ボス戦ならボスが回復（または無慈悲なセリフ）
            if (this.isBossMission() && this.difficulty === 'HARD') {
                // HARDボスの嫌がらせ: HP回復
                this.bossHP = Math.min(this.bossHP + 1, this.maxBossHP);
            }

            this.handleMistake(note, element);
        }

        this.updateUI();
        this.checkClearCondition();
    }

    /**
     * ミス時の処理（理論的ツッコミロジック強化版）
     */
    /**
     * ミス時の処理（理論的ツッコミロジック強化版）
     */
    private handleMistake(wrongNote: string, element: HTMLElement) {
        if (!this.currentMission) return;

        this.score -= 50;
        // ミスは累計スコアからも引く？ -> ゲーム性を考えると引くべき
        // ただし0未満にはしない措置を入れても良いが、今回はそのまま引く
        this.totalScore -= 50;
        localStorage.setItem('scalegate_total_score', this.totalScore.toString());

        this.audio.playTone(150, 'square');
        element.classList.add('miss-anim');

        const root = this.currentLevel!.root;
        const interval = this.calculateInterval(root, wrongNote);

        let specificTrigger: TriggerType = 'miss';

        // --- インターバル判定ロジック (Stage 4対応版) ---

        // 1. 完全4度 (5半音) -> アボイド (Stage 1,2,3,4共通)
        if (interval === 5) specificTrigger = 'miss_p4';

        // 2. 短3度 (3半音) -> メジャーキー(St1,2,3)でのミス
        else if (interval === 3) specificTrigger = 'miss_m3';

        // 3. 長3度 (4半音) -> ★追加: マイナーキー(St4)でのミス
        // ドリアン(マイナー)なのに、明るい音(M3)を弾いてしまった場合
        else if (interval === 4) specificTrigger = 'miss_M3';

        // 4. 短2度 (1半音)
        else if (interval === 1) specificTrigger = 'miss_m2';

        // 5. トライトーン (6半音)
        else if (interval === 6) specificTrigger = 'miss_tri';

        // 6. 短6度 (8半音) -> ★追加: ドリアンでのミス
        // ドリアンは「長6度(9半音)」が正解。普通のマイナー(短6度)を弾くとダサい
        else if (interval === 8) specificTrigger = 'miss_m6';

        // 7. テンション (長2度など)
        else if (interval === 2) specificTrigger = 'miss_tension';

        // ★追加: タブー音（avoidIntervals）チェック
        if (this.currentMission.avoidIntervals?.includes(interval)) {
            specificTrigger = 'miss_avoid';
        }

        // 記録
        this.missHistory[specificTrigger] = (this.missHistory[specificTrigger] || 0) + 1;

        // ★追加: 呆れ判定 (同じミス3回以上)
        const mistakeCount = this.missHistory[specificTrigger];
        let finalTrigger: TriggerType = specificTrigger;

        if (mistakeCount >= 3) {
            // サフィックスを追加して試行 (GenSan側で対応していれば拾われる)
            // 型アサーションで無理やり文字列結合
            finalTrigger = `${specificTrigger}_fed_up` as TriggerType;
        }

        // セリフ再生
        if (Math.random() < 0.8) {
            this.performSpeech(finalTrigger);
        } else {
            this.performSpeech('miss');
        }
    }

    /**
     * ルート音からの半音数（0〜11）を計算
     */
    private calculateInterval(root: string, note: string): number {
        const rootIdx = NOTE_ORDER.indexOf(root);
        const noteIdx = NOTE_ORDER.indexOf(note);
        let diff = noteIdx - rootIdx;
        if (diff < 0) diff += 12;
        return diff;
    }

    private checkClearCondition() {
        if (this.isBossMission()) {
            // ボス戦クリア条件: HPが0になること
            if (this.bossHP <= 0) {
                this.finishGame();
            }
        } else {
            // 通常クリア条件: スコア1500
            if (this.score >= 1500) {
                this.finishGame();
            }
        }
    }

    private finishGame() {
        this.isPlaying = false;
        this.audio.playTone(1200, 'sine');
        this.onClearCallback(this.score, this.currentLevel!.id, this.currentMission!.id);
    }

    private updateUI() {
        if (!this.ui.score) {
            this.ui.score = document.getElementById('score-display')!;
            this.ui.level = document.getElementById('level-display')!;
            this.ui.hpContainer = document.getElementById('boss-hp-container')!;
            this.ui.hpBar = document.getElementById('boss-hp-bar')!;
        }

        if (this.ui.score) this.ui.score.innerText = `SCORE: ${this.totalScore}`;
        if (this.ui.level) this.ui.level.innerText = `Mission: ${this.currentMission?.id}`;

        // ボスHPバー更新
        if (this.isBossMission() && this.ui.hpBar) {
            const pct = (this.bossHP / this.maxBossHP) * 100;
            this.ui.hpBar.style.width = `${pct}%`;
        }
    }

    /**
     * ポップアップ演出を表示
     */
    private showPopup(targetEl: HTMLElement, text: string) {
        const popup = document.createElement('div');
        popup.className = 'popup-score';
        popup.innerText = text;

        // 座標計算 (ターゲット要素の中央)
        const rect = targetEl.getBoundingClientRect();
        // game-area内での相対位置にする必要があるが、簡略化のためabsoluteで配置
        // ただし親要素(fretboard-area)が overflow: hidden だと切れる可能性があるため、body直下に置くか工夫が必要
        // ここではボタンの中にappendして overflow を無視するスタイルにするか...
        // いや、シンプルに targetEl に appendChild するのが一番早い（relativeなら）
        targetEl.appendChild(popup);

        // アニメーション終了後に削除
        setTimeout(() => {
            popup.remove();
        }, 1000);
    }

    /**
     * 中央集権的なセリフ再生メソッド
     * - ボス戦かどうかを判定
     * - 重複IDの管理
     */
    private async performSpeech(trigger: TriggerType) {
        if (!this.currentMission) return;

        const isBoss = this.isBossMission();

        if (isBoss) {
            // ボスの会話
            const data = this.boss.speak(trigger, this.lastSpeechId || undefined);

            // データなしの場合はスキップ（ただしミス時は何か言わせたいかも？ Boss.tsは "……。" を返すのでOK）
            if (data.id === 'nodata' && trigger !== 'miss') return;

            await this.onScene(data.aa, "森の主", data.text);
            this.lastSpeechId = data.id;

        } else {
            // 弦さんの会話 (main.ts経由)
            this.lastSpeechId = await this.onTalk(trigger, this.lastSpeechId || undefined);
        }
    }

    /**
     * 現在のミッションがボス戦かどうか判定
     */
    private isBossMission(): boolean {
        if (!this.currentMission) return false;
        // IDに 'boss' が含まれるか、またはオープニングにBossが登場するか
        const byId = this.currentMission.id.toLowerCase().includes('boss');
        const byScript = this.currentMission.openingScript?.some(d => d.speaker === 'Boss') || false;

        return byId || byScript;
    }
}