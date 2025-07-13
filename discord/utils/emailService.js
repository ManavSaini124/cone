const nodeMailer = require('nodemailer');

const createTransporter = () => {
    return nodeMailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
}

const testEmailConnection = async () => {
    try {
        const transporter = createTransporter();
        await transporter.verify();
        console.log('✅ Email connection successful!');
        return true;
    } catch (error) {
        console.error('❌ Email connection failed:', error.message);
        return false;
    }
};

const sendOTPEmail = async (email, otp, name) => {
    try{
        const transporter = createTransporter();
        const mailOptions = {
            from: {
                name: process.env.APP_NAME || 'Cone',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: 'Verify Your Email - OTP Code',
            html: `
                <div style="font-family: 'Segoe UI', Roboto, sans-serif; background-color: #0f0f0f; color: #ffffff; max-width: 600px; margin: auto; padding: 40px 30px; border-radius: 12px;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #9cbc9c; font-size: 28px; margin-bottom: 8px;">Welcome to Cone 👋</h1>
                    <p style="color: #c9a896; font-size: 16px;">Let’s connect without limits.</p>
                </div>

                <!-- Greeting & Message -->
                <div style="background-color: #1c1c1c; padding: 25px 20px; border-radius: 10px;">
                    <p style="font-size: 16px;">Hi <strong>${name}</strong>,</p>
                    <p style="font-size: 15px; line-height: 1.6;">
                    Thanks for joining <strong>Cone</strong> — the place to connect, share, and chat freely. To complete your sign-up, please verify your email using the one-time password (OTP) below:
                    </p>

                    <!-- OTP Code -->
                    <div style="text-align: center; margin: 30px 0;">
                    <span style="display: inline-block; background-color: #2a2a2a; padding: 18px 30px; font-size: 30px; font-weight: bold; letter-spacing: 6px; color: #9cbc9c; border-radius: 8px;">
                        ${otp}
                    </span>
                    </div>

                    <p style="font-size: 14px; color: #cccccc;"><strong>This OTP is valid for 10 minutes.</strong></p>
                    <p style="font-size: 14px; color: #999999;">
                    Didn’t request this? You can safely ignore this message.
                    </p>
                </div>

                <!-- Footer -->
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #333;">
                <p style="font-size: 12px; color: #666666; text-align: center;">
                    This is an automated email from Cone. Please do not reply.
                </p>
                </div>
            `
        };
        console.log('📤 Sending email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ OTP email sent successfully:', info.messageId);
        console.log('📧 Email response:', info.response);
        return true;
    }catch(err){
        console.error('❌ Error sending OTP email:');
        console.error('Error message:', err.message);
        console.error('Error code:', err.code);
        console.error('Error command:', err.command);
        console.err('Full err:', err);
        if (err.code === 'EAUTH') {
            throw new Error('Email authentication failed. Please check your Gmail credentials and App Password.');
        } else if (err.code === 'ENOTFOUND') {
            throw new Error('Network err. Please check your internet connection.');
        } else if (err.code === 'ECONNECTION') {
            throw new Error('Connection failed. Please check your network settings.');
        } else {
            throw new Error(`Email sending failed: ${err.message}`);
        }
    }
}

module.exports = { 
    sendOTPEmail,
    testEmailConnection
};