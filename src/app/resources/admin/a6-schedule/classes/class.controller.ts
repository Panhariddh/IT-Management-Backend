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
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Roles } from 'src/app/common/decorators/roles.decorator';
import { Role } from 'src/app/common/enum/role.enum';
import { JwtAuthGuard } from 'src/app/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/app/common/guards/roles.guard';
import { ClassResponseDto, CreateClassDto, UpdateClassDto } from './class.dto';
import { ClassService } from './class.service';

@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Post()
  @Roles(Role.ADMIN, Role.HEAD_OF_DEPARTMENT, Role.TEACHER)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(@Body() createClassDto: CreateClassDto) {
    const classEntity = await this.classService.create(createClassDto);
    return new ClassResponseDto(classEntity);
  }

  @Get()
  @Roles(Role.ADMIN, Role.HEAD_OF_DEPARTMENT, Role.TEACHER, Role.STUDENT)
  async findAll() {
    const classes = await this.classService.findAll();
    return classes.map((classEntity) => new ClassResponseDto(classEntity));
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.HEAD_OF_DEPARTMENT, Role.TEACHER, Role.STUDENT)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const classEntity = await this.classService.findOne(id);
    return new ClassResponseDto(classEntity);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.HEAD_OF_DEPARTMENT, Role.TEACHER)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClassDto: UpdateClassDto,
  ) {
    const classEntity = await this.classService.update(id, updateClassDto);
    return new ClassResponseDto(classEntity);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.HEAD_OF_DEPARTMENT, Role.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.classService.remove(id);
  }

  @Get('subject/:subjectId')
  @Roles(Role.ADMIN, Role.HEAD_OF_DEPARTMENT, Role.TEACHER, Role.STUDENT)
  async getClassesBySubject(
    @Param('subjectId', ParseIntPipe) subjectId: number,
  ) {
    const classes = await this.classService.getClassesBySubject(subjectId);
    return classes.map((classEntity) => new ClassResponseDto(classEntity));
  }

  @Get('semester/:semesterId')
  @Roles(Role.ADMIN, Role.HEAD_OF_DEPARTMENT, Role.TEACHER, Role.STUDENT)
  async getClassesBySemester(
    @Param('semesterId', ParseIntPipe) semesterId: number,
  ) {
    const classes = await this.classService.getClassesBySemester(semesterId);
    return classes.map((classEntity) => new ClassResponseDto(classEntity));
  }

  @Get('subject/:subjectId/semester/:semesterId')
  @Roles(Role.ADMIN, Role.HEAD_OF_DEPARTMENT, Role.TEACHER, Role.STUDENT)
  async getClassesBySubjectAndSemester(
    @Param('subjectId', ParseIntPipe) subjectId: number,
    @Param('semesterId', ParseIntPipe) semesterId: number,
  ) {
    const classes = await this.classService.getClassesBySubjectAndSemester(
      subjectId,
      semesterId,
    );
    return classes.map((classEntity) => new ClassResponseDto(classEntity));
  }

  // Admin-only endpoints
  @Get('admin/all')
  @Roles(Role.ADMIN)
  async findAllIncludingInactive() {
    const classes = await this.classService.findAllIncludingInactive();
    return classes.map((classEntity) => new ClassResponseDto(classEntity));
  }

  @Put('admin/restore/:id')
  @Roles(Role.ADMIN)
  async restore(@Param('id', ParseIntPipe) id: number) {
    const classEntity = await this.classService.restore(id);
    return new ClassResponseDto(classEntity);
  }

  @Delete('admin/hard/:id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async hardDelete(@Param('id', ParseIntPipe) id: number) {
    return await this.classService.hardDelete(id);
  }
}
