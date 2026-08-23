#!/bin/bash
# Script para agregar NovaMedics a Traefik
cat > /root/traefik/dynamic.yml << 'YAML'
http:
  routers:
    mensajeria:
      rule: "Host(`appsoluciones.duckdns.org`)"
      entryPoints:
        - websecure
      service: mensajeria
      tls:
        certResolver: mytlschallenge
    novamedics:
      rule: "Host(`novamedics.com.mx`) || Host(`www.novamedics.com.mx`)"
      entryPoints:
        - websecure
      service: novamedics
      tls:
        certResolver: mytlschallenge

  services:
    mensajeria:
      loadBalancer:
        servers:
          - url: "http://host.docker.internal:3000"
    novamedics:
      loadBalancer:
        servers:
          - url: "http://host.docker.internal:3100"
YAML
echo "Traefik dynamic.yml actualizado con NovaMedics"
