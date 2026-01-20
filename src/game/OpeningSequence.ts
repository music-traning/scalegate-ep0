import { AudioSystem } from "../engine/AudioSystem";

// (AAやSCENARIOの定義は長いので省略しませんが、以前と同じ内容のままでOKです。
//  ただし、コードをコピーしやすいようにクラス部分を中心に記述します)

// --- AA定義 (変更なし) ---
const AA = {
    NONE: "",
    TITLE: "   _______\n  /       \\\n |  GYM  |\n  \\_______/",
    GEN_NORMAL: "   _______\n  /  _ _  \\\n (| (o) x |)\n  |   J   |\n   \\  -  /\n    `---'",
    GEN_LAUGH: "   _______\n  /  ^ ^  \\\n (| >   < |)\n  |  皿   |\n   \\  -  /\n    `---'",
    GEN_SERIOUS: "   _______\n  /  / /  \\\n (| o   x |)\n  |  ___  |\n   \\     /\n    `---'",
    GEN_PLAY: "   _______\n  /  ~ ~  \\\n (| -   - |) ♫\n  |   o   |\n   \\     /\n    `---'"
};

// --- シナリオデータ (変更なし) ---
// ※以前の SCENARIO オブジェクトをここにそのまま置いてください
// もし手元になければ、前回のコードから SCENARIO 部分だけコピーしてください
// ここではスペース省略のため型定義だけ書きますが、実装時はデータが必要です。
type SceneId = string;
interface Scene { aa: string; name: string; text: string; next?: SceneId; choices?: { label: string; target: SceneId }[]; sound?: string; }
const SCENARIO: Record<SceneId, Scene> = {
    "start": { aa: AA.NONE, name: "モノローグ", text: "「6弦の魔術師」を目指すギタリスト、俺。\n魔城『FRETGATE』を攻略し、慢心していたのかもしれない。", next: "encounter_1" },
    "encounter_1": { aa: AA.GEN_NORMAL, name: "？？？", text: "ある夜、片目に眼帯をした酔っ払いの老人が、ふらりと俺の前に現れた。", next: "encounter_2" },
    "encounter_2": { aa: AA.GEN_NORMAL, name: "酔っ払いの老人", text: "「おい若造。お前、あの魔城から帰ってきたらしいな」\n酒臭い息。だが、その眼光は鋭い。", next: "question_1" },
    "question_1": { aa: AA.GEN_SERIOUS, name: "酔っ払いの老人", text: "「単刀直入に聞くぞ。\nお前は『Cメジャースケール』を知っているか？」", choices: [
        { label: "当たり前だ。ドレミだろ？", target: "ans_arrogant" },
        { label: "……自信がないです。", target: "ans_humble" },
        { label: "あんた誰だ？", target: "ans_ignore" }
    ]},
    "ans_arrogant": { aa: AA.GEN_LAUGH, name: "酔っ払いの老人", text: "「カッカッカ！ 笑わせるねえ！\nだからお前の音は『薄っぺらい』んだよ！」", next: "demo_play" },
    "ans_humble": { aa: AA.GEN_NORMAL, name: "酔っ払いの老人", text: "「ほう……正直でいい。\n分かった気になってる奴よりマシだ。」", next: "demo_play" },
    "ans_ignore": { aa: AA.GEN_NORMAL, name: "酔っ払いの老人", text: "「ただの亡霊さ……。\nだが、お前のギターが泣いてるのが聞こえてな。」", next: "demo_play" },
    "demo_play": { aa: AA.GEN_PLAY, name: "", text: "老人は俺のギターを奪い、つま弾いた。\nただの『ドレミ』が……極彩色の魔法に変わる。", sound: "magical_scale", next: "revelation" },
    "revelation": { aa: AA.GEN_SERIOUS, name: "謎の老人", text: "「これがCメジャースケールだ。\nパッションはいい。だが、お前は明日から俺のジムに来い」", next: "name_reveal" },
    "name_reveal": { aa: AA.GEN_SERIOUS, name: "丹下 弦", text: "「俺の名は、丹下 弦（タンゲ ゲン）だ。\n……逃げ出さなければの話だがな。」", next: "recruit_choice" },
    "recruit_choice": { aa: AA.GEN_SERIOUS, name: "丹下 弦", text: "「どうする？ 来るのか？」", choices: [
        { label: "行きます！弟子にしてください！", target: "join_yes" },
        { label: "……考えておきます。", target: "join_tsundere" }
    ]},
    "join_yes": { aa: AA.GEN_LAUGH, name: "丹下 弦", text: "「いい返事だ。明日は朝6時に来い。\n遅刻したら破門だぞ。」", next: "to_game" },
    "join_tsundere": { aa: AA.GEN_NORMAL, name: "丹下 弦", text: "「フン、臆病風に吹かれたか？\nまあいい。気が向いたら来な。俺はいつでも待っている。」", next: "to_game" },
    "to_game": { aa: AA.TITLE, name: "", text: "こうして、俺とオヤジの、指板を巡る血と汗の記録が幕を開けた。", next: "finish" }
};

export class OpeningSequence {
    private container: HTMLElement;
    private audio: AudioSystem;
    private onComplete: () => void;
    private currentId: SceneId = 'start';
    private isTyping = false;
    private intervalId: any = null; // タイマー制御用
    private elements: { aa: HTMLElement, name: HTMLElement, text: HTMLElement, choices: HTMLElement, next: HTMLElement };

    constructor(containerId: string, audio: AudioSystem, onComplete: () => void) {
        this.container = document.getElementById(containerId)!;
        this.audio = audio;
        this.onComplete = onComplete;
        
        this.elements = {
            aa: this.container.querySelector('#op-aa')!,
            name: this.container.querySelector('#op-name')!,
            text: this.container.querySelector('#op-text')!,
            choices: this.container.querySelector('#op-choices')!,
            next: this.container.querySelector('#op-next')!
        };
        
        this.elements.next.addEventListener('click', () => this.next());
    }

    start() {
        this.renderScene(this.currentId);
    }

    // ★追加: スキップ機能
    skip() {
        if (this.intervalId) clearInterval(this.intervalId);
        this.onComplete();
    }

    private renderScene(id: SceneId) {
        if (id === 'finish') {
            this.onComplete();
            return;
        }

        const scene = SCENARIO[id];
        this.currentId = id;

        this.elements.choices.style.display = 'none';
        this.elements.next.style.display = 'none';
        this.elements.choices.innerHTML = "";
        this.elements.text.innerText = "";

        this.elements.aa.innerText = scene.aa;
        if (scene.name) {
            this.elements.name.innerText = scene.name;
            this.elements.name.style.display = 'inline-block';
        } else {
            this.elements.name.style.display = 'none';
        }

        if (scene.sound === 'magical_scale') {
            this.audio.playMagicalScale();
        }

        this.typeWriter(scene.text, () => {
            if (scene.choices) {
                this.elements.choices.style.display = 'flex';
                scene.choices.forEach(c => {
                    const btn = document.createElement('button');
                    btn.className = 'op-choice-btn';
                    btn.innerText = `> ${c.label}`;
                    btn.onclick = () => this.renderScene(c.target);
                    this.elements.choices.appendChild(btn);
                });
            } else if (scene.next) {
                this.elements.next.style.display = 'block';
            }
        });
    }

    private next() {
        if (this.isTyping) return;
        const scene = SCENARIO[this.currentId];
        if (scene.next) this.renderScene(scene.next);
    }

    private typeWriter(text: string, callback: () => void) {
        this.isTyping = true;
        let i = 0;
        
        if (this.intervalId) clearInterval(this.intervalId);

        this.intervalId = setInterval(() => {
            const char = text.charAt(i);
            this.elements.text.innerText += char;

            // ★追加: 文字送り音（ナレーション風）
            if (char.trim() !== "") {
                this.audio.playVoice('SYSTEM'); 
            }

            i++;
            if (i >= text.length) {
                clearInterval(this.intervalId);
                this.isTyping = false;
                callback();
            }
        }, 40);
    }
}