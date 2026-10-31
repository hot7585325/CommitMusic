# 🎵 GitMusic (Git Commit 遊戲音樂步進編曲機)

將專案的 Git 提交歷史（Commit History）轉化為遊戲背景音樂（BGM）的矩陣步進音序器。

---

## 🌟 核心特點
1. **矩陣音序器表格 (Step Sequencer)**：
   * 第一欄為檔案名稱（支援 Mute 靜音、切換樂器與音高）。
   * 橫向為各個 Commit（`c1`, `c2`, `c3`...），以 `o`（有更動）與 `_`（休止符）呈現。
   * 點擊任意格子可即時微調音符與試聽。
2. **雙模式時長 / 節奏連動**：
   * **BPM 模式**：自由微調速度（60 ~ 240 BPM）與拍數（1/4 拍、1/2 拍、1 拍），系統即時推算總秒數。
   * **總時長模式**：直接設定「我想讓這首遊戲配樂播 15 秒 / 30 秒」，系統自動反推 BPM。
3. **專為遊戲設計的音色與防走音機制**：
   * 內建 **8-Bit 像素懷舊 (Chiptune)**、**賽博龐克合成器 (Synthwave)**、**溫馨小品 (Lo-Fi)** 風格。
   * 鎖定五聲音階（Pentatonic），不管同個 Commit 同時更動多少檔案，合奏絕不走音。
4. **一鍵無損匯出**：
   * 支援將演奏結果無損錄製並下載為 `.WAV` 遊戲音訊檔，直接放進 Unity、Godot 或 Unreal 當作遊戲配樂。

---

## 🚀 快速開始

### 方式一：直接雙擊開啟
1. 雙擊開啟專案目錄下的 [`index.html`](file:///d:/03-曾卓絢/Porject/GitMusic/index.html)。
2. 預設已載入模擬的遊戲開發專案（包含 `PlayerController.cs`、`BossAI.cs`、`LevelData.json` 等）。
3. 點擊 **「播放 BGM」** 即可享受專案提交音樂！

---

### 方式二：讀取真實專案的 Git 提交紀錄
專案內已準備好擷取腳本：

1. 開啟 PowerShell，執行擷取腳本：
   ```powershell
   # 範例：擷取旁邊的 QuickQrder 專案
   .\export_gitlog.ps1 -RepoPath "..\QuickQrder"
   ```
   或是直接在你要分析的任何 Git 專案執行：
   ```bash
   git log --reverse --pretty=format:"COMMIT:%h|%an|%s" --numstat > gitlog.txt
   ```
2. 打開 `index.html`，點擊右上角 **「匯入 Git Log 檔案」**，選取剛產生的 `gitlog.txt`。
3. 表格會立即重建為該專案的完整檔案 $\times$ 提交矩陣，按下播放即可聆聽該專案的演變歷程！

---

## 📁 檔案結構
* [`index.html`](file:///d:/03-曾卓絢/Porject/GitMusic/index.html)：單一檔案完整應用程式（含 Web Audio / Tone.js 合成器與 Tailwind 介面）。
* [`export_gitlog.ps1`](file:///d:/03-曾卓絢/Porject/GitMusic/export_gitlog.ps1)：Git Log 快速擷取工具（自動相容 Fork Git / 系統 Git）。
* [`SPECIFICATION.md`](file:///d:/03-曾卓絢/Porject/GitMusic/SPECIFICATION.md)：完整工具規格書、演算法與商業賣點分析。
* [`gitlog.txt`](file:///d:/03-曾卓絢/Porject/GitMusic/gitlog.txt)：已提取的實際專案範例數據。
