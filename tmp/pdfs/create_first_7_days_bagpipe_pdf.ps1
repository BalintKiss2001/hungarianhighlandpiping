param(
  [string]$OutputPath = (Join-Path (Resolve-Path ".") "output\pdf\elso-7-nap-skot-dudan.pdf")
)

$PdfEncoding = [System.Text.Encoding]::GetEncoding(1250)

function Hu([string]$Text) {
  return $Text `
    -replace "\{a'\}", ([char]0x00E1) `
    -replace "\{A'\}", ([char]0x00C1) `
    -replace "\{e'\}", ([char]0x00E9) `
    -replace "\{E'\}", ([char]0x00C9) `
    -replace "\{i'\}", ([char]0x00ED) `
    -replace "\{I'\}", ([char]0x00CD) `
    -replace "\{o'\}", ([char]0x00F3) `
    -replace "\{O'\}", ([char]0x00D3) `
    -replace "\{o:\}", ([char]0x00F6) `
    -replace "\{O:\}", ([char]0x00D6) `
    -replace "\{o''\}", ([char]0x0151) `
    -replace "\{O''\}", ([char]0x0150) `
    -replace "\{u'\}", ([char]0x00FA) `
    -replace "\{U'\}", ([char]0x00DA) `
    -replace "\{u:\}", ([char]0x00FC) `
    -replace "\{U:\}", ([char]0x00DC) `
    -replace "\{u''\}", ([char]0x0171) `
    -replace "\{U''\}", ([char]0x0170)
}

function Escape-PdfText([string]$Text) {
  $Text = Hu $Text
  return ($Text -replace "\\", "\\\\" -replace "\(", "\(" -replace "\)", "\)")
}

function TextLine([double]$X, [double]$Y, [string]$Text, [int]$Size = 11, [string]$Font = "F1", [string]$Color = "0 0 0") {
  $safe = Escape-PdfText $Text
  return "BT /$Font $Size Tf $Color rg 1 0 0 1 $X $Y Tm ($safe) Tj ET`n"
}

function WrapText([string]$Text, [int]$MaxChars) {
  $words = $Text.Split(" ")
  $lines = New-Object System.Collections.Generic.List[string]
  $line = ""
  foreach ($word in $words) {
    if (($line.Length + $word.Length + 1) -gt $MaxChars) {
      if ($line.Trim().Length -gt 0) { $lines.Add($line.Trim()) }
      $line = $word
    } else {
      $line = "$line $word"
    }
  }
  if ($line.Trim().Length -gt 0) { $lines.Add($line.Trim()) }
  return $lines
}

function Paragraph([double]$X, [double]$Y, [double]$Leading, [string]$Text, [int]$MaxChars = 74, [int]$Size = 10) {
  $ops = ""
  foreach ($line in (WrapText $Text $MaxChars)) {
    $ops += TextLine $X $Y $line $Size "F1" "0.12 0.12 0.12"
    $Y -= $Leading
  }
  return @{ Ops = $ops; Y = $Y }
}

function Heading([double]$X, [double]$Y, [string]$Text, [int]$Size = 22) {
  return TextLine $X $Y $Text $Size "F2" "0 0.42 0.32"
}

function Subheading([double]$X, [double]$Y, [string]$Text) {
  return TextLine $X $Y $Text 14 "F2" "0 0.42 0.32"
}

function Rule([double]$X1, [double]$Y, [double]$X2) {
  return "0.82 0.72 0.62 RG 1 w $X1 $Y m $X2 $Y l S`n"
}

function Bullet([double]$X, [double]$Y, [string]$Text) {
  return "0 0.42 0.32 rg $X $($Y + 3) 3 0 360 arc f`n" + (TextLine ($X + 12) $Y $Text 10 "F1" "0.12 0.12 0.12")
}

function Circle([double]$Cx, [double]$Cy, [double]$R, [string]$Fill = "0 0.42 0.32") {
  $c = 0.5522847498 * $R
  return "$Fill rg $($Cx+$R) $Cy m $($Cx+$R) $($Cy+$c) $($Cx+$c) $($Cy+$R) $Cx $($Cy+$R) c $($Cx-$c) $($Cy+$R) $($Cx-$R) $($Cy+$c) $($Cx-$R) $Cy c $($Cx-$R) $($Cy-$c) $($Cx-$c) $($Cy-$R) $Cx $($Cy-$R) c $($Cx+$c) $($Cy-$R) $($Cx+$R) $($Cy-$c) $($Cx+$R) $Cy c f`n"
}

function Staff([double]$X, [double]$Y, [double]$W) {
  $ops = "0.12 0.12 0.12 RG 0.9 w`n"
  for ($i=0; $i -lt 5; $i++) {
    $yy = $Y - ($i * 9)
    $ops += "$X $yy m $($X+$W) $yy l S`n"
  }
  return $ops
}

function NoteY([double]$StaffTopY, [int]$StepsFromLowG) {
  $staffBottomY = $StaffTopY - 36
  return $staffBottomY + ($StepsFromLowG * 4.5)
}

function Note([double]$X, [double]$Y, [string]$Label) {
  return (Circle $X $Y 4.4 "0 0.42 0.32") + "0 0.42 0.32 RG 1 w $($X+4.4) $Y m $($X+4.4) $($Y+34) l S`n" + (TextLine ($X-16) ($Y-28) $Label 8 "F1" "0.12 0.12 0.12")
}

function LedgerNote([double]$X, [double]$Y, [string]$Label) {
  $ops = "1 1 1 rg $($X-14) $($Y-1.2) 28 2.4 re f`n"
  $ops += Circle $X $Y 4.4 "0 0.42 0.32"
  $ops += "0.12 0.12 0.12 RG 0.9 w $($X-14) $Y m $($X+14) $Y l S`n"
  $ops += "0 0.42 0.32 RG 1 w $($X+4.4) $Y m $($X+4.4) $($Y+34) l S`n"
  $ops += TextLine ($X-16) ($Y-28) $Label 8 "F1" "0.12 0.12 0.12"
  return $ops
}

function PageFooter([int]$Page, [int]$Total) {
  return (Rule 54 52 541) + (TextLine 54 34 "Kiss B{a'}lint Sk{o'}tdud{a'}s - Els{o''} 7 nap sk{o'}t dud{a'}n" 8 "F1" "0.35 0.35 0.35") + (TextLine 506 34 "$Page / $Total" 8 "F1" "0.35 0.35 0.35")
}

$pages = New-Object System.Collections.Generic.List[string]

$p = ""
$p += "0.92 0.86 0.78 rg 0 0 595 842 re f`n"
$p += Heading 54 742 "Els{o''} 7 nap sk{o'}t dud{a'}n" 34
$p += TextLine 54 704 "Kezd{o''} {u'}tmutat{o'} gyakorl{o'}s{i'}phoz, hangokhoz {e'}s napi rutinhoz" 14 "F1" "0.12 0.12 0.12"
$p += Rule 54 682 541
$res = Paragraph 54 646 15 "Ez a r{o:}vid PDF azoknak k{e'}sz{u:}lt, akik most ismerkednek a sk{o'}t dud{a'}val. Az els{o''} h{e'}ten nem a gyorsas{a'}g a c{e'}l, hanem a stabil tart{a'}s, a tiszta ujjmozg{a'}s {e'}s az, hogy minden nap legyen egy kicsi, megism{e'}telhet{o''} siker." 70 11
$p += $res.Ops
$y = $res.Y - 16
$p += Subheading 54 $y "Mire lesz sz{u:}ks{e'}ged?"
$y -= 26
foreach ($item in @(
  "Gyakorl{o'}s{i'}p, stabil reed {e'}s k{e'}nyelmes sz{e'}k.",
  "Napi 10-15 perc csendes, figyelmes gyakorl{a'}s.",
  "Metron{o'}m vagy telefonos metron{o'}m alkalmaz{a'}s.",
  "T{u:}relmes temp{o'}: el{o''}sz{o:}r pontoss{a'}g, csak ut{a'}na sebess{e'}g."
)) { $p += Bullet 62 $y $item; $y -= 18 }
$y -= 32
$p += Subheading 54 $y "A h{e'}t c{e'}lja"
$y -= 24
$res = Paragraph 54 $y 15 "A h{e'}t v{e'}g{e'}re felismered a sk{o'}t duda alap hangjait kott{a'}ban, tudsz egyszer{u''} hangsort j{a'}tszani gyakorl{o'}s{i'}pon, {e'}s lesz egy napi rutinod, amelyre k{e'}s{o''}bb {e'}p{i'}teni lehet." 72 11
$p += $res.Ops
$p += PageFooter 1 5
$pages.Add($p)

$p = ""
$p += Heading 54 760 "1-2. nap: tart{a'}s {e'}s stabil hang" 22
$p += Rule 54 742 541
$y = 712
$p += Subheading 54 $y "1. nap - Ismerked{e'}s a gyakorl{o'}s{i'}ppal"; $y -= 24
foreach ($item in @(
  "{U:}lj egyenesen, v{a'}ll laz{a'}n, a kar ne fesz{u:}lj{o:}n.",
  "Fedd le a hanglyukakat puh{a'}n, ne szor{i'}tsd a s{i'}pot.",
  "F{u'}jj hossz{u'}, egyenletes hangokat 4 m{a'}sodpercig.",
  "Pihenj sokat: a sz{e'}p hang fontosabb, mint a hossz{u'} gyakorl{a'}s."
)) { $p += Bullet 62 $y $item; $y -= 18 }
$y -= 16
$p += Subheading 54 $y "2. nap - Low A {e'}s Low G"; $y -= 24
$res = Paragraph 54 $y 15 "A sk{o'}t duda tanul{a'}sban a Low A gyakran a kiindul{o'}pont. Ehhez k{e'}pest a Low G egy m{e'}lyebb hang. A c{e'}l nem a dallam, hanem az, hogy a k{e'}t hang k{o:}z{o:}tt tiszt{a'}n tudj v{a'}ltani." 72 10
$p += $res.Ops; $y = $res.Y - 8
foreach ($item in @(
  "J{a'}tszd: Low A - Low G - Low A - Low G.",
  "Minden hang legyen egyforma hossz{u'}.",
  "Ha s{i'}pol vagy t{o:}rik a hang, lass{i'}ts {e'}s ellen{o''}rizd az ujjaidat."
)) { $p += Bullet 62 $y $item; $y -= 18 }
$p += PageFooter 2 5
$pages.Add($p)

$p = ""
$p += Heading 54 760 "3-5. nap: hangok {o:}sszek{o:}t{e'}se" 22
$p += Rule 54 742 541
$y = 712
$sections = @(
  @{ H="3. nap - Low A, B, C"; T="Ezen a napon csak h{a'}rom hanggal dolgozz. A c{e'}l, hogy minden v{a'}lt{a'}st lassan, tiszt{a'}n {e'}s ritmusban tudj megcsin{a'}lni."; B=@("Low A - B - C - B - Low A", "Ne emeld t{u'}l magasra az ujjaidat.", "Metron{o'}m: 60 BPM, negyed hangok.") },
  @{ H="4. nap - D {e'}s E"; T="A k{o:}z{e'}ps{o''} hangokn{a'}l k{o:}nny{u''} kapkodni. Maradj lass{u'} temp{o'}ban, {e'}s figyelj arra, hogy a kezek ne fesz{u:}ljenek."; B=@("C - D - E - D - C", "Ha egy hang elcs{u'}szik, csak azt a v{a'}lt{a'}st ism{e'}teld.", "R{o:}vid blokkok: 3 perc gyakorl{a'}s, 1 perc pihen{o''}.") },
  @{ H="5. nap - F, High G, High A"; T="A magasabb hangokn{a'}l a kis pontatlans{a'}g is er{o''}sebben hallatszik. A c{e'}l itt a tiszta {a'}tmenet, nem a hanger{o''}."; B=@("E - F - High G - High A", "Minden hang el{o''}tt gondold v{e'}gig, melyik ujj mozdul.", "A hib{a'}s v{a'}lt{a'}st lass{i'}tva jav{i'}tsd.") }
)
foreach ($s in $sections) {
  $p += Subheading 54 $y $s.H; $y -= 22
  $res = Paragraph 54 $y 14 $s.T 74 10
  $p += $res.Ops; $y = $res.Y - 4
  foreach ($b in $s.B) { $p += Bullet 62 $y $b; $y -= 16 }
  $y -= 14
}
$p += PageFooter 3 5
$pages.Add($p)

$p = ""
$p += Heading 54 760 "6-7. nap: mini rutin" 22
$p += Rule 54 742 541
$y = 712
$p += Subheading 54 $y "6. nap - Egyenletes ritmus"; $y -= 24
$res = Paragraph 54 $y 15 "Most m{a'}r nem csak a hangokat, hanem a ritmust is figyeled. V{a'}lassz nagyon lass{u'} temp{o'}t, {e'}s minden nap ugyanazt a kis sort ism{e'}teld." 72 10
$p += $res.Ops; $y = $res.Y - 8
foreach ($item in @(
  "Low G - Low A - B - C - D - E - F - High G - High A",
  "Majd vissza: High A - High G - F - E - D - C - B - Low A - Low G",
  "Ha a ritmus sz{e'}tesik, ne gyors{i'}ts, hanem egyszer{u''}s{i'}ts."
)) { $p += Bullet 62 $y $item; $y -= 18 }
$y -= 18
$p += Subheading 54 $y "7. nap - {O:}sszegz{e'}s"; $y -= 24
foreach ($item in @(
  "J{a'}tszd v{e'}gig az alap hangsort 3-szor lassan.",
  "V{a'}lassz ki k{e'}t neh{e'}z v{a'}lt{a'}st {e'}s gyakorold k{u:}l{o:}n.",
  "{I'}rj fel egy mondatot: mi ment jobban, mint az els{o''} napon?",
  "Ha szeretn{e'}l szem{e'}lyes ir{a'}nyt, iratkozz fel a v{a'}r{o'}list{a'}ra."
)) { $p += Bullet 62 $y $item; $y -= 18 }
$y -= 20
$p += "0 0.42 0.32 rg 54 $($y-12) 255 34 re f`n"
$p += TextLine 70 $y "V{a'}r{o'}lista: hungarianbagpiper.hu/varolista.html" 10 "F2" "1 1 1"
$p += PageFooter 4 5
$pages.Add($p)

$p = ""
$p += Heading 54 760 "Kotta: a sk{o'}t duda alap hangjai" 22
$p += Rule 54 742 541
$res = Paragraph 54 712 15 "A Highland bagpipe alap sk{a'}la hangjai gyakran {i'}gy jelennek meg: Low G, Low A, B, C, D, E, F, High G, High A. A kotta itt nem teljes zeneelm{e'}let, hanem gyors t{a'}j{e'}koz{o'}d{o'} a hangjegyek elhelyezked{e'}s{e'}r{o''}l." 72 10
$p += $res.Ops
$staffY = 612
$p += Staff 70 $staffY 455
$noteData = @(
  @{ X=105; Y=(NoteY $staffY 0); Label="Low G" },
  @{ X=155; Y=(NoteY $staffY 1); Label="Low A" },
  @{ X=205; Y=(NoteY $staffY 2); Label="B" },
  @{ X=255; Y=(NoteY $staffY 3); Label="C" },
  @{ X=305; Y=(NoteY $staffY 4); Label="D" },
  @{ X=355; Y=(NoteY $staffY 5); Label="E" },
  @{ X=405; Y=(NoteY $staffY 6); Label="F" },
  @{ X=455; Y=(NoteY $staffY 7); Label="High G" },
  @{ X=505; Y=(NoteY $staffY 10); Label="High A" }
)
foreach ($n in $noteData) {
  if ($n.Label -eq "High A") {
    $p += LedgerNote $n.X $n.Y $n.Label
  } else {
    $p += Note $n.X $n.Y $n.Label
  }
}
$p += TextLine 74 520 "Egyszer{u''} gyakorlat 1: Low A - B - C - B - Low A" 11 "F2" "0 0.42 0.32"
$exerciseStaffY = 482
$p += Staff 82 $exerciseStaffY 390
foreach ($n in @(
  @{X=130;Y=(NoteY $exerciseStaffY 1);L="Low A"}, @{X=190;Y=(NoteY $exerciseStaffY 2);L="B"}, @{X=250;Y=(NoteY $exerciseStaffY 3);L="C"}, @{X=310;Y=(NoteY $exerciseStaffY 2);L="B"}, @{X=370;Y=(NoteY $exerciseStaffY 1);L="Low A"}
)) { $p += Note $n.X $n.Y $n.L }
$p += TextLine 74 352 "Egyszer{u''} gyakorlat 2: D - E - F - E - D" 11 "F2" "0 0.42 0.32"
$exerciseStaffY = 314
$p += Staff 82 $exerciseStaffY 390
foreach ($n in @(
  @{X=130;Y=(NoteY $exerciseStaffY 4);L="D"}, @{X=190;Y=(NoteY $exerciseStaffY 5);L="E"}, @{X=250;Y=(NoteY $exerciseStaffY 6);L="F"}, @{X=310;Y=(NoteY $exerciseStaffY 5);L="E"}, @{X=370;Y=(NoteY $exerciseStaffY 4);L="D"}
)) { $p += Note $n.X $n.Y $n.L }
$p += PageFooter 5 5
$pages.Add($p)

$objects = New-Object System.Collections.Generic.List[string]
$objects.Add("<< /Type /Catalog /Pages 2 0 R >>")
$pageKids = ""
for ($i=0; $i -lt $pages.Count; $i++) {
  $pageObjNum = 3 + ($i * 2)
  $pageKids += "$pageObjNum 0 R "
}
$objects.Add("<< /Type /Pages /Kids [ $pageKids] /Count $($pages.Count) >>")
for ($i=0; $i -lt $pages.Count; $i++) {
  $pageObjNum = 3 + ($i * 2)
  $streamObjNum = $pageObjNum + 1
  $fontEncoding = "<< /Type /Encoding /BaseEncoding /WinAnsiEncoding /Differences [193 /Aacute 201 /Eacute 205 /Iacute 211 /Oacute 213 /Odblacute 214 /Odieresis 218 /Uacute 219 /Udblacute 220 /Udieresis 225 /aacute 233 /eacute 237 /iacute 243 /oacute 245 /odblacute 246 /odieresis 250 /uacute 251 /udblacute 252 /udieresis] >>"
  $objects.Add("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding $fontEncoding >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding $fontEncoding >> >> >> /Contents $streamObjNum 0 R >>")
  $streamBytes = $PdfEncoding.GetBytes($pages[$i])
  $objects.Add("<< /Length $($streamBytes.Length) >>`nstream`n$($pages[$i])endstream")
}

$pdf = New-Object System.Text.StringBuilder
[void]$pdf.Append("%PDF-1.4`n%PDF generated by Codex`n")
$offsets = New-Object System.Collections.Generic.List[int]
for ($i=0; $i -lt $objects.Count; $i++) {
  $offsets.Add($PdfEncoding.GetByteCount($pdf.ToString()))
  [void]$pdf.Append("$($i+1) 0 obj`n$($objects[$i])`nendobj`n")
}
$xrefOffset = $PdfEncoding.GetByteCount($pdf.ToString())
[void]$pdf.Append("xref`n0 $($objects.Count + 1)`n")
[void]$pdf.Append("0000000000 65535 f `n")
foreach ($offset in $offsets) {
  [void]$pdf.Append(("{0:D10} 00000 n `n" -f $offset))
}
[void]$pdf.Append("trailer`n<< /Size $($objects.Count + 1) /Root 1 0 R >>`nstartxref`n$xrefOffset`n%%EOF`n")

[System.IO.File]::WriteAllBytes($OutputPath, $PdfEncoding.GetBytes($pdf.ToString()))
Write-Output $OutputPath
