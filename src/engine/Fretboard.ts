// src/engine/Fretboard.ts

export class Fretboard {
    private container: HTMLElement;
    private onClick: (note: string, element: HTMLElement) => void;

    // 開放弦の音（6弦→1弦）
    private openStrings = ["E", "A", "D", "G", "B", "E"];
    private allNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

    private readonly positionMarks = [3, 5, 7, 9];

    constructor(containerId: string, onClick: (note: string, el: HTMLElement) => void) {
        this.container = document.getElementById(containerId)!;
        this.onClick = onClick;
        this.render();
    }

    // ★追加: 指定範囲外に霧をかけるメソッド
    public setFocusRange(startFret: number, endFret: number) {
        const buttons = this.container.querySelectorAll('button');
        buttons.forEach(btn => {
            // data-fret属性からフレット数を取得
            const fret = parseInt(btn.dataset.fret || "0");
            
            // 範囲内なら霧を晴らす、範囲外なら霧をかける
            if (fret >= startFret && fret <= endFret) {
                btn.classList.remove('foggy');
            } else {
                btn.classList.add('foggy');
            }
        });
    }

    // 指板の描画
    private render() {
        this.container.innerHTML = "";
        this.container.style.display = "grid";
        this.container.style.gridTemplateRows = "repeat(6, 1fr)"; // 6弦
        this.container.style.gap = "2px";
        this.container.style.height = "200px"; // 指板エリアの高さ
        this.container.style.background = "#222";
        this.container.style.marginTop = "10px";
        this.container.style.border = "2px solid #555";

        // 6弦から1弦までループ
        this.openStrings.forEach((openNote, stringIndex) => {
            const stringRow = document.createElement("div");
            stringRow.style.display = "flex";
            stringRow.style.width = "100%";
            
            // 0フレット〜12フレットまでループ
            for (let fret = 0; fret <= 12; fret++) {
                const note = this.calculateNote(openNote, fret);
                const fretBtn = document.createElement("button");
                
                // スタイル設定
                fretBtn.style.flex = fret === 0 ? "0.8" : "1"; // 0フレットは少し狭く
                fretBtn.style.background = "transparent";
                fretBtn.style.border = "1px solid #444";
                fretBtn.style.color = "#33ff33";
                fretBtn.style.fontSize = "10px";
                fretBtn.style.cursor = "pointer";
                fretBtn.innerText = fret === 0 ? openNote : ""; // 最初は開放弦のみ表示
                
                // データ属性に音名を仕込む
                fretBtn.dataset.note = note;

                // ★追加: フレット番号をデータ属性に埋め込む
                fretBtn.dataset.fret = fret.toString();

                // 3弦(index 3)または4弦(index 2)のボタンにマークを付ける
                if (stringIndex === 3) { 
                    if (fret === 12) {
                        fretBtn.classList.add('pos-mark', 'pos-mark-12');
                    } else if (this.positionMarks.includes(fret)) {
                        fretBtn.classList.add('pos-mark');
                    }
                }
                
                // クリックイベント
                fretBtn.addEventListener("click", () => {
                    this.onClick(note, fretBtn);
                });

                stringRow.appendChild(fretBtn);
            }
            this.container.appendChild(stringRow);
        });
    }

    // 音名の計算ロジック
    private calculateNote(openNote: string, fret: number): string {
        const startIndex = this.allNotes.indexOf(openNote);
        const targetIndex = (startIndex + fret) % 12;
        return this.allNotes[targetIndex];
    }

    // Fretboard.ts
public reset() {
        const buttons = this.container.querySelectorAll('button');
        buttons.forEach(btn => {
            // アニメーションクラスを削除
            btn.classList.remove('hit-anim', 'miss-anim');
            
            // 強制的にスタイルを初期値に戻す（色が残るのを防ぐ）
            btn.style.background = "transparent";
            btn.style.color = "#33ff33";
            
            // ※もし「霧」の状態もリセットしたければここで remove('foggy') もできますが、
            // startGame内で setFocusRange が呼ばれるのでそのままで大丈夫です。
        });
}
}