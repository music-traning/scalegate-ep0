// src/game/LevelData.ts

// ★追加: 会話データの型定義 (これをGameMasterが読み込みます)
export interface Dialogue {
    speaker: 'Gen' | 'Boss';
    text: string;
}

export interface Mission {
    id: string;
    title: string;
    frets: number[];
    targetNotes: string[];
    // ★追加: 開始前の会話スクリプト (?がついているので無くてもOKという意味)
    openingScript?: Dialogue[];
    // ★追加: 問題文
    questionText?: string;
    // ★追加: タブー音（インターバル, 0-11）
    avoidIntervals?: number[];
}

export interface Level {
    id: number;
    title: string;
    description: string;
    root: string;
    missions: Mission[];
}

export const LEVELS: Level[] = [
    {
        id: 1,
        title: "Stage 1: Cの森 (Basic C Major)",
        description: "基本のCメジャースケール。\nCAGEDシステムで指板を制覇せよ。",
        root: "C",
        missions: [
            { id: "1-1", title: "C-Shape (Open Area)", frets: [0, 3], targetNotes: ["C", "D", "E", "F", "G", "A", "B"] },
            { id: "1-2", title: "A-Shape (3fr - 5fr)", frets: [3, 5], targetNotes: ["C", "D", "E", "F", "G", "A", "B"] },
            { id: "1-3", title: "G-Shape (5fr - 8fr)", frets: [5, 8], targetNotes: ["C", "D", "E", "F", "G", "A", "B"] },
            { id: "1-4", title: "E-Shape (7fr - 10fr)", frets: [7, 10], targetNotes: ["C", "D", "E", "F", "G", "A", "B"] },
            { id: "1-5", title: "D-Shape (10fr - 13fr)", frets: [10, 13], targetNotes: ["C", "D", "E", "F", "G", "A", "B"] },
            // ★この 1-6 が重要です！ここが書き換わっていない可能性があります
            {
                id: "1-6",
                title: "BOSS: C Major G-Shape",
                frets: [5, 8],
                targetNotes: ["E"],
                questionText: "【問題】 G-Shapeの中に潜む\n『長3度 (Major 3rd)』の音を攻撃せよ！",
                openingScript: [
                    { speaker: 'Gen', text: "気をつけろ！こいつは『Cの森』の主だ！\n理論武装してかからないと食われるぞ！" },
                    { speaker: 'Boss', text: "グググ……我が森を荒らすのは貴様か……。" },
                    { speaker: 'Boss', text: "我の弱点は『3度』の響き……。\n貴様にその位置が見切れるかな？" }
                ]
            }
        ]
    },
    // ... Stage 2以降 ...
    // src/game/LevelData.ts の LEVELS配列内の Stage 2 部分

    {
        id: 2,
        title: "Stage 2: Cの遺跡 (Code Tones)",
        description: "崩れかけた遺跡。必要なのは『装飾』ではない。\n建物を支える『骨組み（コードトーン）』だ。",
        root: "C",
        missions: [
            // --- Mission 2-1: C-Shape ---
            {
                id: "2-1",
                title: "C-Shape Arpeggio",
                frets: [0, 3],
                targetNotes: ["C", "E", "G", "B"],
                questionText: "【指令】C-Shapeエリア\nCmaj7の構成音（C,E,G,B）のみを弾き、\n遺跡の入口を開け！"
            },
            // --- Mission 2-2: A-Shape ---
            {
                id: "2-2",
                title: "A-Shape Arpeggio",
                frets: [3, 5],
                targetNotes: ["C", "E", "G", "B"],
                questionText: "【指令】A-Shapeエリア\n5弦ルートの響きを感じろ。\n経過音（スケール）は踏むな！"
            },
            // --- Mission 2-3: G-Shape ---
            {
                id: "2-3",
                title: "G-Shape Arpeggio",
                frets: [5, 8],
                targetNotes: ["C", "E", "G", "B"],
                questionText: "【指令】G-Shapeエリア\n小指が吊りそうなストレッチ。\nだが、それが『骨』を強くする。"
            },
            // --- Mission 2-4: E-Shape ---
            {
                id: "2-4",
                title: "E-Shape Arpeggio",
                frets: [7, 10],
                targetNotes: ["C", "E", "G", "B"],
                questionText: "【指令】E-Shapeエリア\nギタリストの実家（6弦ルート）。\nここでは目を瞑ってでも弾け！"
            },
            // --- Mission 2-5: D-Shape ---
            {
                id: "2-5",
                title: "D-Shape Arpeggio",
                frets: [10, 13],
                targetNotes: ["C", "E", "G", "B"],
                questionText: "【指令】D-Shapeエリア\n高音域の『骨組み』は脆い。\n正確なピッキングで補強せよ。"
            },
            // --- Mission 2-6: BOSS ---
            {
                id: "2-6",
                title: "BOSS: The Skeleton King",
                frets: [0, 12], // 全指板開放
                targetNotes: ["B"], // ボスの弱点：メジャー7th (B音)

                questionText: "【BOSS】全指板開放！！\nCメジャー7thの『決定的な色（B音）』を\n全て撃ち抜き、亡霊を浄化せよ！",

                openingScript: [
                    { speaker: 'Gen', text: "出たな……ここの主『スケルトン・キング』だ。\n装飾音（テンション）は一切通じねえぞ。" },
                    { speaker: 'Gen', text: "こいつを倒したければ、コードの響きを決定づける\n『7度（Major 7th）』の急所を狙え！" },
                    { speaker: 'Boss', text: "ガガガ……我ハ……『和音』ノ亡霊……。" },
                    { speaker: 'Boss', text: "貴様ノギターニ……『芯』ハアルカ……？" }
                ]
            }
        ]
    },

    // ... Stage 3 ...
    {
        id: 3,
        title: "Stage 3: Gの宴 (Mixolydian Feast)",
        description: "陽気で騒がしい宴の会場（Key=Cの5番街）。\nここでは『G』が王様だ。7番目の音に気をつけろ。",
        root: "G",
        missions: [
            // --- 3-1: G-Shape (Low) ---
            {
                id: "3-1",
                title: "G-Shape (Root G)",
                frets: [0, 3],
                targetNotes: ["C", "D", "E", "F", "G", "A", "B"],
                questionText: "【指令】ローポジション（Gフォーム）\nGメジャーコードの形を意識しつつ、\nドレミ（Cメジャースケール）を弾きまくれ！"
            },
            // --- 3-2: E-Shape ---
            {
                id: "3-2",
                title: "E-Shape (3fr - 5fr)",
                frets: [3, 5],
                targetNotes: ["C", "D", "E", "F", "G", "A", "B"],
                questionText: "【指令】E-Shapeエリア\n人差し指は3フレット（G音）に置け。\nそこが今回の『実家』だ。"
            },
            // --- 3-3: D-Shape ---
            {
                id: "3-3",
                title: "D-Shape (5fr - 8fr)",
                frets: [5, 8],
                targetNotes: ["C", "D", "E", "F", "G", "A", "B"],
                questionText: "【指令】D-Shapeエリア\n指板の真ん中で踊り狂え。\nただし『C音（4度）』には長居するなよ！"
            },
            // --- 3-4: C-Shape ---
            {
                id: "3-4",
                title: "C-Shape (7fr - 10fr)",
                frets: [7, 10],
                targetNotes: ["C", "D", "E", "F", "G", "A", "B"],
                questionText: "【指令】C-Shapeエリア\n8フレットのCコードの形……ではなく、\n10フレットのGルートを見失うな！"
            },
            // --- 3-5: A-Shape ---
            {
                id: "3-5",
                title: "A-Shape (10fr - 13fr)",
                frets: [10, 13],
                targetNotes: ["C", "D", "E", "F", "G", "A", "B"],
                questionText: "【指令】A-Shapeエリア\n高音域のソロパートだ。\nチョーキングしたくなるが、今は我慢しろ。"
            },
            // --- 3-6: BOSS ---
            {
                id: "3-6",
                title: "BOSS: Drunken Dominant",
                frets: [0, 12],
                targetNotes: ["F"], // ミクソリディアンの核：Minor 7th (F音)

                questionText: "【BOSS】全指板開放！！\nメジャースケールとは違う『決定的な1音』\nフラット7th（F音）を叩き込み、酔っ払いを正気に戻せ！",

                openingScript: [
                    { speaker: 'Gen', text: "酒臭いな……。こいつは『ドミナント・7th』の化身だ。\n解決したくてウズウズしてやがる。" },
                    { speaker: 'Gen', text: "こいつの正体は『短7度（F音）』だ！\nメジャースケール(F#)との違いを分からせてやれ！" },
                    { speaker: 'Boss', text: "ヒック……！ 俺はまだ……Cには行かねえぞ……！" },
                    { speaker: 'Boss', text: "もっとブルージーに……『F』の音をくれぇ……！" }
                ]
            }
        ]
    },
    // ... Stage 3 ...
    {
        id: 4,
        title: "Stage 4: ドリアンの洞窟 (Dorian Cave)",
        description: "暗く湿ったマイナーの洞窟。\nだが、ここには『希望の光（ナチュラル6th）』が差し込む。",
        root: "D",
        missions: [
            // --- 4-1: D-Shape (Open) ---
            {
                id: "4-1",
                title: "D-Shape (Open Area)",
                frets: [0, 3],
                targetNotes: ["C", "D", "E", "F", "G", "A", "B"],
                questionText: "【指令】D-Shape (開放弦)\nDmコードのフォームを意識せよ。\n暗い響きの中に、光を探せ。"
            },
            // --- 4-2: C-Shape ---
            {
                id: "4-2",
                title: "C-Shape (2fr - 5fr)",
                frets: [2, 5],
                targetNotes: ["C", "D", "E", "F", "G", "A", "B"],
                questionText: "【指令】C-Shapeエリア\n人差し指で3フレット(F音)と5フレット(G音)を行き来せよ。\nここがマイナーの心臓部だ。"
            },
            // --- 4-3: A-Shape ---
            {
                id: "4-3",
                title: "A-Shape (5fr - 8fr)",
                frets: [5, 8],
                targetNotes: ["C", "D", "E", "F", "G", "A", "B"],
                questionText: "【指令】A-Shapeエリア\n5弦5フレット(D)がルートだ。\n小指で7フレット(B音)を鳴らせ。それがドリアンだ。"
            },
            // --- 4-4: G-Shape ---
            {
                id: "4-4",
                title: "G-Shape (7fr - 10fr)",
                frets: [7, 10],
                targetNotes: ["C", "D", "E", "F", "G", "A", "B"],
                questionText: "【指令】G-Shapeエリア\nストレッチがきついか？\n指を開くたびに、洞窟が広がるぞ。"
            },
            // --- 4-5: E-Shape ---
            {
                id: "4-5",
                title: "E-Shape (10fr - 13fr)",
                frets: [10, 13],
                targetNotes: ["C", "D", "E", "F", "G", "A", "B"],
                questionText: "【指令】E-Shapeエリア\n10フレット、6弦ルート。\nここから見下ろす景色は絶景だ。"
            },
            // --- 4-6: BOSS ---
            {
                id: "4-6",
                title: "BOSS: The Doppelganger",
                frets: [0, 12],
                targetNotes: ["B"], // ドリアンの核：Major 6th (B音)

                questionText: "【BOSS】全指板開放！！\n通常のマイナー(Bb)に逃げるな！\n勇気の『ナチュラル6th（B音）』で幻影を切り裂け！",

                openingScript: [
                    { speaker: 'Gen', text: "おい、自分の影に飲み込まれるなよ。\nそいつは『エオリアン（普通のマイナー）』の亡霊だ。" },
                    { speaker: 'Gen', text: "やつを祓うには『光の音（6度）』が必要だ。\n半音高いB音（シ）を叩き込め！" },
                    { speaker: 'Boss', text: "私ハ……オ前ダ……。\n悲シイ音（Bb）ヲ奏デヨ……。" },
                    { speaker: 'Boss', text: "ナゼ……ソウ明ルク振る舞ウ……？" }
                ]
            }
        ]
    },
    {
        id: 5,
        title: "Stage 5: エオリアンの古城 (Aeolian Castle)",
        description: "救いのない純粋なマイナーの世界。\n日本人のDNAに刻まれた『哀愁（Minor 6th）』を響かせろ。",
        root: "A",
        missions: [
            // --- 5-1: C-Shape (Low) ---
            {
                id: "5-1",
                title: "C-Shape (Open Area)",
                frets: [0, 3],
                targetNotes: ["A", "B", "C", "D", "E", "F", "G"],
                avoidIntervals: [1, 6], // Amペンタトニック的縛り（m2, tritone禁止）
                questionText: "【指令】ローポジション（Cフォーム相当）。\n開放弦を活かし、古城に漂う陰鬱な空気を\n一音ずつ丁寧に紡ぎ出せ。"
            },
            // --- 5-2: A-Shape ---
            {
                id: "5-2",
                title: "A-Shape (2fr - 5fr)",
                frets: [2, 5],
                targetNotes: ["A", "B", "C", "D", "E", "F", "G"],
                questionText: "【指令】A-Shapeエリア。\n5弦開放のルートを意識しろ。\nドリアンの明るい影は、もうここには無い。"
            },
            // --- 5-3: G-Shape ---
            {
                id: "5-3",
                title: "G-Shape (5fr - 8fr)",
                frets: [5, 8],
                targetNotes: ["A", "B", "C", "D", "E", "F", "G"],
                questionText: "【指令】G-Shapeエリア。\n中音域でのマイナー・フレージング。\n『F（短6度）』の音が持つ重圧に耐えろ。"
            },
            // --- 5-4: E-Shape ---
            {
                id: "5-4",
                title: "E-Shape (7fr - 10fr)",
                frets: [7, 10],
                targetNotes: ["A", "B", "C", "D", "E", "F", "G"],
                questionText: "【指令】E-Shapeエリア。\nギタリストが最も泣ける5弦ルートのポジション。\n魂の叫びを指板に叩き込め！"
            },
            // --- 5-5: D-Shape ---
            {
                id: "5-5",
                title: "D-Shape (10fr - 13fr)",
                frets: [10, 13],
                targetNotes: ["A", "B", "C", "D", "E", "F", "G"],
                questionText: "【指令】D-Shapeエリア。\n高音域の悲鳴のような旋律。\n正確な運指こそが、崩壊を防ぐ唯一の手段だ。"
            },
            // --- 5-6: BOSS ---
            {
                id: "5-6",
                title: "BOSS: The Sorrowful Knight",
                frets: [0, 12],
                targetNotes: ["F"], // エオリアンの核：Minor 6th (F音)

                questionText: "【BOSS】全指板開放！！\nドリアンを否定する『悲しみの1音』\n短6度（F音）を全フレットで暴き出し、騎士を眠らせろ！",

                openingScript: [
                    { speaker: 'Gen', text: "ついにここまで来たか。ここはエオリアンの古城だ。" },
                    { speaker: 'Gen', text: "ドリアンの明るい6度はもう通用しねえ。\n半音低い『F音』が、この城を沈める鍵だ！" },
                    { speaker: 'Boss', text: "……ナゼ、ココニ来タ……。" },
                    { speaker: 'Boss', text: "ココニハ『絶望（b6）』シカ……ナイノダ……。" }
                ]
            }
        ]
    },
];