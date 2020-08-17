import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  version: { type: Number, required: true, unique: true },
  date: { type: Date, required: true, default: Date.now() },
});
const model = mongoose.model('Version', schema);
export default model;
