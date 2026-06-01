require('dotenv').config();

const express = require('express');
const http = require('http');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');

const { connectDatabase } = require('./src/config/database');
const { createAuthMiddleware } = require('./src/middleware/auth');
const { createMaintenanceMiddleware } = require('./src/middleware/maintenance');
const { initializeParkingSlots, seedAdminUser } = require('./src/services/seedService');
const { createAuthController } = require('./src/controllers/authController');
const { createDashboardController } = require('./src/controllers/dashboardController');
const { createParkingController } = require('./src/controllers/parkingController');
const { createVehicleController } = require('./src/controllers/vehicleController');
const { createContactController } = require('./src/controllers/contactController');
const { createPasswordController } = require('./src/controllers/passwordController');
const { createAuthRoutes } = require('./src/routes/authRoutes');
const { createDashboardRoutes } = require('./src/routes/dashboardRoutes');
const { createParkingRoutes } = require('./src/routes/parkingRoutes');
const { createVehicleRoutes } = require('./src/routes/vehicleRoutes');
const { createContactRoutes } = require('./src/routes/contactRoutes');
const { createPasswordRoutes } = require('./src/routes/passwordRoutes');
const { createGuardController } = require('./src/controllers/guardController');
const { createGuardRoutes } = require('./src/routes/guardRoutes');
const { createHistoryController } = require('./src/controllers/historyController');
const { createHistoryRoutes } = require('./src/routes/historyRoutes');
const { createRecurringController } = require('./src/controllers/recurringController');
const { createRecurringRoutes } = require('./src/routes/recurringRoutes');
const { createWaitlistController } = require('./src/controllers/waitlistController');
const { createWaitlistRoutes } = require('./src/routes/waitlistRoutes');
const { createNotificationController } = require('./src/controllers/notificationController');
const { createAnalyticsController } = require('./src/controllers/analyticsController');
const { createAnalyticsRoutes } = require('./src/routes/analyticsRoutes');
const { createReportsController } = require('./src/controllers/reportsController');
const { createReportsRoutes } = require('./src/routes/reportsRoutes');
const { createPassController } = require('./src/controllers/passController');
const { createPassRoutes } = require('./src/routes/passRoutes');
const { createLogService } = require('./src/services/logService');
const { createSecurityController } = require('./src/controllers/securityController');
const { createSecurityRoutes } = require('./src/routes/securityRoutes');
const { createSettingsService } = require('./src/services/settingsService');
const { createSettingsController } = require('./src/controllers/settingsController');
const { createSettingsRoutes } = require('./src/routes/settingsRoutes');
const { createBranchController } = require('./src/controllers/branchController');
const { createBranchRoutes } = require('./src/routes/branchRoutes');
const { createUserController } = require('./src/controllers/userController');
const { createUserRoutes } = require('./src/routes/userRoutes');
const BlockedVehicle = require('./src/models/BlockedVehicle');
const { createBlockedController } = require('./src/controllers/blockedController');
const { createBlockedRoutes } = require('./src/routes/blockedRoutes');
const { createNotificationRoutes } = require('./src/routes/notificationRoutes');
const { setSocketServer } = require('./src/services/realtime');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true,
    credentials: true,
  },
});
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'pms-session-secret';
const CLIENT_DIST_DIR = path.join(__dirname, '..', 'client', 'dist');
const CLIENT_INDEX_FILE = path.join(CLIENT_DIST_DIR, 'index.html');
const HAS_CLIENT_BUILD = fs.existsSync(CLIENT_INDEX_FILE);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (HAS_CLIENT_BUILD) {
  app.use(express.static(CLIENT_DIST_DIR));
}

const { authenticateToken, requireRole } = createAuthMiddleware(JWT_SECRET);
const authController = createAuthController({ jwtSecret: JWT_SECRET });
const dashboardController = createDashboardController();
const parkingController = createParkingController();
const vehicleController = createVehicleController();
const contactController = createContactController();
const passwordController = createPasswordController();
const historyController = createHistoryController();
const recurringController = createRecurringController();
const waitlistController = createWaitlistController();
const notificationController = createNotificationController();
const analyticsController = createAnalyticsController();
const reportsController = createReportsController();
const passController = createPassController();
const logService = createLogService({ jwtSecret: JWT_SECRET });
const securityController = createSecurityController({ logService });
const settingsService = createSettingsService();
const settingsController = createSettingsController({ settingsService });
const branchController = createBranchController();
const userController = createUserController();
const blockedController = createBlockedController({ BlockedVehicleModel: BlockedVehicle });
const guardController = createGuardController({ blockedController });

app.use('/api', createMaintenanceMiddleware(settingsService, JWT_SECRET));

app.use('/api/auth', createAuthRoutes(authController, authenticateToken));
app.use('/api/dashboard', createDashboardRoutes(dashboardController, authenticateToken, requireRole));
app.use('/api/slots', createParkingRoutes(parkingController, authenticateToken, requireRole, dashboardController.buildUserDashboard));
app.use('/api/vehicles', createVehicleRoutes(vehicleController, authenticateToken, requireRole));
app.use('/api/contact', createContactRoutes(contactController));
app.use('/api/password', createPasswordRoutes(passwordController));
app.use('/api/guard', createGuardRoutes(guardController, authenticateToken, requireRole));
app.use('/api/history', createHistoryRoutes(historyController, authenticateToken, requireRole));
app.use('/api/waitlist', createWaitlistRoutes(waitlistController, authenticateToken, requireRole));
app.use('/api/recurring', createRecurringRoutes(recurringController, authenticateToken, requireRole));
app.use('/api/notifications', createNotificationRoutes(notificationController, authenticateToken));
app.use('/api/analytics', createAnalyticsRoutes(analyticsController, authenticateToken, requireRole));
app.use('/api/reports', createReportsRoutes(reportsController, authenticateToken, requireRole));
app.use('/api/passes', createPassRoutes(passController, authenticateToken, requireRole));
app.use('/api/security', createSecurityRoutes(securityController, authenticateToken, requireRole));
app.use('/api/blocked', createBlockedRoutes(blockedController, authenticateToken, requireRole));
app.use('/api/settings', createSettingsRoutes(settingsController, authenticateToken, requireRole));
app.use('/api/branches', createBranchRoutes(branchController, authenticateToken, requireRole));
app.use('/api/users', createUserRoutes(userController, authenticateToken, requireRole));
setSocketServer(io);

// request-logging middleware (non-blocking)
app.use('/api', (req, res, next) => {
  // capture finish event to get status code
  res.on('finish', () => {
    logService.logRequest(req, res).catch(() => {});
  });
  next();
});

app.get(/^(?!\/api).*/, (_req, res) => {
  if (HAS_CLIENT_BUILD) {
    res.sendFile(CLIENT_INDEX_FILE);
    return;
  }

  res.status(404).send('Frontend is not built. Run `npm run dev` for hot reload or `npm run build` first.');
});

async function bootstrap() {
  try {
    const mongoServer = await connectDatabase();
    await initializeParkingSlots();
    await seedAdminUser();

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

    process.on('SIGINT', async () => {
      await mongoServer.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Application startup failed:', error);
    process.exit(1);
  }
}

bootstrap();