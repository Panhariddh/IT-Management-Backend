import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModel } from 'src/app/database/models/user.model';
import { MinioService } from '../../services/minio/minio.service';
import { AdminProfileController } from './admin-profile.controller';
import { HodProfileController } from './hod-profile.controller';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { StudentProfileController } from './student-profile.controller';
import { TeacherProfileController } from './teacher-profile.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserModel])],
  controllers: [
    ProfileController,
    AdminProfileController,
    TeacherProfileController,
    StudentProfileController,
    HodProfileController,
  ],
  providers: [ProfileService, MinioService],
})
export class ProfileModule {}
