import mongoose, { Schema } from 'mongoose';

const metadata = [{
  key: { type: String, required: true },
  value: { type: Schema.Types.Mixed },
}];

const annotations = [{
  version: { type: Number, required: true },
  annotator: { type: String, required: true },
  params: Schema.Types.Mixed,
  metadata,
}];

const schema = new mongoose.Schema({
  user: { type: String, required: true, immutable: true },
  date: { type: Date, required: true, immutable: true },
  whiteName: { type: String, required: true },
  blackName: { type: String, required: true },
  whiteElo: { type: Number },
  blackElo: { type: Number },
  database: { type: String, required: true },
  repertoire: {
    type: String, default: null, enum: ['white', 'black', null], immutable: true,
  },
  result: { type: Number, enum: [1, -1, 0.5], immutable: true },
  pgnraw: { type: String, set: (p) => p.trim(), immutable: true },
  metadata,
  moves: [{
    fen: { type: String, required: true },
    nextMove: { type: String, required: true },
    metadata,
    annotations,
  }],
});

schema.index({ date: -1 });
schema.index({ whiteName: 1 });
schema.index({ blackName: 1 });
schema.index({ repertoire: 1, sparse: true });
schema.index({ database: 1 });
schema.index({ user: 1 });
schema.index({ 'moves.fen': 1 });

// unique indices
schema.index({
  user: 1, whiteName: 1, blackName: 1, date: 1,
}, { unique: true });

const model = mongoose.model('Match', schema);
export default model;
