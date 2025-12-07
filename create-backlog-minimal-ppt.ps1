# Minimal PowerPoint for Product Backlog (Tables Only)
# Creates slides with only tables for User Stories #3, #1, #2, #5

$ErrorActionPreference = 'Stop'

# Launch PowerPoint
$pp = New-Object -ComObject PowerPoint.Application
$pp.Visible = [Microsoft.Office.Core.MsoTriState]::msoTrue
$pres = $pp.Presentations.Add()

# Blank layout = 12
$blankLayout = 12

function Add-TableSlide {
    param(
        $presentation,
        [string] $title,
        [string[]] $headers,
        [object[][]] $rows
    )
    $slide = $presentation.Slides.Add($presentation.Slides.Count + 1, $blankLayout)

    # Add header text (blue, bold)
    $titleShape = $slide.Shapes.AddTextbox(1, 20, 10, 900, 40)
    $titleShape.TextFrame.TextRange.Text = $title
    $titleShape.TextFrame.TextRange.Font.Size = 28
    $titleShape.TextFrame.TextRange.Font.Bold = $true
    $titleShape.TextFrame.TextRange.Font.Color.RGB = 0x0066CC

    $totalRows = $rows.Count + 1
    $totalCols = $headers.Count
    # Place table below header
    $table = $slide.Shapes.AddTable($totalRows, $totalCols, 20, 60, 900, 460).Table

    # Header row
    for ($c = 1; $c -le $totalCols; $c++) {
        $cell = $table.Cell(1, $c)
        $cell.Shape.TextFrame.TextRange.Text = $headers[$c - 1]
        $cell.Shape.TextFrame.TextRange.Font.Bold = $true
        $cell.Shape.TextFrame.TextRange.Font.Size = 14
    }

    # Data rows
    for ($r = 0; $r -lt $rows.Count; $r++) {
        for ($c = 1; $c -le $totalCols; $c++) {
            $cell = $table.Cell($r + 2, $c)
            $cell.Shape.TextFrame.TextRange.Text = [string]$rows[$r][$c - 1]
            $cell.Shape.TextFrame.TextRange.Font.Size = 12
        }
    }
}

# Common headers (exactly as requested)
$headers = @(
    'Product Backlog Item',
    'Priority',
    'Task',
    'Description',
    'Size',
    'Ideal Days'
)

# User Story #3 - Existing features only
$us3_rows = @(
    @('1', 'High', 'Create "New Deck" page', 'Form to create a new deck by entering the deck name.', '1', '0.5'),
    @('2', 'High', 'Create "Add Card" page', 'Form to add a card by entering question and answer.', '1', '0.5'),
    @('3', 'High', 'Deck management (CRUD)', 'Implement deck CRUD in CardsContext: add, delete, edit, view.', '1', '1'),
    @('4', 'High', 'Card management (CRUD)', 'Implement card CRUD in CardsContext: add, delete, edit, view.', '1', '1'),
    @('5', 'Medium', 'Show deck list', 'DeckList component that lists all decks.', '1', '1'),
    @('6', 'High', 'Create Review Mode', 'Page to review and test cards within a deck.', '1', '1'),
    @('7', 'High', 'Card flip mechanism', 'Flip between question and answer on click.', '1', '0.5'),
    @('8', 'Medium', 'Start Review button', 'Button in deck list to open Review Mode for the selected deck.', '0.5', '0.5'),
    @('9', 'Medium', 'Navigation buttons', 'Previous/Next buttons in Review Mode to move between cards.', '0.5', '0.5')
)
Add-TableSlide $pres "Product Backlog - User Story #3" $headers $us3_rows

# User Story #1 - Use only existing project capabilities
# Based on code: deckStats in App.js, QuickActions progress, StudyMode counters, Smart Mode stats
$us1_rows = @(
    @('1', 'High', 'Deck statistics calculation', 'Compute per-deck totals and known/remaining counts.', '1', '1'),
    @('2', 'High', 'Display deck stats in dashboard', 'Show basic progress in dashboard QuickActions.', '1', '1'),
    @('3', 'Medium', 'StudyMode progress counters', 'Display learned/total and remaining during study.', '1', '0.5'),
    @('4', 'Medium', 'Smart session counters', 'Show Smart Mode counts (e.g., difficult set size/rounds).', '1', '1')
)
Add-TableSlide $pres "Product Backlog - User Story #1" $headers $us1_rows

# User Story #2 - Existing persistence only (no auth, no cross-device)
# Based on code: API-first load with localStorage fallback, auto-save decks to localStorage, known state persistence, reset progress, index preservation
$us2_rows = @(
    @('1', 'High', 'API data retrieval', 'Fetch decks from Laravel API on app load.', '1', '1'),
    @('2', 'High', 'Known status handling', 'Toggle known state for cards during study (server-supported).', '1', '0.5'),
    @('3', 'Medium', 'Reset deck progress', 'Reset all cards in a deck to unknown using existing function.', '1', '0.5'),
    @('4', 'Medium', 'Preserve study index', 'Keep current index when cards list recalculates (no jump).', '1', '0.5'),
    @('5', 'Medium', 'Graceful API error handling', 'Handle API errors and keep the UI usable.', '1', '0.5')
)
Add-TableSlide $pres "Product Backlog - User Story #2" $headers $us2_rows

# User Story #4 - AI assistance (MCP exists only, no website integration)
$us4_rows = @(
    @('1', 'High', 'Tool files created', 'Provide MCP tool scripts in the repo (build/run).', '1', '0.5'),
    @('2', 'High', 'Run MCP server (backend)', 'Ability to start MCP server alongside backend.', '1', '0.5'),
    @('3', 'Medium', 'Basic usage docs', 'Quick steps to run and use MCP tools.', '1', '0.5'),
    @('4', 'Medium', 'No website UI changes', 'AI not added to the site; MCP exists only.', '1', '0.5')
)
Add-TableSlide $pres "Product Backlog - User Story #4" $headers $us4_rows

# User Story #5 - Smart Mode (existing)
$us5_rows = @(
    @('1', 'High', 'Difficulty detection', 'Identify difficult cards by incorrect answers/review frequency.', '2', '1.5'),
    @('2', 'High', 'Collect unmastered cards', 'Maintain focused set (up to 6) for intensive review.', '1', '1'),
    @('3', 'High', 'Smart Mode UI', 'Focused interface to review only difficult cards.', '1', '1'),
    @('4', 'Medium', 'Auto switch to Smart Mode', 'Switch when difficult set reaches the limit.', '1', '0.5'),
    @('5', 'High', 'Smart session management', 'Track rounds completed and cards mastered in session.', '1', '1'),
    @('6', 'Medium', 'Difficulty indicators', 'Visual cues to show difficulty level in study.', '1', '0.5'),
    @('7', 'Medium', 'Smart settings', 'Adjust cap and switching behavior from settings.', '1', '1'),
    @('8', 'Low', 'Reset smart progress', 'Reset difficult set and start a fresh smart session.', '0.5', '0.5'),
    @('9', 'Medium', 'Smart statistics', 'Show smart-specific counts during sessions.', '1', '1'),
    @('10', 'High', 'Persist smart data', 'Persist difficult set to survive app reloads.', '1', '0.5')
)
Add-TableSlide $pres "Product Backlog - User Story #5" $headers $us5_rows

# Save and close
$out = Join-Path (Get-Location) 'Backlog_Minimal.pptx'
try {
    $pres.SaveAs($out)
    Write-Host "Created: $out"
}
catch {
    $fallback = Join-Path (Get-Location) ("Backlog_Minimal_{0:yyyyMMdd_HHmmss}.pptx" -f (Get-Date))
    $pres.SaveAs($fallback)
    Write-Host "Target in use. Saved as: $fallback"
    $out = $fallback
}

$pp.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($pp) | Out-Null
