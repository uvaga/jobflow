import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { QuerySavedVacanciesDto } from './dto/query-saved-vacancies.dto';
import { VacanciesService } from '../vacancies/vacancies.service';
import { Vacancy } from '../vacancies/schemas/vacancy.schema';
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
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async changePassword(id: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.userModel.findById(id).select('+password').exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await user.save();

    return { message: 'Password changed successfully' };
  }

  /**
   * Save a vacancy: fetch from hh.ru, create per-user snapshot, add to user's savedVacancies.
   */
  async addVacancy(userId: string, hhId: string): Promise<User> {
    // Check if already saved by this user
    const existingUser = await this.userModel
      .findById(userId)
      .populate('savedVacancies.vacancy')
      .exec();

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const alreadySaved = existingUser.savedVacancies.some(
      (sv) => (sv.vacancy as any)?.hhId === hhId,
    );

    if (alreadySaved) {
      return existingUser;
    }

    // Create a new vacancy snapshot for this user
    const vacancy = await this.vacanciesService.saveVacancyFromHh(hhId);
    const vacancyObjectId = vacancy._id as Types.ObjectId;

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

    return user!;
  }

  /**
   * Remove a vacancy from user's savedVacancies and delete the vacancy snapshot.
   */
  async removeVacancy(userId: string, hhId: string): Promise<User> {
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
      return user;
    }

    const vacancyId = (entry.vacancy as any)._id as Types.ObjectId;

    // Delete the vacancy snapshot from the collection
    await this.vacanciesService.deleteById(vacancyId);

    // Remove from user's savedVacancies
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $pull: { savedVacancies: { vacancy: vacancyId } } },
        { new: true },
      )
      .exec();

    return updatedUser!;
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
    // Find user's specific vacancy via populate
    const existingUser = await this.userModel
      .findById(userId)
      .populate('savedVacancies.vacancy')
      .exec();

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const entry = existingUser.savedVacancies.find(
      (sv) => (sv.vacancy as any)?.hhId === hhId,
    );

    if (!entry) {
      throw new NotFoundException('Saved vacancy not found');
    }

    const vacancyId = (entry.vacancy as any)._id as Types.ObjectId;

    const user = await this.userModel
      .findOneAndUpdate(
        {
          _id: userId,
          'savedVacancies.vacancy': vacancyId,
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
    const updatedEntry = user.savedVacancies.find(
      (sv) => (sv.vacancy as any)?.hhId === hhId,
    );

    return updatedEntry;
  }

  /**
   * Update notes for a saved vacancy.
   */
  async updateVacancyNotes(
    userId: string,
    hhId: string,
    notes: string,
  ): Promise<any> {
    const existingUser = await this.userModel
      .findById(userId)
      .populate('savedVacancies.vacancy')
      .exec();

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const entry = existingUser.savedVacancies.find(
      (sv) => (sv.vacancy as any)?.hhId === hhId,
    );

    if (!entry) {
      throw new NotFoundException('Saved vacancy not found');
    }

    const vacancyId = (entry.vacancy as any)._id as Types.ObjectId;

    const user = await this.userModel
      .findOneAndUpdate(
        {
          _id: userId,
          'savedVacancies.vacancy': vacancyId,
        },
        {
          $set: {
            'savedVacancies.$.notes': notes,
          },
        },
        { new: true },
      )
      .populate('savedVacancies.vacancy')
      .exec();

    if (!user) {
      throw new NotFoundException('Saved vacancy not found');
    }

    return user.savedVacancies.find(
      (sv) => (sv.vacancy as any)?.hhId === hhId,
    );
  }

  /**
   * Update checklist for a saved vacancy.
   */
  async updateVacancyChecklist(
    userId: string,
    hhId: string,
    checklist: { text: string; checked: boolean }[],
  ): Promise<any> {
    const existingUser = await this.userModel
      .findById(userId)
      .populate('savedVacancies.vacancy')
      .exec();

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const entry = existingUser.savedVacancies.find(
      (sv) => (sv.vacancy as any)?.hhId === hhId,
    );

    if (!entry) {
      throw new NotFoundException('Saved vacancy not found');
    }

    const vacancyId = (entry.vacancy as any)._id as Types.ObjectId;

    const user = await this.userModel
      .findOneAndUpdate(
        {
          _id: userId,
          'savedVacancies.vacancy': vacancyId,
        },
        {
          $set: {
            'savedVacancies.$.checklist': checklist,
          },
        },
        { new: true },
      )
      .populate('savedVacancies.vacancy')
      .exec();

    if (!user) {
      throw new NotFoundException('Saved vacancy not found');
    }

    return user.savedVacancies.find(
      (sv) => (sv.vacancy as any)?.hhId === hhId,
    );
  }

  /**
   * Refresh a user's saved vacancy snapshot from hh.ru API.
   */
  async refreshVacancy(userId: string, hhId: string): Promise<Vacancy> {
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

    const vacancyId = (entry.vacancy as any)._id as Types.ObjectId;
    return this.vacanciesService.refreshVacancyById(vacancyId, hhId);
  }
}
