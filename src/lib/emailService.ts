import { supabase } from './supabaseClient';

/**
 * Send an email using the Supabase Edge Function (resend-email)
 * @param to - Recipient email address
 * @param subject - Email subject line
 * @param html - HTML content of the email body
 */
export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<unknown> => {
  const { data, error } = await supabase.functions.invoke('resend-email', {
    body: { to, subject, html },
  });

  if (error) {
    console.error('Email sending failed:', error);
    throw error;
  }

  return data;
};
