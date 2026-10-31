// ==========================================
// GitMusic - Audio Engine (Tone.js + Web Audio)
// ==========================================

// 原生 Web Audio 免 Worklet 混響空間效果 (100% 相容 file:// 與所有瀏覽器)
function createCleanReverb(context, destination, wet = 0.25) {
  const rawCtx = context.rawContext || context;
  const dest = destination.input || destination;
  const sampleRate = rawCtx.sampleRate || 44100;

  const inputNode = rawCtx.createGain();
  const dryGain = rawCtx.createGain();
  const wetGain = rawCtx.createGain();

  const initialWet = Math.max(0, Math.min(1, wet));
  dryGain.gain.setValueAtTime(1 - (initialWet * 0.4), rawCtx.currentTime || 0);
  wetGain.gain.setValueAtTime(initialWet, rawCtx.currentTime || 0);

  inputNode.connect(dryGain);
  dryGain.connect(dest);

  // 產生 1.2 秒雙聲道自然衰減脈衝 (無需 AudioWorklet，純 Float32 運算)
  const duration = 1.2;
  const length = Math.floor(sampleRate * duration);
  const impulse = rawCtx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const factor = Math.exp(-i / (sampleRate * 0.35));
    left[i] = (Math.random() * 2 - 1) * factor;
    right[i] = (Math.random() * 2 - 1) * factor;
  }

  const convolver = rawCtx.createConvolver();
  convolver.buffer = impulse;

  inputNode.connect(convolver);
  convolver.connect(wetGain);
  wetGain.connect(dest);

  return {
    input: inputNode,
    wet: {
      get value() {
        return wetGain.gain.value;
      },
      set value(v) {
        const val = Math.max(0, Math.min(1, v));
        const t = rawCtx.currentTime || 0;
        wetGain.gain.setValueAtTime(val, t);
        dryGain.gain.setValueAtTime(1 - (val * 0.4), t);
      }
    }
  };
}

// 原生 Web Audio 免 Worklet 小鼓合成器 (100% 相容 file:// 與所有瀏覽器)
function createSnareSynth(context, destination) {
  const rawCtx = context.rawContext || context;
  const dest = destination.input || destination;
  const rate = rawCtx.sampleRate || 44100;

  const buffer = rawCtx.createBuffer(1, Math.floor(rate * 0.18), rate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (rate * 0.04));
  }

  return {
    triggerAttackRelease(arg1, arg2, arg3) {
      let time = typeof arg2 === 'number' ? arg2 : rawCtx.currentTime;
      let velocity = typeof arg3 === 'number' ? arg3 : (typeof arg2 === 'number' ? 0.8 : 0.8);
      if (time === undefined || isNaN(time)) time = rawCtx.currentTime;

      try {
        // 1. 白噪聲 (Noise burst)
        const src = rawCtx.createBufferSource();
        src.buffer = buffer;
        const filter = rawCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(800, time);

        const gain = rawCtx.createGain();
        gain.gain.setValueAtTime(Math.min(1.0, velocity * 0.45), time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(dest);

        src.start(time);
        src.stop(time + 0.15);

        // 2. 8-Bit 鼓面音高敲擊 (Tone snap)
        const osc = rawCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, time);
        osc.frequency.exponentialRampToValueAtTime(50, time + 0.07);

        const oscGain = rawCtx.createGain();
        oscGain.gain.setValueAtTime(Math.min(1.0, velocity * 0.35), time);
        oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);

        osc.connect(oscGain);
        oscGain.connect(dest);

        osc.start(time);
        osc.stop(time + 0.08);
      } catch (e) {
        console.warn('Snare play warning:', e);
      }
    }
  };
}

function initAudio() {
  if (synths.leadSynth) return;

  // 免 Worklet 原生空間混響效果
  synths.reverb = createCleanReverb(Tone.context, Tone.Destination, 0.25);

  // Lead Synth (Square / 8-bit style)
  synths.leadSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.15, sustain: 0.2, release: 0.2 }
  }).connect(synths.reverb.input);
  synths.leadSynth.volume.value = -6;

  // Bass Synth (Triangle)
  synths.bassSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.3 }
  }).connect(synths.reverb.input);
  synths.bassSynth.volume.value = -3;

  // Kick Drum
  synths.kickSynth = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 6,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.3, sustain: 0.01, release: 0.3 }
  }).toDestination();
  synths.kickSynth.volume.value = 0;

  // Snare Drum (免 Worklet 原生高相容小鼓)
  synths.snareSynth = createSnareSynth(Tone.context, Tone.Destination);

  // Hi-Hat
  synths.hihatSynth = new Tone.MetalSynth({
    frequency: 200,
    envelope: { attack: 0.001, decay: 0.05, release: 0.02 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5
  }).toDestination();
  synths.hihatSynth.volume.value = -16;
}

function updateSoundPreset(preset) {
  if (!synths.leadSynth) return;
  if (preset === 'chiptune') {
    synths.leadSynth.set({ oscillator: { type: 'square' } });
    synths.bassSynth.set({ oscillator: { type: 'triangle' } });
    synths.reverb.wet.value = 0.15;
  } else if (preset === 'synthwave') {
    synths.leadSynth.set({ oscillator: { type: 'sawtooth' } });
    synths.bassSynth.set({ oscillator: { type: 'fatsawtooth' } });
    synths.reverb.wet.value = 0.45;
  } else if (preset === 'lofi') {
    synths.leadSynth.set({ oscillator: { type: 'sine' } });
    synths.bassSynth.set({ oscillator: { type: 'sine' } });
    synths.reverb.wet.value = 0.35;
  }
}

function playTrackSound(fIdx, velocity = 0.8) {
  const track = trackSettings[fIdx];
  if (!track || track.isMuted) return;

  const inst = track.instrument;
  const note = track.note;

  try {
    if (inst === 'kick') {
      synths.kickSynth.triggerAttackRelease(note, '8n', undefined, velocity);
    } else if (inst === 'snare') {
      synths.snareSynth.triggerAttackRelease('16n', undefined, velocity * 0.8);
    } else if (inst === 'hihat') {
      synths.hihatSynth.triggerAttackRelease('32n', undefined, velocity * 0.6);
    } else if (inst === 'bass') {
      synths.bassSynth.triggerAttackRelease(note, '8n', undefined, velocity);
    } else {
      synths.leadSynth.triggerAttackRelease(note, '16n', undefined, velocity);
    }
  } catch (e) {
    console.warn('Audio playback error:', e);
  }
}

function updateTimingCalculations() {
  const bpm = parseFloat(document.getElementById('bpmSlider').value);
  const division = document.getElementById('stepDivision').value;
  let beatsPerStep = division === '16n' ? 0.25 : (division === '4n' ? 1.0 : 0.5);

  const secondsPerBeat = 60 / bpm;
  const totalSeconds = totalSteps * beatsPerStep * secondsPerBeat;

  document.getElementById('durationVal').textContent = `${totalSeconds.toFixed(1)}s`;
  document.getElementById('durationSlider').value = Math.min(120, Math.max(5, Math.round(totalSeconds)));
}

function calculateBpmFromDuration(targetDurationSeconds) {
  const division = document.getElementById('stepDivision').value;
  let beatsPerStep = division === '16n' ? 0.25 : (division === '4n' ? 1.0 : 0.5);

  let calculatedBpm = (totalSteps * beatsPerStep * 60) / targetDurationSeconds;
  calculatedBpm = Math.min(240, Math.max(60, Math.round(calculatedBpm)));

  document.getElementById('bpmSlider').value = calculatedBpm;
  document.getElementById('bpmVal').textContent = calculatedBpm;
  Tone.Transport.bpm.value = calculatedBpm;
  updateTimingCalculations();
}

function onStep(time) {
  if (totalSteps === 0) return;
  const step = currentStep % totalSteps;
  highlightStep(step);

  filesList.forEach((_, fIdx) => {
    const cell = gridMatrix[`${fIdx}_${step}`];
    if (cell && cell.active) {
      const lines = cell.lines || 10;
      const velocity = Math.min(1.0, Math.max(0.4, 0.4 + 0.18 * Math.log10(lines + 1)));
      playTrackSound(fIdx, velocity);
    }
  });

  currentStep++;
}

function resetPlayback() {
  Tone.Transport.stop();
  if (stepEventId !== null) {
    Tone.Transport.clear(stepEventId);
    stepEventId = null;
  }
  currentStep = 0;
  isPlaying = false;
  document.getElementById('playText').textContent = 'PLAY BGM';
  document.getElementById('playIcon').setAttribute('data-lucide', 'play');
  document.querySelectorAll('.active-step').forEach(el => el.classList.remove('active-step'));
  document.querySelectorAll('.active-step-header').forEach(el => el.classList.remove('active-step-header'));
  document.getElementById('currentStepText').textContent = `0 / ${totalSteps}`;
  lucide.createIcons();
}

function togglePlay() {
  initAudio();
  if (Tone.context.state !== 'running') {
    Tone.context.resume();
  }

  if (isPlaying) {
    Tone.Transport.pause();
    isPlaying = false;
    document.getElementById('playText').textContent = 'RESUME';
    document.getElementById('playIcon').setAttribute('data-lucide', 'play');
  } else {
    const division = document.getElementById('stepDivision').value;
    const bpm = parseFloat(document.getElementById('bpmSlider').value);
    Tone.Transport.bpm.value = bpm;

    if (stepEventId === null) {
      stepEventId = Tone.Transport.scheduleRepeat((time) => {
        onStep(time);
      }, division);
    }

    Tone.Transport.start();
    isPlaying = true;
    document.getElementById('playText').textContent = 'PAUSE';
    document.getElementById('playIcon').setAttribute('data-lucide', 'pause');
  }
  lucide.createIcons();
}

function jumpToStep(stepIdx) {
  currentStep = stepIdx;
  highlightStep(stepIdx);
}
