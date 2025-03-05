import { Resend } from "resend";
import { env } from "./env.config.js";

// Initialize Resend with API key
const resend = new Resend(env.RESEND_API_KEY);

// Email payload interface
interface EmailPayload {
    from: string;
    to: string | string[];
    subject: string;
    body: string;
    replyTo?: string;
    cc?: string[];
    bcc?: string[]; 
}

/**
 * Sends an email using Resend service
 * @param {EmailPayload} payload - Email configuration object
 * @returns {Promise<{ success: boolean; message: string; data?: any }>}
 */
export async function sendEmail({ from, to, subject, body, replyTo, cc, bcc }: EmailPayload) {
    try {
        // Validate email addresses
        if (!from || !to || !subject || !body) {
            throw new Error("Missing required email fields");
        }

        const { data, error } = await resend.emails.send({
            from,
            to,
            subject,
            html: body,
            replyTo,
            cc,
            bcc
        });

        if (error) {
            return {
                success: false,
                message: error.message
            };
        }

        return {
            success: true,
            message: "Email sent successfully",
            data
        };
    } catch (error: any) {
        console.error("Email sending failed:", error);
        return {
            success: false,
            message: error.message || "Failed to send email"
        };
    }
}

export const resendConfig = {
    apiKey: env.RESEND_API_KEY,
    // In test/dev, maybe log emails instead of sending them
    dryRun: env.NODE_ENV !== 'production'
};
