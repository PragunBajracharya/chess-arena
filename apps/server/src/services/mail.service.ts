import { env } from "../config/env";
import { logger } from "../config/logger";

interface Mail {
    to: string;
    subject: string;
    /** Plain-text body. */
    text: string;
    /** The one link the email is about, also rendered as a button. */
    link: { label: string; url: string };
}

const escape = (s: string) =>
    s.replace(
        /[&<>"']/g,
        (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
    );

function html({ text, link }: Mail) {
    const paragraphs = text
        .split("\n\n")
        .map((p) => `<p style="margin:0 0 16px">${escape(p)}</p>`)
        .join("");
    return `<!doctype html><html><body style="margin:0;background:#f4f1ec;padding:32px 16px;font-family:system-ui,sans-serif;color:#1d2026;font-size:15px;line-height:1.5">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px">
<p style="margin:0 0 24px;font-weight:600;font-size:17px">Chess Arena</p>
${paragraphs}
<p style="margin:24px 0"><a href="${escape(link.url)}" style="display:inline-block;background:#8a6526;color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px">${escape(link.label)}</a></p>
<p style="margin:0;font-size:13px;color:#5c636d">If the button doesn't work, paste this link into your browser:<br>${escape(link.url)}</p>
</div></body></html>`;
}

/**
 * Sends an email through Resend's HTTP API. Without RESEND_API_KEY the email is
 * logged instead, so sign-up, verification and password reset all work locally.
 */
export async function sendMail(mail: Mail) {
    if (!env.RESEND_API_KEY) {
        logger.info(
            { to: mail.to, subject: mail.subject, link: mail.link.url },
            "Email not sent (RESEND_API_KEY is not set). Open the link to continue.",
        );
        return;
    }
    const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: env.EMAIL_FROM,
            to: mail.to,
            subject: mail.subject,
            text: `${mail.text}\n\n${mail.link.label}: ${mail.link.url}`,
            html: html(mail),
        }),
    });
    if (!res.ok) {
        logger.error({ status: res.status, body: await res.text() }, "Resend rejected the email");
        throw new Error("The email couldn't be sent. Try again in a minute.");
    }
}
