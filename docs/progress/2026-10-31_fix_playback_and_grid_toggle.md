# 專案開發進度記錄

- **紀錄時間**：2026-10-31
- **當前目標與背景**：修復步進音序器在瀏覽器中「無法播放」與「無法點擊/拖曳設定音階格子」之致命核心問題，恢復即時音訊播放與視覺互動矩陣。
- **已完成事項清單**：
  - [x] **音訊引擎節點連接架構修復**：排除自製 Convolver 空間效果將原生 Web Audio `GainNode` 誤連至 Tone.js 非原生節點 `Volume` 所導致的 `A value with the given key could not be found` 致命異常；全面改採 Tone.js 原生免 Worklet 演算法混響 `Tone.Freeverb`，支援動態調校 `wet.value`。
  - [x] **免 Worklet 小鼓輸出修復**：修正自製 Web Audio 雜訊小鼓合成器的連線目標為原生的 `(context.rawContext || context).destination`，確保原生音訊流正確直接導向硬體輸出。
  - [x] **音階格子互動與音訊狀態喚醒**：在單元格切換（`toggleSingleCellState`）及音高/樂器下拉調整時，加入 `Tone.context.state !== 'running'` 判定並自動觸發 `resume()`，確保使用者手勢操作時即時解鎖瀏覽器 Autoplay 限制。
  - [x] **矩陣框選塗抹效能優化**：重構 `updateSelectionRange`，改以高效率 `classList.toggle('selection-box')` 取代原先全表格單元格 `renderCellContent` 之 DOM innerHTML 頻繁重繪，大幅提升大專案拖曳塗抹順暢度。
  - [x] **離線音訊匯出同步升級**：同步更新 `exporter.js` 之離線高速渲染邏輯，統一音色混響管線，確保 WAV / MP3 匯出穩定無阻。
- **待辦事項 / 已知問題**：
  - [ ] 持續觀察在不同瀏覽器環境下的大型 Repository（超過 100+ Commit）效能表現。
- **核心檔案對照表**：
  - `js/audio.js`：核心音訊合成引擎，提供 PolySynth、MembraneSynth、MetalSynth 與 Freeverb 效果器初始化與拍點發聲調度。
  - `js/ui.js`：步進矩陣 UI 與互動控制器，處理音階格子切換、Excel 式拖曳選取與軌道音高設定。
  - `js/exporter.js`：背景離線音訊渲染與 WAV/MP3 格式編碼匯出器。
