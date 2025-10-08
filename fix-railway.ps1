# Remove railway.toml properly
Set-Location "c:\xXNJEEBXx\Projects\flash Cards"
git rm backend/railway.toml -f
git commit -m "fix: remove invalid railway.toml (use railway.json instead)"
git push origin main
Write-Host "✅ Done! railway.toml removed"
