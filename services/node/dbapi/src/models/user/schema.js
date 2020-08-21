import mongoose, { Schema } from 'mongoose';

const schema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  alias: [{ type: String }],
  authentication: [{
    name: { type: String, required: true, set: (p) => p.trim() },
    token: { type: String, required: true },
    active: { type: Boolean, required: true, default: true },
  }],
  scrapeTasks: [{
    name: { type: String, required: true },
    params: Schema.Types.Mixed,
  }],
});

const model = mongoose.model('User', schema);
export default model;
