Add-Type -AssemblyName System.Drawing

$iconsDir = Join-Path $PSScriptRoot "..\public\icons"
$buildDir = Join-Path $PSScriptRoot "..\build"
$logoPath = Join-Path $iconsDir "logo.png"

if (-not (Test-Path $logoPath)) {
    Write-Error "logo.png not found at $logoPath"
    exit 1
}

New-Item -ItemType Directory -Force -Path $buildDir | Out-Null

function New-SquareIcon($size) {
    $source = [System.Drawing.Image]::FromFile((Resolve-Path $logoPath))
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::White)
    $g.SmoothingMode = 'HighQuality'
    $g.InterpolationMode = 'HighQualityBicubic'

    $padding = [int]($size * 0.08)
    $maxW = $size - ($padding * 2)
    $maxH = $size - ($padding * 2)
    $ratio = [Math]::Min($maxW / $source.Width, $maxH / $source.Height)
    $drawW = [int]($source.Width * $ratio)
    $drawH = [int]($source.Height * $ratio)
    $x = [int](($size - $drawW) / 2)
    $y = [int](($size - $drawH) / 2)

    $g.DrawImage($source, $x, $y, $drawW, $drawH)

    $outPath = Join-Path $iconsDir ("icon-{0}x{0}.png" -f $size)
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $bmp.Dispose()
    $source.Dispose()

    Write-Host "Created $outPath"
}

foreach ($size in @(16, 24, 32, 48, 64, 128, 192, 256, 512)) {
    New-SquareIcon $size
}

foreach ($size in @(16, 24, 32, 48, 64, 128, 256)) {
    $source = Join-Path $iconsDir ("icon-{0}x{0}.png" -f $size)
    $target = Join-Path $buildDir ("icon-{0}x{0}.png" -f $size)
    Copy-Item $source $target -Force
}

Write-Host "Icon PNG sizes ready in public/icons and build/"
