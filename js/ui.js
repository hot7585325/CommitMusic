// ==========================================
// GitMusic - UI & Sequencer Grid Renderer
// ==========================================

function loadDataset(commits) {
  commitsData = commits;
  totalSteps = commits.length;

  const filesMap = new Map();
  commits.forEach((c) => {
    Object.keys(c.changes).forEach((file) => {
      filesMap.set(file, (filesMap.get(file) || 0) + 1);
    });
  });

  filesList = Array.from(filesMap.keys()).sort((a, b) => filesMap.get(b) - filesMap.get(a));

  gridMatrix = {};
  trackSettings = [];

  let melodyNoteIdx = 0;
  let bassNoteIdx = 0;

  filesList.forEach((file, fIdx) => {
    let instrument = 'lead';
    let note = 'C4';

    if (file.toLowerCase().includes('manager') || file.toLowerCase().includes('data') || file.endsWith('.json')) {
      instrument = 'bass';
      note = BASS_SCALE[bassNoteIdx % BASS_SCALE.length];
      bassNoteIdx++;
    } else if (file.toLowerCase().includes('audio') || file.endsWith('.md')) {
      instrument = 'hihat';
      note = 'G4';
    } else if (file.toLowerCase().includes('combat') || file.toLowerCase().includes('enemy')) {
      instrument = 'snare';
      note = 'C2';
    } else if (file.toLowerCase().includes('boss')) {
      instrument = 'kick';
      note = 'C1';
    } else {
      instrument = 'lead';
      note = MELODY_SCALE[melodyNoteIdx % MELODY_SCALE.length];
      melodyNoteIdx++;
    }

    trackSettings.push({
      file: file,
      instrument: instrument,
      note: note,
      isMuted: false,
      isCollapsed: false
    });

    commits.forEach((c, cIdx) => {
      if (c.changes[file]) {
        gridMatrix[`${fIdx}_${cIdx}`] = {
          active: true,
          type: c.changes[file].type,
          lines: c.changes[file].lines
        };
      } else {
        gridMatrix[`${fIdx}_${cIdx}`] = {
          active: false,
          type: null,
          lines: 0
        };
      }
    });
  });

  clearSelection();
  renderSequencerTable();
  updateTimingCalculations();
  resetPlayback();
}

function renderSequencerTable() {
  const thead = document.querySelector('#sequencerTable thead tr');
  const tbody = document.getElementById('matrixTbody');

  while (thead.children.length > 1) {
    thead.removeChild(thead.lastChild);
  }
  tbody.innerHTML = '';

  commitsData.forEach((c, idx) => {
    const th = document.createElement('th');
    th.className = `p-2.5 text-center min-w-[65px] border-r border-green-950/70 commit-col-${idx} cursor-pointer hover:bg-neutral-900 transition`;
    th.title = `${c.hash} - ${c.msg} (${c.author})`;
    th.innerHTML = `
      <div class="text-[11px] font-bold text-neutral-300">c${idx + 1}</div>
      <div class="text-[10px] text-green-500/70 truncate w-14 mx-auto">${c.hash}</div>
    `;
    th.addEventListener('click', () => jumpToStep(idx));
    thead.appendChild(th);
  });

  filesList.forEach((file, fIdx) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-neutral-900/40 transition group';
    tr.dataset.fileIndex = fIdx;

    // 1. Single Consolidated Track Cell (Triangle 2-Row Layout & Collapsible like Excel)
    const tdTrack = document.createElement('td');
    const isCollapsed = trackSettings[fIdx].isCollapsed;
    tdTrack.className = 'p-2 pl-3 sticky left-0 z-10 bg-[#080808] group-hover:bg-[#111] border-r border-green-950 shadow-md font-mono text-xs';

    tdTrack.innerHTML = `
      <!-- 頂部第 1 行：三角形頂點 (收合按鈕 + 檔名 + 縮圖標籤 + 靜音鈕) -->
      <div class="flex items-center justify-between gap-1.5">
        <div class="flex items-center gap-1.5 min-w-0">
          <button class="row-collapse-btn text-neutral-500 hover:text-green-400 p-0.5 rounded transition shrink-0" data-file-idx="${fIdx}" title="點擊收合/展開此軌樂器與音高">
            <i data-lucide="${isCollapsed ? 'chevron-right' : 'chevron-down'}" class="w-3.5 h-3.5"></i>
          </button>
          <i data-lucide="file-code" class="w-3.5 h-3.5 text-green-500/70 shrink-0"></i>
          <span class="truncate font-semibold text-neutral-200 text-xs hover:text-green-300" title="${file}">${file}</span>
          ${isCollapsed ? `<span class="text-[9px] px-1.5 py-0.2 bg-green-950/60 border border-green-800/40 text-green-400 rounded shrink-0">${INSTRUMENT_TYPES[trackSettings[fIdx].instrument].name.split(' ')[0]} ${trackSettings[fIdx].note}</span>` : ''}
        </div>
        <button class="mute-btn shrink-0 text-[10px] px-2 py-0.5 rounded border transition ${trackSettings[fIdx].isMuted ? 'bg-red-950 text-red-400 border-red-800' : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'}" data-file-idx="${fIdx}">
          ${trackSettings[fIdx].isMuted ? 'Muted' : 'Mute'}
        </button>
      </div>

      <!-- 底部第 2 行：三角形底座 (左: 指派樂器，右: 音高選單) -->
      <div class="mt-1.5 pl-5 flex items-center gap-2 ${isCollapsed ? 'hidden' : ''}">
        <div class="flex-1">
          <select class="inst-select bg-neutral-900 border border-neutral-800 hover:border-green-600/50 text-[10px] text-green-400 rounded px-1.5 py-0.5 w-full focus:outline-none focus:border-green-500 cursor-pointer" data-file-idx="${fIdx}">
            ${Object.keys(INSTRUMENT_TYPES).map(k => `
              <option value="${k}" ${trackSettings[fIdx].instrument === k ? 'selected' : ''}>
                ${INSTRUMENT_TYPES[k].name}
              </option>
            `).join('')}
          </select>
        </div>
        <div class="w-20">
          <select class="note-select bg-neutral-900 border border-neutral-800 hover:border-green-600/50 text-[10px] text-green-300 font-bold rounded px-1 py-0.5 w-full focus:outline-none focus:border-green-500 text-center cursor-pointer" data-file-idx="${fIdx}">
            ${['C1','G1','C2','E2','G2','A2','C3','D3','E3','G3','A3','C4','D4','E4','G4','A4','C5','E5','G5'].map(n => `
              <option value="${n}" ${trackSettings[fIdx].note === n ? 'selected' : ''}>
                ${n}
              </option>
            `).join('')}
          </select>
        </div>
      </div>
    `;
    tr.appendChild(tdTrack);

    // 2. Matrix Steps Columns (Interactive Grid)
    commitsData.forEach((_, cIdx) => {
      const tdCell = document.createElement('td');
      tdCell.className = `p-1 text-center border-r border-green-950/40 commit-col-${cIdx} transition cursor-pointer select-none`;
      tdCell.id = `cell_${fIdx}_${cIdx}`;
      tdCell.dataset.fIdx = fIdx;
      tdCell.dataset.cIdx = cIdx;

      renderCellContent(tdCell, fIdx, cIdx);

      // Drag Events for Excel Selection & Note Painting
      tdCell.addEventListener('mousedown', (e) => {
        if (currentTool !== 'select' || e.button !== 0) return;
        isMouseDown = true;
        dragStartCell = { fIdx, cIdx };
        dragCurrentCell = { fIdx, cIdx };

        const cellData = gridMatrix[`${fIdx}_${cIdx}`];
        dragFillTargetState = !(cellData && cellData.active);

        toggleSingleCellState(fIdx, cIdx, dragFillTargetState);
        updateSelectionRange(dragStartCell, dragCurrentCell);
      });

      tdCell.addEventListener('mouseenter', () => {
        if (!isMouseDown || currentTool !== 'select') return;
        dragCurrentCell = { fIdx, cIdx };
        toggleSingleCellState(fIdx, cIdx, dragFillTargetState);
        updateSelectionRange(dragStartCell, dragCurrentCell);
      });

      tr.appendChild(tdCell);
    });

    tbody.appendChild(tr);
  });

  // Bind track setting events
  tbody.querySelectorAll('.inst-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const fIdx = parseInt(e.target.dataset.fileIdx);
      trackSettings[fIdx].instrument = e.target.value;
    });
  });

  tbody.querySelectorAll('.note-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const fIdx = parseInt(e.target.dataset.fileIdx);
      trackSettings[fIdx].note = e.target.value;
    });
  });

  tbody.querySelectorAll('.row-collapse-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const fIdx = parseInt(btn.dataset.fileIdx);
      trackSettings[fIdx].isCollapsed = !trackSettings[fIdx].isCollapsed;
      renderSequencerTable();
    });
  });

  tbody.querySelectorAll('.mute-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const fIdx = parseInt(btn.dataset.fileIdx);
      trackSettings[fIdx].isMuted = !trackSettings[fIdx].isMuted;
      renderSequencerTable();
    });
  });

  document.getElementById('matrixStats').textContent = `(${filesList.length} 檔案軌道, ${commitsData.length} 提交拍點)`;
  lucide.createIcons();
}

function renderCellContent(td, fIdx, cIdx) {
  const cellData = gridMatrix[`${fIdx}_${cIdx}`];
  const isSelected = selectedCells.has(`${fIdx}_${cIdx}`);

  if (isSelected) {
    td.classList.add('selection-box');
  } else {
    td.classList.remove('selection-box');
  }

  if (cellData && cellData.active) {
    let colorStyle = 'bg-green-500 text-black shadow-[0_0_8px_#22c55e]';
    if (cellData.type === 'A') colorStyle = 'bg-emerald-400 text-black shadow-[0_0_10px_#34d399]';
    if (cellData.type === 'D') colorStyle = 'bg-rose-600 text-white shadow-[0_0_8px_#e11d48]';

    td.innerHTML = `
      <div class="w-6 h-6 mx-auto rounded ${colorStyle} flex items-center justify-center font-black text-xs transition active:scale-90" title="異動行數: ${cellData.lines || 1}">
        o
      </div>
    `;
  } else {
    td.innerHTML = `
      <div class="w-6 h-6 mx-auto rounded bg-[#0a0a0a] border border-neutral-900 text-neutral-800 flex items-center justify-center text-xs hover:border-green-900/60 hover:text-green-600 transition">
        _
      </div>
    `;
  }
}

function toggleSingleCellState(fIdx, cIdx, targetState) {
  initAudio();
  if (!gridMatrix[`${fIdx}_${cIdx}`]) {
    gridMatrix[`${fIdx}_${cIdx}`] = { active: false, type: 'M', lines: 10 };
  }
  gridMatrix[`${fIdx}_${cIdx}`].active = targetState;
  if (targetState) {
    if (!gridMatrix[`${fIdx}_${cIdx}`].type) gridMatrix[`${fIdx}_${cIdx}`].type = 'M';
    playTrackSound(fIdx, 0.75);
  }
  const td = document.getElementById(`cell_${fIdx}_${cIdx}`);
  if (td) renderCellContent(td, fIdx, cIdx);
}

// Excel Range Selection Update
function updateSelectionRange(start, end) {
  selectedCells.clear();
  const minF = Math.min(start.fIdx, end.fIdx);
  const maxF = Math.max(start.fIdx, end.fIdx);
  const minC = Math.min(start.cIdx, end.cIdx);
  const maxC = Math.max(start.cIdx, end.cIdx);

  for (let f = minF; f <= maxF; f++) {
    for (let c = minC; c <= maxC; c++) {
      selectedCells.add(`${f}_${c}`);
    }
  }

  // Re-render visual selection
  document.querySelectorAll('#matrixTbody td[id^="cell_"]').forEach(td => {
    const f = parseInt(td.dataset.fIdx);
    const c = parseInt(td.dataset.cIdx);
    renderCellContent(td, f, c);
  });

  // Show Action Bar
  if (selectedCells.size > 1) {
    document.getElementById('selectionActionBar').classList.remove('hidden');
    document.getElementById('selectedCountText').textContent = `已選取 ${selectedCells.size} 格 (${maxF - minF + 1} 軌 × ${maxC - minC + 1} 拍)`;
  } else {
    document.getElementById('selectionActionBar').classList.add('hidden');
  }
}

function clearSelection() {
  selectedCells.clear();
  dragStartCell = null;
  dragCurrentCell = null;
  document.getElementById('selectionActionBar').classList.add('hidden');
  document.querySelectorAll('.selection-box').forEach(el => el.classList.remove('selection-box'));
}

function highlightStep(stepIdx) {
  document.querySelectorAll('.active-step').forEach(el => el.classList.remove('active-step'));
  document.querySelectorAll('.active-step-header').forEach(el => el.classList.remove('active-step-header'));

  document.querySelectorAll(`.commit-col-${stepIdx}`).forEach(el => {
    if (el.tagName === 'TH') {
      el.classList.add('active-step-header');
    } else {
      el.classList.add('active-step');
    }
  });

  const c = commitsData[stepIdx];
  if (c) {
    document.getElementById('activeCommitHash').textContent = c.hash;
    document.getElementById('activeCommitMsg').textContent = c.msg;
    document.getElementById('activeCommitAuthor').textContent = `作者: ${c.author}`;
    const activeFilesCount = Object.keys(c.changes).length;
    document.getElementById('activeCommitFiles').textContent = `異動: ${activeFilesCount} 檔`;
  }

  document.getElementById('currentStepText').textContent = `${stepIdx + 1} / ${totalSteps}`;
}
