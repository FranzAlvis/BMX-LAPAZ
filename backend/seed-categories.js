const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedCategories() {
  try {
    // Check if categories already exist
    const existingCategories = await prisma.category.count()
    
    if (existingCategories > 0) {
      console.log(`Database already has ${existingCategories} categories. Skipping seed.`)
      return
    }

    // Sample BMX categories
    const categories = [
      {
        name: 'Cruiser 17-24 Masculino',
        minAge: 17,
        maxAge: 24,
        gender: 'M',
        wheel: 'Cruiser',
        maxRiders: 32
      },
      {
        name: 'Cruiser 17-24 Femenino',
        minAge: 17,
        maxAge: 24,
        gender: 'F',
        wheel: 'Cruiser',
        maxRiders: 32
      },
      {
        name: 'Cruiser 25-29 Masculino',
        minAge: 25,
        maxAge: 29,
        gender: 'M',
        wheel: 'Cruiser',
        maxRiders: 32
      },
      {
        name: 'Cruiser 25-29 Femenino',
        minAge: 25,
        maxAge: 29,
        gender: 'F',
        wheel: 'Cruiser',
        maxRiders: 32
      },
      {
        name: 'Cruiser 30+ Masculino',
        minAge: 30,
        maxAge: 99,
        gender: 'M',
        wheel: 'Cruiser',
        maxRiders: 32
      },
      {
        name: 'Cruiser 30+ Femenino',
        minAge: 30,
        maxAge: 99,
        gender: 'F',
        wheel: 'Cruiser',
        maxRiders: 32
      },
      {
        name: '5-6 Años Mixto',
        minAge: 5,
        maxAge: 6,
        gender: 'Mixed',
        wheel: 'TWENTY_INCH',
        maxRiders: 32
      },
      {
        name: '7-8 Años Masculino',
        minAge: 7,
        maxAge: 8,
        gender: 'M',
        wheel: 'TWENTY_INCH',
        maxRiders: 32
      },
      {
        name: '7-8 Años Femenino',
        minAge: 7,
        maxAge: 8,
        gender: 'F',
        wheel: 'TWENTY_INCH',
        maxRiders: 32
      },
      {
        name: '9-10 Años Masculino',
        minAge: 9,
        maxAge: 10,
        gender: 'M',
        wheel: 'TWENTY_INCH',
        maxRiders: 32
      },
      {
        name: '9-10 Años Femenino',
        minAge: 9,
        maxAge: 10,
        gender: 'F',
        wheel: 'TWENTY_INCH',
        maxRiders: 32
      },
      {
        name: '11-12 Años Masculino',
        minAge: 11,
        maxAge: 12,
        gender: 'M',
        wheel: 'TWENTY_INCH',
        maxRiders: 32
      },
      {
        name: '11-12 Años Femenino',
        minAge: 11,
        maxAge: 12,
        gender: 'F',
        wheel: 'TWENTY_INCH',
        maxRiders: 32
      },
      {
        name: '13-14 Años Masculino',
        minAge: 13,
        maxAge: 14,
        gender: 'M',
        wheel: 'TWENTY_INCH',
        maxRiders: 32
      },
      {
        name: '13-14 Años Femenino',
        minAge: 13,
        maxAge: 14,
        gender: 'F',
        wheel: 'TWENTY_INCH',
        maxRiders: 32
      },
      {
        name: '15-16 Años Masculino',
        minAge: 15,
        maxAge: 16,
        gender: 'M',
        wheel: 'TWENTY_INCH',
        maxRiders: 32
      },
      {
        name: '15-16 Años Femenino',
        minAge: 15,
        maxAge: 16,
        gender: 'F',
        wheel: 'TWENTY_INCH',
        maxRiders: 32
      },
      {
        name: 'Junior 17-18 Masculino',
        minAge: 17,
        maxAge: 18,
        gender: 'M',
        wheel: 'TWENTY_INCH',
        maxRiders: 32
      },
      {
        name: 'Junior 17-18 Femenino',
        minAge: 17,
        maxAge: 18,
        gender: 'F',
        wheel: 'TWENTY_INCH',
        maxRiders: 32
      },
      {
        name: 'Elite Masculino',
        minAge: 19,
        maxAge: 99,
        gender: 'M',
        wheel: 'TWENTY_INCH',
        maxRiders: 32
      },
      {
        name: 'Elite Femenino',
        minAge: 19,
        maxAge: 99,
        gender: 'F',
        wheel: 'TWENTY_INCH',
        maxRiders: 32
      }
    ]

    console.log('Seeding categories...')
    
    for (const category of categories) {
      await prisma.category.create({
        data: category
      })
      console.log(`Created category: ${category.name}`)
    }

    console.log(`Successfully seeded ${categories.length} categories!`)
    
  } catch (error) {
    console.error('Error seeding categories:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  seedCategories()
    .then(() => {
      console.log('Seed completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Seed failed:', error)
      process.exit(1)
    })
}

module.exports = { seedCategories }
