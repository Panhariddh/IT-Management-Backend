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
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Roles } from 'src/app/common/decorators/roles.decorator';
import { DayOfWeek } from 'src/app/common/enum/dayofweek.enum';
import { Role } from 'src/app/common/enum/role.enum';
import { JwtAuthGuard } from 'src/app/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/app/common/guards/roles.guard';
import { CreateScheduleDto, UpdateScheduleDto } from './schedule.dto';
import { ScheduleService } from './schedule.service';

@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  @Roles(Role.ADMIN, Role.HEAD_OF_DEPARTMENT, Role.TEACHER)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(@Body() createScheduleDto: CreateScheduleDto) {
    return await this.scheduleService.create(createScheduleDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.HEAD_OF_DEPARTMENT, Role.TEACHER, Role.STUDENT)
  async findAll(@Request() req) {
    // Extract user info from JWT token
    const userRole = req.user?.role;
    const userId = req.user?.id;

    return await this.scheduleService.findAll(userRole, userId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.HEAD_OF_DEPARTMENT, Role.TEACHER, Role.STUDENT)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.scheduleService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.HEAD_OF_DEPARTMENT, Role.TEACHER)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ) {
    return await this.scheduleService.update(id, updateScheduleDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.HEAD_OF_DEPARTMENT, Role.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.scheduleService.remove(id);
  }

  @Get('room/:roomId')
  @Roles(Role.ADMIN, Role.HEAD_OF_DEPARTMENT, Role.TEACHER, Role.STUDENT)
  async getSchedulesByRoom(@Param('roomId', ParseIntPipe) roomId: number) {
    return await this.scheduleService.getSchedulesByRoom(roomId);
  }

  @Get('class/:classId')
  @Roles(Role.ADMIN, Role.HEAD_OF_DEPARTMENT, Role.TEACHER, Role.STUDENT)
  async getSchedulesByClass(@Param('classId', ParseIntPipe) classId: number) {
    return await this.scheduleService.getSchedulesByClass(classId);
  }

  @Get('day/:day')
  @Roles(Role.ADMIN, Role.HEAD_OF_DEPARTMENT, Role.TEACHER, Role.STUDENT)
  async getSchedulesByDay(@Param('day') day: DayOfWeek) {
    return await this.scheduleService.getSchedulesByDay(day);
  }

  // Special admin-only endpoints
  @Get('admin/all')
  @Roles(Role.ADMIN)
  async findAllIncludingInactive() {
    return await this.scheduleService.findAllIncludingInactive();
  }

  @Put('admin/restore/:id')
  @Roles(Role.ADMIN)
  async restore(@Param('id', ParseIntPipe) id: number) {
    return await this.scheduleService.restore(id);
  }

  @Delete('admin/hard/:id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async hardDelete(@Param('id', ParseIntPipe) id: number) {
    return await this.scheduleService.hardDelete(id);
  }
}
