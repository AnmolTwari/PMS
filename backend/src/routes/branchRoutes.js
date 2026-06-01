const express = require('express');

function createBranchRoutes(branchController, authenticateToken, requireRole) {
  const router = express.Router();

  router.get('/', authenticateToken, requireRole('admin'), async (_req, res) => {
    try {
      return res.json(await branchController.list());
    } catch (err) {
      return res.status(500).json({ message: 'Failed to list branches', error: err.message });
    }
  });

  router.get('/default', async (_req, res) => {
    try {
      return res.json(await branchController.getDefault());
    } catch (err) {
      return res.status(500).json({ message: 'Failed to load default branch', error: err.message });
    }
  });

  router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const branch = await branchController.create(req.body);
      return res.status(201).json(branch);
    } catch (err) {
      return res.status(400).json({ message: 'Failed to create branch', error: err.message });
    }
  });

  return router;
}

module.exports = { createBranchRoutes };
