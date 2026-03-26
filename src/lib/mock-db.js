// Mock MongoDB implementation for testing without network access
// This stores data in memory and simulates MongoDB behavior

class MockDatabase {
  constructor() {
    this.collections = new Map();
  }

  collection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new MockCollection(name));
    }
    return this.collections.get(name);
  }

  async connect() {
    console.log('✅ Mock Database Connected (In-Memory)');
    return this;
  }

  async disconnect() {
    this.collections.clear();
    console.log('✅ Mock Database Disconnected');
  }
}

class MockCollection {
  constructor(name) {
    this.name = name;
    this.data = [];
    this.nextId = 1;
  }

  async findOne(query) {
    return this.data.find(doc => this.matches(doc, query));
  }

  async find(query = {}) {
    const results = this.data.filter(doc => this.matches(doc, query));
    return {
      toArray: () => Promise.resolve(results)
    };
  }

  async insertOne(doc) {
    const newDoc = { ...doc, _id: this.nextId++, createdAt: new Date() };
    this.data.push(newDoc);
    return { insertedId: newDoc._id, insertedCount: 1 };
  }

  async updateOne(query, update) {
    const doc = this.data.find(d => this.matches(d, query));
    if (doc) {
      Object.assign(doc, update.$set || update);
      return { modifiedCount: 1 };
    }
    return { modifiedCount: 0 };
  }

  async deleteOne(query) {
    const idx = this.data.findIndex(d => this.matches(d, query));
    if (idx >= 0) {
      this.data.splice(idx, 1);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  matches(doc, query) {
    return Object.entries(query).every(([key, value]) => doc[key] === value);
  }
}

module.exports = { MockDatabase, MockCollection };
