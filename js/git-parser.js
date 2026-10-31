// ==========================================
// GitMusic - Git Log Parser & Fetcher
// ==========================================

function parseGitLogText(text) {
  const lines = text.split(/\r?\n/);
  const parsedCommits = [];
  let currentCommit = null;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    if (line.startsWith('COMMIT:')) {
      if (currentCommit) parsedCommits.push(currentCommit);
      const parts = line.substring(7).split('|');
      currentCommit = {
        hash: parts[0] || 'head',
        author: parts[1] || 'Unknown',
        msg: parts[2] || 'Update',
        changes: {}
      };
    } else if (currentCommit) {
      const parts = line.split(/\s+/);
      if (parts.length >= 3) {
        const added = parseInt(parts[0]) || 0;
        const deleted = parseInt(parts[1]) || 0;
        const filePath = parts.slice(2).join(' ');
        const totalLines = added + deleted;
        let type = 'M';
        if (deleted === 0 && added > 0) type = 'A';
        if (added === 0 && deleted > 0) type = 'D';

        currentCommit.changes[filePath] = {
          type: type,
          lines: totalLines
        };
      }
    }
  }

  if (currentCommit) parsedCommits.push(currentCommit);
  return parsedCommits;
}

// One-click Local Git Path Fetcher
async function fetchLocalGitLog(path) {
  const btn = document.getElementById('btnFetchRepo');
  const originalHtml = btn.innerHTML;
  btn.innerHTML = `<span class="animate-spin mr-1">⏳</span> 讀取中...`;
  btn.disabled = true;

  try {
    const targetUrl = `http://localhost:5055/api/git-log?path=${encodeURIComponent(path)}`;
    const res = await fetch(targetUrl);
    if (!res.ok) {
      throw new Error(await res.text());
    }
    const text = await res.text();
    const commits = parseGitLogText(text);
    if (!commits || commits.length === 0) {
      alert('未能解析出提交紀錄，請確認該路徑下是否有有效的 Git Commit！');
      return;
    }
    loadDataset(commits);
  } catch (err) {
    console.error(err);
    alert(`無法連線到本地 Git 服務或路徑無效！\n\n提示：請確保已點擊專案目錄下的「start.bat」啟動本機伺服器。\n錯誤詳情: ${err.message}`);
  } finally {
    btn.innerHTML = originalHtml;
    btn.disabled = false;
    lucide.createIcons();
  }
}
