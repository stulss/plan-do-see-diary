param(
  [Parameter(Mandatory = $true)]
  [string]$PresentationPath
)

$ErrorActionPreference = "Stop"

# PowerPoint COM의 색상 값은 R + G*256 + B*65536 순서로 만든다.
function Get-PptRgb([int]$Red, [int]$Green, [int]$Blue) {
  return $Red + ($Green -shl 8) + ($Blue -shl 16)
}

$Color = @{
  Ink   = Get-PptRgb 23 55 47
  Green = Get-PptRgb 20 107 88
  Gold  = Get-PptRgb 197 139 42
  Coral = Get-PptRgb 211 107 85
  Gray  = Get-PptRgb 95 111 105
  Line  = Get-PptRgb 216 226 221
  Paper = Get-PptRgb 252 252 248
  White = Get-PptRgb 255 255 255
  Mint  = Get-PptRgb 221 237 231
}
$Font = "맑은 고딕"

function Add-TextBox($Slide, [string]$Text, [double]$Left, [double]$Top, [double]$Width, [double]$Height, [double]$FontSize = 18, [int]$Color = $Color.Ink, [bool]$Bold = $false, [int]$Align = 1) {
  $shape = $Slide.Shapes.AddTextbox(1, $Left, $Top, $Width, $Height)
  $shape.TextFrame.MarginLeft = 0
  $shape.TextFrame.MarginRight = 0
  $shape.TextFrame.MarginTop = 0
  $shape.TextFrame.MarginBottom = 0
  $shape.TextFrame.WordWrap = -1
  $range = $shape.TextFrame.TextRange
  $range.Text = $Text
  $range.Font.Name = $Font
  $range.Font.Size = $FontSize
  $range.Font.Bold = if ($Bold) { -1 } else { 0 }
  $range.Font.Color.RGB = $Color
  $range.ParagraphFormat.Alignment = $Align
  return $shape
}

function Add-RoundedCard($Slide, [double]$Left, [double]$Top, [double]$Width, [double]$Height, [int]$Fill = $Color.White, [int]$Line = $Color.Line) {
  $shape = $Slide.Shapes.AddShape(5, $Left, $Top, $Width, $Height)
  $shape.Fill.ForeColor.RGB = $Fill
  $shape.Fill.Solid()
  $shape.Line.ForeColor.RGB = $Line
  $shape.Line.Weight = 0.75
  return $shape
}

function Add-Header($Slide, [string]$Eyebrow, [string]$Title, [string]$Subtitle, [string]$Page) {
  Add-TextBox $Slide $Eyebrow 45 28 300 18 8.5 $Color.Gold $true | Out-Null
  Add-TextBox $Slide $Title 45 58 830 48 25 $Color.Ink $true | Out-Null
  Add-TextBox $Slide $Subtitle 47 108 820 28 11 $Color.Gray $false | Out-Null
  Add-TextBox $Slide $Page 865 30 45 18 8.5 $Color.Green $true 3 | Out-Null
}

function Add-Footer($Slide) {
  $line = $Slide.Shapes.AddLine(45, 515, 915, 515)
  $line.Line.ForeColor.RGB = $Color.Line
  $line.Line.Weight = 0.75
  Add-TextBox $Slide "PLAN · DO · SEE" 45 520 180 14 7.5 $Color.Green $true | Out-Null
  Add-TextBox $Slide "2026.09.01" 820 520 95 14 7.5 $Color.Gray $false 3 | Out-Null
}

function Initialize-Slide($Slide) {
  $Slide.FollowMasterBackground = 0
  $Slide.Background.Fill.ForeColor.RGB = $Color.Paper
  $Slide.Background.Fill.Solid()
}

function Add-GuideCard($Slide, [string]$Number, [string]$Label, [string]$Body, [double]$Left, [double]$Top, [double]$Width, [double]$Height, [int]$Accent) {
  Add-RoundedCard $Slide $Left $Top $Width $Height | Out-Null
  $circle = $Slide.Shapes.AddShape(9, ($Left + 16), ($Top + 16), 34, 34)
  $circle.Fill.ForeColor.RGB = $Accent
  $circle.Fill.Solid()
  $circle.Line.Visible = 0
  Add-TextBox $Slide $Number ($Left + 16) ($Top + 21) 34 22 11 $Color.White $true 2 | Out-Null
  Add-TextBox $Slide $Label ($Left + 64) ($Top + 14) ($Width - 82) 24 13 $Accent $true | Out-Null
  Add-TextBox $Slide $Body ($Left + 64) ($Top + 42) ($Width - 82) ($Height - 52) 10.5 $Color.Ink $false | Out-Null
}

function Add-VerificationTable($Slide, $Rows) {
  $left = 45
  $top = 152
  $widths = @(105, 385, 325, 80)
  $headers = @("확인 항목", "절차", "통과 기준", "상태")
  $offset = $left
  for ($column = 0; $column -lt $headers.Count; $column++) {
    $cell = $Slide.Shapes.AddShape(1, $offset, $top, $widths[$column], 34)
    $cell.Fill.ForeColor.RGB = $Color.Ink
    $cell.Fill.Solid()
    $cell.Line.ForeColor.RGB = $Color.Ink
    Add-TextBox $Slide $headers[$column] ($offset + 7) ($top + 7) ($widths[$column] - 14) 20 9.5 $Color.White $true $(if ($column -eq 3) { 2 } else { 1 }) | Out-Null
    $offset += $widths[$column]
  }

  $rowHeight = 50
  for ($rowIndex = 0; $rowIndex -lt $Rows.Count; $rowIndex++) {
    $rowTop = $top + 34 + ($rowIndex * $rowHeight)
    $offset = $left
    for ($column = 0; $column -lt 4; $column++) {
      $fill = if (($rowIndex % 2) -eq 0) { $Color.White } else { Get-PptRgb 245 248 246 }
      $cell = $Slide.Shapes.AddShape(1, $offset, $rowTop, $widths[$column], $rowHeight)
      $cell.Fill.ForeColor.RGB = $fill
      $cell.Fill.Solid()
      $cell.Line.ForeColor.RGB = $Color.Line
      $cell.Line.Weight = 0.5
      $fontColor = if ($column -eq 3) { $Color.Green } else { $Color.Ink }
      Add-TextBox $Slide $Rows[$rowIndex][$column] ($offset + 7) ($rowTop + 7) ($widths[$column] - 14) ($rowHeight - 14) 8.7 $fontColor ($column -eq 0 -or $column -eq 3) $(if ($column -eq 3) { 2 } else { 1 }) | Out-Null
      $offset += $widths[$column]
    }
  }
}

$fullPath = (Resolve-Path $PresentationPath).Path
$powerPoint = $null
$presentation = $null

try {
  $powerPoint = New-Object -ComObject PowerPoint.Application
  $presentation = $powerPoint.Presentations.Open($fullPath, $false, $false, $false)

  # 사용자가 만든 마지막 제출 슬라이드는 맨 끝에 유지되도록 바로 앞(15번)에 세 장을 삽입한다.
  $guideSlide = $presentation.Slides.Add(15, 12)
  Initialize-Slide $guideSlide
  Add-Header $guideSlide "VERIFICATION GUIDE" "30초 안에 끝내는 확인" "제출용 확인 방법을 네 항목으로 분리했다." "15"
  Add-GuideCard $guideSlide "1" "어디로 가나요" "https://plan-do-see-diary.vercel.app`n로그인·가입 없이 첫 화면으로 이동" 45 155 420 120 $Color.Green
  Add-GuideCard $guideSlide "2" "세 단계 안에 무엇을 하나요" "① 할 일의 완료 버튼을 빠르게 두 번 누른다`n② 돌아보기로 이동한다`n③ 완료 수 숫자를 클릭한다" 495 155 420 120 $Color.Gold
  Add-GuideCard $guideSlide "3" "무엇이 보이면 통과인가요" "완료 수가 1만 늘고, 숫자를 누르면 같은 기간의 완료 근거 목록과 조건 문장이 보인다. 새로고침해도 값이 유지된다." 45 300 420 135 $Color.Green
  Add-GuideCard $guideSlide "4" "안 될 때는 무엇이 보이나요" "화면 위쪽 오류 띠에 ‘저장하지 못했습니다 — 다시 시도’가 보인다. 빈 화면이나 무반응은 정상 상태가 아니다." 495 300 420 135 $Color.Coral
  Add-TextBox $guideSlide "현재 결과: 자동 검사·실제 화면·공개 배포 검증 통과" 150 463 660 24 11 $Color.Green $true 2 | Out-Null
  Add-Footer $guideSlide

  $detailSlide1 = $presentation.Slides.Add(16, 12)
  Initialize-Slide $detailSlide1
  Add-Header $detailSlide1 "VERIFICATION GUIDE" "항목별 확인 절차 ① — 핵심 흐름" "계획·할 일·실행·돌아보기의 핵심 규칙을 직접 확인한다." "16"
  Add-VerificationTable $detailSlide1 @(
    @("계획 이력 C08", "계획 상세 → 제목 수정 → 저장 → 하단 이력", "고치기 전 값이 이력에 남는다", "PASS"),
    @("정렬 C20", "할 일 목록을 같은 조건으로 새로고침 2회", "화면 기준대로 순서가 같다", "PASS"),
    @("완료 C21/22", "완료 버튼 연타 → 돌아보기", "기록 1건, 완료 수 +1", "PASS"),
    @("실행 분리 C27", "실행 기록 추가 후 예상 시간 확인", "예상 시간이 바뀌지 않는다", "PASS"),
    @("지연 C30", "지난 마감일의 미완료 할 일 확인", "완료 건은 지연에서 제외된다", "PASS"),
    @("되짚기 C83", "돌아보기 집계 숫자 클릭", "목록 건수와 집계 숫자가 같다", "PASS")
  )
  Add-Footer $detailSlide1

  $detailSlide2 = $presentation.Slides.Add(17, 12)
  Initialize-Slide $detailSlide2
  Add-Header $detailSlide2 "VERIFICATION GUIDE" "항목별 확인 절차 ② — 복원·보안·배포" "데이터 보존과 공개 제출 상태를 확인한다." "17"
  Add-VerificationTable $detailSlide2 @(
    @("이월 C33", "고칠 점 작성 → 이 한 줄로 계획 만들기", "계획에 문장과 출처가 보인다", "PASS"),
    @("복원 C35", "자료 입력 후 새로고침", "ID·날짜·값·단위가 동일하다", "PASS"),
    @("내보내기 C36", "/api/export 접속", "JSON 파일 1개가 내려받아진다", "PASS"),
    @("문자 안전 C57", "스크립트 모양 글자 저장", "실행되지 않고 글자로 보인다", "PASS"),
    @("비밀값 C58", "소스·네트워크·콘솔 검색", "DB 접속 문자열이 없다", "PASS"),
    @("공개 접근 C01", "새 시크릿 창에서 결과물·소스 열기", "인증 없이 HTTP 200으로 열린다", "PASS")
  )
  Add-Footer $detailSlide2

  $presentation.Save()
  Write-Output "APPENDED_VERIFICATION_SLIDES=$($presentation.Slides.Count)"
}
finally {
  if ($presentation) { $presentation.Close() }
  if ($powerPoint) { $powerPoint.Quit() }
}
