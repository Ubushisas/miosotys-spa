// Script to update services to have minPeople: 4, maxPeople: 6
// Run with: node update-services.js

require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const servicesToUpdate = [
  'Tarde de Chicas',
  'Pasabordo Rápido de Desestrés',
  'Experiencia de Renovación Corporal',
  'Día de Spa para Adolescentes',
  'Aventura Spa para Preadolescentes',
  'Feliz 15 Años con tus Mejores Amigas',
  'Celebración de Cumpleaños',
  'Despedida de Soltera'
];

async function updateServices() {
  try {
    console.log('🔄 Starting services update...\n');

    // Get current settings
    const settings = await prisma.calendarSettings.findFirst();

    if (!settings || !settings.services) {
      console.error('❌ No settings found in database');
      return;
    }

    const updatedServices = {};
    let updateCount = 0;

    // Update each category's services
    for (const [categoryKey, categoryServices] of Object.entries(settings.services)) {
      updatedServices[categoryKey] = categoryServices.map(service => {
        if (servicesToUpdate.includes(service.name)) {
          updateCount++;
          console.log(`✅ Updating: ${service.name}`);
          console.log(`   Old: minPeople=${service.minPeople || 'N/A'}, maxPeople=${service.maxPeople || 'N/A'}`);
          console.log(`   New: minPeople=4, maxPeople=6`);

          // Update description if it doesn't already have the max personas text
          let newDescription = service.description || '';
          if (!newDescription.includes('Max Personas:')) {
            newDescription += (newDescription ? ' ' : '') + 'Max Personas: 4 a 6 personas';
          }

          return {
            ...service,
            minPeople: 4,
            maxPeople: 6,
            description: newDescription
          };
        }
        return service;
      });
    }

    // Update database
    await prisma.calendarSettings.update({
      where: { id: settings.id },
      data: {
        services: updatedServices
      }
    });

    console.log(`\n✅ Successfully updated ${updateCount} services!`);
    console.log('\n📝 Updated services:');
    servicesToUpdate.forEach(name => console.log(`   - ${name}`));

  } catch (error) {
    console.error('❌ Error updating services:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateServices();
