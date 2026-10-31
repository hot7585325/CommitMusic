# 🎵 GitMusic (Git Commit 遊戲音樂步進編曲機)

> **黑客終端風格（黑底 ✕ 螢光綠）✕ 專案 Commit 步進音序器 ✕ 遊戲 BGM 生成器**

將專案的 Git 提交歷史（Commit History）轉化為遊戲背景音樂（BGM）的矩陣步進音序器。

---

## 🌟 核心功能與特色

### 1. 矩陣音序器表格 (Step Sequencer)
* **直覺矩陣視圖**：第一欄固定為檔案名稱（可獨立 Mute 靜音、指派不同樂器與音高），橫向為各個 Commit（`c1`, `c2`, `c3`...），修改標註為 `o`（新增 `A`、修改 `M`、刪除 `D`），未變更為 `_`。
* **類似 Excel 的拖曳互動操作**：
  * **框選 / 刷填模式**：按住滑鼠拖曳可連續塗抹或消除音符，拖曳後更提供「批次填滿」與「批次清除」功能，讓編曲與修整拍點如試算表般快速順手。
  * **平移畫布模式 (Hand Tool)**：支援點選小手工具任意拖動畫布，順暢瀏覽超長 Commit 歷程。

### 2. 賽博龐克風格視覺 (Cyberpunk Neon Green)
* 採用純黑背景搭配高對比螢光綠（Neon Green）點綴，模擬駭客終端矩陣感。
* 具備垂直螢光綠發光掃描線（Playhead），實時同步當前提交的作者、異動檔案數與 Commit 訊息。

### 3. 雙模式時長 / 節奏雙向換算
* **BPM 節奏模式**：自由調整演奏速度（60 ~ 240 BPM）與拍數（1/4 拍、1/2 拍、1 拍），系統即時推算總演奏時長。
* **總時長模式 (秒)**：可直接指定「想要生成幾秒的遊戲配樂」，系統自動反推最佳 BPM 與量化設定。

### 4. 專為遊戲設計的音色與防走音機制
* 內建 **👾 8-Bit 像素懷舊 (Chiptune)**、**🌆 賽博龐克合成器 (Synthwave)**、**☕ 溫馨小品 (Lo-Fi)** 三種遊戲音色風格。
* 採用五聲音階（Pentatonic Scale）保護演算法，無論同時有多少檔案在同一拍被觸發，合奏絕不產生半音衝突，隨時維持良好聽感。

### 5. 一鍵無損音訊匯出
* 支援即時錄音並直接匯出 `.WAV` 遊戲音訊檔，免轉檔即可放入 Unity、Godot、Unreal 等遊戲引擎使用。

---

## 🚀 快速開始

### 方式一：直接雙擊開啟
1. 雙擊開啟目錄下的 [`index.html`](file:///d:/03-曾卓絢/Porject/GitMusic/index.html)。
2. 預設已載入模擬的遊戲開發專案。
3. 點擊 **「PLAY BGM」** 即可享受專案提交音樂！

---

### 方式二：讀取真實專案的 Git 提交紀錄
1. 執行擷取腳本：
   ```powershell
   # 範例：擷取鄰近的專案
   .\export_gitlog.ps1 -RepoPath "..\QuickQrder"
   ```
   或直接在任一 Git 專案執行：
   ```bash
   git log --reverse --pretty=format:"COMMIT:%h|%an|%s" --numstat > gitlog.txt
   ```
2. 打開 `index.html`，點擊右上角 **「匯入 Git Log」** 選取 `gitlog.txt`。
3. 表格立即重建為該專案的完整矩陣，開始演奏該專案的開發音樂！

---

## 📁 檔案結構
* [`index.html`](file:///d:/03-曾卓絢/Porject/GitMusic/index.html)：單一檔案完整應用程式（Tone.js 合成器、Tailwind CSS、Excel 式拖曳矩陣）。
* [`export_gitlog.ps1`](file:///d:/03-曾卓絢/Porject/GitMusic/export_gitlog.ps1)：Git Log 快速擷取腳本。
* [`SPECIFICATION.md`](file:///d:/03-曾卓絢/Porject/GitMusic/SPECIFICATION.md)：詳細技術規格書、架構圖、演算法設計與遊戲配樂市場分析。
* [`gitlog.txt`](file:///d:/03-曾卓絢/Porject/GitMusic/gitlog.txt)：已提取的實際專案 Commit 數據範例。
