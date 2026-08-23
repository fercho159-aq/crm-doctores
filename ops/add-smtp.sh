#!/bin/bash
echo "SMTP_HOST=smtp.hostinger.com" >> /root/novamed/.env
echo "SMTP_PORT=465" >> /root/novamed/.env
echo "SMTP_USER=info@novamedics.com.mx" >> /root/novamed/.env
echo 'SMTP_PASS=Info2025.$' >> /root/novamed/.env
echo "--- .env actualizado ---"
cat /root/novamed/.env
