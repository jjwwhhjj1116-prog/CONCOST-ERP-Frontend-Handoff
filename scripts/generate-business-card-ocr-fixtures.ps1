$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$scriptDirectory = if ($PSScriptRoot) { $PSScriptRoot } else { Join-Path (Get-Location) 'scripts' }
$outputDirectory = Join-Path $scriptDirectory '..\public\demo\business-cards'
[System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null

function New-BusinessCardFixture {
  param(
    [Parameter(Mandatory = $true)][string]$FileName,
    [Parameter(Mandatory = $true)][string]$Heading,
    [Parameter(Mandatory = $true)][string[]]$Lines,
    [Parameter(Mandatory = $true)][System.Drawing.Color]$Accent
  )

  $bitmap = New-Object System.Drawing.Bitmap 1600, 950
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $graphics.Clear([System.Drawing.Color]::White)

  $accentBrush = New-Object System.Drawing.SolidBrush $Accent
  $textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(15, 23, 42))
  $mutedBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(71, 85, 105))
  $headingFont = New-Object System.Drawing.Font 'Malgun Gothic', 27, ([System.Drawing.FontStyle]::Bold)
  $primaryFont = New-Object System.Drawing.Font 'Malgun Gothic', 34, ([System.Drawing.FontStyle]::Bold)
  $identityFont = New-Object System.Drawing.Font 'Malgun Gothic', 28, ([System.Drawing.FontStyle]::Bold)
  $bodyFont = New-Object System.Drawing.Font 'Malgun Gothic', 25, ([System.Drawing.FontStyle]::Regular)

  try {
    $graphics.FillRectangle($accentBrush, 0, 0, 44, 950)
    $graphics.DrawString($Heading, $headingFont, $accentBrush, 104, 70)
    $pen = New-Object System.Drawing.Pen $Accent, 3
    try {
      $graphics.DrawLine($pen, 104, 144, 1490, 144)
    }
    finally {
      $pen.Dispose()
    }

    for ($index = 0; $index -lt $Lines.Count; $index += 1) {
      $font = if ($index -eq 0) { $primaryFont } elseif ($index -le 3) { $identityFont } else { $bodyFont }
      $brush = if ($index -le 1) { $textBrush } else { $mutedBrush }
      $graphics.DrawString($Lines[$index], $font, $brush, 104, (180 + ($index * 68)))
    }

    $path = Join-Path $outputDirectory $FileName
    $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally {
    $headingFont.Dispose()
    $primaryFont.Dispose()
    $identityFont.Dispose()
    $bodyFont.Dispose()
    $accentBrush.Dispose()
    $textBrush.Dispose()
    $mutedBrush.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

$korean = @{
  FileName = 'business-card-ko.png'
  Heading = 'SYNTHETIC DEMO BUSINESS CARD · KOREAN'
  Accent = [System.Drawing.Color]::FromArgb(234, 88, 12)
  Lines = @(
    '이름: 홍길동',
    '회사: DEMO 건설 주식회사',
    '부서: 기술본부',
    '직급: 부장',
    '휴대전화: 010-1234-5678',
    '전화: 02-1234-5678',
    '팩스: 02-1234-5679',
    '이메일: hong.gildong@example.invalid',
    '홈페이지: www.demo-construction.example',
    '주소: 서울특별시 중구 테스트로 10'
  )
}
New-BusinessCardFixture @korean

$english = @{
  FileName = 'business-card-en.png'
  Heading = 'SYNTHETIC DEMO BUSINESS CARD · ENGLISH'
  Accent = [System.Drawing.Color]::FromArgb(2, 132, 199)
  Lines = @(
    'Name: ALEX DEMO',
    'Company: DEMO ENGINEERING CO., LTD.',
    'Department: Project Controls',
    'Position: Senior Manager',
    'Mobile: +1 202-555-0142',
    'Tel: +1 202-555-0143',
    'Fax: +1 202-555-0144',
    'Email: alex.demo@example.invalid',
    'Website: www.demo-engineering.example',
    'Address: 100 Example Road, Demo City'
  )
}
New-BusinessCardFixture @english

$vietnamese = @{
  FileName = 'business-card-vi.png'
  Heading = 'SYNTHETIC DEMO BUSINESS CARD · VIETNAMESE'
  Accent = [System.Drawing.Color]::FromArgb(5, 150, 105)
  Lines = @(
    'Họ tên: NGUYEN VAN DEMO',
    'Công ty: DEMO VIETNAM JSC',
    'Phòng: Dự án',
    'Chức vụ: Project Manager',
    'Di động: +84 912 345 678',
    'Điện thoại: +84 24 1234 5678',
    'Fax: +84 24 1234 5679',
    'Email: demo.vn@example.invalid',
    'Website: www.demo-vietnam.example',
    'Địa chỉ: 10 Đường Mẫu, Quận 1, Thành phố Demo'
  )
}
New-BusinessCardFixture @vietnamese
