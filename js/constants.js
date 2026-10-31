// ==========================================
// GitMusic - Constants & Presets
// ==========================================

const INSTRUMENT_TYPES = {
  lead: { name: '🎹 8-Bit Lead', type: 'synth', note: 'C4' },
  bass: { name: '🎸 Synth Bass', type: 'bass', note: 'C2' },
  arp: { name: '✨ Arpeggio', type: 'synth', note: 'E4' },
  kick: { name: '🥁 Kick Drum', type: 'kick', note: 'C1' },
  snare: { name: '💥 Snare Drum', type: 'snare', note: 'C2' },
  hihat: { name: '🎩 Hi-Hat', type: 'hihat', note: 'G4' },
  chime: { name: '🔔 8-Bit Coin', type: 'synth', note: 'A5' }
};

// Pentatonic scale
const MELODY_SCALE = ['C3', 'D3', 'E3', 'G3', 'A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'E5'];
const BASS_SCALE = ['C2', 'D2', 'E2', 'G2', 'A2', 'C3'];

// Default Sample Data
const SAMPLE_COMMITS = [
  { hash: 'a1b2c3', author: 'Alex', msg: 'init: Unity project architecture and player controller', changes: { 'PlayerController.cs': { type: 'A', lines: 65 }, 'README.md': { type: 'A', lines: 15 } } },
  { hash: 'd4e5f6', author: 'Alex', msg: 'feat: add player jump and ground check mechanics', changes: { 'PlayerController.cs': { type: 'M', lines: 28 }, 'GameManager.cs': { type: 'A', lines: 40 } } },
  { hash: '789abc', author: 'Sam', msg: 'feat: enemy basic patrol state machine', changes: { 'EnemyAI.cs': { type: 'A', lines: 85 }, 'AudioManager.cs': { type: 'A', lines: 32 } } },
  { hash: 'def012', author: 'Alex', msg: 'feat: combat system and health bars', changes: { 'PlayerController.cs': { type: 'M', lines: 30 }, 'CombatSystem.cs': { type: 'A', lines: 75 }, 'EnemyAI.cs': { type: 'M', lines: 22 } } },
  { hash: '345678', author: 'Sam', msg: 'feat: level 1 tilemap config and json data', changes: { 'LevelData.json': { type: 'A', lines: 120 }, 'GameManager.cs': { type: 'M', lines: 18 } } },
  { hash: '901234', author: 'Alex', msg: 'fix: jump velocity glitch and wall slide bug', changes: { 'PlayerController.cs': { type: 'M', lines: 12 }, 'CombatSystem.cs': { type: 'M', lines: 8 } } },
  { hash: '567890', author: 'Sam', msg: 'feat: add background music audio clip loader', changes: { 'AudioManager.cs': { type: 'M', lines: 45 }, 'LevelData.json': { type: 'M', lines: 20 } } },
  { hash: 'abcdef', author: 'Alex', msg: 'feat: boss phase 2 rage animation state', changes: { 'BossAI.cs': { type: 'A', lines: 98 }, 'CombatSystem.cs': { type: 'M', lines: 35 }, 'EnemyAI.cs': { type: 'M', lines: 14 } } },
  { hash: '112233', author: 'Sam', msg: 'refactor: clean up unused audio assets and docs', changes: { 'AudioManager.cs': { type: 'M', lines: 10 }, 'README.md': { type: 'M', lines: 25 }, 'TempDebug.cs': { type: 'D', lines: 30 } } },
  { hash: '445566', author: 'Alex', msg: 'feat: game over screen and restart loop', changes: { 'GameManager.cs': { type: 'M', lines: 52 }, 'PlayerController.cs': { type: 'M', lines: 15 } } },
  { hash: '778899', author: 'Sam', msg: 'tune: boss attack damage balance parameters', changes: { 'BossAI.cs': { type: 'M', lines: 24 }, 'LevelData.json': { type: 'M', lines: 16 } } },
  { hash: 'aabbcc', author: 'Alex', msg: 'v1.0.0-release: ready for steam game jam build', changes: { 'README.md': { type: 'M', lines: 40 }, 'GameManager.cs': { type: 'M', lines: 10 }, 'PlayerController.cs': { type: 'M', lines: 5 } } }
];
