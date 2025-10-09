import nodemailer from 'nodemailer';
import admin from '../config/firebase.js';

const db = admin.firestore();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async getAllStudentEmails() {
    try {
      const usersRef = db.collection('users');
      
      // Get all users and filter out admins
      const querySnapshot = await usersRef.get();
      console.log('Total users in database:', querySnapshot.size);
      
      const emails = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        
        // Include users who have email and are not admins
        if (userData.email && userData.role !== 'admin') {
          emails.push({
            email: userData.email,
            name: userData.name || userData.displayName || 'Student'
          });
        }
      });
      
      console.log(`Found ${emails.length} student emails for notifications`);
      return emails;
    } catch (error) {
      console.error('Error fetching student emails:', error);
      throw error;
    }
  }

  generateContestEmailHTML(contests, studentName) {
    const contestsHTML = contests.map(contest => `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 12px 0; background: #f9fafb;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h3 style="margin: 0; color: #1f2937; font-size: 18px;">${contest.name}</h3>
          <span style="background: #3b82f6; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: bold;">
            ${contest.platform}
          </span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 12px 0;">
          <div>
            <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">📅 Date: <strong>${contest.date}</strong></p>
            <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">⏰ Time: <strong>${contest.time}</strong></p>
          </div>
          <div>
            <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">⏱️ Duration: <strong>${contest.duration}</strong></p>
            <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">🟢 Status: <strong>Upcoming</strong></p>
          </div>
        </div>
        ${contest.url ? `
          <a href="${contest.url}" style="display: inline-block; background: #3b82f6; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 8px;">
            Register Now →
          </a>
        ` : ''}
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Upcoming Coding Contests</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 12px; color: white; font-weight: bold; font-size: 24px; line-height: 60px; margin-bottom: 16px;">
            CT
          </div>
          <h1 style="margin: 0; color: #1f2937;">CodeTrack Pro</h1>
          <p style="margin: 8px 0 0 0; color: #6b7280;">Upcoming Contest Notifications</p>
        </div>

        <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #1f2937; margin-top: 0;">Hello ${studentName}! 👋</h2>
          
          <p style="color: #4b5563; margin-bottom: 24px;">
            Don't miss out on these exciting coding contests! Here are the upcoming competitions across various platforms:
          </p>

          ${contestsHTML}

          <div style="background: #eff6ff; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <h3 style="margin: 0 0 8px 0; color: #1e40af;">💡 Pro Tips:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #374151;">
              <li>Set reminders 30 minutes before each contest</li>
              <li>Review your favorite algorithms beforehand</li>
              <li>Ensure stable internet connection</li>
              <li>Keep your IDE/editor ready</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin-bottom: 16px;">Track your progress on CodeTrack Pro</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" 
               style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">
              View Dashboard
            </a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px; color: #9ca3af; font-size: 12px;">
          <p>© 2025 CodeTrack Pro. All rights reserved.</p>
          <p>You're receiving this because you're registered for contest notifications.</p>
        </div>
      </body>
      </html>
    `;
  }

  async sendContestNotifications(contests) {
    try {
      const students = await this.getAllStudentEmails();
      
      if (students.length === 0) {
        return { success: false, message: 'No students found' };
      }

      const emailPromises = students.map(async (student) => {
        const mailOptions = {
          from: `"CodeTrack Pro" <${process.env.EMAIL_USER}>`,
          to: student.email,
          subject: `🚀 ${contests.length} Upcoming Coding Contest${contests.length > 1 ? 's' : ''} - Don't Miss Out!`,
          html: this.generateContestEmailHTML(contests, student.name)
        };

        try {
          await this.transporter.sendMail(mailOptions);
          return { email: student.email, status: 'sent' };
        } catch (error) {
          console.error(`Failed to send email to ${student.email}:`, error);
          return { email: student.email, status: 'failed', error: error.message };
        }
      });

      const results = await Promise.all(emailPromises);
      const successful = results.filter(r => r.status === 'sent').length;
      const failed = results.filter(r => r.status === 'failed').length;

      return {
        success: true,
        message: `Emails sent successfully to ${successful} students. ${failed} failed.`,
        results: {
          total: students.length,
          successful,
          failed,
          details: results
        }
      };
    } catch (error) {
      console.error('Error sending contest notifications:', error);
      return { success: false, message: error.message };
    }
  }
}

export default new EmailService();