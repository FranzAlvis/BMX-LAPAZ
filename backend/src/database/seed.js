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

  // Get created categories for assignment
  const createdCategories = await prisma.category.findMany({});
  const striders = createdCategories.find(c => c.name === 'STRIDERS');
  const superClass = createdCategories.find(c => c.name === 'SUPER CLASS');
  const novatos = createdCategories.find(c => c.name === 'NOVATOS');
  const expertosVarones = createdCategories.find(c => c.name === 'EXPERTOS VARONES');
  const expertosDamas = createdCategories.find(c => c.name === 'EXPERTOS DAMAS');
  const crucerosVarones = createdCategories.find(c => c.name === 'CRUCEROS VARONES');
  const crucerosDamas = createdCategories.find(c => c.name === 'CRUCEROS DAMAS');
  const iniciales = createdCategories.find(c => c.name === 'INICIALES');

  // Create sample riders with category assignments
  console.log('Creating sample riders with categories...');
  const riders = [
    // STRIDERS (2-4 años)
    { plate: 1, firstName: 'Matías', lastName: 'Pérez', club: 'BMX La Paz', dateOfBirth: new Date('2021-03-15'), gender: 'M', categoryId: striders?.id },
    { plate: 2, firstName: 'Sofía', lastName: 'García', club: 'BMX La Paz', dateOfBirth: new Date('2022-07-22'), gender: 'F', categoryId: striders?.id },
    
    // SUPER CLASS (5-7 años)
    { plate: 3, firstName: 'Diego', lastName: 'López', club: 'Riders Unidos', dateOfBirth: new Date('2018-12-10'), gender: 'M', categoryId: superClass?.id },
    { plate: 4, firstName: 'Emma', lastName: 'Martínez', club: 'BMX La Paz', dateOfBirth: new Date('2019-05-18'), gender: 'F', categoryId: superClass?.id },
    
    // NOVATOS (8-12 años)
    { plate: 5, firstName: 'Carlos', lastName: 'Rodríguez', club: 'Velocidad BMX', dateOfBirth: new Date('2015-09-03'), gender: 'M', categoryId: novatos?.id },
    { plate: 6, firstName: 'Valentina', lastName: 'Hernández', club: 'BMX La Paz', dateOfBirth: new Date('2014-11-25'), gender: 'F', categoryId: novatos?.id },
    { plate: 7, firstName: 'Miguel', lastName: 'Torres', club: 'Riders Unidos', dateOfBirth: new Date('2013-04-12'), gender: 'M', categoryId: novatos?.id },
    { plate: 8, firstName: 'Isabella', lastName: 'Flores', club: 'Velocidad BMX', dateOfBirth: new Date('2012-08-30'), gender: 'F', categoryId: novatos?.id },
    
    // INICIALES (8-15 años)
    { plate: 9, firstName: 'Andrés', lastName: 'Morales', club: 'BMX La Paz', dateOfBirth: new Date('2011-01-20'), gender: 'M', categoryId: iniciales?.id },
    { plate: 10, firstName: 'Camila', lastName: 'Vargas', club: 'Riders Unidos', dateOfBirth: new Date('2010-06-14'), gender: 'F', categoryId: iniciales?.id },
    
    // EXPERTOS VARONES (13+ años)
    { plate: 11, firstName: 'Santiago', lastName: 'Jiménez', club: 'Velocidad BMX', dateOfBirth: new Date('2005-10-08'), gender: 'M', categoryId: expertosVarones?.id },
    { plate: 12, firstName: 'Mateo', lastName: 'Castillo', club: 'Riders Unidos', dateOfBirth: new Date('2004-12-05'), gender: 'M', categoryId: expertosVarones?.id },
    { plate: 13, firstName: 'Sebastián', lastName: 'Ortega', club: 'BMX La Paz', dateOfBirth: new Date('2003-05-11'), gender: 'M', categoryId: expertosVarones?.id },
    { plate: 14, firstName: 'Alejandro', lastName: 'Mendoza', club: 'Velocidad BMX', dateOfBirth: new Date('2002-09-17'), gender: 'M', categoryId: expertosVarones?.id },
    
    // EXPERTOS DAMAS (13+ años)
    { plate: 15, firstName: 'Lucía', lastName: 'Ruiz', club: 'BMX La Paz', dateOfBirth: new Date('2006-02-28'), gender: 'F', categoryId: expertosDamas?.id },
    { plate: 16, firstName: 'Gabriela', lastName: 'Silva', club: 'Riders Unidos', dateOfBirth: new Date('2004-08-23'), gender: 'F', categoryId: expertosDamas?.id },
    { plate: 17, firstName: 'María', lastName: 'Vega', club: 'Velocidad BMX', dateOfBirth: new Date('2003-11-15'), gender: 'F', categoryId: expertosDamas?.id },
    
    // CRUCEROS VARONES (13+ años)
    { plate: 18, firstName: 'Roberto', lastName: 'Chávez', club: 'BMX La Paz', dateOfBirth: new Date('2001-03-20'), gender: 'M', categoryId: crucerosVarones?.id },
    { plate: 19, firstName: 'Fernando', lastName: 'Moreno', club: 'Riders Unidos', dateOfBirth: new Date('2000-07-12'), gender: 'M', categoryId: crucerosVarones?.id },
    
    // CRUCEROS DAMAS (13+ años)
    { plate: 20, firstName: 'Ana', lastName: 'Delgado', club: 'Velocidad BMX', dateOfBirth: new Date('2001-09-08'), gender: 'F', categoryId: crucerosDamas?.id },
    { plate: 21, firstName: 'Patricia', lastName: 'Romero', club: 'BMX La Paz', dateOfBirth: new Date('2000-12-03'), gender: 'F', categoryId: crucerosDamas?.id },
  ];

  // Clear existing riders first
  await prisma.rider.deleteMany({});

  for (const rider of riders) {
    await prisma.rider.create({
      data: rider,
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
  console.log(`🏃 Riders: ${riders.length} created with category assignments`);

}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
