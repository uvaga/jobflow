import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from './schemas/user.schema';
import { VacanciesModule } from '../vacancies/vacancies.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    VacanciesModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Export for Auth module
})
export class UsersModule {}
