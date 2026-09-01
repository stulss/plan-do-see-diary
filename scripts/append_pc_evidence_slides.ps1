param(
    [Parameter(Mandatory = $true)]
    [string]$PresentationPath
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$fullPath = [IO.Path]::GetFullPath($PresentationPath)
$root = Split-Path -Parent $PSScriptRoot
$evidenceDir = Join-Path $root 'docs\evidence'
$powerPoint = $null
$presentation = $null

function Get-PptRgb([int]$Red, [int]$Green, [int]$Blue) {
    return $Red + ($Green -shl 8) + ($Blue -shl 16)
}

function Add-Text($slide, [string]$text, [double]$x, [double]$y, [double]$w, [double]$h, [double]$size, [int]$color, [bool]$bold = $false) {
    $shape = $slide.Shapes.AddTextbox(1, $x * 72, $y * 72, $w * 72, $h * 72)
    $shape.TextFrame.MarginLeft = 0
    $shape.TextFrame.MarginRight = 0
    $shape.TextFrame.MarginTop = 0
    $shape.TextFrame.MarginBottom = 0
    $shape.TextFrame.WordWrap = -1
    $shape.TextFrame.TextRange.Text = $text
    $shape.TextFrame.TextRange.Font.Name = '맑은 고딕'
    $shape.TextFrame.TextRange.Font.Size = $size
    $shape.TextFrame.TextRange.Font.Bold = if ($bold) { -1 } else { 0 }
    $shape.TextFrame.TextRange.Font.Color.RGB = $color
}

function Add-FittedPicture($slide, [string]$path, [double]$x, [double]$y, [double]$w, [double]$h) {
    $image = [System.Drawing.Image]::FromFile($path)
    try { $ratio = $image.Width / $image.Height } finally { $image.Dispose() }
    $width = $w
    $height = $width / $ratio
    if ($height -gt $h) {
        $height = $h
        $width = $height * $ratio
    }
    $left = ($x + (($w - $width) / 2)) * 72
    $top = ($y + (($h - $height) / 2)) * 72
    [void]$slide.Shapes.AddPicture($path, 0, -1, $left, $top, $width * 72, $height * 72)
}

$items = @(
    @{ File = '01_C04-C08_plan_revision.png'; Title = '계획과 수정 이력'; Codes = 'C04~C08'; Note = '기간·우선순위·예상 시간과 DB 트리거가 남긴 수정 이력' },
    @{ File = '02_C09-C22_tasks_completion_sort.png'; Title = '할 일·정렬·완료'; Codes = 'C09~C22'; Note = '할 일 5건, 검색·거르기·고정 정렬과 완료·되돌리기' },
    @{ File = '03_C23-C27_run_log.png'; Title = '실행 기록'; Codes = 'C23~C27'; Note = '시작·종료·실제 시간·막힌 이유가 할 일에 연결된 기록' },
    @{ File = '04_C28-C33_C83_review_metrics.png'; Title = '돌아보기 집계'; Codes = 'C28~C33 · C83'; Note = '계획·완료·지연·막힘·예상·실제 수치와 조회 기간' },
    @{ File = '05_C83_metric_evidence_list.png'; Title = '집계 근거 목록'; Codes = 'C83'; Note = '완료 수 1과 같은 조건으로 조회한 근거 목록 1건' },
    @{ File = '06_C34-C35_C78-C82_planner_public_notice.png'; Title = 'PC 플래너와 공개 안내'; Codes = 'C34~C35 · C78~C82'; Note = '실제 DB 자료, 날짜·분 단위, 플래너와 로그인 없는 공개 안내' },
    @{ File = '07_C57_script_text_safe.png'; Title = '스크립트 문자 안전 표시'; Codes = 'C57'; Note = '스크립트 모양 입력이 실행되지 않고 화면에 글자 그대로 표시' }
)

try {
    $powerPoint = New-Object -ComObject PowerPoint.Application
    $presentation = $powerPoint.Presentations.Open($fullPath, $false, $false, $false)

    # 같은 부록을 두 번 넣지 않도록 첫 제목을 확인한다.
    foreach ($slide in $presentation.Slides) {
        foreach ($shape in $slide.Shapes) {
            if ($shape.HasTextFrame -eq -1 -and $shape.TextFrame.HasText -eq -1 -and $shape.TextFrame.TextRange.Text -like '*PC 증거 1/7*') {
                throw 'PC 증거 부록이 이미 들어 있습니다.'
            }
        }
    }

    $ink = Get-PptRgb 23 55 47
    $green = Get-PptRgb 20 107 88
    $gray = Get-PptRgb 95 111 105
    $paper = Get-PptRgb 252 252 248
    $insertAt = $presentation.Slides.Count

    for ($i = 0; $i -lt $items.Count; $i++) {
        # 최종 제출 슬라이드는 맨 뒤에 남기고 그 앞에 증거 부록을 순서대로 삽입한다.
        $slide = $presentation.Slides.Add($insertAt + $i, 12)
        $slide.FollowMasterBackground = 0
        $slide.Background.Fill.ForeColor.RGB = $paper
        Add-Text $slide "PC 증거 $($i + 1)/7 · $($items[$i].Codes)" 0.65 0.38 4.0 0.28 11 $green $true
        Add-Text $slide $items[$i].Title 0.65 0.72 8.8 0.48 25 $ink $true
        Add-Text $slide $items[$i].Note 0.65 1.18 11.8 0.32 11 $gray $false
        Add-FittedPicture $slide ([IO.Path]::GetFullPath((Join-Path $evidenceDir $items[$i].File))) 0.65 1.58 12.03 5.25
        Add-Text $slide '1920×1080 PC 데스크톱 기준 · 2026-09-01' 8.55 7.05 4.1 0.2 8 $gray $false
    }

    $presentation.Save()
    Write-Output "APPENDED_PC_EVIDENCE_SLIDES=$($presentation.Slides.Count)"
}
finally {
    if ($null -ne $presentation) { $presentation.Close() }
    if ($null -ne $powerPoint) { $powerPoint.Quit() }
    if ($null -ne $presentation) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($presentation) }
    if ($null -ne $powerPoint) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($powerPoint) }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}
