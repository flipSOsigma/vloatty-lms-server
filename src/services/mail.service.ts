import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || '"Vloatty LMS" <no-reply@vloatty.edu>';

let transporter: nodemailer.Transporter | null = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
} else {
  console.warn("MailService: SMTP configuration missing in env. Email notifications will be printed to console only.");
}

// Unified premium styling matching the Vloatty LMS website aesthetic (Outfit & Poppins fonts, warm cream & amber theme)
function getEmailLayout(title: string, contentHtml: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800&display=swap');
          
          body, table, td, h1, h2, h3, h4, p, a, span, div {
            font-family: 'Outfit', 'Poppins', system-ui, -apple-system, sans-serif !important;
          }
          a:hover {
            opacity: 0.9 !important;
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #FAF7F2; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-align: center;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF7F2; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; text-align: center;">
                <!-- Header / Logo -->
                <tr>
                  <td style="padding: 0 0 30px 0;">
                    <img src="https://j5xs5ezer6.ufs.sh/f/tD2SFM3OFP4Kq3fcEZMB3M5oN6tknUjTQasgFz7GOHRCpLPm" alt="Vloatty Logo" style="height: 38px; display: inline-block; vertical-align: middle; filter: brightness(0);" />
                  </td>
                </tr>
                
                <!-- Content (centered) -->
                <tr>
                  <td style="padding: 0 20px 30px 20px; font-size: 15px; line-height: 1.6; color: #374151; text-align: center;">
                    ${contentHtml}
                  </td>
                </tr>
                
                <!-- Premium Dark Footer -->
                <tr>
                  <td style="padding: 0;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #121212; padding: 36px 32px; text-align: center; border-radius: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
                      <tr>
                        <td align="center">
                          <!-- Footer Logo -->
                          <a href="#" style="text-decoration: none; display: inline-block; margin-bottom: 12px;">
                            <img src="https://j5xs5ezer6.ufs.sh/f/tD2SFM3OFP4Kq3fcEZMB3M5oN6tknUjTQasgFz7GOHRCpLPm" alt="Vloatty" style="height: 20px; display: block; filter: invert(1);" />
                          </a>
                          
                          <!-- Footer Tagline -->
                          <p style="margin: 0 auto 16px auto; max-width: 320px; font-size: 12px; line-height: 1.6; color: rgba(255, 255, 255, 0.45); font-weight: 500;">
                            Unlock your learning and campus management potential with our unified LMS ecosystem.
                          </p>
                          
                          <!-- Footer Links -->
                          <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 20px auto;">
                            <tr>
                              <td style="padding: 0 8px;"><a href="http://localhost:3000/#features" style="color: rgba(255, 255, 255, 0.6); text-decoration: none; font-size: 12px; font-weight: 700;">Features</a></td>
                              <td style="padding: 0 8px; color: rgba(255, 255, 255, 0.2); font-size: 12px;">&bull;</td>
                              <td style="padding: 0 8px;"><a href="http://localhost:3000/#pricing" style="color: rgba(255, 255, 255, 0.6); text-decoration: none; font-size: 12px; font-weight: 700;">Pricing</a></td>
                              <td style="padding: 0 8px; color: rgba(255, 255, 255, 0.2); font-size: 12px;">&bull;</td>
                              <td style="padding: 0 8px;"><a href="http://localhost:3000/docs" style="color: rgba(255, 255, 255, 0.6); text-decoration: none; font-size: 12px; font-weight: 700;">Documentation</a></td>
                              <td style="padding: 0 8px; color: rgba(255, 255, 255, 0.2); font-size: 12px;">&bull;</td>
                              <td style="padding: 0 8px;"><a href="mailto:support@vloatty.com" style="color: rgba(255, 255, 255, 0.6); text-decoration: none; font-size: 12px; font-weight: 700;">Support</a></td>
                            </tr>
                          </table>

                          <!-- Divider -->
                          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px;">
                            <tr>
                              <td style="border-top: 1px solid rgba(255, 255, 255, 0.08); height: 1px; width: 100%;"></td>
                            </tr>
                          </table>
                          
                          <!-- Copyright -->
                          <p style="margin: 0; font-size: 11px; color: rgba(255, 255, 255, 0.3); font-weight: 500;">
                            &copy; 2026 Vloatty. All rights reserved. Vloatty Learning Management System.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}



export class MailService {
  static async sendMail(to: string, subject: string, text: string, html?: string, attachments?: any[]) {
    if (!transporter) {
      console.log(`[SMTP SIMULATION] To: ${to} | Subject: ${subject}\nBody: ${text}\n-----------------------`);
      return;
    }

    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to,
        subject,
        text,
        html: html || text,
        attachments,
      });
      console.log(`Email notification sent to ${to} for: ${subject}`);
    } catch (err) {
      console.error(`Failed to send email to ${to}:`, err);
    }
  }

  // Template 1: Created new account (Registration)
  static async sendWelcomeEmail(to: string, userName: string) {
    const subject = "Welcome to Vloatty LMS! 🎓";
    const text = `Hello ${userName},\n\nYour account has been created successfully. Welcome to Vloatty LMS!`;
    const fallback = getEmailLayout(
      subject,
      `
      <h3 style="color: #121212; font-size: 18px; font-weight: 800; margin-top: 0; letter-spacing: -0.02em;">Welcome on Board! 🚀</h3>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Your account has been created successfully. We're absolutely thrilled to welcome you to the premium Vloatty LMS platform!</p>
      <p>Explore your dashboard, access your course materials, and interact with classes easily.</p>
      <div style="margin-top: 30px; text-align: center;">
        <a href="http://localhost:3000/dashboard" style="display: inline-block; padding: 12px 28px; background-color: #facc15; color: #121212; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 14px; border: 1px solid #eab308; box-shadow: 0 4px 14px rgba(250, 204, 21, 0.25);">Go to Dashboard</a>
      </div>
      `
    );
    return this.sendMail(to, subject, text, fallback);
  }

  // Template 2: Logged in session
  static async sendLoginNotification(to: string, userName: string, ip: string, userAgent: string) {
    const subject = "New Sign-in to Vloatty LMS 🔑";
    const time = new Date().toLocaleString();
    const text = `Hello ${userName},\n\nWe detected a new login to your account.\nTime: ${time}\nIP Address: ${ip}\nDevice: ${userAgent}`;
    const fallback = getEmailLayout(
      subject,
      `
      <div style="max-width: 220px; margin: 0 auto 24px auto; border-radius: 16px; overflow: hidden;">
        <div class="tenor-gif-embed" data-postid="14651250" data-share-method="host" data-aspect-ratio="2.02532" data-width="100%"><a href="https://tenor.com/view/tease-anime-darth-vader-light-saber-gif-14651250">Tease Anime GIF</a>from <a href="https://tenor.com/search/tease-gifs">Tease GIFs</a></div> <script type="text/javascript" async src="https://tenor.com/embed.js"></script>
      </div>
      <h3 style="color: #121212; font-size: 18px; font-weight: 800; margin-top: 0; letter-spacing: -0.02em;">New Sign-in Detected 🔑</h3>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>We detected a successful login to your Vloatty LMS account.</p>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px auto; max-width: 480px; text-align: left;">
        <tr>
          <td style="padding: 10px 0;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13.5px; line-height: 1.6; border-collapse: collapse;">
              <tr>
                <td valign="top" style="padding: 10px 12px 10px 0; width: 33%;">
                  <span style="font-size: 10.5px; font-weight: 800; color: #71717a; text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 2px;">Time</span>
                  <span style="font-size: 22px; font-weight: 600; color: #121212; display: block; line-height: 1.2;">${time}</span>
                </td>
                <td valign="top" style="padding: 10px 12px; width: 33%;">
                  <span style="font-size: 10.5px; font-weight: 800; color: #71717a; text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 2px;">IP Address</span>
                  <span style="font-size: 22px; font-weight: 600; color: #121212; display: block; font-family: monospace; line-height: 1.2;">${ip}</span>
                </td>
                <td valign="top" style="padding: 10px 0 10px 12px; width: 34%;">
                  <span style="font-size: 10.5px; font-weight: 800; color: #71717a; text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 2px;">Device</span>
                  <span style="font-size: 18px; font-weight: 600; color: #121212; display: block; word-break: break-word; line-height: 1.3;">${userAgent}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <p style="font-size: 12px; color: #ef4444; font-weight: 750; margin-bottom: 0;">If this wasn't you, please secure your account immediately by resetting your password.</p>
      `
    );
    return this.sendMail(to, subject, text, fallback);
  }

  // Template 3: Logged out session
  static async sendLogoutNotification(to: string, userName: string, ip: string) {
    const subject = "Signed out of Vloatty LMS 👋";
    const time = new Date().toLocaleString();
    const text = `Hello ${userName},\n\nYou have successfully signed out of your session from IP Address: ${ip}.`;
    const fallback = getEmailLayout(
      subject,
      `
      <h3 style="color: #121212; font-size: 18px; font-weight: 800; margin-top: 0; letter-spacing: -0.02em;">Session Signed Out 👋</h3>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>You have successfully logged out of your current Vloatty LMS session.</p>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px auto; max-width: 440px; text-align: left;">
        <tr>
          <td style="padding: 10px 0;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13.5px; line-height: 1.6; border-collapse: collapse;">
              <tr>
                <td valign="top" style="padding: 10px 12px 10px 0; width: 50%;">
                  <span style="font-size: 10.5px; font-weight: 800; color: #71717a; text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 2px;">Time</span>
                  <span style="font-size: 22px; font-weight: 600; color: #121212; display: block; line-height: 1.2;">${time}</span>
                </td>
                <td valign="top" style="padding: 10px 0 10px 12px; width: 50%;">
                  <span style="font-size: 10.5px; font-weight: 800; color: #71717a; text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 2px;">IP Address</span>
                  <span style="font-size: 22px; font-weight: 600; color: #121212; display: block; font-family: monospace; line-height: 1.2;">${ip}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      `
    );
    return this.sendMail(to, subject, text, fallback);
  }

  // Template 4: Got new subject created
  static async sendNewSubjectNotification(to: string, userName: string, subjectId: string, subjectName: string, room?: string | null, category?: string) {
    const subject = `New Subject Created: ${subjectName} 📚`;
    const text = `Hello ${userName},\n\nYou have successfully created a new subject on Vloatty LMS.\nSubject: ${subjectName}\nRoom: ${room || "N/A"}\nCategory: ${category || "N/A"}`;
    const fallback = getEmailLayout(
      subject,
      `
      <h3 style="color: #121212; font-size: 18px; font-weight: 800; margin-top: 0; letter-spacing: -0.02em;">New Subject Created 📚</h3>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>You have successfully created a new subject on Vloatty LMS.</p>
      <div style="margin: 20px 0; text-align: left;">
        <strong style="color: #121212; font-size: 17px; font-weight: 800; display: block; margin-bottom: 16px; text-align: center;">${subjectName}</strong>
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 auto; max-width: 440px;">
          <tr>
            <td style="padding: 10px 0;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13.5px; line-height: 1.6; border-collapse: collapse;">
                <tr>
                  <td valign="top" style="padding: 10px 12px 10px 0; width: 50%;">
                    <span style="font-size: 10.5px; font-weight: 800; color: #71717a; text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 2px;">Room</span>
                    <span style="font-size: 22px; font-weight: 600; color: #121212; display: block; line-height: 1.2;">${room || "N/A"}</span>
                  </td>
                  <td valign="top" style="padding: 10px 0 10px 12px; width: 50%;">
                    <span style="font-size: 10.5px; font-weight: 800; color: #71717a; text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 2px;">Category</span>
                    <span style="font-size: 22px; font-weight: 600; color: #121212; display: block; line-height: 1.2;">${category || "N/A"}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
      <div style="margin-top: 24px; text-align: center;">
        <a href="http://localhost:3000/dashboard/subject/${subjectId}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #facc15 0%, #d97706 100%); color: #ffffff; text-decoration: none; border-radius: 99px; font-weight: 800; font-size: 13.5px; letter-spacing: -0.01em; box-shadow: 0 4px 14px rgba(217, 119, 6, 0.2); transition: all 0.2s ease;">Manage Subject</a>
      </div>
      `
    );
    return this.sendMail(to, subject, text, fallback);
  }

  // Template 5: Got new module added
  static async sendNewModuleNotification(to: string, userName: string, subjectId: string, subjectName: string, moduleTitle: string, moduleDesc?: string) {
    const subject = `New Module Published: ${moduleTitle} 📁`;
    const text = `Hello ${userName},\n\nA new module has been published in your subject "${subjectName}".\nModule: ${moduleTitle}`;
    const fallback = getEmailLayout(
      subject,
      `
      <h3 style="color: #121212; font-size: 18px; font-weight: 800; margin-top: 0; letter-spacing: -0.02em;">New Module Added 📁</h3>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>A new module has been published in your subject <strong>${subjectName}</strong>.</p>
      <div style="margin: 20px 0; text-align: left;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 auto; max-width: 460px;">
          <tr>
            <td style="padding: 10px 0;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13.5px; line-height: 1.6; border-collapse: collapse;">
                <tr>
                  <td valign="top" style="padding: 10px 12px 10px 0; width: 50%;">
                    <span style="font-size: 10.5px; font-weight: 800; color: #71717a; text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 2px;">Module Title</span>
                    <span style="font-size: 22px; font-weight: 600; color: #121212; display: block; line-height: 1.2;">${moduleTitle}</span>
                  </td>
                  <td valign="top" style="padding: 10px 0 10px 12px; width: 50%;">
                    <span style="font-size: 10.5px; font-weight: 800; color: #71717a; text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 2px;">Description</span>
                    <span style="font-size: 14px; font-weight: 500; color: #52525b; display: block; line-height: 1.4;">${moduleDesc || "No description provided."}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
      <div style="margin-top: 24px; text-align: center;">
        <a href="http://localhost:3000/dashboard/subject/${subjectId}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #facc15 0%, #d97706 100%); color: #ffffff; text-decoration: none; border-radius: 99px; font-weight: 800; font-size: 13.5px; letter-spacing: -0.01em; box-shadow: 0 4px 14px rgba(217, 119, 6, 0.2); transition: all 0.2s ease;">Open Course Page</a>
      </div>
      `
    );
    return this.sendMail(to, subject, text, fallback);
  }

  // Template 6: Got new lesson for any type of lesson
  static async sendNewLessonNotification(to: string, userName: string, subjectId: string, subjectName: string, moduleTitle: string, lessonTitle: string, lessonType: string) {
    const subject = `New Lesson Added: ${lessonTitle} 📖`;
    const text = `Hello ${userName},\n\nA new lesson has been added to your subject "${subjectName}".\nModule: ${moduleTitle}\nLesson: ${lessonTitle}\nType: ${lessonType}`;
    
    // Fallback template matching the new centered card-less design
    const fallback = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Lesson Added</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800&display=swap');
            body, table, td, h1, h2, h3, p, a, span, div {
              font-family: 'Outfit', 'Poppins', system-ui, -apple-system, sans-serif !important;
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #FAF7F2; text-align: center;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF7F2; padding: 40px 10px;">
            <tr>
              <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; text-align: center;">
                  <tr>
                    <td style="padding: 0 0 30px 0;">
                      <img src="https://j5xs5ezer6.ufs.sh/f/tD2SFM3OFP4Kq3fcEZMB3M5oN6tknUjTQasgFz7GOHRCpLPm" alt="Vloatty Logo" style="height: 38px; display: inline-block; filter: brightness(0);" />
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 0 20px 0;">
                      <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #121212;">New Lesson Published</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 20px 30px 20px; font-size: 15px; line-height: 1.6; color: #374151;">
                      <p>Hello <strong>${userName}</strong>,</p>
                      <p>A new lesson has been added under your subject <strong>${subjectName}</strong>.</p>
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 auto 24px auto; max-width: 440px; text-align: left;">
                        <tr>
                          <td style="padding: 10px 0;">
                            <strong style="color: #121212; font-size: 17px; font-weight: 800; display: block; margin-bottom: 16px; text-align: center;">${lessonTitle}</strong>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13.5px; line-height: 1.6; border-collapse: collapse;">
                              <tr>
                                <td valign="top" style="padding: 10px 12px 10px 0; width: 50%;">
                                  <span style="font-size: 10.5px; font-weight: 800; color: #71717a; text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 2px;">Module</span>
                                  <span style="font-size: 22px; font-weight: 600; color: #121212; display: block; line-height: 1.2;">${moduleTitle}</span>
                                </td>
                                <td valign="top" style="padding: 10px 0 10px 12px; width: 50%;">
                                  <span style="font-size: 10.5px; font-weight: 800; color: #71717a; text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 2px;">Type</span>
                                  <span style="font-size: 22px; font-weight: 600; color: #121212; display: block; text-transform: capitalize; line-height: 1.2;">${lessonType}</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <div style="margin-top: 24px; text-align: center;">
                        <a href="http://localhost:3000/dashboard/subject/${subjectId}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #facc15 0%, #d97706 100%); color: #ffffff; text-decoration: none; border-radius: 99px; font-weight: 800; font-size: 13.5px; letter-spacing: -0.01em; box-shadow: 0 4px 14px rgba(217, 119, 6, 0.2); transition: all 0.2s ease;">View Lesson</a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #121212; padding: 36px 32px; text-align: center; border-radius: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
                        <tr>
                          <td align="center">
                            <a href="#" style="text-decoration: none; display: inline-block; margin-bottom: 12px;">
                              <img src="https://j5xs5ezer6.ufs.sh/f/tD2SFM3OFP4Kq3fcEZMB3M5oN6tknUjTQasgFz7GOHRCpLPm" alt="Vloatty" style="height: 20px; display: block; filter: invert(1);" />
                            </a>
                            <p style="margin: 0 auto 16px auto; max-width: 320px; font-size: 12px; line-height: 1.6; color: rgba(255, 255, 255, 0.45); font-weight: 500;">
                              Unlock your learning and campus management potential with our unified LMS ecosystem.
                            </p>
                            <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 20px auto;">
                              <tr>
                                <td style="padding: 0 8px;"><a href="http://localhost:3000/#features" style="color: rgba(255, 255, 255, 0.6); text-decoration: none; font-size: 12px; font-weight: 700;">Features</a></td>
                                <td style="padding: 0 8px; color: rgba(255, 255, 255, 0.2); font-size: 12px;">&bull;</td>
                                <td style="padding: 0 8px;"><a href="http://localhost:3000/#pricing" style="color: rgba(255, 255, 255, 0.6); text-decoration: none; font-size: 12px; font-weight: 700;">Pricing</a></td>
                                <td style="padding: 0 8px; color: rgba(255, 255, 255, 0.2); font-size: 12px;">&bull;</td>
                                <td style="padding: 0 8px;"><a href="http://localhost:3000/docs" style="color: rgba(255, 255, 255, 0.6); text-decoration: none; font-size: 12px; font-weight: 700;">Documentation</a></td>
                                <td style="padding: 0 8px; color: rgba(255, 255, 255, 0.2); font-size: 12px;">&bull;</td>
                                <td style="padding: 0 8px;"><a href="mailto:support@vloatty.com" style="color: rgba(255, 255, 255, 0.6); text-decoration: none; font-size: 12px; font-weight: 700;">Support</a></td>
                              </tr>
                            </table>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px;">
                              <tr>
                                <td style="border-top: 1px solid rgba(255, 255, 255, 0.08); height: 1px; width: 100%;"></td>
                              </tr>
                            </table>
                            <p style="margin: 0; font-size: 11px; color: rgba(255, 255, 255, 0.3); font-weight: 500;">
                              &copy; 2026 Vloatty. All rights reserved. Vloatty Learning Management System.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    return this.sendMail(to, subject, text, fallback);
  }

  // Template 7: Notification of tier limit reached
  static async sendLimitReachedNotification(to: string, userName: string, limitType: string, currentLimit: string | number, tier: string) {
    const subject = `⚠️ Subscription Limit Warning: ${limitType}`;
    const text = `Hello ${userName},\n\nYou have hit the limit for ${limitType} on your current ${tier.toUpperCase()} tier (Limit: ${currentLimit}). Please upgrade to a higher tier to increase limits.`;
    const fallback = getEmailLayout(
      subject,
      `
      <h3 style="color: #dc2626; font-size: 18px; font-weight: 800; margin-top: 0; letter-spacing: -0.02em;">⚠️ Subscription Limit Warning</h3>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>We detected that you hit a resource or storage allocation limit bound to your current premium tier.</p>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px auto; max-width: 480px; text-align: left;">
        <tr>
          <td style="padding: 10px 0;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13.5px; line-height: 1.6; border-collapse: collapse;">
              <tr>
                <td valign="top" style="padding: 10px 12px 10px 0; width: 33%;">
                  <span style="font-size: 10.5px; font-weight: 800; color: #71717a; text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 2px;">Limit Type</span>
                  <span style="font-size: 22px; font-weight: 600; color: #b91c1c; display: block; line-height: 1.2;">${limitType}</span>
                </td>
                <td valign="top" style="padding: 10px 12px; width: 33%;">
                  <span style="font-size: 10.5px; font-weight: 800; color: #71717a; text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 2px;">Your Current Tier</span>
                  <span style="font-size: 22px; font-weight: 600; color: #7f1d1d; display: block; text-transform: uppercase; line-height: 1.2;">${tier}</span>
                </td>
                <td valign="top" style="padding: 10px 0 10px 12px; width: 34%;">
                  <span style="font-size: 10.5px; font-weight: 800; color: #71717a; text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 2px;">Maximum Allowed</span>
                  <span style="font-size: 22px; font-weight: 600; color: #7f1d1d; display: block; line-height: 1.2;">${currentLimit}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <p style="font-weight: 700; color: #121212; margin-bottom: 0;">Need to expand your boundaries? Upgrade to Pro or Max for higher quotas.</p>
      `
    );
    return this.sendMail(to, subject, text, fallback);
  }
}
