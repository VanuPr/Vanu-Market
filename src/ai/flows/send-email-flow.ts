
'use server';
/**
 * @fileOverview An email sending flow using nodemailer.
 *
 * - sendNotificationEmail - Sends an email.
 * - EmailInput - The input type for the sendNotificationEmail function.
 */

import { z } from 'zod';
import nodemailer from 'nodemailer';

const EmailInputSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  text: z.string(),
  html: z.string().optional(),
});
export type EmailInput = z.infer<typeof EmailInputSchema>;


export async function sendNotificationEmail(input: EmailInput): Promise<{ success: boolean }> {
  try {
      // IMPORTANT: Replace with your actual email transport configuration
      // This example uses a test account from ethereal.email.
      // In production, use a real SMTP provider (e.g., SendGrid, Mailgun) and store credentials securely.
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: (process.env.SMTP_SECURE === 'true') || false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER || 'arianna.koss34@ethereal.email', // generated ethereal user
          pass: process.env.SMTP_PASS || 'TtdV58a69zXb5h4YyC', // generated ethereal password
        },
      });

      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Vanu Organic Support" <support@vanu.com>',
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });

      console.log('Message sent: %s', info.messageId);
      // You can see a preview of the email here:
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

      return { success: true };
    } catch (error) {
      console.error('Failed to send email:', error);
      return { success: false };
    }
}
