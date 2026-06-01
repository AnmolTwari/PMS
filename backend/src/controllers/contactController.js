const nodemailer = require('nodemailer');

function createContactController() {
  async function sendContactMessage(req, res) {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'All contact fields are required' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"${name}" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: `ParkSy contact: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    });

    return res.json({ message: 'Message sent successfully' });
  }

  return { sendContactMessage };
}

module.exports = {
  createContactController,
};