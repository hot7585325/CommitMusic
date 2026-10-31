$port = 5055
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
} catch {
    Write-Host "Port $port error: $_"
    exit 1
}

$gitExe = "git"
$forkGit = "C:\Users\lingo\AppData\Local\Fork\gitInstance\2.50.1\cmd\git.exe"
if (Test-Path $forkGit) {
    $gitExe = $forkGit
}

Write-Host "GitMusic server running at http://localhost:$port"

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")

        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        $rawUrl = $request.Url.LocalPath

        if ($rawUrl -eq "/api/git-log") {
            $repoPath = $request.QueryString["path"]
            if ([string]::IsNullOrWhiteSpace($repoPath)) {
                $repoPath = (Get-Location).Path
            }

            if (Test-Path $repoPath) {
                $repoPath = (Resolve-Path $repoPath).Path
            }

            $tempOut = Join-Path ([System.IO.Path]::GetTempPath()) "gitmusic_log.txt"
            & $gitExe -C $repoPath log --reverse --pretty=format:"COMMIT:%h|%an|%s" --numstat | Set-Content -Path $tempOut -Encoding UTF8

            if (Test-Path $tempOut) {
                $content = [System.IO.File]::ReadAllText($tempOut, [System.Text.Encoding]::UTF8)
                Remove-Item $tempOut -Force -ErrorAction SilentlyContinue

                $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
                $response.ContentType = "text/plain; charset=utf-8"
                $response.ContentLength64 = $buffer.Length
                $response.StatusCode = 200
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            } else {
                $response.StatusCode = 400
            }
            $response.Close()
            continue
        }

        $filePath = "index.html"
        if ($rawUrl -ne "/" -and $rawUrl.Length -gt 1) {
            $subPath = $rawUrl.Substring(1).Replace('/', '\')
            if (Test-Path $subPath) {
                $filePath = $subPath
            }
        }

        if (Test-Path $filePath) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            if ($filePath.EndsWith(".html")) { $response.ContentType = "text/html; charset=utf-8" }
            elseif ($filePath.EndsWith(".js")) { $response.ContentType = "application/javascript" }
            elseif ($filePath.EndsWith(".css")) { $response.ContentType = "text/css" }
            elseif ($filePath.EndsWith(".txt")) { $response.ContentType = "text/plain; charset=utf-8" }
            else { $response.ContentType = "application/octet-stream" }

            $response.ContentLength64 = $bytes.Length
            $response.StatusCode = 200
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.Close()
    } catch {
        # continue loop
    }
}
