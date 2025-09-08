// migration.js - Run this once to fix existing data
const mongoose = require("mongoose");
require("dotenv").config();

async function migrateSubscriptionData() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to database for migration...");
    
    // Update all users with subscriptionPlan "FREE" to "NONE"
    const result = await mongoose.connection.db.collection('owners').updateMany(
      { subscriptionPlan: "FREE" },
      { $set: { subscriptionPlan: "NONE" } }
    );
    
    console.log(`Updated ${result.modifiedCount} users from FREE to NONE`);
    
    // Update users who don't have subscriptionPlan field (undefined)
    const result2 = await mongoose.connection.db.collection('owners').updateMany(
      { subscriptionPlan: { $exists: false } },
      { $set: { subscriptionPlan: "NONE", subscriptionExpiry: null } }
    );
    
    console.log(`Updated ${result2.modifiedCount} users with missing subscription fields`);
    
    // Verify the migration
    const noneCount = await mongoose.connection.db.collection('owners').countDocuments({ subscriptionPlan: "NONE" });
    const basicCount = await mongoose.connection.db.collection('owners').countDocuments({ subscriptionPlan: "BASIC" });
    
    console.log(`Migration complete:`);
    console.log(`- Users with NONE: ${noneCount}`);
    console.log(`- Users with BASIC: ${basicCount}`);
    
    await mongoose.connection.close();
    console.log("Migration completed successfully!");
    
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

// Run migration
migrateSubscriptionData();