// MongoDB initialization script
// This runs once when the database is first created

db = db.getSiblingDB('jobflow');

// Create application user with read/write access
db.createUser({
  user: 'jobflow_user',
  pwd: 'jobflow_dev_password',
  roles: [
    {
      role: 'readWrite',
      db: 'jobflow',
    },
  ],
});

// Create initial collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'createdAt', 'updatedAt'],
      properties: {
        email: {
          bsonType: 'string',
          description: 'must be a string and is required',
        },
        name: {
          bsonType: 'string',
          description: 'must be a string',
        },
        createdAt: {
          bsonType: 'date',
          description: 'must be a date and is required',
        },
        updatedAt: {
          bsonType: 'date',
          description: 'must be a date and is required',
        },
      },
    },
  },
});

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });

print('✅ Database initialization completed');
