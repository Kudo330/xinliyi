Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$publicDir = Join-Path $projectRoot 'public'

$assets = @(
  @{
    Input = Join-Path $publicDir 'samoyed-avatar.png'
    Output = Join-Path $publicDir 'samoyed-avatar-cutout.png'
  },
  @{
    Input = Join-Path $publicDir 'golden-cat-avatar.png'
    Output = Join-Path $publicDir 'golden-cat-avatar-cutout.png'
  }
)

foreach ($asset in $assets) {
  $bytes = [System.IO.File]::ReadAllBytes($asset.Input)
  $memoryStream = New-Object System.IO.MemoryStream(,$bytes)
  $source = [System.Drawing.Bitmap]::FromStream($memoryStream)
  $bitmap = New-Object System.Drawing.Bitmap $source
  try {
    for ($x = 0; $x -lt $bitmap.Width; $x++) {
      for ($y = 0; $y -lt $bitmap.Height; $y++) {
        $pixel = $bitmap.GetPixel($x, $y)
        $brightness = ($pixel.R + $pixel.G + $pixel.B) / 3

        if ($brightness -ge 250 -and $pixel.R -ge 245 -and $pixel.G -ge 245 -and $pixel.B -ge 245) {
          $bitmap.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, $pixel.R, $pixel.G, $pixel.B))
        } elseif ($brightness -ge 238 -and $pixel.R -ge 228 -and $pixel.G -ge 228 -and $pixel.B -ge 228) {
          $alpha = [Math]::Max(0, [int](255 - (($brightness - 238) * 14)))
          $bitmap.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $pixel.R, $pixel.G, $pixel.B))
        }
      }
    }
  } finally {
    $source.Dispose()
    $memoryStream.Dispose()
  }

  try {
    $outputStream = New-Object System.IO.FileStream($asset.Output, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write)
    try {
      $bitmap.Save($outputStream, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $outputStream.Dispose()
    }
  } finally {
    $bitmap.Dispose()
  }
}

Write-Output 'Avatar assets prepared.'
