param(
    [Parameter(Mandatory = $true)]
    [string]$PresentationPath,

    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[0-9a-f]{40}$')]
    [string]$CommitHash
)

$ErrorActionPreference = 'Stop'
$pptPath = [IO.Path]::GetFullPath($PresentationPath)
$pdfPath = [IO.Path]::ChangeExtension($pptPath, '.pdf')
$newUrl = "https://github.com/stulss/plan-do-see-diary/commits/$CommitHash/"
$powerPoint = $null
$presentation = $null
$replaced = 0
$found = 0

try {
    # 사용자가 고친 디자인은 건드리지 않고, 텍스트 상자의 기존 고정 URL만 바꾼다.
    $powerPoint = New-Object -ComObject PowerPoint.Application
    $presentation = $powerPoint.Presentations.Open($pptPath, $false, $false, $false)

    foreach ($slide in $presentation.Slides) {
        foreach ($shape in $slide.Shapes) {
            if ($shape.HasTextFrame -ne -1 -or $shape.TextFrame.HasText -ne -1) {
                continue
            }

            $text = $shape.TextFrame.TextRange.Text
            if ($text -match 'https://github\.com/stulss/plan-do-see-diary/commits/[0-9a-f]{40}/') {
                $found++
            }
            $updated = $text -replace 'https://github\.com/stulss/plan-do-see-diary/commits/[0-9a-f]{40}/', $newUrl
            if ($updated -ne $text) {
                $shape.TextFrame.TextRange.Text = $updated
                $replaced++
            }
        }
    }

    if ($found -eq 0) {
        throw 'PPT에서 교체할 40자리 고정 URL을 찾지 못했습니다.'
    }

    # PDF도 PPT와 같은 최신 내용을 보도록 한 번에 다시 내보낸다.
    $presentation.Save()
    $presentation.SaveAs($pdfPath, 32)
    Write-Output "UPDATED_REPORT_URL=$newUrl"
    Write-Output "REPLACED_TEXT_BOXES=$replaced"
}
finally {
    if ($null -ne $presentation) { $presentation.Close() }
    if ($null -ne $powerPoint) { $powerPoint.Quit() }
    if ($null -ne $presentation) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($presentation) }
    if ($null -ne $powerPoint) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($powerPoint) }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}
