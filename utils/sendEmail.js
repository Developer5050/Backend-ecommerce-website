const nodeMailer = require("nodemailer");   

const sendEmail = async ({to , subject, html}) => {
    const transporter = nodeMailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `"New Order" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    };
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
        return info;
    } catch (error) {
        console.error("Error sending email: ", error);
        throw error;
    }

}

module.exports = sendEmail;