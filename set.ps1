$wallpaperUrl = "https://naww.io/wallpaper.png"
$wallpaperPath = "$env:TEMP\wallpaper.png"
Invoke-WebRequest -Uri $wallpaperUrl -OutFile $wallpaperPath
Set-ItemProperty -Path 'HKCU:\Control Panel\Desktop\' -Name WallPaper -Value $wallpaperPath
RUNDLL32.EXE user32.dll,UpdatePerUserSystemParameters ,1 ,True