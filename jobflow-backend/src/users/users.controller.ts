import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { QuerySavedVacanciesDto } from './dto/query-saved-vacancies.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from './schemas/user.schema';
import { VacanciesService } from '../vacancies/vacancies.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly vacanciesService: VacanciesService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@CurrentUser() user: User) {
    return user;
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user._id.toString(), dto);
  }

  @Get('me/vacancies')
  @ApiOperation({ summary: 'Get saved vacancies with filters and pagination' })
  getSavedVacancies(
    @CurrentUser() user: User,
    @Query() query: QuerySavedVacanciesDto,
  ) {
    return this.usersService.getSavedVacancies(user._id.toString(), query);
  }

  @Get('me/vacancies/:hhId')
  @ApiOperation({ summary: 'Get saved vacancy detail by hh.ru ID' })
  getSavedVacancyDetail(
    @CurrentUser() user: User,
    @Param('hhId') hhId: string,
  ) {
    return this.usersService.getSavedVacancyByHhId(
      user._id.toString(),
      hhId,
    );
  }

  @Post('me/vacancies/:hhId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save vacancy (fetches from hh.ru and stores permanently)' })
  addVacancy(
    @CurrentUser() user: User,
    @Param('hhId') hhId: string,
  ) {
    return this.usersService.addVacancy(user._id.toString(), hhId);
  }

  @Delete('me/vacancies/:hhId')
  @ApiOperation({ summary: 'Remove vacancy from saved list' })
  removeVacancy(
    @CurrentUser() user: User,
    @Param('hhId') hhId: string,
  ) {
    return this.usersService.removeVacancy(user._id.toString(), hhId);
  }

  @Post('me/vacancies/:hhId/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh saved vacancy from hh.ru API' })
  refreshVacancy(
    @CurrentUser() user: User,
    @Param('hhId') hhId: string,
  ) {
    return this.vacanciesService.refreshVacancyFromHh(hhId);
  }

  @Patch('me/vacancies/:hhId/progress')
  @ApiOperation({ summary: 'Update progress status for saved vacancy' })
  updateVacancyProgress(
    @CurrentUser() user: User,
    @Param('hhId') hhId: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.usersService.updateVacancyProgress(
      user._id.toString(),
      hhId,
      dto.status,
    );
  }
}
