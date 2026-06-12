Add-Type -AssemblyName System.Drawing

$iconsDir = Join-Path $PSScriptRoot "..\public\icons"
$sizes = @(192, 512)

function Draw-RoundedRect($g, $brush, $x, $y, $w, $h, $radius) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc($x, $y, $radius * 2, $radius * 2, 180, 90)
    $path.AddArc($x + $w - $radius * 2, $y, $radius * 2, $radius * 2, 270, 90)
    $path.AddArc($x + $w - $radius * 2, $y + $h - $radius * 2, $radius * 2, $radius * 2, 0, 90)
    $path.AddArc($x, $y + $h - $radius * 2, $radius * 2, $radius * 2, 90, 90)
    $path.CloseFigure()
    $g.FillPath($brush, $path)
    $path.Dispose()
}

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    $g.Clear([System.Drawing.Color]::FromArgb(74, 144, 226))

    $s = $size / 512.0
    $white = [System.Drawing.Brushes]::White
    $blue = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(74, 144, 226), [Math]::Max(2, 8 * $s))
    $bluePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(74, 144, 226), [Math]::Max(2, 10 * $s))
    $bluePen.EndCap = 'Round'
    $bluePen.StartCap = 'Round'

    # Bottom box
    Draw-RoundedRect $g $white (96 * $s) (280 * $s) (152 * $s) (128 * $s) (16 * $s)
    $g.DrawLine($blue, (96 * $s), (328 * $s), (248 * $s), (328 * $s))
    $g.DrawLine($bluePen, (120 * $s), (356 * $s), (200 * $s), (356 * $s))
    $g.DrawLine($bluePen, (120 * $s), (382 * $s), (176 * $s), (382 * $s))

    # Middle box
    Draw-RoundedRect $g $white (180 * $s) (196 * $s) (152 * $s) (128 * $s) (16 * $s)
    $g.DrawLine($blue, (180 * $s), (244 * $s), (332 * $s), (244 * $s))
    $g.DrawLine($bluePen, (256 * $s), (196 * $s), (256 * $s), (244 * $s))
    $g.DrawLine($bluePen, (212 * $s), (220 * $s), (300 * $s), (220 * $s))

    # Top box
    Draw-RoundedRect $g $white (264 * $s) (112 * $s) (152 * $s) (128 * $s) (16 * $s)
    $g.DrawLine($blue, (264 * $s), (160 * $s), (416 * $s), (160 * $s))
    $lightBlue = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(38, 74, 144, 226))
    Draw-RoundedRect $g $lightBlue (304 * $s) (188 * $s) (72 * $s) (36 * $s) (6 * $s)
    $g.DrawLine($bluePen, (312 * $s), (206 * $s), (368 * $s), (206 * $s))
    $g.DrawLine($bluePen, (312 * $s), (218 * $s), (352 * $s), (218 * $s))

    $path = Join-Path $iconsDir ("icon-{0}x{0}.png" -f $size)
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $bmp.Dispose()
    $blue.Dispose()
    $bluePen.Dispose()
    $lightBlue.Dispose()

    Write-Host "Created $path"
}
