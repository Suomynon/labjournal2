// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

print('Creating lab_journal database...');

// Switch to the lab_journal database
db = db.getSiblingDB('lab_journal');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "email", "hashed_password", "role"],
      properties: {
        id: { bsonType: "string" },
        email: { bsonType: "string" },
        hashed_password: { bsonType: "string" },
        role: { bsonType: "string" },
        is_active: { bsonType: "bool" },
        created_at: { bsonType: "date" }
      }
    }
  }
});

db.createCollection('roles', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "name", "display_name", "permissions"],
      properties: {
        id: { bsonType: "string" },
        name: { bsonType: "string" },
        display_name: { bsonType: "string" },
        description: { bsonType: "string" },
        permissions: { bsonType: "array" },
        is_system: { bsonType: "bool" }
      }
    }
  }
});

db.createCollection('permissions');
db.createCollection('chemicals');
db.createCollection('experiments');
db.createCollection('activity_logs');

// Create indexes for better performance
print('Creating indexes...');

// User indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });

// Role indexes
db.roles.createIndex({ "name": 1 }, { unique: true });

// Chemical indexes
db.chemicals.createIndex({ "name": 1 });
db.chemicals.createIndex({ "location": 1 });
db.chemicals.createIndex({ "created_by": 1 });

// Experiment indexes
db.experiments.createIndex({ "title": 1 });
db.experiments.createIndex({ "date": -1 });
db.experiments.createIndex({ "created_by": 1 });

// Activity log indexes
db.activity_logs.createIndex({ "timestamp": -1 });
db.activity_logs.createIndex({ "user_id": 1 });
db.activity_logs.createIndex({ "action": 1 });
db.activity_logs.createIndex({ "resource_type": 1 });

print('MongoDB initialization completed successfully!');
