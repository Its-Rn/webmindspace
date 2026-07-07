import SiteSettings from '../models/SiteSettings.js';
import { ensureSiteSettings } from '../config/ensureSiteSettings.js';

export const getSettings = async () => {
  let settings = await SiteSettings.findOne();
  if (!settings) {
    settings = await ensureSiteSettings();
  }
  return settings.toSettingsJSON();
};

export const updateSettings = async (payload) => {
  let settings = await SiteSettings.findOne();
  if (!settings) {
    settings = new SiteSettings();
  }

  if (payload.siteName !== undefined) settings.siteName = payload.siteName;
  if (payload.siteLogoText !== undefined) settings.siteLogoText = payload.siteLogoText;
  if (payload.siteTagline !== undefined) settings.siteTagline = payload.siteTagline;
  if (payload.contactEmail !== undefined) settings.contactEmail = payload.contactEmail;
  if (payload.customFooterText !== undefined) settings.customFooterText = payload.customFooterText;
  if (payload.allowRegistration !== undefined) settings.allowRegistration = payload.allowRegistration;
  if (payload.landingPageContent !== undefined) {
    settings.landingPageContent = payload.landingPageContent;
    settings.markModified('landingPageContent');
  }

  await settings.save();
  return settings.toSettingsJSON();
};
