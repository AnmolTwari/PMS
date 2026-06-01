function createSettingsController({ settingsService }) {
  async function getMaintenance() {
    return settingsService.getMaintenanceState();
  }

  async function updateMaintenance(data, user) {
    return settingsService.updateMaintenanceState(data, user?._id || user?.id || null);
  }

  async function getSettings() {
    const [maintenance, smtp, app] = await Promise.all([
      settingsService.getMaintenanceState(),
      settingsService.getSmtpSettings(),
      settingsService.getAppSettings(),
    ]);

    return { maintenance, smtp, app };
  }

  async function updateSettings(data, user) {
    const result = {};

    if (data?.maintenance) {
      result.maintenance = await settingsService.updateMaintenanceState(data.maintenance, user?._id || user?.id || null);
    }

    if (data?.smtp) {
      result.smtp = await settingsService.updateSmtpSettings(data.smtp, user?._id || user?.id || null);
    }

    if (data?.app) {
      result.app = await settingsService.updateAppSettings(data.app, user?._id || user?.id || null);
    }

    return result;
  }

  return {
    getMaintenance,
    updateMaintenance,
    getSettings,
    updateSettings,
  };
}

module.exports = {
  createSettingsController,
};
