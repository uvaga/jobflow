import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vacancy } from './schemas/vacancy.schema';
import { HhApiService } from './hh-api.service';
import { SearchVacanciesDto } from './dto/search-vacancies.dto';

@Injectable()
export class VacanciesService {
  constructor(
    @InjectModel(Vacancy.name) private vacancyModel: Model<Vacancy>,
    private readonly hhApiService: HhApiService,
  ) {}

  async search(params: SearchVacanciesDto) {
    return this.hhApiService.searchVacancies(params);
  }

  async findById(id: string) {
    // Check cache first
    const cached = await this.vacancyModel
      .findOne({
        hhId: id,
        cacheExpiresAt: { $gt: new Date() },
      })
      .exec();

    if (cached) {
      return cached;
    }

    // Fetch from API
    const apiData = await this.hhApiService.getVacancyById(id);

    // Cache it
    const vacancy = await this.vacancyModel.findOneAndUpdate(
      { hhId: id },
      {
        ...apiData,
        hhId: id,
        cacheExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      { upsert: true, new: true },
    );

    return vacancy;
  }

  async getDictionaries() {
    return this.hhApiService.getDictionaries();
  }
}
