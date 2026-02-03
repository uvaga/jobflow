import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VacancyProgressService } from './vacancy-progress.service';
import { CreateVacancyProgressDto } from './dto/create-vacancy-progress.dto';
import { UpdateVacancyProgressDto } from './dto/update-vacancy-progress.dto';
import { QueryVacancyProgressDto } from './dto/query-vacancy-progress.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/schemas/user.schema';

@ApiTags('Vacancy Progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vacancy-progress')
export class VacancyProgressController {
  constructor(
    private readonly vacancyProgressService: VacancyProgressService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create application tracking' })
  create(@CurrentUser() user: User, @Body() dto: CreateVacancyProgressDto) {
    return this.vacancyProgressService.create(user._id.toString(), dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all applications' })
  findAll(@CurrentUser() user: User, @Query() query: QueryVacancyProgressDto) {
    return this.vacancyProgressService.findAll(user._id.toString(), query);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get application statistics' })
  getStatistics(@CurrentUser() user: User) {
    return this.vacancyProgressService.getStatistics(user._id.toString());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application by ID' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.vacancyProgressService.findOne(id, user._id.toString());
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update application' })
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateVacancyProgressDto,
  ) {
    return this.vacancyProgressService.update(id, user._id.toString(), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete application' })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.vacancyProgressService.remove(id, user._id.toString());
  }
}
