const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  }
}, {
  timestamps: true
});

// Static helper: Get a setting by key with optional default
settingsSchema.statics.getValue = async function(key, defaultValue = null) {
  const doc = await this.findOne({ key });
  return doc ? doc.value : defaultValue;
};

// Static helper: Set a setting by key (upsert)
settingsSchema.statics.setValue = async function(key, value, adminId = null, description = '') {
  return this.findOneAndUpdate(
    { key },
    { value, updatedBy: adminId, ...(description && { description }) },
    { upsert: true, new: true }
  );
};

module.exports = mongoose.model('Settings', settingsSchema);
