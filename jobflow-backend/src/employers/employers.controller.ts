import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EmployersService } from './employers.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Employers')
@Controller('employers')
export class EmployersController {
  constructor(private readonly employersService: EmployersService) {}

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get employer details from hh.ru' })
  getEmployer(@Param('id') id: string) {
    return this.employersService.getEmployerById(id);
  }
}
