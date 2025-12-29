// Sound manager for game audio effects

type SoundType = 'click' | 'place' | 'remove' | 'chug' | 'whistle';

class SoundManagerClass {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.5;
  private chugInterval: number | null = null;

  // Initialize audio context (must be called after user interaction)
  init() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopChug();
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  isEnabled() {
    return this.enabled;
  }

  getVolume() {
    return this.volume;
  }

  // Generate simple tones using Web Audio API
  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volumeMultiplier: number = 1
  ) {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    const now = this.audioContext.currentTime;
    const vol = this.volume * volumeMultiplier;

    // Envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(vol, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  // Generate noise burst (for chug sound)
  private playNoise(duration: number, volumeMultiplier: number = 1) {
    if (!this.enabled || !this.audioContext) return;

    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    source.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    const now = this.audioContext.currentTime;
    const vol = this.volume * volumeMultiplier * 0.3;

    gainNode.gain.setValueAtTime(vol, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    source.start(now);
  }

  // Play click sound (UI interactions)
  playClick() {
    this.playTone(800, 0.05, 'sine', 0.3);
  }

  // Play place sound (placing tracks)
  playPlace() {
    this.playTone(400, 0.1, 'triangle', 0.4);
    setTimeout(() => this.playTone(600, 0.1, 'triangle', 0.3), 50);
  }

  // Play remove sound (removing tracks)
  playRemove() {
    this.playTone(300, 0.15, 'sawtooth', 0.2);
  }

  // Play single chug sound
  private playChugOnce() {
    this.playNoise(0.08, 0.8);
    this.playTone(80, 0.1, 'square', 0.15);
  }

  // Start continuous chug sound for train
  startChug() {
    if (this.chugInterval) return;

    this.init();
    this.playChugOnce();

    this.chugInterval = window.setInterval(() => {
      this.playChugOnce();
    }, 250); // Chug every 250ms
  }

  // Stop chug sound
  stopChug() {
    if (this.chugInterval) {
      clearInterval(this.chugInterval);
      this.chugInterval = null;
    }
  }

  // Play whistle sound (at stations)
  playWhistle() {
    if (!this.enabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    const vol = this.volume * 0.4;

    // Two-tone whistle
    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.audioContext.destination);

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.value = 880;
    osc2.frequency.value = 1100;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.05);
    gain.gain.setValueAtTime(vol, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  }

  // Play sound by type
  play(sound: SoundType) {
    this.init();
    switch (sound) {
      case 'click':
        this.playClick();
        break;
      case 'place':
        this.playPlace();
        break;
      case 'remove':
        this.playRemove();
        break;
      case 'whistle':
        this.playWhistle();
        break;
      case 'chug':
        this.playChugOnce();
        break;
    }
  }
}

// Singleton instance
export const SoundManager = new SoundManagerClass();
