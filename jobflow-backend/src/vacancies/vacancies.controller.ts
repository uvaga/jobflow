import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VacanciesService } from './vacancies.service';
import { SearchVacanciesDto } from './dto/search-vacancies.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Vacancies')
@Controller('vacancies')
export class VacanciesController {
  constructor(private readonly vacanciesService: VacanciesService) {}

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search vacancies from hh.ru' })
  search(@Query() params: SearchVacanciesDto) {
    return this.vacanciesService.search(params);
  }

  @Public()
  @Get('dictionaries')
  @ApiOperation({ summary: 'Get hh.ru dictionaries' })
  getDictionaries() {
    return this.vacanciesService.getDictionaries();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get vacancy by ID' })
  findById(@Param('id') id: string) {
    return this.vacanciesService.findById(id);
  }
}
