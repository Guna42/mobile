@echo off
echo ==================================================
echo Deploying Emolit MOBILE Backend to AWS ECR
echo ==================================================
echo.

echo 1. Logging in to AWS ECR...
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 418295688383.dkr.ecr.eu-north-1.amazonaws.com
if %errorlevel% neq 0 (
    echo ECR Login Failed. Make sure you are authenticated.
    pause
    exit /b 1
)
echo.

echo 2. Building and Pushing Mobile Backend Image...
docker build -t emolit-mobile-backend ./
if %errorlevel% neq 0 (
    echo Backend build failed!
    pause
    exit /b 1
)
docker tag emolit-mobile-backend:latest 418295688383.dkr.ecr.eu-north-1.amazonaws.com/emolit-mobile-backend:latest
docker push 418295688383.dkr.ecr.eu-north-1.amazonaws.com/emolit-mobile-backend:latest
if %errorlevel% neq 0 (
    echo Backend push failed!
    pause
    exit /b 1
)
echo.

echo ==================================================
echo Mobile Backend pushed to AWS ECR successfully!
echo ==================================================
echo.
pause
