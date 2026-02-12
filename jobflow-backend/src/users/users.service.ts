import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QuerySavedVacanciesDto } from './dto/query-saved-vacancies.dto';
import { VacanciesService } from '../vacancies/vacancies.service';
import { VacancyProgressStatus } from '../vacancy-progress/enums/vacancy-progress-status.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly vacanciesService: VacanciesService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = new this.userModel(createUserDto);
    return user.save();
  }

  async findById(id: string): Promise<User | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.userModel.findById(id).exec();
  }

  async findByEmail(
    email: string,
    includePassword = false,
  ): Promise<User | null> {
    const query = this.userModel.findOne({ email });
    if (includePassword) {
      query.select('+password');
    }
    return query.exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Save a vacancy: fetch from hh.ru, store permanently, add to user's savedVacancies.
   */
  async addVacancy(userId: string, hhId: string): Promise<User> {
    // Fetch and save vacancy permanently from hh.ru
    const vacancy = await this.vacanciesService.saveVacancyFromHh(hhId);
    const vacancyObjectId = vacancy._id as Types.ObjectId;

    // Check if already saved by this user
    const alreadySaved = await this.userModel
      .findOne({
        _id: userId,
        'savedVacancies.vacancy': vacancyObjectId,
      })
      .exec();

    if (alreadySaved) {
      return alreadySaved;
    }

    // Add to savedVacancies with initial progress
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $push: {
            savedVacancies: {
              vacancy: vacancyObjectId,
              progress: [
                {
                  status: VacancyProgressStatus.SAVED,
                  statusSetDate: new Date(),
                },
              ],
            },
          },
        },
        { new: true },
      )
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Remove a vacancy from user's savedVacancies.
   */
  async removeVacancy(userId: string, hhId: string): Promise<User> {
    const vacancy = await this.vacanciesService.findByHhId(hhId);
    if (!vacancy) {
      throw new NotFoundException(`Vacancy with hhId ${hhId} not found`);
    }

    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $pull: { savedVacancies: { vacancy: vacancy._id } } },
        { new: true },
      )
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Get saved vacancies with filtering, sorting, and pagination.
   */
  async getSavedVacancies(userId: string, query: QuerySavedVacanciesDto) {
    const { status, sortBy = 'savedDate', sortOrder = 'desc', page = 0, limit = 20 } = query;

    const user = await this.userModel
      .findById(userId)
      .populate('savedVacancies.vacancy')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let items = user.savedVacancies.filter((entry) => entry.vacancy != null);

    // Filter by current progress status (last entry in progress array)
    if (status) {
      items = items.filter((entry) => {
        if (entry.progress.length === 0) return false;
        const currentStatus = entry.progress[entry.progress.length - 1].status;
        return currentStatus === status;
      });
    }

    // Sort
    items.sort((a, b) => {
      const direction = sortOrder === 'asc' ? 1 : -1;

      if (sortBy === 'name') {
        const nameA = (a.vacancy as any)?.name || '';
        const nameB = (b.vacancy as any)?.name || '';
        return nameA.localeCompare(nameB) * direction;
      }

      // Default: sort by saved date (first progress entry's statusSetDate)
      const dateA = a.progress[0]?.statusSetDate?.getTime() || 0;
      const dateB = b.progress[0]?.statusSetDate?.getTime() || 0;
      return (dateA - dateB) * direction;
    });

    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedItems = items.slice(page * limit, (page + 1) * limit);

    return {
      items: paginatedItems,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get a single saved vacancy by hhId with progress data.
   */
  async getSavedVacancyByHhId(userId: string, hhId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate('savedVacancies.vacancy')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const entry = user.savedVacancies.find(
      (sv) => (sv.vacancy as any)?.hhId === hhId,
    );

    if (!entry) {
      throw new NotFoundException('Saved vacancy not found');
    }

    return entry;
  }

  /**
   * Update progress status for a saved vacancy.
   */
  async updateVacancyProgress(
    userId: string,
    hhId: string,
    status: string,
  ): Promise<any> {
    const vacancy = await this.vacanciesService.findByHhId(hhId);
    if (!vacancy) {
      throw new NotFoundException(`Vacancy with hhId ${hhId} not found`);
    }

    const user = await this.userModel
      .findOneAndUpdate(
        {
          _id: userId,
          'savedVacancies.vacancy': vacancy._id,
        },
        {
          $push: {
            'savedVacancies.$.progress': {
              status,
              statusSetDate: new Date(),
            },
          },
        },
        { new: true },
      )
      .populate('savedVacancies.vacancy')
      .exec();

    if (!user) {
      throw new NotFoundException('Saved vacancy not found');
    }

    // Return the updated entry
    const entry = user.savedVacancies.find(
      (sv) => (sv.vacancy as any)?.hhId === hhId,
    );

    return entry;
  }
}
