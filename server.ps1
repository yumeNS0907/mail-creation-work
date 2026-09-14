# メール作成ワークを同じWi-Fi上へ配信する簡易サーバー
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, 8765)
$listener.Start()
$contentTypes = @{
  '.html' = 'text/html; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'
  '.js' = 'text/javascript; charset=utf-8'
}

while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $stream = $client.GetStream()
    $reader = [System.IO.StreamReader]::new($stream)
    $requestLine = $reader.ReadLine()
    while ($reader.ReadLine() -ne '') { }
    $requestPath = if ($requestLine) { ($requestLine -split ' ')[1] } else { '/' }
    $relativePath = [System.Uri]::UnescapeDataString(($requestPath -split '\?')[0]).TrimStart('/')
    if ([string]::IsNullOrWhiteSpace($relativePath)) { $relativePath = 'index.html' }
    $filePath = Join-Path $root $relativePath

    if (Test-Path $filePath -PathType Leaf) {
      $content = [System.IO.File]::ReadAllBytes($filePath)
      $status = '200 OK'
      $type = $contentTypes[[System.IO.Path]::GetExtension($filePath)]
      if (-not $type) { $type = 'application/octet-stream' }
    } else {
      $content = [System.Text.Encoding]::UTF8.GetBytes('Not found')
      $status = '404 Not Found'
      $type = 'text/plain; charset=utf-8'
    }

    $header = "HTTP/1.1 $status`r`nContent-Type: $type`r`nContent-Length: $($content.Length)`r`nConnection: close`r`n`r`n"
    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
    $stream.Write($headerBytes, 0, $headerBytes.Length)
    $stream.Write($content, 0, $content.Length)
    $stream.Close()
  } finally {
    $client.Close()
  }
}
