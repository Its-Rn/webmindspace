import mongoose from 'mongoose';

const { Schema } = mongoose;

const siteSettingsSchema = new Schema(
  {
    siteName: {
      type: String,
      required: true,
      trim: true,
      default: 'Pulse',
      maxlength: 100
    },
    siteLogoText: {
      type: String,
      required: true,
      trim: true,
      default: 'P',
      maxlength: 10
    },
    siteTagline: {
      type: String,
      trim: true,
      default: 'Personal OS',
      maxlength: 200
    },
    contactEmail: {
      type: String,
      trim: true,
      default: 'admin@example.com'
    },
    customFooterText: {
      type: String,
      trim: true,
      default: '© 2026 Pulse. All rights reserved.',
      maxlength: 500
    },
    allowRegistration: {
      type: Boolean,
      default: true
    },
    allowTimelineDelete: {
      type: Boolean,
      default: false
    },
    allowTimelineEdit: {
      type: Boolean,
      default: false
    },
    landingPageContent: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

siteSettingsSchema.methods.toSettingsJSON = function toSettingsJSON() {
  return {
    id: this._id.toString(),
    siteName: this.siteName,
    siteLogoText: this.siteLogoText,
    siteTagline: this.siteTagline,
    contactEmail: this.contactEmail,
    customFooterText: this.customFooterText,
    allowRegistration: this.allowRegistration,
    allowTimelineDelete: this.allowTimelineDelete,
    allowTimelineEdit: this.allowTimelineEdit,
    landingPageContent: this.landingPageContent || {},
    updatedAt: this.updatedAt
  };
};

const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);

export default SiteSettings;
