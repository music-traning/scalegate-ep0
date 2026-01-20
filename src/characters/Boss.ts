import bossLinesDataRaw from '../data/boss_lines.json';
import { GenSanLine, TriggerType, GenSanResponse, FaceType } from '../types';

// JSONを型アサーションで読み込む
const linesData = bossLinesDataRaw as GenSanLine[];

// AA定義
const AA: Record<FaceType, string> = {
    NORMAL: "  /|\\   \n ( o o ) \n  \\_-_/  ",
    ANGRY: "  /|\\   \n ( O O ) \n  \\_A_/  ",
    HAPPY: "  /|\\   \n ( ^ ^ ) \n  \\_~_/  ",
    LAUGH: "  /|\\   \n ( @ @ ) \n  \\_w_/  ",
    SERIOUS: "  /|\\   \n ( - - ) \n  \\___/  ",
    KO: "  /|\\   \n ( x x ) \n  \\_~_/  ",
    PANIC: "  /|\\   \n ( T T ) \n  \\_~_/  "
};

export class Boss {
    private lines: GenSanLine[];

    constructor() {
        this.lines = linesData;
    }

    public getAA(face: FaceType): string {
        return AA[face] || AA.NORMAL;
    }

    public speak(trigger: TriggerType, lastSpeechId?: string): GenSanResponse {
        // 1. トリガー一致フィルタリング
        let candidates = this.lines.filter(line => line.trigger.includes(trigger));

        // 直前のセリフを除外 (候補が複数ある場合のみ)
        if (lastSpeechId && candidates.length > 1) {
            candidates = candidates.filter(line => line.id !== lastSpeechId);
        }

        // 万が一データがない場合
        if (candidates.length === 0) {
            // ボスは無言でも威圧的
            return { id: "nodata", aa: AA.NORMAL, text: "……。", face: 'NORMAL' };
        }

        // 2. 抽選
        const selected = this.weightedRandom(candidates);
        const aaArt = AA[selected.face] || AA.NORMAL;

        return {
            id: selected.id,
            aa: aaArt,
            text: selected.text,
            face: selected.face
        };
    }

    private weightedRandom(candidates: GenSanLine[]): GenSanLine {
        const weights: Record<string, number> = {
            "common": 100,
            "rare": 25,
            "epic": 5,
            "legendary": 1
        };

        const weightedList: GenSanLine[] = [];

        candidates.forEach(item => {
            const w = weights[item.rarity] || 100;
            for (let i = 0; i < w; i++) {
                weightedList.push(item);
            }
        });

        const idx = Math.floor(Math.random() * weightedList.length);
        return weightedList[idx];
    }
}