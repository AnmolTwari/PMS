// Simple notification skeleton for demo purposes
const Notification = require('../models/Notification');
const { emitEvent } = require('./realtime');
const nodemailer = require('nodemailer');
const AppSetting = require('../models/AppSetting');

let cachedSmtpKey = '';

async function loadSmtpConfig() {
  const setting = await AppSetting.findOne({ key: 'smtpSettings' }).lean();
  const value = setting?.value || {};
  const host = value.host || process.env.SMTP_HOST || '';
  const port = String(value.port || process.env.SMTP_PORT || 587);
  const secure = Boolean(value.secure ?? (process.env.SMTP_SECURE === 'true'));
  const user = value.user || process.env.SMTP_USER || '';
  const pass = value.pass || process.env.SMTP_PASS || '';
  const from = value.from || process.env.SMTP_FROM || user || '';

  return { host, port, secure, user, pass, from };
}

async function ensureTransporter() {
  const config = await loadSmtpConfig();
  const key = JSON.stringify(config);

  if (!config.host || !config.user) {
    transporter = null;
    cachedSmtpKey = key;
    return { transporter, from: config.from };
  }

  if (!transporter || cachedSmtpKey !== key) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: Number(config.port) || 587,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
    cachedSmtpKey = key;
  }

  return { transporter, from: config.from };
}

let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendEmail(to, subject, body) {
  try {
    console.log(`[notification] sendEmail -> to:${to} subject:${subject}`);
    const mailer = await ensureTransporter();
    if (mailer.transporter) {
      await mailer.transporter.sendMail({ from: mailer.from || process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text: body });
    }
  } catch (err) {
    console.error('sendEmail error', err);
  }
}

async function sendPush(userId, payload) {
  try {
    // For demo: persist in-app notification and emit socket event
    if (!userId) return;
    const n = await Notification.create({ userId, type: payload.type || 'generic', title: payload.title, body: payload.body, meta: payload });
    emitEvent('notification:created', { notification: n.toObject() });
    console.log(`[notification] sendPush -> user:${userId} payload:`, payload);
    return n;
  } catch (err) {
    console.error('sendPush error', err);
  }
}

async function sendInApp(userId, payload) {
  return sendPush(userId, payload);
}

module.exports = {
  sendEmail,
  sendPush,
  sendInApp,
};
