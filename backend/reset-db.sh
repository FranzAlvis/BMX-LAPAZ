#!/bin/bash

echo "🔄 Reseteando base de datos BMX Racing..."

# Detener contenedores existentes
echo "🛑 Deteniendo contenedores existentes..."
docker-compose down -v

# Limpiar volúmenes de Docker
echo "🧹 Limpiando volúmenes..."
docker volume prune -f

# Iniciar PostgreSQL
echo "🐘 Iniciando PostgreSQL..."
docker-compose up -d

# Esperar a que PostgreSQL esté listo
echo "⏳ Esperando a que PostgreSQL esté listo..."
sleep 15

# Resetear Prisma
echo "🔄 Reseteando Prisma..."
npx prisma migrate reset --force

# Generar cliente
echo "🔧 Generando cliente de Prisma..."
npx prisma generate

# Ejecutar seed
echo "🌱 Poblando base de datos..."
npm run seed

echo "✅ Base de datos reseteada correctamente!"
echo ""
echo "👤 Usuarios disponibles:"
echo "   Admin: admin@bmx.com / admin123"
echo "   Secretaría: secretaria@bmx.com / secretaria123"
echo "   Cronometraje: cronometraje@bmx.com / cronometraje123"
