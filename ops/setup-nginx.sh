#!/bin/bash
# Crear config nginx para novamedics.com.mx
cat > /etc/nginx/sites-available/novamedics << 'NGINX'
server {
    server_name novamedics.com.mx www.novamedics.com.mx;

    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
    }

    listen 80;
}
NGINX

ln -sf /etc/nginx/sites-available/novamedics /etc/nginx/sites-enabled/novamedics
nginx -t && nginx -s reload
echo "Nginx configurado. Ahora corre: certbot --nginx -d novamedics.com.mx -d www.novamedics.com.mx"
