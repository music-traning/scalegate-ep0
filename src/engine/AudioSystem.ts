// src/engine/AudioSystem.ts
export class AudioSystem {
    private ctx: AudioContext;
    private masterGain: GainNode;

    constructor() {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.ctx.destination);
    }

    async resume() {
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
    }

    /** キャラクターの声 */
    playVoice(type: 'GEN' | 'SYSTEM' = 'GEN') {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        if (type === 'GEN') {
            osc.type = 'square';
            const freq = 120 + Math.random() * 20; 
            osc.frequency.setValueAtTime(freq, t);
        } else {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(800, t);
        }

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.5, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);

        osc.start(t);
        osc.stop(t + 0.07);
    }

    /** ★追加: 正解/不正解のトーン */
    playTone(freq: number, type: 'sine' | 'square' | 'triangle' = 'sine') {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

        osc.start(t);
        osc.stop(t + 0.3);
    }

    /** ★追加: オープニング用の魔法の音 */
    playMagicalScale() {
        const now = this.ctx.currentTime;
        // C E G B D E G (Major9 arpeggio)
        const notes = [261.63, 329.63, 392.00, 493.88, 523.25, 659.25, 783.99]; 
        let time = now;
        
        notes.forEach((freq) => {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.connect(g);
            g.connect(this.masterGain); // masterGain経由にする
            
            o.type = 'triangle';
            o.frequency.value = freq;
            
            g.gain.setValueAtTime(0, time);
            g.gain.linearRampToValueAtTime(0.2, time + 0.05);
            g.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
            
            o.start(time);
            o.stop(time + 0.5);
            time += 0.12; 
        });
    }
}