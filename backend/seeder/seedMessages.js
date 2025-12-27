const mongoose = require('mongoose');
const Message = require('../models/Message');
require('dotenv').config();

const sampleMessages = [
  {
    text: "Hello from MongoDB Atlas! 🚀",
    sender: "System",
    timestamp: new Date()
  },
  {
    text: "Frontend and backend are now connected to the cloud! ☁️",
    sender: "System",
    timestamp: new Date()
  },
  {
    text: "Messages are now persistent and stored in the database! 💾",
    sender: "System",
    timestamp: new Date()
  },
  {
    text: "You can now create, read, update, and delete messages! ✨",
    sender: "System",
    timestamp: new Date()
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('🗄️ Connected to MongoDB Atlas');
    
    // Clear existing messages
    await Message.deleteMany({});
    console.log('🧹 Cleared existing messages');
    
    // Insert sample messages
    const insertedMessages = await Message.insertMany(sampleMessages);
    console.log(`✅ Inserted ${insertedMessages.length} sample messages`);
    
    // Display inserted messages
    console.log('\n📝 Sample messages:');
    insertedMessages.forEach((msg, index) => {
      console.log(`${index + 1}. ${msg.text} (by ${msg.sender})`);
    });
    
    console.log('\n🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
