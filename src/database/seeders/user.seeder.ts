import { UserEntity } from '../../modules/user/models/user.model';
import { AppDataSource } from '../../config/data-source';

export class UserSeeder {
  static async seed() {
    const repo = AppDataSource.getRepository(UserEntity);

    await repo.save({
      name: "Admin",
      stuId: "00000",
      email: "admin@example.com",
      password: "123456",
      phone: "012345678",
      gender: "Male",
      address: "Phnom Penh",
      dob: new Date("2000-01-01"),
      year: "4",
      emergencyContact: "099888777"
    });

    console.log("UserSeeder completed.");
  }
}
