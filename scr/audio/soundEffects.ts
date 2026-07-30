// Web Audio API Procedural Sound Engine for BO3 Zombies Prototype

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.5;

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
  }

  // Play gunshot sound based on weapon type
  public playGunshot(type: 'm1911' | 'kuda' | 'krm262' | 'raygun' | 'pap') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(this.masterVolume, now);
    masterGain.connect(this.ctx.destination);

    if (type === 'raygun' || type === 'pap') {
      // Sci-fi laser zap sound
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.25);

      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'krm262') {
      // Heavy shotgun blast (Noise + low boom)
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.3);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.8, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      // Low bass punch
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
      oscGain.gain.setValueAtTime(0.9, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(masterGain);

      osc.connect(oscGain);
      oscGain.connect(masterGain);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.35);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // Standard pistol / SMG shot
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(type === 'kuda' ? 1800 : 1200, now);
      filter.Q.value = 1;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.15);
    }
  }

  // Hitmarker tick sound
  public playHitmarker(headshot: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(headshot ? 2200 : 1500, now);
    osc.frequency.exponentialRampToValueAtTime(headshot ? 3000 : 1800, now + 0.05);

    gain.gain.setValueAtTime(headshot ? 0.4 : 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Spatial Zombie Groan sound (Volume attenuation, stereo panning & directional muffling)
  public playZombieGroan(
    zombiePos?: [number, number, number],
    playerPos?: [number, number, number],
    playerYaw: number = 0,
    intensity: number = 1.0
  ) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    let volume = 0.25 * intensity;
    let pan = 0;
    let filterFreq = 500;

    if (zombiePos && playerPos) {
      const dx = zombiePos[0] - playerPos[0];
      const dz = zombiePos[2] - playerPos[2];
      const dist = Math.hypot(dx, dz);

      // Max hearing distance = 35 meters
      const maxDist = 35;
      const distRatio = Math.max(0, Math.min(1, 1 - dist / maxDist));
      // Inverse square curve: loud when near, smoothly drops off
      volume = distRatio * distRatio * 0.5 * intensity;

      if (dist > 0.01) {
        // Direction vector from player to zombie
        const ndx = dx / dist;
        const ndz = dz / dist;

        // Player right vector: (cos(yaw), 0, -sin(yaw))
        // Player forward vector: (-sin(yaw), 0, -cos(yaw))
        const rightX = Math.cos(playerYaw);
        const rightZ = -Math.sin(playerYaw);
        const forwardX = -Math.sin(playerYaw);
        const forwardZ = -Math.cos(playerYaw);

        const dotRight = ndx * rightX + ndz * rightZ;
        const dotForward = ndx * forwardX + ndz * forwardZ;

        // Stereo pan between -1 (full left) and +1 (full right)
        pan = Math.max(-1, Math.min(1, dotRight));

        // Dynamic Lowpass Filter: Behind player sounds muffled
        if (dotForward < 0) {
          filterFreq = 220 + (1 + dotForward) * 180; // 220Hz - 400Hz (muffled behind)
        } else {
          filterFreq = 400 + dotForward * 450; // 400Hz - 850Hz (clear in front)
        }
      }
    }

    if (volume <= 0.002) return; // Don't play silent sounds out of range

    osc.type = 'sawtooth';
    const baseFreq = (65 + Math.random() * 45) * (intensity > 1.2 ? 1.2 : 1.0);
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.35, now + 0.3);
    osc.frequency.linearRampToValueAtTime(baseFreq * 0.7, now + 0.7);

    // Filter node
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, now);

    // Gain envelope
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(volume * this.masterVolume, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    osc.connect(filter);
    filter.connect(gain);

    // Connect via StereoPannerNode
    if (typeof this.ctx.createStereoPanner === 'function') {
      const panner = this.ctx.createStereoPanner();
      panner.pan.setValueAtTime(pan, now);
      gain.connect(panner);
      panner.connect(this.ctx.destination);
    } else {
      gain.connect(this.ctx.destination);
    }

    osc.start(now);
    osc.stop(now + 0.75);
  }

  // Reload click sound
  public playReload() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const playClick = (time: number, freq: number) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(time);
      osc.stop(time + 0.05);
    };

    playClick(now, 800);
    playClick(now + 0.15, 600);
    playClick(now + 0.35, 1200);
  }

  // Round start sound effect (Spooky BO3 horn / ambient string tone)
  public playRoundStart() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now); // A2
    osc.frequency.exponentialRampToValueAtTime(220, now + 1.2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.linearRampToValueAtTime(1200, now + 1.0);
    filter.frequency.linearRampToValueAtTime(200, now + 2.0);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 2.2);
  }

  // Perk drink chime sound
  public playPerkDrink() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const time = now + idx * 0.1;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(time);
      osc.stop(time + 0.25);
    });
  }

  // Player hit / damage sound
  public playPlayerHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Purchase sound (Cha-Ching)
  public playBuySound() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, now); // B5
    osc2.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.15);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.3);
  }

  // Cassette pickup sound (Tape rewind burst & heavy chord)
  public playCassettePickup() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.18);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Mystery Box activation sound
  public playMysteryBox() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.4);
    osc.frequency.linearRampToValueAtTime(1320, now + 0.8);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.2);
  }

  // Thrash Metal Track Generator Engine (Heavy Distorted Riffs + Double-Bass Drums)
  private thrashInterval: number | null = null;
  private isThrashActive: boolean = false;

  private createDistortionCurve(amount: number = 50) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  public startThrashMetalTrack() {
    if (this.isThrashActive) return;
    this.isThrashActive = true;
    this.initCtx();

    let step = 0;
    // Riff notes (frequencies in Hz): E1, E1, G1, F#1, E1, Bb1, A1, G1 (Fast German Thrash riff style)
    const riffNotes = [82.41, 82.41, 98.00, 92.50, 82.41, 116.54, 110.00, 98.00];

    this.thrashInterval = window.setInterval(() => {
      if (!this.isThrashActive || this.isMuted || !this.ctx) return;
      const now = this.ctx.currentTime;

      // 1. Heavy Distorted Guitar Power Chord / Riff
      const osc = this.ctx.createOscillator();
      const dist = this.ctx.createWaveShaper();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      const freq = riffNotes[step % riffNotes.length];
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      dist.curve = this.createDistortionCurve(80);
      dist.oversample = '4x';

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, now);

      gain.gain.setValueAtTime(0.28 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(dist);
      dist.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);

      // 2. Thrash Kick & Double-Bass Drum on every 16th beat
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(160, now);
      kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.08);

      kickGain.gain.setValueAtTime(0.35 * this.masterVolume, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      kickOsc.connect(kickGain);
      kickGain.connect(this.ctx.destination);
      kickOsc.start(now);
      kickOsc.stop(now + 0.08);

      // 3. Snare on beats 2 and 4
      if (step % 2 === 1) {
        const bufferSize = this.ctx.sampleRate * 0.08;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(1000, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.25 * this.masterVolume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        noise.start(now);
        noise.stop(now + 0.08);
      }

      step++;
    }, 130); // ~230 BPM aggressive thrash pace
  }

  public stopThrashMetalTrack() {
    this.isThrashActive = false;
    if (this.thrashInterval !== null) {
      clearInterval(this.thrashInterval);
      this.thrashInterval = null;
    }
  }
}

export const soundManager = new SoundEngine();

