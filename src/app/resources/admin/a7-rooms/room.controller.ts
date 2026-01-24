import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Roles } from 'src/app/common/decorators/roles.decorator';
import { Role } from 'src/app/common/enum/role.enum';
import { JwtAuthGuard } from 'src/app/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/app/common/guards/roles.guard';
import { CreateRoomDto, UpdateRoomDto } from './room.dto';
import { RoomService } from './room.service';

@Controller('rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @Roles(Role.ADMIN, Role.HEAD_OF_DEPARTMENT, Role.TEACHER)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(@Body() createRoomDto: CreateRoomDto) {
    return await this.roomService.create(createRoomDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.HEAD_OF_DEPARTMENT, Role.TEACHER, Role.STUDENT)
  async findAll() {
    return await this.roomService.findAll();
  }

  @Get('search')
  @Roles(Role.ADMIN, Role.HEAD_OF_DEPARTMENT, Role.TEACHER, Role.STUDENT)
  async search(@Query('q') query: string) {
    return await this.roomService.searchRooms(query);
  }

  @Get('building/:building')
  @Roles(Role.ADMIN, Role.HEAD_OF_DEPARTMENT, Role.TEACHER, Role.STUDENT)
  async getByBuilding(@Param('building') building: string) {
    return await this.roomService.getRoomsByBuilding(building);
  }

  @Get('available')
  @Roles(Role.ADMIN, Role.HEAD_OF_DEPARTMENT, Role.TEACHER, Role.STUDENT)
  async getAvailableRooms(
    @Query('day') day: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('capacity') capacity?: number,
  ) {
    return await this.roomService.getAvailableRooms(
      day,
      startTime,
      endTime,
      capacity,
    );
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.HEAD_OF_DEPARTMENT, Role.TEACHER, Role.STUDENT)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.roomService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.HEAD_OF_DEPARTMENT, Role.TEACHER)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    return await this.roomService.update(id, updateRoomDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.HEAD_OF_DEPARTMENT, Role.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.roomService.remove(id);
  }

  // Special admin-only endpoints
  @Get('admin/all')
  @Roles(Role.ADMIN)
  async findAllIncludingInactive() {
    return await this.roomService.findAllIncludingInactive();
  }

  @Put('admin/restore/:id')
  @Roles(Role.ADMIN)
  async restore(@Param('id', ParseIntPipe) id: number) {
    return await this.roomService.restore(id);
  }

  @Delete('admin/hard/:id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async hardDelete(@Param('id', ParseIntPipe) id: number) {
    return await this.roomService.hardDelete(id);
  }

  @Get('admin/stats')
  @Roles(Role.ADMIN)
  async getRoomStatistics() {
    return await this.roomService.getRoomStatistics();
  }
}
