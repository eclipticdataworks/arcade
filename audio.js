/**
 * Web Audio API Sound Synthesizer for Shiba Pac-Man Arcade
 * 100% procedural 8-bit arcade audio - no external audio files required!
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterVolume = 0.4;
    this.masterGain = null;
    this.sirenOsc = null;
    this.sirenGain = null;
    this.sirenTimer = null;
    this.isSirenPlaying = false;
    this.chompToggle = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('AudioContext init error:', e);
    }
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  setVolume(vol) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
  }

  // Waka-waka / Chomp sound
  playChomp() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    this.chompToggle = !this.chompToggle;
    const baseFreq = this.chompToggle ? 420 : 310;
    const endFreq = this.chompToggle ? 260 : 180;

    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.07);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  // Eating Golden Acorn / Power Pellet
  playPowerPellet() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.25);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    // Subtle lowpass filter for warmth
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  // Catching a squirrel
  playEatSquirrel() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, t + 0.08);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.09);
    });
  }

  // Eating Fruit / Bonus Toy
  playEatFruit() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const freqs = [880, 1174.66, 1480, 1760]; // A5, D6, F#6, A6
    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + i * 0.05;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(start);
      osc.stop(start + 0.13);
    });
  }

  // Shiba Defeat / Caught sound
  playDeath() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Chromatic downward stepping pitch
    const pitches = [
      493.88, 466.16, 440.00, 415.30, 392.00, 369.99, 
      349.23, 329.63, 311.13, 293.66, 277.18, 261.63,
      246.94, 220.00, 196.00, 164.81
    ];

    pitches.forEach((freq, i) => {
      const start = t + i * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.9, start + 0.055);

      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.055);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(start);
      osc.stop(start + 0.06);
    });

    // Cute gentle whimper at end
    const whimperStart = t + pitches.length * 0.06 + 0.05;
    const wOsc = this.ctx.createOscillator();
    const wGain = this.ctx.createGain();
    wOsc.type = 'sine';
    wOsc.frequency.setValueAtTime(520, whimperStart);
    wOsc.frequency.exponentialRampToValueAtTime(280, whimperStart + 0.25);
    wGain.gain.setValueAtTime(0.2, whimperStart);
    wGain.gain.exponentialRampToValueAtTime(0.001, whimperStart + 0.25);

    wOsc.connect(wGain);
    wGain.connect(this.masterGain);
    wOsc.start(whimperStart);
    wOsc.stop(whimperStart + 0.26);
  }

  // Classic Arcade Game Start Fanfare
  playStartFanfare() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime + 0.05;
    // Iconic Pac-Man start melody notes: (freq, duration)
    const melody = [
      { f: 493.88, d: 0.12 }, // B4
      { f: 987.77, d: 0.12 }, // B5
      { f: 739.99, d: 0.12 }, // F#5
      { f: 622.25, d: 0.12 }, // D#5
      { f: 987.77, d: 0.12 }, // B5
      { f: 739.99, d: 0.12 }, // F#5
      { f: 622.25, d: 0.22 }, // D#5
      { f: 523.25, d: 0.12 }, // C5
      { f: 1046.50, d: 0.12 },// C6
      { f: 783.99, d: 0.12 }, // G5
      { f: 659.25, d: 0.12 }, // E5
      { f: 1046.50, d: 0.12 },// C6
      { f: 783.99, d: 0.12 }, // G5
      { f: 659.25, d: 0.22 }, // E5
      { f: 493.88, d: 0.12 }, // B4
      { f: 987.77, d: 0.12 }, // B5
      { f: 739.99, d: 0.12 }, // F#5
      { f: 622.25, d: 0.12 }, // D#5
      { f: 987.77, d: 0.12 }, // B5
      { f: 739.99, d: 0.12 }, // F#5
      { f: 622.25, d: 0.22 }, // D#5
      { f: 622.25, d: 0.07 }, // D#5
      { f: 659.25, d: 0.07 }, // E5
      { f: 698.46, d: 0.07 }, // F5
      { f: 739.99, d: 0.07 }, // F#5
      { f: 783.99, d: 0.07 }, // G5
      { f: 830.61, d: 0.07 }, // G#5
      { f: 880.00, d: 0.07 }, // A5
      { f: 987.77, d: 0.35 }  // B5
    ];

    let curTime = t;
    melody.forEach(note => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(note.f, curTime);

      gain.gain.setValueAtTime(0.2, curTime);
      gain.gain.exponentialRampToValueAtTime(0.001, curTime + note.d * 0.95);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(curTime);
      osc.stop(curTime + note.d);

      curTime += note.d;
    });
  }

  // Extra Life sound (cheerful bell chime)
  playExtraLife() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((f, idx) => {
      const start = t + idx * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, start);

      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(start);
      osc.stop(start + 0.26);
    });
  }
}

// Global audio singleton
window.soundEngine = new SoundEngine();
