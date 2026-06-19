# 📱 EC2 MOBILE DEPLOYMENT COMMANDS

Follow these steps in your AWS EC2 Instance Connect browser terminal to run the mobile backend alongside the web app.

---

## Step 1: Open your Docker Compose file
Open the docker-compose file on the server:
```bash
nano docker-compose.yml
```

Update your `services` block to add the `mobile-backend` service. It should look like this:
```yaml
version: '3.8'

services:
  # 🌐 Existing Web Backend
  backend:
    image: 418295688383.dkr.ecr.eu-north-1.amazonaws.com/emolit-backend:latest
    container_name: emolit-backend-v2
    ports:
      - "8000:8000"
    env_file:
      - .env
    restart: always

  # 🌐 Existing Web Frontend
  frontend:
    image: 418295688383.dkr.ecr.eu-north-1.amazonaws.com/emolit-frontend:latest
    container_name: emolit-frontend-v2
    ports:
      - "8080:80"
    restart: always

  # 📱 NEW Mobile Backend
  mobile-backend:
    image: 418295688383.dkr.ecr.eu-north-1.amazonaws.com/emolit-mobile-backend:latest
    container_name: emolit-mobile-backend-v2
    ports:
      - "8001:8000"
    env_file:
      - .env
    restart: always
```
*(Press `Ctrl+O` then `Enter` to save, and `Ctrl+X` to exit nano)*

---

## Step 2: Open your Caddyfile
Open the Caddy configuration file:
```bash
sudo nano /etc/caddy/Caddyfile
```

Modify it so it routes `/mobile-api/*` to port `8001`:
```caddy
emolit.duckdns.org {
    # 📱 Mobile Backend Routing
    handle_path /mobile-api/* {
        reverse_proxy localhost:8001
    }

    # 🌐 Web Backend Routing
    handle_path /api/* {
        reverse_proxy localhost:8000
    }

    # 🌐 Web Frontend Routing
    handle {
        reverse_proxy localhost:8080
    }
}
```
*(Press `Ctrl+O` then `Enter` to save, and `Ctrl+X` to exit nano)*

---

## Step 3: Pull the new image and start the mobile container
Run these commands to log in to ECR, pull the new mobile backend image, and start it:
```bash
# 1. Login to ECR
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 418295688383.dkr.ecr.eu-north-1.amazonaws.com

# 2. Pull and start mobile backend
docker-compose pull mobile-backend
docker-compose up -d mobile-backend
```

---

## Step 4: Reload Caddy
Reload Caddy to apply the new routing rules:
```bash
sudo systemctl reload caddy
```

---

## Step 5: Verify
Check if the mobile backend is running and outputting logs:
```bash
# Check running containers
docker ps

# Check mobile backend logs
docker logs --tail 20 emolit-mobile-backend-v2
```
