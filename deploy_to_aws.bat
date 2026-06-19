@echo off
echo ==================================================
echo Deploying Emolit to AWS ECR
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

echo 2. Building and Pushing Backend Image...
docker build -t emolit-backend ./
if %errorlevel% neq 0 (
    echo Backend build failed!
    pause
    exit /b 1
)
docker tag emolit-backend:latest 418295688383.dkr.ecr.eu-north-1.amazonaws.com/emolit-backend:latest
docker push 418295688383.dkr.ecr.eu-north-1.amazonaws.com/emolit-backend:latest
if %errorlevel% neq 0 (
    echo Backend push failed!
    pause
    exit /b 1
)
echo.

echo 3. Building and Pushing Frontend Image...
docker build -t emolit-frontend ./frontend
if %errorlevel% neq 0 (
    echo Frontend build failed!
    pause
    exit /b 1
)
docker tag emolit-frontend:latest 418295688383.dkr.ecr.eu-north-1.amazonaws.com/emolit-frontend:latest
docker push 418295688383.dkr.ecr.eu-north-1.amazonaws.com/emolit-frontend:latest
if %errorlevel% neq 0 (
    echo Frontend push failed!
    pause
    exit /b 1
)
echo.

echo ==================================================
echo Local builds pushed to AWS ECR successfully!
echo ==================================================
echo.
echo NEXT STEP:
echo Go to AWS Web Console -> EC2 -> Instances -> Click Connect (EC2 Instance Connect)
echo And run these commands in the browser terminal:
echo.
echo   aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 418295688383.dkr.ecr.eu-north-1.amazonaws.com
echo   docker-compose pull
echo   docker-compose up -d
echo.
pause
