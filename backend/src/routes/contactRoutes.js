const express = require('express');

function createContactRoutes(contactController) {
  const router = express.Router();

  router.post('/', contactController.sendContactMessage);

  return router;
}

module.exports = {
  createContactRoutes,
};