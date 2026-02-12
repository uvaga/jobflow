import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
    // Check cache only (cached copies have cacheExpiresAt, user snapshots do not)
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
    const mappedData = this.mapHhApiToVacancy(apiData);

    // Cache it with 7-day TTL (skip validation — external API data may lack optional fields)
    const vacancy = new this.vacancyModel({
      ...mappedData,
      hhId: id,
      cacheExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return vacancy.save({ validateBeforeSave: false });
  }

  /**
   * Fetch vacancy from hh.ru API and create a new permanent snapshot (no TTL).
   * Each user save creates a separate document.
   */
  async saveVacancyFromHh(hhId: string): Promise<Vacancy> {
    const apiData = await this.hhApiService.getVacancyById(hhId);
    const mappedData = this.mapHhApiToVacancy(apiData);

    // Skip validation — external API data may lack fields marked as required
    const vacancy = new this.vacancyModel({
      ...mappedData,
      hhId,
    });

    return vacancy.save({ validateBeforeSave: false });
  }

  /**
   * Re-fetch vacancy from hh.ru API and update a specific document by ObjectId.
   */
  async refreshVacancyById(
    vacancyId: Types.ObjectId,
    hhId: string,
  ): Promise<Vacancy> {
    const apiData = await this.hhApiService.getVacancyById(hhId);
    const mappedData = this.mapHhApiToVacancy(apiData);

    const vacancy = await this.vacancyModel
      .findByIdAndUpdate(
        vacancyId,
        { ...mappedData, hhId },
        { new: true },
      )
      .exec();

    if (!vacancy) {
      throw new NotFoundException(`Vacancy not found`);
    }

    return vacancy;
  }

  /**
   * Delete a vacancy document by ObjectId.
   */
  async deleteById(id: Types.ObjectId): Promise<void> {
    await this.vacancyModel.deleteOne({ _id: id }).exec();
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
