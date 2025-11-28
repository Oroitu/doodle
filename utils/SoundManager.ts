class SoundManager {
    private ctx: AudioContext | null = null;
    private isMuted: boolean = false;

    constructor() {
        // Lazy init to respect browser policies
    }

    private getContext(): AudioContext {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return this.ctx;
    }

    public async init() {
        const ctx = this.getContext();
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }
    }

    private vibrate(pattern: number | number[]) {
        try {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(pattern);
            }
        } catch (e) {
            // Ignore vibration errors (unsupported device/browser policies)
            console.debug('Vibration not supported or failed:', e);
        }
    }

    private playOscillator(
        freq: number,
        type: OscillatorType,
        startTime: number,
        duration: number,
        vol: number = 0.1
    ) {
        if (this.isMuted) return;
        const ctx = this.getContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(vol, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    public playBootSequence() {
        this.init();
        const ctx = this.getContext();
        const now = ctx.currentTime;

        // Startup chime: C4 - E4 - G4 - C5
        this.playOscillator(261.63, 'sine', now, 0.5, 0.2);
        this.playOscillator(329.63, 'sine', now + 0.1, 0.5, 0.2);
        this.playOscillator(392.00, 'sine', now + 0.2, 0.5, 0.2);
        this.playOscillator(523.25, 'sine', now + 0.3, 1.0, 0.2);

        this.vibrate([50, 30, 50, 30, 100]);
    }

    public playClick() {
        this.init();
        const ctx = this.getContext();
        const now = ctx.currentTime;
        // High blip
        this.playOscillator(800, 'sine', now, 0.1, 0.05);

        this.vibrate(10);
    }

    public playGrab() {
        this.init();
        const ctx = this.getContext();
        const now = ctx.currentTime;
        // Low mechanical thud
        this.playOscillator(150, 'triangle', now, 0.1, 0.1);

        this.vibrate(20);
    }

    public playSnap() {
        this.init();
        const ctx = this.getContext();
        const now = ctx.currentTime;
        // Satisfying "ding" - two tones
        this.playOscillator(880, 'sine', now, 0.3, 0.1);
        this.playOscillator(1760, 'sine', now, 0.4, 0.05);

        this.vibrate([40, 20, 40]);
    }

    public playError() {
        this.init();
        const ctx = this.getContext();
        const now = ctx.currentTime;
        // Dissonant buzz
        this.playOscillator(150, 'sawtooth', now, 0.2, 0.1);
        this.playOscillator(140, 'sawtooth', now, 0.2, 0.1);

        this.vibrate([100, 50, 100]);
    }

    public playWin() {
        this.init();
        const ctx = this.getContext();
        const now = ctx.currentTime;

        // Victory melody
        const melody = [
            { f: 523.25, t: 0 },   // C5
            { f: 523.25, t: 0.15 }, // C5
            { f: 523.25, t: 0.30 }, // C5
            { f: 659.25, t: 0.45 }, // E5
            { f: 783.99, t: 0.60 }, // G5
            { f: 1046.50, t: 0.90 } // C6
        ];

        melody.forEach(note => {
            this.playOscillator(note.f, 'square', now + note.t, 0.3, 0.1);
        });

        this.vibrate([100, 50, 100, 50, 200, 50, 300]);
    }
    private currentMusic: HTMLAudioElement | null = null;

    public playMusic(filename: string, loop: boolean = true) {
        // If the same song is already playing, do nothing
        if (this.currentMusic && this.currentMusic.src.includes(filename)) {
            return;
        }

        this.stopMusic();

        const audio = new Audio(`./audio/${filename}`);
        audio.loop = loop;
        audio.volume = 0.4;

        audio.play().catch(e => console.log("Audio play failed (autoplay policy?):", e));
        this.currentMusic = audio;
    }

    public stopMusic() {
        if (this.currentMusic) {
            // Simple fade out could go here, but hard stop for now
            this.currentMusic.pause();
            this.currentMusic = null;
        }
    }
}

export const soundManager = new SoundManager();
