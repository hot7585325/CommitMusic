// ==========================================
// GitMusic - Global App State
// ==========================================

// Playback & Timing State
let isPlaying = false;
let currentStep = 0;
let totalSteps = 0;
let stepEventId = null;
let timingMode = 'bpm'; // 'bpm' or 'duration'
let currentTool = 'select'; // 'select' (Excel drag) or 'pan' (canvas drag)

// Excel Drag & Selection State
let isMouseDown = false;
let dragStartCell = null; // { fIdx, cIdx }
let dragCurrentCell = null;
let selectedCells = new Set(); // Set of "fIdx_cIdx"
let dragFillTargetState = null; // Boolean or null

// Canvas Pan (Hand tool drag) State
let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let scrollStartLeft = 0;
let scrollStartTop = 0;

// Sequencer Dataset & Settings
let commitsData = [];
let filesList = [];
let gridMatrix = {};
let trackSettings = [];

// Tone.js Synths Setup Container
let synths = {
  leadSynth: null,
  bassSynth: null,
  kickSynth: null,
  snareSynth: null,
  hihatSynth: null,
  reverb: null
};
