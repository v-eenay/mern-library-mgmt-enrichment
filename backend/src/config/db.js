import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();
// Get MongoDB connection URL from environment variable
const mongoURI = process.env.DB_URL;

// Connect to MongoDB
mongoose.connect(mongoURI);
// Get the default connection
const db = mongoose.connection;
// Event handlers for connection events
db.on("error", (err) => {
  console.error(`MongoDB connection error: ${err}`);
});
db.once("open", () => {
  console.log("Connected to MongoDB");
});
export default db;