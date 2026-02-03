import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from './schemas/user.schema';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
  @ApiOperation({ summary: 'Get saved vacancies' })
  getSavedVacancies(@CurrentUser() user: User) {
    return this.usersService.getSavedVacancies(user._id.toString());
  }

  @Post('me/vacancies/:vacancyId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add vacancy to saved list' })
  addVacancy(
    @CurrentUser() user: User,
    @Param('vacancyId') vacancyId: string,
  ) {
    return this.usersService.addVacancy(user._id.toString(), vacancyId);
  }

  @Delete('me/vacancies/:vacancyId')
  @ApiOperation({ summary: 'Remove vacancy from saved list' })
  removeVacancy(
    @CurrentUser() user: User,
    @Param('vacancyId') vacancyId: string,
  ) {
    return this.usersService.removeVacancy(user._id.toString(), vacancyId);
  }
}
