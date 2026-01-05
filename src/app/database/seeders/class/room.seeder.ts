import { AppDataSource } from '../../../config/data-source';
import { RoomModel } from '../../models/class/room.model';

export class RoomSeeder {
  static async seed() {
    const repo = AppDataSource.getRepository(RoomModel);

    const rooms = [
      // Building A - Lecture Halls
      { room_code: 'A101', building: 'A', capacity: 100 },
      { room_code: 'A102', building: 'A', capacity: 100 },
      { room_code: 'A103', building: 'A', capacity: 80 },
      { room_code: 'A201', building: 'A', capacity: 60 },
      { room_code: 'A202', building: 'A', capacity: 60 },
      
      // Building B - Classrooms
      { room_code: 'B101', building: 'B', capacity: 40 },
      { room_code: 'B102', building: 'B', capacity: 40 },
      { room_code: 'B103', building: 'B', capacity: 40 },
      { room_code: 'B201', building: 'B', capacity: 30 },
      { room_code: 'B202', building: 'B', capacity: 30 },
      
      // Building C - Labs
      { room_code: 'C101', building: 'C', capacity: 25, description: 'Computer Lab' },
      { room_code: 'C102', building: 'C', capacity: 25, description: 'Computer Lab' },
      { room_code: 'C201', building: 'C', capacity: 20, description: 'Science Lab' },
      { room_code: 'C202', building: 'C', capacity: 20, description: 'Science Lab' },
      
      // Building D - Medical
      { room_code: 'D101', building: 'D', capacity: 30, description: 'Anatomy Lab' },
      { room_code: 'D102', building: 'D', capacity: 30, description: 'Medical Lab' },
    ];

    for (const roomData of rooms) {
      const existing = await repo.findOne({ where: { room_code: roomData.room_code } });
      if (!existing) {
        await repo.save(repo.create({
          ...roomData,
          is_active: true,
        }));
      }
    }

    console.log('✅ RoomSeeder completed.');
  }
}