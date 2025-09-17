# 🚀 Documentación del Sistema de Deploy - ELECTRON

## 📋 Resumen del Sistema

El sistema de deploy utiliza **Git con hooks post-receive** para automatizar el despliegue desde tu máquina local al servidor EC2 de Amazon AWS.

**Arquitectura:**
- **Local:** Máquina de desarrollo con Git
- **Producción:** Amazon EC2 con Node.js, PM2, y certificados SSL
- **Conexión:** SSH con claves .pem
- **Automatización:** Git hooks post-receive

---

## 🏠 CONFIGURACIÓN MÁQUINA LOCAL

### Estructura de Proyecto
```
/home/desarrollo/source/electron/
├── src/                        # Código fuente Astro
├── dist/                       # Build compilado
├── package.json               # Dependencias
├── astro.config.mjs          # Configuración Astro
├── .env                      # Variables de entorno
├── DEPLOY.md                 # Esta documentación
└── .git/                     # Repositorio Git
```

### Configuración SSH
**Archivo:** `~/.ssh/config`
```
Host electron-ec2
    HostName 18.184.20.26
    User ec2-user
    IdentityFile ~/.ssh/electron.pem
    StrictHostKeyChecking no
```

### Configuración Git
```bash
# Remote de producción
git remote add production electron-ec2:/var/repo/electron.git

# Ramas configuradas
main        -> desarrollo
production  -> despliegue
```

### Variables de Entorno Local
**Archivo:** `.env`
```bash
PUBLIC_SUPABASE_URL="https://lftaygvnwyllkwgftwxv.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
PUBLIC_SITE_URL="https://electron.finance"
```

---

## 🖥️ CONFIGURACIÓN SERVIDOR EC2

### Información del Servidor
- **IP:** 18.184.20.26
- **OS:** Amazon Linux 2023
- **Usuario:** ec2-user
- **Dominio:** electron.finance

### Estructura de Directorios
```
/var/repo/electron.git/          # Repositorio Git bare
├── hooks/
│   └── post-receive            # Script automatización
└── ...

/var/www/electron/              # Aplicación en ejecución
├── dist/                       # Archivos compilados
├── node_modules/               # Dependencias
├── server.mjs                  # Servidor Node.js
├── ecosystem.config.cjs        # Configuración PM2
├── package.json
├── .env                        # Variables producción
└── logs/                       # Logs PM2

/var/www/ssl/                   # Certificados SSL
├── fullchain.pem
└── privkey.pem
```

### Software Instalado
```bash
# Node.js y pnpm
node --version    # v18.20.8
pnpm --version    # 8.x.x

# PM2 (Process Manager)
pm2 --version

# Git
git --version

# Certbot (SSL)
certbot --version
```

---

## 🔧 CONFIGURACIÓN TÉCNICA

### Servidor Node.js
**Archivo:** `/var/www/electron/server.mjs`
```javascript
import { handler as ssrHandler } from './dist/server/entry.mjs';
import express from 'express';
import { createServer as createHttpServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { readFileSync, existsSync } from 'fs';

const app = express();
app.use(ssrHandler);

// Puertos no privilegiados
const PORT_HTTP = 3000;
const PORT_HTTPS = 3001;

// Servidor HTTP
const httpServer = createHttpServer(app);
httpServer.listen(PORT_HTTP, '0.0.0.0', () => {
  console.log(`HTTP Server running on port ${PORT_HTTP}`);
});

// Servidor HTTPS
const certPath = '/var/www/ssl/fullchain.pem';
const keyPath = '/var/www/ssl/privkey.pem';

if (existsSync(certPath) && existsSync(keyPath)) {
  const sslOptions = {
    key: readFileSync(keyPath),
    cert: readFileSync(certPath)
  };
  const httpsServer = createHttpsServer(sslOptions, app);
  httpsServer.listen(PORT_HTTPS, '0.0.0.0', () => {
    console.log(`HTTPS Server running on port ${PORT_HTTPS}`);
  });
}
```

### Configuración PM2
**Archivo:** `/var/www/electron/ecosystem.config.cjs`
```javascript
module.exports = {
  apps: [{
    name: "electron-app",
    script: "./server.mjs",
    instances: 1,
    exec_mode: "fork",
    env: {
      NODE_ENV: "production",
      HOST: "0.0.0.0"
    }
  }]
}
```

### Redirección de Puertos (iptables)
```bash
# Puerto 80 -> 3000 (HTTP)
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000

# Puerto 443 -> 3001 (HTTPS)
sudo iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-port 3001
```

### Hook Post-Receive
**Archivo:** `/var/repo/electron.git/hooks/post-receive`
```bash
#!/bin/bash
WORK_TREE=/var/www/electron
GIT_DIR=/var/repo/electron.git
BRANCH=main

while read oldrev newrev ref
do
    if [[ $ref = refs/heads/$BRANCH ]];
    then
        echo "Deploying $BRANCH branch..."
        git --work-tree=$WORK_TREE --git-dir=$GIT_DIR checkout -f $BRANCH

        echo "Installing dependencies..."
        cd $WORK_TREE
        pnpm install --prod

        echo "Building application..."
        pnpm build

        echo "Restarting application..."
        pm2 reload all || pm2 start ecosystem.config.cjs

        echo "Deployment completed!"
    fi
done
```

---

## 🚀 PROCESO DE DEPLOY

### Flujo Completo

#### 1. Desarrollo Local
```bash
# Cambiar a rama principal
git checkout main

# Realizar cambios en el código
# ... editar archivos ...

# Construir aplicación
pnpm build

# Probar localmente
pnpm dev
```

#### 2. Preparar Producción
```bash
# Cambiar a rama de producción
git checkout production

# Mergear cambios desde main
git merge main

# Verificar que dist/ está incluido
ls -la dist/

# Añadir todos los cambios
git add .

# Hacer commit descriptivo
git commit -m "Deploy: [descripción de cambios]"
```

#### 3. Desplegar
```bash
# Enviar a servidor de producción
git push production production:main

# El hook post-receive se ejecuta automáticamente:
# ✅ Extrae archivos a /var/www/electron
# ✅ Instala dependencias con pnpm
# ✅ Construye aplicación
# ✅ Reinicia servidor con PM2
```

#### 4. Verificar Deploy
```bash
# Verificar estado en servidor
ssh electron-ec2 "pm2 status"

# Ver logs
ssh electron-ec2 "pm2 logs --lines 20"

# Probar aplicación
curl https://electron.finance
```

---

## 🛠️ COMANDOS ÚTILES

### Comandos Locales

```bash
# Deploy rápido (en rama production)
pnpm build && git add . && git commit -m "Quick deploy" && git push production production:main

# Ver diferencias antes de deploy
git diff production/main main

# Ver estado de remotos
git remote -v

# Verificar conexión SSH
ssh electron-ec2

# Ver logs remotos
ssh electron-ec2 "pm2 logs --lines 50"
```

### Comandos en Servidor

```bash
# Conectar al servidor
ssh electron-ec2

# Estado de aplicación
pm2 status
pm2 logs
pm2 monit

# Gestión de procesos
pm2 reload all      # Reinicio sin downtime
pm2 restart all     # Reinicio completo
pm2 stop all        # Parar aplicación
pm2 start ecosystem.config.cjs  # Iniciar

# Verificar puertos
netstat -tlnp | grep :3000
netstat -tlnp | grep :3001

# Verificar certificados SSL
sudo certbot certificates
ls -la /var/www/ssl/

# Logs del sistema
sudo journalctl -f
```

---

## 🔐 GESTIÓN SSL

### Certificados Let's Encrypt

#### Ubicación Original
```
/etc/letsencrypt/live/electron.finance/
├── fullchain.pem
├── privkey.pem
├── cert.pem
└── chain.pem
```

#### Ubicación Copiada (accesible)
```
/var/www/ssl/
├── fullchain.pem  (644)
└── privkey.pem    (600)
```

#### Renovación Manual
```bash
# Parar aplicación temporalmente
sudo pm2 stop all

# Renovar certificados
sudo certbot renew

# Copiar certificados renovados
sudo cp /etc/letsencrypt/live/electron.finance/fullchain.pem /var/www/ssl/
sudo cp /etc/letsencrypt/live/electron.finance/privkey.pem /var/www/ssl/
sudo chown ec2-user:ec2-user /var/www/ssl/*
sudo chmod 644 /var/www/ssl/fullchain.pem
sudo chmod 600 /var/www/ssl/privkey.pem

# Reiniciar aplicación
sudo pm2 start all
```

#### Renovación Automática
```bash
# Añadir a crontab del usuario root
sudo crontab -e

# Añadir esta línea:
0 3 * * * /usr/bin/certbot renew --quiet && cp /etc/letsencrypt/live/electron.finance/*.pem /var/www/ssl/ && chown ec2-user:ec2-user /var/www/ssl/* && pm2 reload all
```

---

## 🚨 TROUBLESHOOTING

### Problemas Comunes

#### 1. Error de Conexión SSH
```bash
# Verificar clave SSH
ls -la ~/.ssh/electron.pem
chmod 400 ~/.ssh/electron.pem

# Probar conexión
ssh -v electron-ec2

# Verificar configuración
cat ~/.ssh/config
```

#### 2. Deploy Falla
```bash
# Ver logs de deploy
ssh electron-ec2 "tail -f /var/repo/electron.git/hooks/post-receive.log"

# Deploy manual
ssh electron-ec2
cd /var/www/electron
git status
pnpm install
pm2 reload all
```

#### 3. Aplicación No Responde
```bash
# Verificar procesos PM2
ssh electron-ec2 "pm2 list"

# Ver logs de error
ssh electron-ec2 "pm2 logs --err --lines 50"

# Verificar puertos
ssh electron-ec2 "netstat -tlnp | grep 300"

# Reiniciar aplicación
ssh electron-ec2 "pm2 restart all"
```

#### 4. Problemas de SSL
```bash
# Verificar certificados
ssh electron-ec2 "ls -la /var/www/ssl/"

# Probar HTTPS
curl -k https://electron.finance

# Verificar redirección de puertos
ssh electron-ec2 "sudo iptables -t nat -L"
```

### Logs Importantes

```bash
# Logs de aplicación
/var/www/electron/logs/out.log
/var/www/electron/logs/err.log

# Logs de PM2
~/.pm2/pm2.log

# Logs del sistema
/var/log/messages
```

---

## 📈 MONITOREO Y MANTENIMIENTO

### Tareas Regulares

#### Daily
- Verificar estado de aplicación: `pm2 status`
- Revisar logs de error: `pm2 logs --err --lines 20`

#### Weekly
- Actualizar dependencias: `pnpm update`
- Verificar espacio en disco: `df -h`
- Revisar certificados SSL: `sudo certbot certificates`

#### Monthly
- Actualizar sistema: `sudo dnf update`
- Limpiar logs antiguos: `pm2 flush`
- Backup de configuración

### Métricas a Monitorear

```bash
# CPU y memoria
ssh electron-ec2 "top -bn1 | head -20"

# Espacio en disco
ssh electron-ec2 "df -h"

# Procesos de aplicación
ssh electron-ec2 "pm2 monit"

# Conexiones de red
ssh electron-ec2 "netstat -tuln"
```

---

## 🔄 ROLLBACK

### Rollback Rápido
```bash
# En caso de problemas, volver a commit anterior
git log --oneline -5  # Ver últimos commits
git checkout production
git reset --hard HEAD~1  # Volver 1 commit atrás
git push production production:main --force
```

### Rollback con Backup
```bash
# Crear backup antes de deploy
ssh electron-ec2 "cp -r /var/www/electron /var/www/electron.backup.$(date +%Y%m%d)"

# Restaurar backup si es necesario
ssh electron-ec2 "rm -rf /var/www/electron && mv /var/www/electron.backup.YYYYMMDD /var/www/electron && pm2 reload all"
```

---

## 📞 INFORMACIÓN DE CONTACTO

### Recursos y URLs
- **Aplicación:** https://electron.finance
- **Repositorio:** /home/desarrollo/source/electron/
- **Servidor:** ec2-user@18.184.20.26
- **Supabase:** https://lftaygvnwyllkwgftwxv.supabase.co

### Puertos
- **HTTP:** 80 → 3000
- **HTTPS:** 443 → 3001
- **SSH:** 22

---

## 🔧 SCRIPTS DE AUTOMATIZACIÓN

### Script de Deploy Rápido
```bash
#!/bin/bash
# deploy.sh
echo "🚀 Iniciando deploy..."
pnpm build
git add .
git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
git push production production:main
echo "✅ Deploy completado!"
```

### Script de Verificación
```bash
#!/bin/bash
# check.sh
echo "🔍 Verificando estado del servidor..."
ssh electron-ec2 "pm2 status && curl -s -o /dev/null -w '%{http_code}' https://electron.finance"
```

---

**Documento generado:** 17 de septiembre de 2025  
**Versión:** 1.0  
**Sistema:** ELECTRON - Aplicación Astro en Amazon EC2