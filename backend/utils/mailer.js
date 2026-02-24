import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

export const sendTicketEmail = async (toEmail, eventName, ticketId, organizerName, startDate, endDate) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USERNAME,
            pass: process.env.GMAIL_PASSWORD
        }
    });
    const qrDataUrl = await QRCode.toDataURL(ticketId);
    const qrBase64 = qrDataUrl.split(',')[1];

    const fmtDate = (d) => d ? new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'TBA';

    const html = `
        <h2>Registration Confirmed</h2>
        <p><b>${eventName}</b> by ${organizerName}</p>
        <p>Start: ${fmtDate(startDate)} | End: ${fmtDate(endDate)}</p>
        <img src="cid:qrcode" alt="QR Code" width="180" height="180" />
        <p>Ticket ID: <b>${ticketId}</b></p>
    `;

    await transporter.sendMail({
        from: process.env.GMAIL_USERNAME,
        to: toEmail,
        subject: `Ticket for ${eventName}`,
        html,
        attachments: [{
            filename: 'qrcode.png',
            content: qrBase64,
            encoding: 'base64',
            cid: 'qrcode'
        }]
    });
};
