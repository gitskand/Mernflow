// test-mongo.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('MONGO_URI not set');
  process.exit(1);
}

mongoose.connect(uri)
  .then(() => { console.log('Connected OK'); process.exit(0); })
  .catch(err => { console.error('Connect failed:', err); process.exit(1); });
