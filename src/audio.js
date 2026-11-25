// Procedural Web Audio API sound system for Temple Run
export class SoundSystem {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicPlaying = false;
    this.musicTimer = null;
    this.bpm = 135;
    this.step = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    if (!this.enabled && this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicPlaying = false;
    } else if (this.enabled && !this.musicPlaying) {
      this.startMusic();
    }
    return this.enabled;
  }

  startMusic() {
    if (!this.enabled) return;
    this.init();
    if (this.musicPlaying) return;
    this.musicPlaying = true;
    this.step = 0;

    const interval = (60 / this.bpm / 4) * 1000;
    this.musicTimer = setInterval(() => {
      this.playMusicStep();
      this.step = (this.step + 1) % 16;
    }, interval);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.musicPlaying = false;
  }

  setSpeed(multiplier) {
    this.bpm = Math.min(180, 135 + (multiplier - 1) * 35);
    if (this.musicPlaying) {
      this.stopMusic();
      this.startMusic();
    }
  }

  // Tribal drum loop: Bass drum, jungle tom, metallic shaker
  playMusicStep() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;

    // Bass / Taiko Drum on beats 0, 4, 8, 11, 14
    if ([0, 4, 8, 11, 14].includes(this.step)) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(38, t + 0.18);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    }

    // Mid Tom drum on beats 2, 6, 10, 13
    if ([2, 6, 10, 13].includes(this.step)) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(190, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.12);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.14);
    }

    // Shaker / Maraca on every 16th note with varying velocity
    if (this.step % 2 === 0) {
      const bufferSize = this.ctx.sampleRate * 0.04;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(4500, t);

      const gain = this.ctx.createGain();
      const vol = this.step % 4 === 0 ? 0.08 : 0.04;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(t);
    }
  }

  // Sparkling golden coin chime
  playCoin() {
    if (!this.enabled) return;
    this.init();
    const t = this.ctx.currentTime;
    
    // Random harmonious pitch
    const pitches = [987.77, 1174.66, 1318.51, 1567.98, 1760.00];
    const freq = pitches[Math.floor(Math.random() * pitches.length)];

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.18);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, t);
    osc2.frequency.exponentialRampToValueAtTime(freq * 2.5, t + 0.12);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc2.start(t);
    osc.stop(t + 0.25);
    osc2.stop(t + 0.25);
  }

  // Player Jump swoosh
  playJump() {
    if (!this.enabled) return;
    this.init();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(650, t + 0.2);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  // Slide whoosh with low gravel grit
  playSlide() {
    if (!this.enabled) return;
    this.init();
    const t = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.linearRampToValueAtTime(300, t + 0.3);
    filter.Q.value = 3;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);
  }

  // Turn swoosh
  playTurn() {
    if (!this.enabled) return;
    this.init();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.15);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  // Stumble crunch & grunt
  playStumble() {
    if (!this.enabled) return;
    this.init();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.linearRampToValueAtTime(60, t + 0.25);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  // Demon Monkey snarling growl
  playDemonGrowl() {
    if (!this.enabled) return;
    this.init();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.linearRampToValueAtTime(70, t + 0.5);

    mod.type = 'sine';
    mod.frequency.setValueAtTime(25, t); // growl rumble
    modGain.gain.setValueAtTime(35, t);

    mod.connect(osc.frequency);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    mod.start(t);
    osc.start(t);
    mod.stop(t + 0.5);
    osc.stop(t + 0.5);
  }

  // Powerup fanfare
  playPowerup() {
    if (!this.enabled) return;
    this.init();
    const t = this.ctx.currentTime;

    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = t + i * 0.07;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }

  // Game over death crash
  playGameOver() {
    if (!this.enabled) return;
    this.init();
    const t = this.ctx.currentTime;
    this.stopMusic();

    // Low boom
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.8);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.8);
  }
}

export const sound = new SoundSystem();
