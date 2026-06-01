const AppSetting = require('../models/AppSetting');

const MAINTENANCE_KEY = 'maintenanceMode';
const SMTP_KEY = 'smtpSettings';
const APP_KEY = 'appSettings';

function createSettingsService() {
  async function getMaintenanceState() {
    const setting = await AppSetting.findOne({ key: MAINTENANCE_KEY }).lean();
    const value = setting?.value || {};

    return {
      enabled: Boolean(value.enabled),
      message: value.message || 'The system is temporarily under maintenance. Please check back soon.',
      updatedAt: setting?.updatedAt || null,
      updatedBy: setting?.updatedBy || null,
    };
  }

  async function updateMaintenanceState(data, updatedBy) {
    const nextValue = {
      enabled: Boolean(data?.enabled),
      message: (data?.message || '').trim() || 'The system is temporarily under maintenance. Please check back soon.',
    };

    const setting = await AppSetting.findOneAndUpdate(
      { key: MAINTENANCE_KEY },
      { $set: { value: nextValue, updatedBy: updatedBy || null } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();

    return {
      enabled: Boolean(setting?.value?.enabled),
      message: setting?.value?.message || nextValue.message,
      updatedAt: setting?.updatedAt || null,
      updatedBy: setting?.updatedBy || null,
    };
  }

  async function isMaintenanceEnabled() {
    const state = await getMaintenanceState();
    return state.enabled;
  }

  async function getSmtpSettings() {
    const setting = await AppSetting.findOne({ key: SMTP_KEY }).lean();
    const value = setting?.value || {};

    return {
      host: value.host || process.env.SMTP_HOST || '',
      port: String(value.port || process.env.SMTP_PORT || 587),
      secure: Boolean(value.secure ?? (process.env.SMTP_SECURE === 'true')),
      user: value.user || process.env.SMTP_USER || '',
      pass: value.pass || process.env.SMTP_PASS || '',
      from: value.from || process.env.SMTP_FROM || '',
    };
  }

  async function updateSmtpSettings(data, updatedBy) {
    const nextValue = {
      host: String(data?.host || '').trim(),
      port: Number(data?.port || 587),
      secure: Boolean(data?.secure),
      user: String(data?.user || '').trim(),
      pass: String(data?.pass || '').trim(),
      from: String(data?.from || '').trim(),
    };

    const setting = await AppSetting.findOneAndUpdate(
      { key: SMTP_KEY },
      { $set: { value: nextValue, updatedBy: updatedBy || null } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();

    return {
      host: setting?.value?.host || nextValue.host,
      port: String(setting?.value?.port || nextValue.port),
      secure: Boolean(setting?.value?.secure),
      user: setting?.value?.user || nextValue.user,
      pass: setting?.value?.pass || nextValue.pass,
      from: setting?.value?.from || nextValue.from,
    };
  }

  async function getAppSettings() {
    const setting = await AppSetting.findOne({ key: APP_KEY }).lean();
    const value = setting?.value || {};

    return {
      appName: value.appName || 'ParkSy',
      supportEmail: value.supportEmail || '',
      defaultBranchCode: value.defaultBranchCode || 'MAIN',
      updatedAt: setting?.updatedAt || null,
    };
  }

  async function updateAppSettings(data, updatedBy) {
    const nextValue = {
      appName: String(data?.appName || '').trim() || 'ParkSy',
      supportEmail: String(data?.supportEmail || '').trim(),
      defaultBranchCode: String(data?.defaultBranchCode || 'MAIN').trim().toUpperCase() || 'MAIN',
    };

    const setting = await AppSetting.findOneAndUpdate(
      { key: APP_KEY },
      { $set: { value: nextValue, updatedBy: updatedBy || null } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();

    return {
      appName: setting?.value?.appName || nextValue.appName,
      supportEmail: setting?.value?.supportEmail || nextValue.supportEmail,
      defaultBranchCode: setting?.value?.defaultBranchCode || nextValue.defaultBranchCode,
      updatedAt: setting?.updatedAt || null,
    };
  }

  return {
    getMaintenanceState,
    updateMaintenanceState,
    isMaintenanceEnabled,
    getSmtpSettings,
    updateSmtpSettings,
    getAppSettings,
    updateAppSettings,
  };
}

module.exports = {
  createSettingsService,
};
