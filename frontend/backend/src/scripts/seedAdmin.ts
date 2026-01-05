import { AppDataSource } from '../config/database';
import { Hospital } from '../entities/Hospital';
import { User, UserRole } from '../entities/User';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('Data Source has been initialized!');

    const hospitalRepo = AppDataSource.getRepository(Hospital);
    const userRepo = AppDataSource.getRepository(User);

    // Create a default hospital if it doesn't exist
    let hospital = await hospitalRepo.findOneBy({ code: 'SYSTEM' });
    if (!hospital) {
      hospital = hospitalRepo.create({
        name: 'System Hospital',
        code: 'SYSTEM',
      });
      await hospitalRepo.save(hospital);
      console.log('Created System Hospital');
    }

    // Create an admin user if it doesn't exist
    let admin = await userRepo.findOneBy({ username: 'admin', hospital_id: hospital.id });
    if (!admin) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      admin = userRepo.create({
        username: 'admin',
        password_hash: passwordHash,
        role: UserRole.ADMIN,
        hospital_id: hospital.id,
        is_active: true,
      });
      await userRepo.save(admin);
      console.log('Created admin user (username: admin, password: admin123)');
    } else {
      console.log('Admin user already exists');
    }

    await AppDataSource.destroy();
  } catch (err) {
    console.error('Error during seeding:', err);
  }
}

seed();
