function createSecurityController({ logService }) {
  async function list({ page = 1, limit = 50, from, to } = {}) {
    return logService.listLogs({ page, limit, from, to });
  }

  return { list };
}

module.exports = { createSecurityController };
