import { Injectable, NotFoundException } from '@nestjs/common';
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
    // Check cache first (includes both cached and permanently saved vacancies)
    const cached = await this.vacancyModel
      .findOne({
        hhId: id,
        $or: [
          { cacheExpiresAt: { $gt: new Date() } },
          { cacheExpiresAt: { $exists: false } },
        ],
      })
      .exec();

    if (cached) {
      return cached;
    }

    // Fetch from API
    const apiData = await this.hhApiService.getVacancyById(id);
    const mappedData = this.mapHhApiToVacancy(apiData);

    // Cache it with 7-day TTL
    const vacancy = await this.vacancyModel.findOneAndUpdate(
      { hhId: id },
      {
        ...mappedData,
        hhId: id,
        cacheExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      { upsert: true, new: true },
    );

    return vacancy;
  }

  async findByHhId(hhId: string): Promise<Vacancy | null> {
    return this.vacancyModel.findOne({ hhId }).exec();
  }

  /**
   * Save vacancy permanently from hh.ru API (no TTL).
   * If vacancy already exists, removes cacheExpiresAt to make it permanent.
   */
  async saveVacancyFromHh(hhId: string): Promise<Vacancy> {
    // Check if vacancy already exists
    const existing = await this.vacancyModel.findOne({ hhId }).exec();

    if (existing) {
      // Make permanent by removing cacheExpiresAt
      if (existing.cacheExpiresAt) {
        await this.vacancyModel
          .updateOne({ hhId }, { $unset: { cacheExpiresAt: 1 } })
          .exec();
        existing.cacheExpiresAt = undefined;
      }
      return existing;
    }

    // Fetch from hh.ru API
    const apiData = await this.hhApiService.getVacancyById(hhId);
    const mappedData = this.mapHhApiToVacancy(apiData);

    // Save permanently (no cacheExpiresAt)
    const vacancy = await this.vacancyModel.findOneAndUpdate(
      { hhId },
      { ...mappedData, hhId },
      { upsert: true, new: true },
    );

    return vacancy;
  }

  /**
   * Re-fetch vacancy from hh.ru API and update MongoDB.
   */
  async refreshVacancyFromHh(hhId: string): Promise<Vacancy> {
    const apiData = await this.hhApiService.getVacancyById(hhId);
    const mappedData = this.mapHhApiToVacancy(apiData);

    const vacancy = await this.vacancyModel
      .findOneAndUpdate(
        { hhId },
        { ...mappedData, hhId },
        { new: true },
      )
      .exec();

    if (!vacancy) {
      throw new NotFoundException(`Vacancy with hhId ${hhId} not found`);
    }

    return vacancy;
  }

  async getDictionaries() {
    return this.hhApiService.getDictionaries();
  }

  /**
   * Map hh.ru API response (snake_case) to Vacancy schema fields (camelCase).
   */
  mapHhApiToVacancy(apiData: any): Partial<Vacancy> {
    return {
      name: apiData.name,
      employer: apiData.employer
        ? {
            id: apiData.employer.id,
            name: apiData.employer.name,
            url: apiData.employer.url,
            logoUrls: apiData.employer.logo_urls,
            alternateUrl: apiData.employer.alternate_url,
            trusted: apiData.employer.trusted,
            accreditedItEmployer: apiData.employer.accredited_it_employer,
          }
        : undefined,
      salary: apiData.salary,
      area: apiData.area,
      url: apiData.url,
      alternateUrl: apiData.alternate_url,
      description: apiData.description,
      schedule: apiData.schedule,
      experience: apiData.experience,
      employment: apiData.employment,
      keySkills: apiData.key_skills,
      professionalRoles: apiData.professional_roles,
      address: apiData.address,
      contacts: apiData.contacts,
      workFormat: apiData.work_format,
      workingHours: apiData.working_hours,
      workScheduleByDays: apiData.work_schedule_by_days,
      acceptHandicapped: apiData.accept_handicapped,
      acceptKids: apiData.accept_kids,
      acceptTemporary: apiData.accept_temporary,
      acceptIncompleteResumes: apiData.accept_incomplete_resumes,
      publishedAt: apiData.published_at
        ? new Date(apiData.published_at)
        : undefined,
    } as any;
  }
}
