import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

export async function sendLowTokensEmail(email, name, remaining) {
    if (!email) return;
    try {
        await transporter.sendMail({
            from: `"AI Consultant" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Внимание: Заканчиваются токены',
            html: `<p>Здравствуйте, ${name || 'клиент'}!</p>
                   <p>На вашем балансе осталось всего <b>${remaining}</b> сообщений.</p>
                   <p>Пожалуйста, пополните баланс или перейдите на другой тариф, чтобы ваши боты продолжали работать без перебоев.</p>`
        });
    } catch (e) {
        console.error('[EmailService] Failed to send low tokens email:', e);
    }
}

export async function sendManagerNotification(email, contactName, botName) {
    if (!email) return;
    try {
        await transporter.sendMail({
            from: `"AI Consultant" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `Требуется менеджер в чате: ${botName}`,
            html: `<p>Внимание!</p>
                   <p>Пользователь <b>${contactName || 'Клиент'}</b> в боте <b>${botName}</b> просит позвать менеджера или бот не смог ответить на вопрос.</p>
                   <p>Пожалуйста, подключитесь к чату.</p>`
        });
    } catch (e) {
        console.error('[EmailService] Failed to send manager notification email:', e);
    }
}
