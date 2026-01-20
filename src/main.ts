import { inject } from '@vercel/analytics';

inject();

import './style.css';
import { GenSan } from './characters/GenSan';
import { AudioSystem } from './engine/AudioSystem';
import { GameMaster } from './engine/GameMaster';
import { LEVELS } from './game/LevelData';
import { TriggerType } from '@/types';
import { OpeningSequence } from './game/OpeningSequence';

// =========================================================
// 1. HTML構造の注入
// =========================================================
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="container">
    
    <div id="opening-screen">
        <div id="title-overlay">
            <h1>ScaleGate<br>Episode 0<br><span style="font-size:12px">TAP TO START</span></h1>
            
            <!-- フッター & データ削除 (タイトル画面の一部として配置) -->
            <div style="position: absolute; bottom: 20px; width: 100%; text-align: center; font-size: 10px; color: #666;">
                <div id="total-score-display" style="color: #3f3; margin-bottom: 5px; font-size: 12px;"></div>
                <button id="data-reset" style="background:transparent; border:none; color:#444; font-size:10px; cursor:pointer; text-decoration:underline;">Delete Data</button>
                <br>
                ©2026  <a href="https://note.com/jazzy_begin" target="_blank" style="color:#666; text-decoration:none;">buro</a>
            </div>
        </div>
        
        <button id="op-skip" style="display:none;">SKIP >></button>
        
        <div id="op-visual"><div id="op-aa"></div></div>
        
        <div id="op-content">
            <span id="op-name"></span>
            <div id="op-text"></div>
            <div id="op-choices"></div>
            <div id="op-next">▼ 次へ</div>
        </div>
    </div>

    <div id="game-screen" style="display: none;">
        <div id="cockpit">
            <div id="aa-box"></div>
            <div id="text-panel">
                <div id="name-tag">弦さん</div>
                <div id="msg-box"></div>
            </div>
        </div>
        
        <div id="game-area">
            <div id="info-bar">
                <button id="back-to-menu" style="display: none;">≪ MENU</button>
                <div style="flex: 1; display: flex; justify-content: space-between; margin-left: 10px;">
                    <span id="level-display">Lv.-</span>
                    <span id="score-display">SCORE: 0</span>
                    <div id="boss-hp-container"><div id="boss-hp-bar"></div></div>
                </div>
            </div>
            <div id="fretboard-area"></div>
        </div>

        <div id="level-select" class="controls"></div>
    </div>

    <div id="mission-modal" class="modal-overlay">
        <div class="modal-content">
            <div id="modal-title" style="border-bottom:1px solid #3f3; margin-bottom:10px; font-weight:bold;">Select Mission</div>
            
            <!-- 難易度選択トグル -->
            <div style="display:flex; justify-content:center; margin-bottom:15px; border:1px solid #444; border-radius:5px; overflow:hidden;">
                <button id="diff-easy" style="width:50%; margin:0; border:none; background:#222; color:#888;">EASY</button>
                <button id="diff-hard" style="width:50%; margin:0; border:none; background:#004400; color:#3f3; font-weight:bold;">HARD</button>
            </div>

            <div id="mission-list" style="display:grid; gap:10px;"></div>
            <button id="modal-close" style="margin-top:20px;">CANCEL</button>
        </div>
    </div>

    <div id="result-modal" class="modal-overlay">
        <div class="modal-content">
            <div style="text-align:center; font-size:20px; margin-bottom:10px; color:#ffff00;">MISSION CLEAR!</div>
            <div id="result-aa" style="text-align:center; white-space:pre; font-size:10px; margin-bottom:10px;"></div>
            <div id="result-msg" style="border:1px dashed #3f3; padding:10px; margin-bottom:10px; font-size:14px;"></div>
            <div id="result-score" style="text-align:center; font-size:18px; color:#ffff00; margin-bottom:20px;"></div>
            <button id="result-close">次の修行へ</button>
        </div>
    </div>

  </div>
`;

// =========================================================
// 2. クラスと変数の初期化
// =========================================================

const gensan = new GenSan();
const audio = new AudioSystem();

// 画面要素の取得
const screens = {
    opening: document.getElementById('opening-screen')!,
    game: document.getElementById('game-screen')!,
    title: document.getElementById('title-overlay')!,
    fretboard: document.getElementById('fretboard-area')!,
    menu: document.getElementById('level-select')!,
    backBtn: document.getElementById('back-to-menu')!
};

const missionModal = document.getElementById('mission-modal')!;
const missionList = document.getElementById('mission-list')!;
const resultModal = document.getElementById('result-modal')!;

const aaBox = document.querySelector<HTMLDivElement>('#aa-box')!;
const msgBox = document.querySelector<HTMLDivElement>('#msg-box')!;
const nameTag = document.querySelector<HTMLDivElement>('#name-tag')!;

// 割り込み防止用のIDカウンター
let currentSpeechId = 0;

/**
 * 汎用タイプライター演出関数
 * AA、名前、テキストを受け取って1文字ずつ表示する
 */
async function typeWriter(aaText: string, nameText: string, messageText: string) {
    // 画面の更新
    if (aaBox) aaBox.textContent = aaText;
    if (nameTag) nameTag.textContent = nameText;
    if (msgBox) msgBox.textContent = "";

    // IDを更新して、古い処理を停止させる
    currentSpeechId++;
    const myId = currentSpeechId;
    const text = messageText || ""; // undefined対策

    // 1文字ずつループ
    for (const char of Array.from(text)) {
        if (myId !== currentSpeechId) return; // 別の会話が始まったら中断
        if (msgBox) msgBox.textContent += char;

        // 文字送り音 (空白以外)
        if (char.trim() !== "") audio.playVoice('GEN');

        // 句読点で少し待つ演出
        let delay = 50;
        if (char === '、') delay = 100;
        if (char === '。') delay = 200;
        await new Promise(r => setTimeout(r, delay));
    }

    // 読み終わった後、少し間を持たせる (余韻)
    await new Promise(r => setTimeout(r, 1000));
}

/**
 * 弦さんが喋るラッパー関数 (通常のゲームプレイ用)
 */
async function talk(trigger: TriggerType, lastSpeechId?: string): Promise<string> {
    const data = gensan.speak(trigger, lastSpeechId);
    await typeWriter(data.aa, "弦さん", data.text);
    return data.id;
}

/**
 * リザルト画面の表示
 */
/**
 * リザルト画面の表示
 */
function showResult(score: number, levelId: number, missionId: string) {
    const trigger = `clear_st${levelId}` as TriggerType;
    const data = gensan.speak(trigger);

    // クリア時のデータがない場合のフォールバック
    const aa = data.aa || gensan.speak('praise_s').aa;
    const text = data.text || "よくやった！ 次のステージへ進め！";

    document.getElementById('result-aa')!.textContent = aa;
    document.getElementById('result-msg')!.textContent = text;
    document.getElementById('result-score')!.textContent = `SCORE: ${score}`;
    resultModal.style.display = 'flex';

    // ★追加: クリア状態の保存 (スコアも渡す)
    saveClearStatus(levelId, missionId, score);
}

// ★追加: クリア情報の保存 (簡易版: レベルIDを保存するが、詳細なミッションID保存はGameMaster側で渡す必要があるため、今回は「直前にプレイしたミッション」を特定する仕組みが必要。
// 簡易的に GameMasterに問い合わせるか、startGameで覚えておく。
// ここでは簡易的に「GameMaster.currentMission」はprivateなので、GameMasterのcallback修正が必要だが、
// showResultの引数からはmissionIdが取れない。callbackの仕様変更がベストだが、
// 手っ取り早く、localStorageのキーに missionId を含めるために、GameMaster内で保存してもらう方が良いかもしれない。
// しかしonClearCallbackはあくまでUI表示用。
// ここでは showResult 内で currentDifficulty も考慮したいが、ひとまずシンプルに実装。
// ★追加: クリア情報の保存 (Score & Stars)
interface ClearData {
    score: number;
    stars: number;
}
const STORAGE_KEY = 'scalegate_progress';
const TOTAL_SCORE_KEY = 'scalegate_total_score';

function saveClearStatus(levelId: number, missionId: string, score: number) {
    if (!missionId) return;

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const currentFromStorage = saved[missionId] as ClearData | undefined;

    // ★変更: 星は「クリア回数」の蓄積とする (最大5)
    // 既存の星があれば+1、なければ1
    let oldStars = currentFromStorage ? currentFromStorage.stars : 0;

    // 旧データ(配列)からの移行処置: クリア済みなら最低1
    const oldKey = 'scalegate_cleared';
    const oldCleared = JSON.parse(localStorage.getItem(oldKey) || '[]');
    if (oldStars === 0 && oldCleared.includes(missionId)) {
        oldStars = 1;
    }

    let newStars = oldStars + 1;
    if (newStars > 5) newStars = 5;

    // スコアはハイスコアを維持
    const currentHighScore = currentFromStorage ? currentFromStorage.score : 0;
    const newHighScore = Math.max(currentHighScore, score);

    // 保存
    saved[missionId] = { score: newHighScore, stars: newStars };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

    // 旧互換(念のため残す)
    if (!oldCleared.includes(missionId)) {
        oldCleared.push(missionId);
        localStorage.setItem(oldKey, JSON.stringify(oldCleared));
    }

    // 累計スコア (XP) の保存は GameMaster 側でリアルタイムに行うため、ここでは削除します。
    // 重複計上を防ぐため。
}

/**
 * GameMasterのコールバック定義変更に合わせて、ここも修正
 */

// =========================================================
// 3. GameMasterの初期化 (ここが重要！)
// =========================================================

const gameMaster = new GameMaster(
    gensan,
    audio,
    talk, // 通常の会話 (引数3)
    (score, levelId, missionId) => { // ★修正: ミッションIDも受け取る
        showResult(score, levelId, missionId);
    },
    // ★追加: シーン演出用コールバック (引数5)
    async (aa: string, name: string, text: string) => {
        await typeWriter(aa, name, text);
    }
);

// =========================================================
// 4. イベントリスナーと画面遷移
// =========================================================

// リザルト閉じる -> メニューへ
document.getElementById('result-close')!.addEventListener('click', () => {
    resultModal.style.display = 'none';
    goToMenu();
});

// タイトル画面クリック -> オープニング開始
screens.title.addEventListener('click', async () => {
    await audio.resume();
    screens.title.style.display = 'none';
    document.getElementById('op-skip')!.style.display = 'block'; // 会話開始でスキップを表示

    const opening = new OpeningSequence('opening-screen', audio, () => {
        goToMenu();
    });

    document.getElementById('op-skip')!.addEventListener('click', () => opening.skip()); // SKIPと言うよりStart

    // データ削除ボタン
    document.getElementById('data-reset')!.addEventListener('click', () => {
        if (confirm("全ての進行データを削除しますか？\nAre you sure to delete all data?")) {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(TOTAL_SCORE_KEY);
            localStorage.removeItem('scalegate_cleared'); // 旧データも念のため
            alert("Data deleted.");
            location.reload();
        }
    });

    // トータルスコア表示更新
    const totalScore = parseInt(localStorage.getItem(TOTAL_SCORE_KEY) || '0', 10);
    const tsEl = document.getElementById('total-score-display');
    if (tsEl && totalScore > 0) {
        tsEl.innerText = `TOTAL EXP: ${totalScore}`;
    }

    opening.start();
});

// レベル選択ボタンの生成
if (screens.menu) {
    LEVELS.forEach(level => {
        const btn = document.createElement('button');
        btn.innerHTML = `${level.title}<br><span style="font-size:10px; color:#888;">${level.description.split('\n')[0]}</span>`;
        btn.addEventListener('click', () => {
            openMissionModal(level);
        });
        screens.menu.appendChild(btn);
    });
}

// 難易度管理
let currentDifficulty: 'EASY' | 'HARD' = 'HARD';

// 難易度ボタンのリスナー
document.getElementById('diff-easy')!.addEventListener('click', () => setDifficulty('EASY'));
document.getElementById('diff-hard')!.addEventListener('click', () => setDifficulty('HARD'));

function setDifficulty(diff: 'EASY' | 'HARD') {
    currentDifficulty = diff;
    const btnEasy = document.getElementById('diff-easy')!;
    const btnHard = document.getElementById('diff-hard')!;

    if (diff === 'EASY') {
        btnEasy.style.background = '#004400';
        btnEasy.style.color = '#3f3';
        btnEasy.style.fontWeight = 'bold';

        btnHard.style.background = '#222';
        btnHard.style.color = '#888';
        btnHard.style.fontWeight = 'normal';
    } else {
        btnHard.style.background = '#440000'; // HARDは赤っぽく
        btnHard.style.color = '#f33';
        btnHard.style.fontWeight = 'bold';

        btnEasy.style.background = '#222';
        btnEasy.style.color = '#888';
        btnEasy.style.fontWeight = 'normal';
    }
}

// ミッション選択モーダル
document.getElementById('modal-close')!.addEventListener('click', () => { missionModal.style.display = 'none'; });

function openMissionModal(level: any) {
    missionModal.style.display = 'flex';
    document.getElementById('modal-title')!.innerText = level.title;
    missionList.innerHTML = "";

    // ★追加: クリア情報の読み込み
    const progressMap = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    // 旧互換
    const oldCleared = JSON.parse(localStorage.getItem('scalegate_cleared') || '[]');

    level.missions.forEach((mission: any) => {
        const mBtn = document.createElement('button');

        // ボス戦の場合は色を変えて目立たせる
        const isBoss = mission.id.toLowerCase().includes('boss');
        let color = isBoss ? '#ff3333' : '#ffff00';

        // 星表示の生成
        const data = progressMap[mission.id] as ClearData | undefined;
        let starStr = "☆☆☆☆☆";

        if (data && data.stars > 0) {
            // ★で埋める
            starStr = "★".repeat(data.stars) + "☆".repeat(5 - data.stars);
            if (data.stars === 5) color = "#00ff00"; // ★5で緑
        } else if (oldCleared.includes(mission.id)) {
            // 旧データからの移行用: 最低1つ★をつける
            starStr = "★☆☆☆☆";
        }

        mBtn.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div><span style="color:${color}">${mission.id}</span> ${mission.title}</div>
                <div style="font-size:10px; color:#aaa; margin-left:10px; font-family:'MS PGothic', sans-serif;">${starStr}</div>
            </div>`;

        mBtn.addEventListener('click', () => {
            missionModal.style.display = 'none';
            startGame(level.id, mission.id, currentDifficulty);
        });
        missionList.appendChild(mBtn);
    });
}

// ゲーム開始処理
function startGame(levelId: number, missionId: string, difficulty: 'EASY' | 'HARD') {
    screens.menu.style.display = 'none';
    screens.backBtn.style.display = 'block';
    screens.fretboard.style.display = 'block';

    // GameMasterに開始を依頼
    gameMaster.startGame(levelId, missionId, difficulty);
}

// メニューに戻る処理
function goToMenu() {
    screens.opening.style.display = 'none';
    screens.game.style.display = 'flex';
    screens.menu.style.display = 'block';

    screens.fretboard.style.display = 'none';
    screens.backBtn.style.display = 'none';

    // 戻ったときは「待機中」のセリフ
    talk('idle');

    // ★追加: メニュー画面でもスコアを表示する
    // 現在のトータルスコアを読み込んで更新
    const totalScore = parseInt(localStorage.getItem(TOTAL_SCORE_KEY) || '0', 10);
    const scoreDisplay = document.getElementById('score-display');
    if (scoreDisplay) {
        scoreDisplay.innerText = `SCORE: ${totalScore}`;
    }
}

screens.backBtn.addEventListener('click', goToMenu);