const { Schema, model } = require('mongoose');

const toggleSchema = new Schema(
  {
    key: { type: String, required: true }, // command name or service name
    type: { type: String, enum: ['command', 'service'], required: true },
    enabled: { type: Boolean, default: true },
    devOnly: { type: Boolean, default: false }, // only valid for command toggles
    guildId: { type: String, default: null }, // null for global toggles, or guild-specific
  },
  { timestamps: true }
);

toggleSchema.index({ key: 1, type: 1, guildId: 1 }, { unique: true });

module.exports = model('Toggle', toggleSchema);
