import nodemailer from 'nodemailer';
import { env } from '../config/environment';
import { logger } from '../utils/logger';

let transporter: nodemailer.Transporter | null = null;

// Email template cache
const emailTemplates = new Map<string, string>();

function getTransporter() {
  if (!env.smtp.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    });
  }
  return transporter;
}

export async function sendMail(to: string, subject: string, text: string) {
  const t = getTransporter();
  if (!t) {
    logger.warn('SMTP not configured; skipping email', { to, subject });
    return;
  }
  await t.sendMail({ from: env.smtp.from, to, subject, text });
}

/** HTML welcome / transactional mail when Resend is unavailable or rejects (e.g. sandbox limits). */
export async function sendHtmlMail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  const t = getTransporter();
  if (!t) {
    return { ok: false, error: 'SMTP not configured' };
  }
  try {
    await t.sendMail({
      from: env.smtp.from,
      to,
      subject,
      text,
      html,
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.warn('SMTP sendHtmlMail failed', { to, subject, error: msg });
    return { ok: false, error: msg };
  }
}

// Email templates
export const EMAIL_TEMPLATES = {
  ASSIGNMENT_PUBLISHED: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4f46e5; margin: 0;">🎓 LearnX</h1>
          <p style="color: #6b7280; margin: 5px 0;">Learning Management System</p>
        </div>
        
        <h2 style="color: #1f2937; margin-bottom: 15px;">📚 New Assignment Published</h2>
        <p style="color: #4b5563; line-height: 1.6;">
          A new assignment has been published for your class. Please check the details below and submit your work before the deadline.
        </p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">{{assignmentTitle}}</h3>
          <p style="color: #6b7280; margin: 10px 0;">{{assignmentDescription}}</p>
          <div style="display: flex; justify-content: space-between; margin-top: 15px;">
            <span style="color: #6b7280;">📅 Due Date: {{dueDate}}</span>
            <span style="color: #6b7280;">⏰ Due Time: {{dueTime}}</span>
          </div>
          <div style="margin-top: 10px;">
            <span style="color: #6b7280;">🎯 Max Score: {{maxScore}} points</span>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{dashboardUrl}}" style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Assignment
          </a>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            This email was sent by LearnX Learning Management System.<br>
            If you have any questions, please contact your teacher.
          </p>
        </div>
      </div>
    </div>
  `,
  
  ASSIGNMENT_GRADED: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4f46e5; margin: 0;">🎓 LearnX</h1>
          <p style="color: #6b7280; margin: 5px 0;">Learning Management System</p>
        </div>
        
        <h2 style="color: #1f2937; margin-bottom: 15px;">✅ Assignment Graded</h2>
        <p style="color: #4b5563; line-height: 1.6;">
          Your assignment has been reviewed and graded by your teacher. Please check your feedback below.
        </p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">{{assignmentTitle}}</h3>
          <div style="display: flex; justify-content: space-between; margin: 15px 0;">
            <span style="color: #6b7280;">🏆 Your Grade: {{grade}}/{{maxScore}}</span>
            <span style="color: #6b7280;">📅 Graded: {{gradedDate}}</span>
          </div>
          {{#if feedback}}
          <div style="margin-top: 15px;">
            <h4 style="color: #1f2937; margin-bottom: 10px;">📝 Feedback:</h4>
            <p style="color: #4b5563; background-color: white; padding: 15px; border-radius: 6px; border-left: 4px solid #4f46e5;">
              {{feedback}}
            </p>
          </div>
          {{/if}}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{dashboardUrl}}" style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Details
          </a>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            This email was sent by LearnX Learning Management System.<br>
            Keep up the great work!
          </p>
        </div>
      </div>
    </div>
  `,
  
  ATTENDANCE_REMINDER: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4f46e5; margin: 0;">🎓 LearnX</h1>
          <p style="color: #6b7280; margin: 5px 0;">Learning Management System</p>
        </div>
        
        <h2 style="color: #ea580c; margin-bottom: 15px;">⏰ Attendance Reminder</h2>
        <p style="color: #4b5563; line-height: 1.6;">
          You haven't marked your attendance for today's class yet. Please mark your attendance now.
        </p>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="color: #92400e; margin-top: 0;">{{classTitle}}</h3>
          <div style="display: flex; justify-content: space-between; margin: 15px 0;">
            <span style="color: #92400e;">📅 Date: {{date}}</span>
            <span style="color: #92400e;">⏰ Time: {{time}}</span>
          </div>
          <div style="margin-top: 10px;">
            <span style="color: #92400e;">📍 Location: {{location}}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{dashboardUrl}}" style="background-color: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Mark Attendance
          </a>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            This email was sent by LearnX Learning Management System.<br>
            Regular attendance is important for your academic success!
          </p>
        </div>
      </div>
    </div>
  `,
  
  ANNOUNCEMENT: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4f46e5; margin: 0;">🎓 LearnX</h1>
          <p style="color: #6b7280; margin: 5px 0;">Learning Management System</p>
        </div>
        
        <h2 style="color: #1f2937; margin-bottom: 15px;">📢 {{announcementTitle}}</h2>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <div style="color: #4b5563; line-height: 1.6;">
            {{announcementContent}}
          </div>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin: 20px 0; font-size: 14px; color: #6b7280;">
          <span>📅 Posted: {{postedDate}}</span>
          <span>👤 By: {{postedBy}}</span>
          <span>🎯 Priority: {{priority}}</span>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{dashboardUrl}}" style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View in Dashboard
          </a>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            This email was sent by LearnX Learning Management System.
          </p>
        </div>
      </div>
    </div>
  `,
  
  PLAGIARISM_FLAGGED: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4f46e5; margin: 0;">🎓 LearnX</h1>
          <p style="color: #6b7280; margin: 5px 0;">Learning Management System</p>
        </div>
        
        <h2 style="color: #dc2626; margin-bottom: 15px;">🚩 Academic Review Required</h2>
        <p style="color: #4b5563; line-height: 1.6;">
          A submission has been flagged for academic review due to potential plagiarism issues.
        </p>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="color: #991b1b; margin-top: 0;">{{assignmentTitle}}</h3>
          <div style="display: flex; justify-content: space-between; margin: 15px 0;">
            <span style="color: #991b1b;">👤 Student: {{studentName}}</span>
            <span style="color: #991b1b;">📊 Similarity: {{similarityScore}}%</span>
          </div>
          <div style="margin-top: 10px;">
            <span style="color: #991b1b;">📝 Reason: {{reason}}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{dashboardUrl}}" style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Review Submission
          </a>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            This email was sent by LearnX Learning Management System.<br>
            Please review this submission as soon as possible.
          </p>
        </div>
      </div>
    </div>
  `,
};

// Template rendering function
export function renderTemplate(template: string, data: Record<string, any>): string {
  let rendered = template;
  
  // Simple template replacement (you could use a proper templating engine)
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value));
  });
  
  // Handle simple if conditions
  rendered = rendered.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (match, condition, content) => {
    return data[condition] ? content : '';
  });
  
  return rendered;
}

// Automated email sending functions
export async function sendAssignmentPublishedEmail(
  studentEmail: string,
  studentName: string,
  assignmentData: {
    title: string;
    description: string;
    dueDate: string;
    dueTime: string;
    maxScore: number;
  }
): Promise<{ ok: boolean; error?: string }> {
  const template = EMAIL_TEMPLATES.ASSIGNMENT_PUBLISHED;
  const html = renderTemplate(template, {
    assignmentTitle: assignmentData.title,
    assignmentDescription: assignmentData.description,
    dueDate: assignmentData.dueDate,
    dueTime: assignmentData.dueTime,
    maxScore: assignmentData.maxScore,
    dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/assignments`,
    studentName,
  });
  
  return sendHtmlMail(
    studentEmail,
    `📚 New Assignment: ${assignmentData.title}`,
    html,
    `A new assignment "${assignmentData.title}" has been published. Due: ${assignmentData.dueDate} at ${assignmentData.dueTime}.`
  );
}

export async function sendAssignmentGradedEmail(
  studentEmail: string,
  studentName: string,
  gradingData: {
    assignmentTitle: string;
    grade: number;
    maxScore: number;
    feedback?: string;
    gradedDate: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  const template = EMAIL_TEMPLATES.ASSIGNMENT_GRADED;
  const html = renderTemplate(template, {
    assignmentTitle: gradingData.assignmentTitle,
    grade: gradingData.grade,
    maxScore: gradingData.maxScore,
    feedback: gradingData.feedback,
    gradedDate: gradingData.gradedDate,
    dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/assignments`,
    studentName,
  });
  
  return sendHtmlMail(
    studentEmail,
    `✅ Assignment Graded: ${gradingData.assignmentTitle}`,
    html,
    `Your assignment "${gradingData.assignmentTitle}" has been graded. Score: ${gradingData.grade}/${gradingData.maxScore}.`
  );
}

export async function sendAttendanceReminderEmail(
  studentEmail: string,
  studentName: string,
  classData: {
    title: string;
    date: string;
    time: string;
    location: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  const template = EMAIL_TEMPLATES.ATTENDANCE_REMINDER;
  const html = renderTemplate(template, {
    classTitle: classData.title,
    date: classData.date,
    time: classData.time,
    location: classData.location,
    dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/attendance`,
    studentName,
  });
  
  return sendHtmlMail(
    studentEmail,
    `⏰ Attendance Reminder: ${classData.title}`,
    html,
    `Please mark your attendance for "${classData.title}" on ${classData.date} at ${classData.time}.`
  );
}

export async function sendAnnouncementEmail(
  recipientEmail: string,
  recipientName: string,
  announcementData: {
    title: string;
    content: string;
    postedDate: string;
    postedBy: string;
    priority: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  const template = EMAIL_TEMPLATES.ANNOUNCEMENT;
  const html = renderTemplate(template, {
    announcementTitle: announcementData.title,
    announcementContent: announcementData.content,
    postedDate: announcementData.postedDate,
    postedBy: announcementData.postedBy,
    priority: announcementData.priority,
    dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/announcements`,
    recipientName,
  });
  
  return sendHtmlMail(
    recipientEmail,
    `📢 ${announcementData.title}`,
    html,
    `New announcement: "${announcementData.title}" from ${announcementData.postedBy}.`
  );
}

export async function sendPlagiarismFlaggedEmail(
  adminEmail: string,
  adminName: string,
  flagData: {
    assignmentTitle: string;
    studentName: string;
    similarityScore: number;
    reason: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  const template = EMAIL_TEMPLATES.PLAGIARISM_FLAGGED;
  const html = renderTemplate(template, {
    assignmentTitle: flagData.assignmentTitle,
    studentName: flagData.studentName,
    similarityScore: flagData.similarityScore,
    reason: flagData.reason,
    dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin`,
    adminName,
  });
  
  return sendHtmlMail(
    adminEmail,
    `🚩 Academic Review Required: ${flagData.assignmentTitle}`,
    html,
    `Submission flagged for plagiarism review: ${flagData.similarityScore}% similarity.`
  );
}

// Bulk email sending with rate limiting
export async function sendBulkEmails(
  recipients: Array<{ email: string; name: string }>,
  subject: string,
  htmlTemplate: string,
  textTemplate: string,
  batchSize: number = 10,
  delayMs: number = 1000
): Promise<{ successful: number; failed: number; errors: string[] }> {
  const results = { successful: 0, failed: 0, errors: [] as string[] };
  
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    
    const promises = batch.map(async (recipient) => {
      try {
        const html = renderTemplate(htmlTemplate, { ...recipient, subject });
        const text = renderTemplate(textTemplate, { ...recipient, subject });
        
        const result = await sendHtmlMail(recipient.email, subject, html, text);
        if (result.ok) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push(`${recipient.email}: ${result.error}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`${recipient.email}: ${error}`);
      }
    });
    
    await Promise.all(promises);
    
    // Add delay between batches to avoid rate limiting
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}
