# Remove railway.toml from git and filesystem
cd "c:\xXNJEEBXx\Projects\flash Cards"
git rm backend/railway.toml
git commit -m "fix: remove invalid railway.toml file"
git push origin main
Write-Host "✅ railway.toml removed from repository"
