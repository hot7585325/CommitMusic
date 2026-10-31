param (
    [string]$RepoPath = "..\\QuickQrder",
    [string]$OutputFile = "gitlog.txt"
)

$gitExe = "C:\Users\lingo\AppData\Local\Fork\gitInstance\2.50.1\cmd\git.exe"
if (-not (Test-Path $gitExe)) {
    $gitExe = "git"
}

Write-Host "Extracting git log from $RepoPath..."
& $gitExe -C $RepoPath log --reverse --pretty=format:"COMMIT:%h|%an|%s" --numstat | Set-Content -Path $OutputFile -Encoding UTF8
Write-Host "Done! Exported to $OutputFile"
