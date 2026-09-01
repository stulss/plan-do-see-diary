param(
    [Parameter(Mandatory = $true)]
    [string]$PresentationPath
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$fullPath = [IO.Path]::GetFullPath($PresentationPath)
$root = Split-Path -Parent $PSScriptRoot
$evidence = Join-Path $root 'docs\evidence'
$powerPoint = $null
$presentation = $null

# 슬라이드 번호, 그림 순서, 새 파일, 그림을 넣을 카드 영역(인치)을 한곳에서 관리한다.
$replacements = @(
    @{ Slide = 4; Index = 1; File = '06_C34-C35_C78-C82_planner_public_notice.png'; X = 0.76; Y = 1.96; W = 3.84; H = 4.43 },
    @{ Slide = 5; Index = 1; File = '01_C04-C08_plan_revision.png'; X = 0.63; Y = 1.94; W = 3.76; H = 4.43 },
    @{ Slide = 5; Index = 2; File = '02_C09-C22_tasks_completion_sort.png'; X = 4.78; Y = 1.94; W = 3.76; H = 4.43 },
    @{ Slide = 5; Index = 3; File = '03_C23-C27_run_log.png'; X = 8.93; Y = 1.94; W = 3.76; H = 4.43 },
    @{ Slide = 6; Index = 1; File = '04_C28-C33_C83_review_metrics.png'; X = 0.76; Y = 1.96; W = 3.89; H = 4.43 },
    @{ Slide = 6; Index = 2; File = '05_C83_metric_evidence_list.png'; X = 5.03; Y = 1.96; W = 3.89; H = 4.43 },
    @{ Slide = 8; Index = 1; File = '07_C57_script_text_safe.png'; X = 0.78; Y = 1.98; W = 3.74; H = 4.33 },
    @{ Slide = 18; Index = 1; File = '01_C04-C08_plan_revision.png'; X = 0.65; Y = 1.58; W = 12.03; H = 5.25 },
    @{ Slide = 19; Index = 1; File = '02_C09-C22_tasks_completion_sort.png'; X = 0.65; Y = 1.58; W = 12.03; H = 5.25 },
    @{ Slide = 20; Index = 1; File = '03_C23-C27_run_log.png'; X = 0.65; Y = 1.58; W = 12.03; H = 5.25 },
    @{ Slide = 21; Index = 1; File = '04_C28-C33_C83_review_metrics.png'; X = 0.65; Y = 1.58; W = 12.03; H = 5.25 },
    @{ Slide = 22; Index = 1; File = '05_C83_metric_evidence_list.png'; X = 0.65; Y = 1.58; W = 12.03; H = 5.25 },
    @{ Slide = 23; Index = 1; File = '06_C34-C35_C78-C82_planner_public_notice.png'; X = 0.65; Y = 1.58; W = 12.03; H = 5.25 },
    @{ Slide = 24; Index = 1; File = '07_C57_script_text_safe.png'; X = 0.65; Y = 1.58; W = 12.03; H = 5.25 }
)

try {
    $powerPoint = New-Object -ComObject PowerPoint.Application
    $presentation = $powerPoint.Presentations.Open($fullPath, $false, $false, $false)

    foreach ($item in $replacements) {
        $slide = $presentation.Slides.Item($item.Slide)
        # 앞 그림을 교체해도 COM 내부 순번이 바뀔 수 있어 목표 카드와 가장 가까운 그림을 찾는다.
        $pictures = @($slide.Shapes | Where-Object { $_.Type -eq 13 })
        $old = $pictures | Sort-Object { [Math]::Abs(($_.Left / 72) - $item.X) } | Select-Object -First 1
        $old.Delete()

        $imagePath = [IO.Path]::GetFullPath((Join-Path $evidence $item.File))
        $image = [System.Drawing.Image]::FromFile($imagePath)
        try { $ratio = $image.Width / $image.Height } finally { $image.Dispose() }

        # 데스크톱 캡처의 비율을 유지하면서 기존 카드 안 중앙에 배치한다.
        $width = $item.W
        $height = $width / $ratio
        if ($height -gt $item.H) {
            $height = $item.H
            $width = $height * $ratio
        }
        $left = ($item.X + (($item.W - $width) / 2)) * 72
        $top = ($item.Y + (($item.H - $height) / 2)) * 72
        [void]$slide.Shapes.AddPicture($imagePath, 0, -1, $left, $top, $width * 72, $height * 72)
    }

    $presentation.Save()
    Write-Output "REPLACED_PC_EVIDENCE=$($replacements.Count)"
}
finally {
    if ($null -ne $presentation) { $presentation.Close() }
    if ($null -ne $powerPoint) { $powerPoint.Quit() }
    if ($null -ne $presentation) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($presentation) }
    if ($null -ne $powerPoint) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($powerPoint) }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}
