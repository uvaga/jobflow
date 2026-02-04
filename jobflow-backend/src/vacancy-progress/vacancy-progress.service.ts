import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VacancyProgress } from './schemas/vacancy-progress.schema';
import { CreateVacancyProgressDto } from './dto/create-vacancy-progress.dto';
import { UpdateVacancyProgressDto } from './dto/update-vacancy-progress.dto';
import { QueryVacancyProgressDto } from './dto/query-vacancy-progress.dto';

@Injectable()
export class VacancyProgressService {
  constructor(
    @InjectModel(VacancyProgress.name)
    private vacancyProgressModel: Model<VacancyProgress>,
  ) {}

  async create(userId: string, dto: CreateVacancyProgressDto) {
    const vacancyProgress = new this.vacancyProgressModel({
      ...dto,
      userId: new Types.ObjectId(userId),
      vacancyId: new Types.ObjectId(dto.vacancyId),
    });
    return vacancyProgress.save();
  }

  async findAll(userId: string, query: QueryVacancyProgressDto) {
    const { status, page = 0, limit = 20 } = query;
    const filter: any = { userId: new Types.ObjectId(userId) };

    if (status) {
      filter.status = status;
    }

    return this.vacancyProgressModel
      .find(filter)
      .populate('vacancyId')
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit)
      .exec();
  }

  async findOne(id: string, userId: string) {
    const vacancyProgress = await this.vacancyProgressModel
      .findOne({ _id: id, userId: new Types.ObjectId(userId) })
      .populate('vacancyId')
      .exec();

    if (!vacancyProgress) {
      throw new NotFoundException('VacancyProgress not found');
    }

    return vacancyProgress;
  }

  async update(id: string, userId: string, dto: UpdateVacancyProgressDto) {
    const vacancyProgress = await this.vacancyProgressModel
      .findOneAndUpdate(
        { _id: id, userId: new Types.ObjectId(userId) },
        dto,
        { new: true },
      )
      .exec();

    if (!vacancyProgress) {
      throw new NotFoundException('VacancyProgress not found');
    }

    return vacancyProgress;
  }

  async remove(id: string, userId: string) {
    const result = await this.vacancyProgressModel
      .deleteOne({ _id: id, userId: new Types.ObjectId(userId) })
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('VacancyProgress not found');
    }

    return { message: 'VacancyProgress deleted successfully' };
  }

  async getStatistics(userId: string) {
    const stats = await this.vacancyProgressModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    return stats.reduce(
      (acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}
