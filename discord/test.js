require('dotenv').config();
const { sendOTPEmail, testEmailConnection } = require('./utils/emailService');

async function testEmail() {
    console.log('🚀 Starting email test...');
    
    // Test 1: Check environment variables
    console.log('\n📋 Checking environment variables:');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASS exists:', !!process.env.EMAIL_PASSWORD);
    console.log('APP_NAME:', process.env.APP_NAME || 'Not set');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error('❌ EMAIL_USER or EMAIL_PASS not found in .env file');
        return;
    }
    
    // Test 2: Test connection
    console.log('\n🔄 Testing email connection...');
    const connectionOk = await testEmailConnection();
    
    if (!connectionOk) {
        console.error('❌ Email connection failed. Please check your credentials.');
        return;
    }
    
    // Test 3: Send actual OTP email
    console.log('\n📧 Sending test OTP email...');
    try {
        await sendOTPEmail(
            process.env.EMAIL_USER, // Send to yourself for testing
            '123456',
            'Test User'
        );
        console.log('✅ Test email sent successfully!');
    } catch (error) {
        console.error('❌ Test email failed:', error.message);
    }
}

testEmail();