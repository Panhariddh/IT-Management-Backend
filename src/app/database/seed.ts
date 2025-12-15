import 'colors';
import * as readlineSync from 'readline-sync';
import { UserSeeder } from './seeders/user.seeder';
import { AppDataSource } from '../config/data-source';
import { DepartmentSeeder } from './seeders/division/department.seeder';
import { ProgramSeeder } from './seeders/division/program.seeder';
import { SectionSeeder } from './seeders/division/section.seeder';
import { TeacherInfoSeeder } from './seeders/info/teacher.info.seeder';
import { StudentInfoSeeder } from './seeders/info/student.info.seeder';
import { HodInfoSeeder } from './seeders/info/hod.info.seeder';
import { AcademicYearSeeder } from './seeders/academic.year.seeder';

async function seed() {
  try {
    // Initialize only if not already initialized
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const tableNames = await AppDataSource.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public'`
    );

    if (tableNames.length > 0) {
      const confirm = readlineSync.keyInYNStrict(
        "This will DROP and SEED again. Proceed?".yellow
      );
      if (!confirm) {
        console.log("\nSeeding cancelled.".cyan);
        process.exit(0);
      }
    }

    await AppDataSource.synchronize(true); 
    console.log("\nSeeding tables…".green);

    // Seed
    await UserSeeder.seed();
     await DepartmentSeeder.seed();
    await ProgramSeeder.seed();
    await SectionSeeder.seed();
    await AcademicYearSeeder.seed();
    await HodInfoSeeder.seed();
    await StudentInfoSeeder.seed();
    await TeacherInfoSeeder.seed();

    console.log("\nSeed completed successfully.".green);
    process.exit(0);
  } catch (error) {
    console.log("\nSeeding error:".red, error.message);
    process.exit(1);
  }
}

seed();
