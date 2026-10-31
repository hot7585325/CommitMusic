// ==========================================
// GitMusic - Main Application Controller
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();

  // Global Mouse Handlers for Dragging
  window.addEventListener('mouseup', () => {
    isMouseDown = false;
    isPanning = false;
    const container = document.getElementById('matrixScrollContainer');
    if (container) container.classList.remove('pan-grabbing');
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      clearSelection();
    }
  });

  // Canvas Pan (Hand tool drag)
  const scrollContainer = document.getElementById('matrixScrollContainer');
  if (scrollContainer) {
    scrollContainer.addEventListener('mousedown', (e) => {
      if (currentTool === 'pan' && e.button === 0) {
        isPanning = true;
        panStartX = e.pageX - scrollContainer.offsetLeft;
        panStartY = e.pageY - scrollContainer.offsetTop;
        scrollStartLeft = scrollContainer.scrollLeft;
        scrollStartTop = scrollContainer.scrollTop;
        scrollContainer.classList.add('pan-grabbing');
      }
    });

    scrollContainer.addEventListener('mousemove', (e) => {
      if (!isPanning || currentTool !== 'pan') return;
      e.preventDefault();
      const x = e.pageX - scrollContainer.offsetLeft;
      const y = e.pageY - scrollContainer.offsetTop;
      const walkX = (x - panStartX) * 1.5;
      const walkY = (y - panStartY) * 1.5;
      scrollContainer.scrollLeft = scrollStartLeft - walkX;
      scrollContainer.scrollTop = scrollStartTop - walkY;
    });
  }

  // Batch Action Bar Handlers
  document.getElementById('btnBatchTurnOn').addEventListener('click', () => {
    selectedCells.forEach(key => {
      const [f, c] = key.split('_').map(Number);
      if (!gridMatrix[key]) gridMatrix[key] = { active: false, type: 'M', lines: 10 };
      gridMatrix[key].active = true;
      const td = document.getElementById(`cell_${f}_${c}`);
      if (td) renderCellContent(td, f, c);
    });
  });

  document.getElementById('btnBatchTurnOff').addEventListener('click', () => {
    selectedCells.forEach(key => {
      const [f, c] = key.split('_').map(Number);
      if (gridMatrix[key]) gridMatrix[key].active = false;
      const td = document.getElementById(`cell_${f}_${c}`);
      if (td) renderCellContent(td, f, c);
    });
  });

  document.getElementById('btnClearSelection').addEventListener('click', clearSelection);

  // Tool switcher buttons
  document.getElementById('toolSelect').addEventListener('click', () => {
    currentTool = 'select';
    document.getElementById('toolSelect').className = 'px-2.5 py-1 rounded-lg bg-green-600 text-black font-bold flex items-center gap-1 transition';
    document.getElementById('toolPan').className = 'px-2.5 py-1 rounded-lg text-neutral-400 hover:text-neutral-200 flex items-center gap-1 transition';
    if (scrollContainer) scrollContainer.classList.remove('pan-grab', 'pan-grabbing');
  });

  document.getElementById('toolPan').addEventListener('click', () => {
    currentTool = 'pan';
    document.getElementById('toolPan').className = 'px-2.5 py-1 rounded-lg bg-green-600 text-black font-bold flex items-center gap-1 transition';
    document.getElementById('toolSelect').className = 'px-2.5 py-1 rounded-lg text-neutral-400 hover:text-neutral-200 flex items-center gap-1 transition';
    clearSelection();
    if (scrollContainer) scrollContainer.classList.add('pan-grab');
  });

  // Playback & Timing Controls
  document.getElementById('btnPlayPause').addEventListener('click', togglePlay);
  document.getElementById('btnStop').addEventListener('click', resetPlayback);

  document.getElementById('bpmSlider').addEventListener('input', (e) => {
    const val = e.target.value;
    document.getElementById('bpmVal').textContent = val;
    Tone.Transport.bpm.value = parseFloat(val);
    updateTimingCalculations();
  });

  document.getElementById('durationSlider').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    document.getElementById('durationVal').textContent = `${val.toFixed(1)}s`;
    calculateBpmFromDuration(val);
  });

  document.getElementById('stepDivision').addEventListener('change', () => {
    const isWasPlaying = isPlaying;
    resetPlayback();
    updateTimingCalculations();
    if (isWasPlaying) togglePlay();
  });

  document.getElementById('soundPreset').addEventListener('change', (e) => {
    initAudio();
    updateSoundPreset(e.target.value);
  });

  document.getElementById('modeBpm').addEventListener('click', () => {
    timingMode = 'bpm';
    document.getElementById('modeBpm').className = 'px-3 py-1 rounded-lg bg-green-500/20 text-green-300 border border-green-500/50 shadow transition';
    document.getElementById('modeDuration').className = 'px-3 py-1 rounded-lg text-neutral-400 hover:text-neutral-200 transition';
    document.getElementById('bpmSlider').disabled = false;
    document.getElementById('bpmContainer').classList.remove('opacity-40');
    document.getElementById('durationSlider').disabled = true;
    document.getElementById('durationContainer').classList.add('opacity-40');
  });

  document.getElementById('modeDuration').addEventListener('click', () => {
    timingMode = 'duration';
    document.getElementById('modeDuration').className = 'px-3 py-1 rounded-lg bg-green-500/20 text-green-300 border border-green-500/50 shadow transition';
    document.getElementById('modeBpm').className = 'px-3 py-1 rounded-lg text-neutral-400 hover:text-neutral-200 transition';
    document.getElementById('bpmSlider').disabled = true;
    document.getElementById('bpmContainer').classList.add('opacity-40');
    document.getElementById('durationSlider').disabled = false;
    document.getElementById('durationContainer').classList.remove('opacity-40');
  });

  // Action Buttons
  document.getElementById('btnLoadSample').addEventListener('click', () => {
    loadDataset(SAMPLE_COMMITS);
  });

  document.getElementById('btnExportWav').addEventListener('click', () => exportAudio('wav'));
  document.getElementById('btnExportMp3').addEventListener('click', () => exportAudio('mp3'));

  document.getElementById('btnToggleAllRows').addEventListener('click', () => {
    const anyExpanded = trackSettings.some(t => !t.isCollapsed);
    trackSettings.forEach(t => t.isCollapsed = anyExpanded);
    document.getElementById('toggleAllRowsText').textContent = anyExpanded ? '全部展開 ⊞' : '全部收合 ⊟';
    renderSequencerTable();
  });

  document.getElementById('fileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const commits = parseGitLogText(text);
      if (commits.length === 0) {
        alert('未能解析出有效提交紀錄，請確認格式是否為：git log --reverse --pretty=format:"COMMIT:%h|%an|%s" --numstat');
        return;
      }
      loadDataset(commits);
    };
    reader.readAsText(file);
  });

  document.getElementById('btnFetchRepo').addEventListener('click', () => {
    const pathVal = document.getElementById('repoPathInput').value.trim() || '.';
    fetchLocalGitLog(pathVal);
  });

  document.getElementById('repoPathInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const pathVal = document.getElementById('repoPathInput').value.trim() || '.';
      fetchLocalGitLog(pathVal);
    }
  });

  // Initial Load
  loadDataset(SAMPLE_COMMITS);
});
