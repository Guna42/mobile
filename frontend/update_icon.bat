@echo off
echo Creating assets directory...
if not exist assets mkdir assets

echo Copying logo...
copy /Y public\logo.jpeg assets\icon.jpg

echo Running Capacitor Assets to generate all Android icon sizes...
call npx @capacitor/assets generate --iconBackgroundColor "#ffffff" --splashBackgroundColor "#ffffff"

echo Done!
