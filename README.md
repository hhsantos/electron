# 🚀 ELECTRON - Aplicación Astro

Aplicación web moderna construida con Astro, desplegada en Amazon EC2 con certificados SSL automáticos.

## 🌟 Características

- ⚡ **Astro** - Framework web moderno y rápido
- 🔐 **HTTPS/SSL** - Certificados Let's Encrypt automáticos
- 🚀 **Deploy automático** - Git hooks con despliegue continuo
- 📱 **Responsive** - Diseño adaptable a todos los dispositivos
- 🗄️ **Supabase** - Base de datos y autenticación
- 🔧 **PM2** - Gestión de procesos en producción

## 🛠️ Tecnologías

- **Frontend:** Astro, HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Base de datos:** Supabase (PostgreSQL)
- **Deployment:** Amazon EC2, PM2
- **SSL:** Let's Encrypt/Certbot
- **Package Manager:** pnpm

## 📋 Requisitos

- Node.js v18.20.8 o superior
- pnpm v8.x.x
- Git
- Acceso SSH al servidor de producción

## 🚀 Instalación Local

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd electron
```

### 2. Instalar dependencias
```bash
pnpm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:
```bash
PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="tu_clave_publica"
PUBLIC_SITE_URL="https://electron.finance"
```

### 4. Ejecutar en desarrollo
```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:4321`

## 🏗️ Scripts Disponibles

```bash
# Desarrollo
pnpm dev          # Servidor de desarrollo
pnpm build        # Compilar para producción
pnpm preview      # Vista previa de la build

# Linting y formato
pnpm lint         # Verificar código
pnpm format       # Formatear código

# Deploy
pnpm deploy       # Deploy rápido a producción
```

## 🌐 Deploy en Producción

### Configuración SSH (una sola vez)

1. **Configurar SSH:**
```bash
# Archivo: ~/.ssh/config
Host electron-ec2
    HostName 18.184.20.26
    User ec2-user
    IdentityFile ~/.ssh/electron.pem
    StrictHostKeyChecking no
```

2. **Añadir remote de producción:**
```bash
git remote add production electron-ec2:/var/repo/electron.git
```

### Proceso de Deploy

```bash
# 1. Desarrollar en rama main
git checkout main
# ... hacer cambios ...
pnpm build

# 2. Preparar para producción
git checkout production
git merge main
git add .
git commit -m "Deploy: descripción de cambios"

# 3. Desplegar
git push production production:main
```

### Deploy Automático

El sistema utiliza **Git hooks** para automatizar el deploy:

- ✅ Extrae archivos al servidor
- ✅ Instala dependencias con `pnpm install --prod`
- ✅ Construye la aplicación con `pnpm build`
- ✅ Reinicia el servidor con PM2

## 📁 Estructura del Proyecto

```
electron/
├── src/                        # Código fuente
│   ├── components/            # Componentes reutilizables
│   ├── layouts/               # Layouts de página
│   ├── pages/                 # Páginas de la aplicación
│   └── styles/                # Estilos CSS
├── public/                    # Archivos estáticos
├── dist/                      # Build compilado
├── server.mjs                 # Servidor Node.js para producción
├── ecosystem.config.cjs       # Configuración PM2
├── astro.config.mjs          # Configuración Astro
├── package.json              # Dependencias y scripts
├── DEPLOY.md                 # Documentación completa de deploy
└── README.md                 # Este archivo
```

## 🔧 Configuración de Producción

### Servidor (Amazon EC2)
- **OS:** Amazon Linux 2023
- **IP:** 18.184.20.26
- **Dominio:** electron.finance
- **Puertos:** 80 (HTTP) → 3000, 443 (HTTPS) → 3001

### Variables de Entorno Producción
```bash
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
PUBLIC_SITE_URL=https://electron.finance
```

### SSL/HTTPS
- Certificados Let's Encrypt automáticos
- Renovación automática configurada
- Redirección HTTP → HTTPS

## 🚨 Troubleshooting

### Problemas Comunes

#### Deploy falla
```bash
# Ver logs del deploy
ssh electron-ec2 "pm2 logs --lines 50"

# Deploy manual
ssh electron-ec2
cd /var/www/electron
pnpm install
pm2 reload all
```

#### Aplicación no responde
```bash
# Verificar estado
ssh electron-ec2 "pm2 status"

# Reiniciar aplicación
ssh electron-ec2 "pm2 restart all"
```

#### Problemas de SSL
```bash
# Verificar certificados
ssh electron-ec2 "sudo certbot certificates"

# Renovar manualmente
ssh electron-ec2 "sudo certbot renew"
```

## 📊 Monitoreo

### Comandos Útiles
```bash
# Estado de la aplicación
ssh electron-ec2 "pm2 status"

# Logs en tiempo real
ssh electron-ec2 "pm2 logs"

# Monitoreo de recursos
ssh electron-ec2 "pm2 monit"

# Estado del sistema
ssh electron-ec2 "df -h && free -h"
```

### URLs de Monitoreo
- **Aplicación:** https://electron.finance
- **Estado HTTP:** https://electron.finance/health (si está configurado)

## 🔄 Rollback

En caso de problemas, puedes volver a la versión anterior:

```bash
# Ver historial de commits
git log --oneline -5

# Volver a commit anterior
git checkout production
git reset --hard HEAD~1
git push production production:main --force
```

## 📚 Documentación Adicional

- **[DEPLOY.md](./DEPLOY.md)** - Documentación completa del sistema de deploy
- **[Astro Docs](https://docs.astro.build/)** - Documentación oficial de Astro
- **[Supabase Docs](https://supabase.com/docs)** - Documentación de Supabase

## 🤝 Contribución

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Contacto

- **Aplicación:** https://electron.finance
- **Repositorio:** GitHub (privado)
- **Servidor:** ec2-user@18.184.20.26

---

**Última actualización:** 17 de septiembre de 2025  
**Versión:** 1.0  
**Mantenido por:** Equipo de desarrollo ELECTRON