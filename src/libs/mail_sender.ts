import nodeMailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

const transporter = nodeMailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  pool: true,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD
  }
});

const SendMail = (msg: Mail.Options) => {
  transporter.sendMail(msg, (err, info) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

const MailSenderServer = () => {
  transporter.verify((error) => {
    if (error) {
      console.log(error);
    } else {
      console.log('Server is ready to take our messages');
    }
  });
};

const sendMailForgotPassword = (email: string, code: string) => {
  const msg = {
    to: email,
    from: {
      name: 'Instafram Team',
      address: 'support@instafram.com'
    },
    subject: 'Reset your Instafram password',
    html: `
        <table width="100%" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background-color: #f4f4f4; padding: 20px; text-align: center;">
              <img src="https://i.imgur.com/AzhnnOu.png" alt="Instafram Logo" style="max-width: 150px; margin-bottom: 20px;">
              <h1 style="font-size: 24px; font-weight: bold; color: #333;">Hello!</h1>
              <p style="font-size: 16px; color: #555;">
                We received a request to reset the password for your Instafram account. Please use the code below to reset your password:
              </p>
              <div style="background: #007bff; color: #fff; padding: 12px 24px; display: inline-block; font-size: 18px; border-radius: 5px; margin-top: 20px;">
                <b>${code}</b>
              </div>
              <p style="font-size: 16px; color: #555; margin-top: 20px;">
                If you didn't request a password reset, please ignore this email.
              </p>
              <p style="font-size: 16px; color: #555;">
                For assistance, contact our support team at <a href="mailto:support@instafram.com" style="color: #007bff; text-decoration: none;">support@instafram.com</a>.
              </p>
              <p style="font-size: 16px; color: #555;">
                Sincerely,<br/>
                The Instafram Team
              </p>
            </td>
          </tr>
        </table>
      `
  };
  return SendMail(msg);
};

const sendMailVerifyEmail = (email: string, code: string) => {
  const msg = {
    to: email,
    from: {
      name: 'Instafram Team',
      address: 'support@instafram.com'
    },
    subject: 'Verify your email address',
    html: `
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background-color: #f4f4f4; padding: 20px; text-align: center;">
                <img src="https://i.imgur.com/AzhnnOu.png" alt="Instafram Logo" style="max-width: 150px; margin-bottom: 20px;">
                <h1 style="font-size: 24px; font-weight: bold; color: #333;">Hello!</h1>
                <p style="font-size: 16px; color: #555;">
                  Thank you for signing up for Instafram! Please use the code below to verify your email address:
                </p>
                <div style="background: #007bff; color: #fff; padding: 12px 24px; display: inline-block; font-size: 18px; border-radius: 5px; margin-top: 20px;">
                  <b>${code}</b>
                </div>
                <p style="font-size: 16px; color: #555; margin-top: 20px;">
                  If you didn't create a Instafram account, please ignore this email.
                </p>
                <p style="font-size: 16px; color: #555;">
                  For assistance, contact our support team at <a href="mailto:support@instafram.com" style="color: #007bff; text-decoration: none;">support@instafram</a>.
                </p>
                <p style="font-size: 16px; color: #555;">
                  Sincerely,<br/>
                  The Instafram Team
                </p>
                </td>
                </tr>
                </table>
                `
  };
  return SendMail(msg);
};

export { MailSenderServer, sendMailForgotPassword, sendMailVerifyEmail };
