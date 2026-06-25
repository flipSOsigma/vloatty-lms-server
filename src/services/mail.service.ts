import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

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
                
                <!-- Black Footer from the Client -->
                <tr>
                  <td style="padding: 0;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #000000; padding: 40px 20px; text-align: center; border-radius: 20px;">
                      <tr>
                        <td align="center">
                          <a href="#" style="text-decoration: none; display: inline-block; margin-bottom: 15px;">
                            <img src="https://j5xs5ezer6.ufs.sh/f/tD2SFM3OFP4Kq3fcEZMB3M5oN6tknUjTQasgFz7GOHRCpLPm" alt="Vloatty" style="height: 22px; display: block;" />
                          </a>
                          <p style="margin: 0 auto 20px auto; max-width: 320px; font-size: 13px; line-height: 1.6; color: rgba(255, 255, 255, 0.5);">
                            Unlock your learning and campus management potential with our unified LMS ecosystem.
                          </p>
                          
                          <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px auto;">
                            <tr>
                              <td style="padding: 0 12px;"><a href="http://localhost:3000/#features" style="color: rgba(255, 255, 255, 0.65); text-decoration: none; font-size: 13px; font-weight: 600;">Features</a></td>
                              <td style="padding: 0 12px;"><a href="http://localhost:3000/#pricing" style="color: rgba(255, 255, 255, 0.65); text-decoration: none; font-size: 13px; font-weight: 600;">Pricing</a></td>
                              <td style="padding: 0 12px;"><a href="mailto:support@vloatty.com" style="color: rgba(255, 255, 255, 0.65); text-decoration: none; font-size: 13px; font-weight: 600;">Support</a></td>
                            </tr>
                          </table>
                          
                          <p style="margin: 0; font-size: 11px; color: rgba(255, 255, 255, 0.35);">
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

// Loads HTML templates from the server/templates folder with replacement placeholders
function getTemplateHtml(templateName: string, placeholders: Record<string, string | number>, fallbackHtml: string): string {
  try {
    const templatePath = path.join(process.cwd(), "templates", `${templateName}.html`);
    if (fs.existsSync(templatePath)) {
      let html = fs.readFileSync(templatePath, "utf8");
      for (const [key, value] of Object.entries(placeholders)) {
        html = html.replace(new RegExp(`{{${key}}}`, "g"), String(value ?? ""));
      }
      return html;
    }
  } catch (err) {
    console.error(`Failed to load template ${templateName}:`, err);
  }
  return fallbackHtml;
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
    const html = getTemplateHtml("welcome", { userName }, fallback);
    return this.sendMail(to, subject, text, html);
  }

  // Template 2: Logged in session
  static async sendLoginNotification(to: string, userName: string, ip: string, userAgent: string) {
    const subject = "New Sign-in to Vloatty LMS 🔑";
    const time = new Date().toLocaleString();
    const text = `Hello ${userName},\n\nWe detected a new login to your account.\nTime: ${time}\nIP Address: ${ip}\nDevice: ${userAgent}`;
    const fallback = getEmailLayout(
      subject,
      `
      <h3 style="color: #121212; font-size: 18px; font-weight: 800; margin-top: 0; letter-spacing: -0.02em;">New Sign-in Detected 🔑</h3>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>We detected a successful login to your Vloatty LMS account.</p>
      <div style="background-color: #f9f8f6; border: 1px solid #E5E1D8; border-radius: 16px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; font-weight: 700; color: #121212; width: 100px;">Time:</td>
            <td style="padding: 6px 0; color: #4b5563;">${time}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 700; color: #121212;">IP Address:</td>
            <td style="padding: 6px 0; color: #4b5563;">${ip}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 700; color: #121212;">Device:</td>
            <td style="padding: 6px 0; color: #4b5563; word-break: break-all;">${userAgent}</td>
          </tr>
        </table>
      </div>
      <p style="font-size: 12px; color: #ef4444; font-weight: 750; margin-bottom: 0;">If this wasn't you, please secure your account immediately by resetting your password.</p>
      `
    );
    const html = getTemplateHtml("login", { userName, time, ip, userAgent }, fallback);
    return this.sendMail(to, subject, text, html);
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
      <div style="background-color: #f9f8f6; border: 1px solid #E5E1D8; border-radius: 16px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; font-weight: 700; color: #121212; width: 100px;">Time:</td>
            <td style="padding: 6px 0; color: #4b5563;">${time}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 700; color: #121212;">IP Address:</td>
            <td style="padding: 6px 0; color: #4b5563;">${ip}</td>
          </tr>
        </table>
      </div>
      `
    );
    const html = getTemplateHtml("logout", { userName, time, ip }, fallback);
    return this.sendMail(to, subject, text, html);
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
      <div style="background-color: #fbfbfa; border-left: 4px solid #d97706; padding: 20px; margin: 20px 0; border-radius: 4px 18px 18px 4px; border-top: 1px solid #E5E1D8; border-right: 1px solid #E5E1D8; border-bottom: 1px solid #E5E1D8; box-shadow: 0 4px 12px rgba(0,0,0,0.015);">
        <strong style="color: #121212; font-size: 17px; font-weight: 800; display: block; margin-bottom: 8px;">${subjectName}</strong>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 4px 0; font-weight: 700; color: #121212; width: 80px;">Room:</td>
            <td style="padding: 4px 0; color: #4b5563;">${room || "N/A"}</td>
          </tr>
          ${category ? `
          <tr>
            <td style="padding: 4px 0; font-weight: 700; color: #121212;">Category:</td>
            <td style="padding: 4px 0; color: #4b5563;">${category}</td>
          </tr>` : ""}
        </table>
      </div>
      <div style="margin-top: 30px; text-align: center;">
        <a href="http://localhost:3000/dashboard/subject/${subjectId}" style="display: inline-block; padding: 12px 28px; background-color: #facc15; color: #121212; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 14px; border: 1px solid #eab308; box-shadow: 0 4px 14px rgba(250, 204, 21, 0.25);">Manage Subject</a>
      </div>
      `
    );
    const html = getTemplateHtml(
      "new-subject",
      {
        userName,
        subjectId,
        subjectName,
        room: room || "N/A",
        category: category || "N/A"
      },
      fallback
    );
    return this.sendMail(to, subject, text, html);
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
      <div style="background-color: #fbfbfa; border-left: 4px solid #d97706; padding: 20px; margin: 20px 0; border-radius: 4px 18px 18px 4px; border-top: 1px solid #E5E1D8; border-right: 1px solid #E5E1D8; border-bottom: 1px solid #E5E1D8; box-shadow: 0 4px 12px rgba(0,0,0,0.015);">
        <strong style="color: #121212; font-size: 16px; font-weight: 800; display: block; margin-bottom: 6px;">${moduleTitle}</strong>
        ${moduleDesc ? `<p style="margin: 0; font-size: 13px; color: #4b5563; line-height: 1.5;">${moduleDesc}</p>` : `<p style="margin: 0; font-size: 13px; color: #9ca3af; font-style: italic;">No description provided.</p>`}
      </div>
      <div style="margin-top: 30px; text-align: center;">
        <a href="http://localhost:3000/dashboard/subject/${subjectId}" style="display: inline-block; padding: 12px 28px; background-color: #facc15; color: #121212; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 14px; border: 1px solid #eab308; box-shadow: 0 4px 14px rgba(250, 204, 21, 0.25);">Open Course Page</a>
      </div>
      `
    );
    const html = getTemplateHtml(
      "new-module",
      {
        userName,
        subjectId,
        subjectName,
        moduleTitle,
        moduleDesc: moduleDesc || "No description provided."
      },
      fallback
    );
    return this.sendMail(to, subject, text, html);
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
                      <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 30px auto; background-color: #ffffff; border: 1px solid #E5E1D8; border-radius: 16px; width: 100%; max-width: 400px; text-align: left;">
                        <tr>
                          <td style="padding: 20px 24px;">
                            <strong style="color: #121212; font-size: 16px; font-weight: 700; display: block; margin-bottom: 12px; text-align: center;">${lessonTitle}</strong>
                            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                              <tr>
                                <td style="padding: 6px 0; font-weight: 700; color: #121212; width: 80px;">Module:</td>
                                <td style="padding: 6px 0; color: #4b5563;">${moduleTitle}</td>
                              </tr>
                              <tr>
                                <td style="padding: 6px 0; font-weight: 700; color: #121212;">Type:</td>
                                <td style="padding: 6px 0; color: #4b5563; text-transform: capitalize;">${lessonType}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <div style="margin-top: 10px;">
                        <a href="http://localhost:3000/dashboard/subject/${subjectId}" style="display: inline-block; padding: 12px 28px; background-color: #facc15; color: #121212; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 14px; border: 1px solid #eab308;">View Lesson</a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #000000; padding: 40px 20px; text-align: center; border-radius: 20px;">
                        <tr>
                          <td align="center">
                            <img src="https://j5xs5ezer6.ufs.sh/f/tD2SFM3OFP4Kq3fcEZMB3M5oN6tknUjTQasgFz7GOHRCpLPm" alt="Vloatty" style="height: 22px; display: block; margin-bottom: 15px;" />
                            <p style="margin: 0 auto 20px auto; max-width: 320px; font-size: 13px; line-height: 1.6; color: rgba(255, 255, 255, 0.5);">
                              Unlock your learning and campus management potential with our unified LMS ecosystem.
                            </p>
                            <p style="margin: 0; font-size: 11px; color: rgba(255, 255, 255, 0.35);">
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

    const html = getTemplateHtml(
      "new-lesson",
      {
        userName,
        subjectId,
        subjectName,
        moduleTitle,
        lessonTitle,
        lessonType
      },
      fallback
    );

    return this.sendMail(to, subject, text, html);
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
      <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 18px; padding: 20px; margin: 20px 0; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.02);">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; font-weight: 700; color: #b91c1c; width: 150px;">Limit Type:</td>
            <td style="padding: 6px 0; color: #7f1d1d;">${limitType}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 700; color: #b91c1c;">Your Current Tier:</td>
            <td style="padding: 6px 0; color: #7f1d1d; text-transform: uppercase; font-weight: 800;">${tier}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 700; color: #b91c1c;">Maximum Allowed:</td>
            <td style="padding: 6px 0; color: #7f1d1d; font-weight: 800;">${currentLimit}</td>
          </tr>
        </table>
      </div>
      <p style="font-weight: 700; color: #121212; margin-bottom: 0;">Need to expand your boundaries? Upgrade to Pro or Max for higher quotas.</p>
      `
    );
    const html = getTemplateHtml("limit-reached", { userName, limitType, tier, currentLimit }, fallback);
    return this.sendMail(to, subject, text, html);
  }
}
