import { Connection } from 'mongoose';

export class CleanupHelper {
  constructor(private connection: Connection) {}

  async cleanDatabase() {
    const collections = this.connection.collections;

    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }

  async cleanCollection(collectionName: string) {
    if (this.connection.collections[collectionName]) {
      await this.connection.collections[collectionName].deleteMany({});
    }
  }

  async dropDatabase() {
    await this.connection.dropDatabase();
  }
}
