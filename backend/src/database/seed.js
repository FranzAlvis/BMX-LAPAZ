const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default points table
  console.log('Creating default points table...');
  await prisma.pointsTable.deleteMany({ where: { isDefault: true } });
  
  const pointsData = [
    { place: 1, points: 1, isDefault: true },
    { place: 2, points: 2, isDefault: true },
    { place: 3, points: 3, isDefault: true },
    { place: 4, points: 4, isDefault: true },
    { place: 5, points: 5, isDefault: true },
    { place: 6, points: 6, isDefault: true },
    { place: 7, points: 7, isDefault: true },
    { place: 8, points: 8, isDefault: true },
    { place: 9, points: 9, isDefault: true }, // DNF/DNS/DQ
  ];

  for (const point of pointsData) {
    await prisma.pointsTable.create({ data: point });
  }

  // Create default categories
  console.log('Creating default categories...');
  const categories = [
    { name: 'STRIDERS', minAge: 2, maxAge: 4, gender: 'Mixed', wheel: 'TWENTY_INCH' },
    { name: 'SUPER CLASS', minAge: 5, maxAge: 7, gender: 'Mixed', wheel: 'TWENTY_INCH' },
    { name: 'CRUCEROS VARONES', minAge: 13, maxAge: 99, gender: 'M', wheel: 'Cruiser' },
    { name: 'CRUCEROS DAMAS', minAge: 13, maxAge: 99, gender: 'F', wheel: 'Cruiser' },
    { name: 'NOVATOS', minAge: 8, maxAge: 12, gender: 'Mixed', wheel: 'TWENTY_INCH' },
    { name: 'EXPERTOS VARONES', minAge: 13, maxAge: 99, gender: 'M', wheel: 'TWENTY_INCH' },
    { name: 'EXPERTOS DAMAS', minAge: 13, maxAge: 99, gender: 'F', wheel: 'TWENTY_INCH' },
    { name: 'INICIALES', minAge: 8, maxAge: 15, gender: 'Mixed', wheel: 'TWENTY_INCH' },
  ];

  // Clear existing categories first
  await prisma.category.deleteMany({});
  
  for (const category of categories) {
    await prisma.category.create({
      data: category,
    });
  }

  // Create default admin user
  console.log('Creating default users...');
  
  // Clear existing users first
  await prisma.user.deleteMany({});
  
  const adminPassword = await bcrypt.hash('admin123', 12);
  
  await prisma.user.create({
    data: {
      name: 'Administrador BMX',
      email: 'admin@bmx.com',
      passwordHash: adminPassword,
      role: 'Admin',
    },
  });

  // Create sample users for different roles
  const users = [
    { name: 'María Secretaria', email: 'secretaria@bmx.com', role: 'Secretaria' },
    { name: 'Carlos Cronometraje', email: 'cronometraje@bmx.com', role: 'Cronometraje' },
    { name: 'Ana Juez', email: 'juez@bmx.com', role: 'Juez' },
    { name: 'Usuario Público', email: 'publico@bmx.com', role: 'Publico' },
  ];

  for (const user of users) {
    const password = await bcrypt.hash(`${user.role.toLowerCase()}123`, 12);
    await prisma.user.create({
      data: {
        ...user,
        passwordHash: password,
      },
    });
  }

  // Create sample riders
  console.log('Creating sample riders...');
  const riders = [
    { plate: 1, firstName: 'Juan', lastName: 'Pérez', club: 'BMX La Paz', dateOfBirth: new Date('2010-03-15'), gender: 'M' },
    { plate: 2, firstName: 'María', lastName: 'García', club: 'BMX La Paz', dateOfBirth: new Date('2011-07-22'), gender: 'F' },
    { plate: 3, firstName: 'Carlos', lastName: 'López', club: 'Riders Unidos', dateOfBirth: new Date('2009-12-10'), gender: 'M' },
    { plate: 4, firstName: 'Ana', lastName: 'Martínez', club: 'BMX La Paz', dateOfBirth: new Date('2012-05-18'), gender: 'F' },
    { plate: 5, firstName: 'Diego', lastName: 'Rodríguez', club: 'Velocidad BMX', dateOfBirth: new Date('2008-09-03'), gender: 'M' },
    { plate: 6, firstName: 'Sofía', lastName: 'Hernández', club: 'BMX La Paz', dateOfBirth: new Date('2010-11-25'), gender: 'F' },
    { plate: 7, firstName: 'Miguel', lastName: 'Torres', club: 'Riders Unidos', dateOfBirth: new Date('2007-04-12'), gender: 'M' },
    { plate: 8, firstName: 'Valentina', lastName: 'Flores', club: 'Velocidad BMX', dateOfBirth: new Date('2009-08-30'), gender: 'F' },
    { plate: 9, firstName: 'Andrés', lastName: 'Morales', club: 'BMX La Paz', dateOfBirth: new Date('2006-01-20'), gender: 'M' },
    { plate: 10, firstName: 'Isabella', lastName: 'Vargas', club: 'Riders Unidos', dateOfBirth: new Date('2008-06-14'), gender: 'F' },
    { plate: 11, firstName: 'Santiago', lastName: 'Jiménez', club: 'Velocidad BMX', dateOfBirth: new Date('2005-10-08'), gender: 'M' },
    { plate: 12, firstName: 'Camila', lastName: 'Ruiz', club: 'BMX La Paz', dateOfBirth: new Date('2007-02-28'), gender: 'F' },
    { plate: 13, firstName: 'Mateo', lastName: 'Castillo', club: 'Riders Unidos', dateOfBirth: new Date('2004-12-05'), gender: 'M' },
    { plate: 14, firstName: 'Lucía', lastName: 'Mendoza', club: 'Velocidad BMX', dateOfBirth: new Date('2006-09-17'), gender: 'F' },
    { plate: 15, firstName: 'Sebastián', lastName: 'Ortega', club: 'BMX La Paz', dateOfBirth: new Date('2003-05-11'), gender: 'M' },
    { plate: 16, firstName: 'Gabriela', lastName: 'Silva', club: 'Riders Unidos', dateOfBirth: new Date('2004-08-23'), gender: 'F' },
  ];

  for (const rider of riders) {
    await prisma.rider.upsert({
      where: { plate: rider.plate },
      update: rider,
      create: rider,
    });
  }

  // Create a sample event
  console.log('Creating sample event...');
  const sampleEvent = await prisma.event.create({
    data: {
      name: 'Campeonato BMX La Paz 2024',
      description: 'Campeonato nacional de BMX en La Paz',
      date: new Date('2024-12-15'),
      venue: 'Pista BMX La Paz',
      city: 'La Paz',
      country: 'Bolivia',
      status: 'PLANNED',
    },
  });

  console.log('✅ Database seeding completed successfully!');
  console.log('');
  console.log('🔑 Default Login Credentials:');
  console.log('Admin: admin@bmx.com / admin123');
  console.log('Secretaria: secretaria@bmx.com / secretaria123');
  console.log('Cronometraje: cronometraje@bmx.com / cronometraje123');
  console.log('Juez: juez@bmx.com / juez123');
  console.log('Público: publico@bmx.com / publico123');
  console.log('');
  console.log(`📅 Sample Event Created: ${sampleEvent.name}`);
  console.log(`📊 Categories: ${categories.length} created`);
  console.log(`🏃 Riders: ${riders.length} created`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
