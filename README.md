# 🏁 Sistema BMX Racing - Modernizado

Sistema completo de gestión de carreras BMX modernizado con tecnologías actuales.

## 🚀 Características Principales

- **Gestión de Eventos**: Creación y administración de eventos de carreras BMX
- **Registro de Corredores**: Sistema completo de registro y gestión de participantes
- **Categorías**: Gestión de categorías por edad, género y nivel
- **Inscripciones**: Sistema de inscripciones con validación automática
- **Carreras y Motos**: Generación automática de motos con algoritmo de asignación de carriles
- **Resultados**: Captura rápida de resultados con cronometraje
- **Reportes**: Generación de reportes en PDF y CSV
- **Roles de Usuario**: Sistema de permisos granular
- **Dashboard en Tiempo Real**: Actualizaciones en vivo
- **Interfaz Moderna**: UI/UX moderna con Tailwind CSS

## 🛠️ Stack Tecnológico

### Backend
- **Node.js** con Express.js
- **Prisma ORM** para gestión de base de datos
- **PostgreSQL** como base de datos principal
- **JWT** para autenticación
- **Socket.IO** para actualizaciones en tiempo real
- **Docker** para PostgreSQL

### Frontend
- **Vue.js 3** con Composition API
- **Pinia** para gestión de estado
- **Vue Router** para navegación
- **Tailwind CSS** para estilos
- **Heroicons** para iconografía
- **Axios** para comunicación con API

## 📋 Roles de Usuario

- **Admin**: Acceso completo al sistema
- **Secretaría**: Gestión de eventos, corredores e inscripciones
- **Cronometraje**: Captura de resultados y tiempos
- **Juez**: Marcado de descalificaciones y penalizaciones
- **Público**: Visualización de resultados y clasificaciones

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- Docker y Docker Compose
- Git

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd bici2
```

### 2. Configurar Backend
```bash
cd backend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones
```

### 3. Configurar Base de Datos
```bash
# Iniciar PostgreSQL con Docker
docker-compose up -d

# Aplicar migraciones de Prisma
npx prisma migrate dev

# Generar cliente Prisma
npx prisma generate

# Poblar base de datos con datos iniciales
npm run db:seed
```

### 4. Configurar Frontend
```bash
cd ../frontend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con la URL de tu API
```

### 5. Iniciar el Sistema
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## 🌐 URLs del Sistema

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Base de Datos**: localhost:5432

## 👤 Usuarios de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@bmx.com | admin123 |
| Secretaría | secretaria@bmx.com | secretaria123 |
| Cronometraje | cronometraje@bmx.com | cronometraje123 |
| Juez | juez@bmx.com | juez123 |

## 📁 Estructura del Proyecto

```
bici2/
├── backend/                 # Servidor Node.js
│   ├── src/
│   │   ├── routes/         # Rutas de la API
│   │   ├── middleware/     # Middleware personalizado
│   │   └── database/       # Scripts de base de datos
│   ├── prisma/
│   │   ├── schema.prisma   # Esquema de base de datos
│   │   └── migrations/     # Migraciones
│   └── docker-compose.yml  # PostgreSQL
├── frontend/               # Aplicación Vue.js
│   ├── src/
│   │   ├── views/         # Páginas principales
│   │   ├── layouts/       # Layouts de la aplicación
│   │   ├── stores/        # Stores de Pinia
│   │   ├── router/        # Configuración de rutas
│   │   └── services/      # Servicios (API)
│   └── public/
└── README.md              # Este archivo
```

## 🔧 Scripts Disponibles

### Backend
```bash
npm run dev          # Iniciar servidor en modo desarrollo
npm run build        # Construir para producción
npm run start        # Iniciar servidor de producción
npm run db:seed      # Poblar base de datos
npm run db:generate  # Generar cliente Prisma
npm run db:push      # Sincronizar esquema con BD
npm run db:migrate   # Ejecutar migraciones
```

### Frontend
```bash
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Construir para producción
npm run preview      # Vista previa de producción
```

## 🏆 Funcionalidades Principales

### Gestión de Eventos
- Creación de eventos con fechas y ubicaciones
- Estados: Planificado, Activo, Completado, Cancelado
- Dashboard con estadísticas en tiempo real

### Sistema de Carreras
- Generación automática de motos por categoría
- Algoritmo de asignación de carriles (BEM-like)
- Gestión de heats y rondas
- Control de estados de carrera

### Captura de Resultados
- Interfaz rápida para cronometraje
- Soporte para DNS, DNF, DQ
- Cálculo automático de puntos
- Validación de resultados

### Reportes y Estadísticas
- Listas de largada
- Resultados por carrera
- Clasificaciones finales
- Podios por categoría
- Ranking anual
- Exportación PDF/CSV

## 🔐 Seguridad

- Autenticación JWT
- Autorización basada en roles
- Validación de entrada
- Rate limiting
- Logs de auditoría
- Encriptación de contraseñas

## 🌟 Características Avanzadas

- **Tiempo Real**: Actualizaciones automáticas vía Socket.IO
- **Responsive**: Interfaz adaptable a dispositivos móviles
- **Offline**: Capacidades offline para captura de resultados
- **Import/Export**: Soporte para CSV
- **Audit Trail**: Registro completo de actividades
- **Backup**: Sistema de respaldo automático

## 🐛 Solución de Problemas

### Error de Base de Datos
```bash
# Resetear base de datos
cd backend
docker-compose down -v
docker-compose up -d
npx prisma migrate reset
npm run db:seed
```

### Error de Dependencias
```bash
# Limpiar e instalar
rm -rf node_modules package-lock.json
npm install
```

### Puerto en Uso
```bash
# Verificar procesos en puertos
lsof -i :3000  # Backend
lsof -i :5173  # Frontend
```

## 📞 Soporte

Para reportar problemas o solicitar nuevas características, por favor crear un issue en el repositorio.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

**Desarrollado con ❤️ para la comunidad BMX**
