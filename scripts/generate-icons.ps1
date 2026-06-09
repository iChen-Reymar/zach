Add-Type -AssemblyName System.Drawing

$iconsDir = Join-Path $PSScriptRoot "..\public\icons"
$sizes = @(192, 512)

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    $g.Clear([System.Drawing.Color]::FromArgb(74, 144, 226))

    $fontSize = [int]($size * 0.39)
    $font = New-Object System.Drawing.Font('Arial', $fontSize, [System.Drawing.FontStyle]::Bold)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = 'Center'
    $sf.LineAlignment = 'Center'

    $rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
    $g.DrawString('I', $font, [System.Drawing.Brushes]::White, $rect, $sf)

    $path = Join-Path $iconsDir ("icon-{0}x{0}.png" -f $size)
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $bmp.Dispose()
    $font.Dispose()

    Write-Host "Created $path"
}
