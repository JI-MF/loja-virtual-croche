import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
});

export async function enviarOTP(email, codigo) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
        throw new Error("Credenciais de e-mail não configuradas.");
    }

    const resultado = await transporter.sendMail({
        from: `"Produções da Vick" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Código de verificação - Produções da Vick",
        text: `Seu código de verificação é ${codigo}. Ele expira em 5 minutos.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <h2>Produções da Vick Crochê</h2>

                <p>Olá!</p>

                <p>Utilize o código abaixo para verificar seu e-mail:</p>

                <div style="
                    font-size: 32px;
                    font-weight: bold;
                    letter-spacing: 8px;
                    padding: 20px;
                    text-align: center;
                    background-color: #f5f5f5;
                    border-radius: 8px;
                ">
                    ${codigo}
                </div>

                <p>Este código expira em <strong>5 minutos</strong>.</p>

                <p>Se você não solicitou esta verificação, ignore esta mensagem.</p>

                <hr>

                <p style="font-size: 12px; color: #777;">
                    Produções da Vick Crochê
                </p>
            </div>
        `,
    });

    return resultado;
}