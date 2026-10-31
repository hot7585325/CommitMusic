// ==========================================
// GitMusic - Audio Exporter (WAV & MP3)
// ==========================================

// 將 AudioBuffer 編碼為真正的 16-bit PCM WAV 二進位 Blob
function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let result;
  if (numChannels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    result = new Float32Array(left.length + right.length);
    for (let i = 0; i < left.length; i++) {
      result[i * 2] = left[i];
      result[i * 2 + 1] = right[i];
    }
  } else {
    result = buffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const wavBuffer = new ArrayBuffer(44 + result.length * bytesPerSample);
  const view = new DataView(wavBuffer);

  function writeString(v, offset, str) {
    for (let i = 0; i < str.length; i++) {
      v.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + result.length * bytesPerSample, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, result.length * bytesPerSample, true);

  let offset = 44;
  for (let i = 0; i < result.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

// 將 AudioBuffer 編碼為 128kbps MP3 二進位 Blob (使用 lamejs)
function audioBufferToMp3(buffer, kbps = 128) {
  if (typeof lamejs === 'undefined') {
    throw new Error('lamejs 編碼庫尚未載入完成，請確認網路連線');
  }

  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, kbps);
  const mp3Data = [];
  const sampleBlockSize = 1152;

  if (channels === 2) {
    const leftData = buffer.getChannelData(0);
    const rightData = buffer.getChannelData(1);
    const left = new Int16Array(leftData.length);
    const right = new Int16Array(rightData.length);
    for (let i = 0; i < leftData.length; i++) {
      let l = Math.max(-1, Math.min(1, leftData[i]));
      let r = Math.max(-1, Math.min(1, rightData[i]));
      left[i] = l < 0 ? l * 0x8000 : l * 0x7FFF;
      right[i] = r < 0 ? r * 0x8000 : r * 0x7FFF;
    }

    for (let i = 0; i < left.length; i += sampleBlockSize) {
      const leftChunk = left.subarray(i, i + sampleBlockSize);
      const rightChunk = right.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }
  } else {
    const monoData = buffer.getChannelData(0);
    const mono = new Int16Array(monoData.length);
    for (let i = 0; i < monoData.length; i++) {
      let m = Math.max(-1, Math.min(1, monoData[i]));
      mono[i] = m < 0 ? m * 0x8000 : m * 0x7FFF;
    }
    for (let i = 0; i < mono.length; i += sampleBlockSize) {
      const chunk = mono.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3encoder.encodeBuffer(chunk);
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }
  }

  const end = mp3encoder.flush();
  if (end.length > 0) {
    mp3Data.push(end);
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
}

// 離線背景高速算圖 (完全不需發出聲音、不需即時等待播放)
async function renderOfflineBuffer() {
  const bpm = parseFloat(document.getElementById('bpmSlider').value) || 128;
  const division = document.getElementById('stepDivision').value;
  const preset = document.getElementById('soundPreset').value;

  const beatsPerStep = division === '16n' ? 0.25 : (division === '4n' ? 1.0 : 0.5);
  const secondsPerBeat = 60 / bpm;
  const stepDuration = beatsPerStep * secondsPerBeat;
  const renderDuration = 0.05 + totalSteps * stepDuration + 1.0;

  const renderedBuffer = await Tone.Offline(async () => {
    let leadOsc = 'square';
    let bassOsc = 'triangle';
    let reverbWet = 0.15;

    if (preset === 'synthwave') {
      leadOsc = 'sawtooth';
      bassOsc = 'fatsawtooth';
      reverbWet = 0.35;
    } else if (preset === 'lofi') {
      leadOsc = 'sine';
      bassOsc = 'sine';
      reverbWet = 0.3;
    }

    // 免 Worklet 原生空間混響效果
    const offlineReverb = createCleanReverb(Tone.context, Tone.Destination, reverbWet);

    const lead = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: leadOsc },
      envelope: { attack: 0.01, decay: 0.15, sustain: 0.2, release: 0.2 }
    }).connect(offlineReverb.input);
    lead.volume.value = -6;

    const bass = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: bassOsc },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.3 }
    }).connect(offlineReverb.input);
    bass.volume.value = -3;

    const kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.3, sustain: 0.01, release: 0.3 }
    }).toDestination();
    kick.volume.value = 0;

    // Snare Drum (免 Worklet 原生高相容小鼓)
    const snare = createSnareSynth(Tone.context, Tone.Destination);

    const hihat = new Tone.MetalSynth({
      frequency: 200,
      envelope: { attack: 0.001, decay: 0.05, release: 0.02 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).toDestination();
    hihat.volume.value = -16;

    const startTimeOffset = 0.05; // 避免 time=0 碰撞 Web Audio 初始化事件

    // 依序排程每個拍點，並做同拍點樂器去重合併以避免 Web Audio Automation 時間碰撞
    for (let step = 0; step < totalSteps; step++) {
      const stepTime = startTimeOffset + (step * stepDuration);

      let kickNote = null;
      let kickVel = 0;
      let snareVel = 0;
      let hihatVel = 0;
      const leadNotes = new Map(); // note -> maxVelocity
      const bassNotes = new Map(); // note -> maxVelocity

      filesList.forEach((_, fIdx) => {
        const cell = gridMatrix[`${fIdx}_${step}`];
        if (cell && cell.active) {
          const track = trackSettings[fIdx];
          if (!track || track.isMuted) return;

          const inst = track.instrument;
          const note = track.note;
          const lines = cell.lines || 10;
          const velocity = Math.min(1.0, Math.max(0.4, 0.4 + 0.18 * Math.log10(lines + 1)));

          if (inst === 'kick') {
            kickNote = note;
            kickVel = Math.max(kickVel, velocity);
          } else if (inst === 'snare') {
            snareVel = Math.max(snareVel, velocity * 0.8);
          } else if (inst === 'hihat') {
            hihatVel = Math.max(hihatVel, velocity * 0.6);
          } else if (inst === 'bass') {
            bassNotes.set(note, Math.max(bassNotes.get(note) || 0, velocity));
          } else {
            leadNotes.set(note, Math.max(leadNotes.get(note) || 0, velocity));
          }
        }
      });

      // 安全觸發各樂器，每個拍點每種單音鼓組只觸發一次，避免 Web Audio 碰撞
      try {
        if (kickNote && kickVel > 0) {
          kick.triggerAttackRelease(kickNote, '8n', stepTime, kickVel);
        }
        if (snareVel > 0) {
          snare.triggerAttackRelease('16n', stepTime, snareVel);
        }
        if (hihatVel > 0) {
          hihat.triggerAttackRelease('32n', stepTime, hihatVel);
        }
        leadNotes.forEach((vel, n) => {
          lead.triggerAttackRelease(n, '16n', stepTime, vel);
        });
        bassNotes.forEach((vel, n) => {
          bass.triggerAttackRelease(n, '8n', stepTime, vel);
        });
      } catch (e) {
        console.warn('Step offline schedule note error:', e);
      }
    }
  }, renderDuration, 2, 44100);

  return renderedBuffer.get ? renderedBuffer.get() : renderedBuffer;
}

async function exportAudio(format = 'wav') {
  if (totalSteps === 0 || filesList.length === 0) {
    alert('尚未載入任何 Git 提交資料！請先載入範例或連線本地儲存庫。');
    return;
  }

  const btn = format === 'mp3' ? document.getElementById('btnExportMp3') : document.getElementById('btnExportWav');
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.classList.add('opacity-70', 'cursor-not-allowed');
  btn.innerHTML = `<span class="animate-pulse">轉檔中...</span>`;

  try {
    const audioBuffer = await renderOfflineBuffer();
    let blob;
    if (format === 'mp3') {
      blob = audioBufferToMp3(audioBuffer, 128);
    } else {
      blob = audioBufferToWav(audioBuffer);
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gitmusic_bgm_${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error(`音訊匯出 (${format}) 錯誤:`, err);
    alert(`匯出 ${format.toUpperCase()} 失敗：` + err.message);
  } finally {
    btn.disabled = false;
    btn.classList.remove('opacity-70', 'cursor-not-allowed');
    btn.innerHTML = originalHtml;
    lucide.createIcons();
  }
}
