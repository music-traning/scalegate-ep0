// src/types.ts

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type FaceType = 'NORMAL' | 'ANGRY' | 'HAPPY' | 'LAUGH' | 'SERIOUS' | 'KO' | 'PANIC';

// src/types.ts
// 弦さんやボスのセリフを呼び出すための「きっかけ」一覧

// src/types.ts (確認用)
export type TriggerType =
    | 'startup' | 'idle' | 'clear' | 'miss' | 'gameover'
    | 'praise_s' | 'praise_l' | 'combo_5' // ← これが必要です！
    | 'miss_p4' | 'miss_m3' | 'miss_m2' | 'miss_tri' | 'miss_m7'
    | 'miss_avoid' // ★追加: ステージ固有の禁止音
    // ★追加: テンション/スケールノートの指摘 (D, Aなど)
    | 'miss_tension'
    | 'miss_M3'  // 長3度 (明るすぎるミス)
    | 'miss_m6'  // 短6度 (ドリアン特有のミス)
    | 'miss_m3_fed_up' | 'miss_p4_fed_up' | 'miss_m2_fed_up' | 'miss_tension_fed_up' // ★追加: 呆れ
    | 'miss_avoid_fed_up' | 'miss_tri_fed_up' | 'miss_M3_fed_up' | 'miss_m6_fed_up' | 'miss_m7_fed_up'
    | 'clear_st1' | 'clear_st2' | 'clear_st3' | 'clear_st4' | 'clear_st5' | 'clear_st6'
    | 'reminder' // ★追加: 復習セリフ
    | 'advice' | 'gear' | 'life' | 'shop' | 'battle' | 'boss' | 'legend'
    | 'encounter' | 'attack' | 'damage' | 'defeat';

// サフィックスとして '_fed_up' (呆れ) を動的に付加することがある (例: 'miss_m3_fed_up')

export interface GenSanLine {
    id: string;
    text: string;
    trigger: TriggerType[];
    rarity: Rarity;
    face: FaceType;
}

export interface GenSanResponse {
    id: string; // ★追加: セリフ重複回避用
    aa: string;
    text: string;
    face: FaceType;
}