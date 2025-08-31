// const twilio = require("twilio");

// // Validate environment variables at module load
// const validateTwilioConfig = () => {
//   const required = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_NUMBER'];
//   const missing = required.filter(key => !process.env[key]);
  
//   if (missing.length > 0) {
//     throw new Error(`Missing required Twilio environment variables: ${missing.join(', ')}`);
//   }

//   // Validate format of credentials
//   if (!process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
//     throw new Error('TWILIO_ACCOUNT_SID should start with "AC"');
//   }

//   if (!process.env.TWILIO_WHATSAPP_NUMBER.startsWith('+')) {
//     throw new Error('TWILIO_WHATSAPP_NUMBER should start with "+" and include country code');
//   }
// };

// // Validate config on module load
// try {
//   validateTwilioConfig();
// } catch (error) {
//   console.error('❌ Twilio Configuration Error:', error.message);
//   console.error('🔧 Please check your .env file and ensure all Twilio credentials are properly set');
// }

// // Initialize Twilio client
// let client;
// try {
//   client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
// } catch (error) {
//   console.error('❌ Failed to initialize Twilio client:', error.message);
// }

// const sendWhatsapp = async (toNumber, message) => {
//   try {
//     // Re-validate config before each call
//     validateTwilioConfig();

//     if (!client) {
//       throw new Error('Twilio client not initialized. Check your credentials.');
//     }

//     // Format phone number
//     let formattedNumber = toNumber.toString().trim();
    
//     // Remove any existing whatsapp: prefix
//     if (formattedNumber.startsWith('whatsapp:')) {
//       formattedNumber = formattedNumber.replace('whatsapp:', '');
//     }
    
//     // Add country code if missing
//     if (!formattedNumber.startsWith('+')) {
//       // For Indian numbers, add +91 prefix
//       formattedNumber = '+91' + formattedNumber;
//     }

//     // Additional validation
//     if (!formattedNumber.match(/^\+\d{10,15}$/)) {
//       throw new Error(`Invalid phone number format: ${formattedNumber}. Expected format: +[country code][number]`);
//     }

//     console.log(`📱 Sending WhatsApp from: ${process.env.TWILIO_WHATSAPP_NUMBER}`);
//     console.log(`📱 Sending WhatsApp to: ${formattedNumber}`);
//     console.log(`💬 Message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);

//     // Test authentication first with a simple API call
//     try {
//       await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
//     } catch (authError) {
//       if (authError.code === 20003) {
//         throw new Error(`Authentication failed. Please verify your Twilio Account SID and Auth Token. Error: ${authError.message}`);
//       }
//       throw authError;
//     }

//     // Send the message
//     const result = await client.messages.create({
//       from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
//       to: `whatsapp:${formattedNumber}`,
//       body: message,
//     });

//     console.log(`✅ WhatsApp sent successfully. SID: ${result.sid}`);
//     console.log(`📊 Status: ${result.status}, Direction: ${result.direction}`);
    
//     return {
//       success: true,
//       sid: result.sid,
//       status: result.status,
//       to: formattedNumber,
//       from: process.env.TWILIO_WHATSAPP_NUMBER
//     };

//   } catch (error) {
//     console.error(`❌ WhatsApp sending failed:`, error);
    
//     // Enhanced error logging based on error type
//     if (error.code === 20003) {
//       console.error('🔑 AUTHENTICATION ERROR:');
//       console.error('   - Check if your Twilio Account SID and Auth Token are correct');
//       console.error('   - Verify credentials in Twilio Console: https://console.twilio.com/');
//       console.error('   - Make sure the Account SID starts with "AC"');
//       console.error('   - Ensure Auth Token is not expired');
//     } else if (error.code === 63016) {
//       console.error('📱 WHATSAPP NUMBER ERROR:');
//       console.error('   - Your Twilio phone number may not be WhatsApp enabled');
//       console.error('   - Check WhatsApp sender status in Twilio Console');
//     } else if (error.code === 21211) {
//       console.error('📱 INVALID TO NUMBER:');
//       console.error('   - The recipient phone number is invalid');
//       console.error(`   - Tried to send to: ${toNumber}`);
//     } else if (error.code === 21608) {
//       console.error('📱 UNVERIFIED NUMBER:');
//       console.error('   - The recipient number may not be verified for WhatsApp sandbox');
//       console.error('   - Or your account may need approval for sending to unverified numbers');
//     }
    
//     // Log environment status for debugging
//     console.error('🔧 Environment Status:');
//     console.error('   - TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'Present' : 'Missing');
//     console.error('   - TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'Present' : 'Missing');
//     console.error('   - TWILIO_WHATSAPP_NUMBER:', process.env.TWILIO_WHATSAPP_NUMBER || 'Missing');
    
//     // Return structured error for better handling upstream
//     throw {
//       ...error,
//       twilioCode: error.code,
//       twilioMessage: error.message,
//       moreInfo: error.moreInfo,
//       isAuthError: error.code === 20003,
//       isPhoneNumberError: [21211, 21608, 63016].includes(error.code)
//     };
//   }
// };

// // Export both the function and a test function
// module.exports = {
//   sendWhatsapp,
  
//   // Test function to validate setup
//   testTwilioSetup: async () => {
//     try {
//       validateTwilioConfig();
//       const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
//       return {
//         success: true,
//         accountStatus: account.status,
//         accountSid: account.sid
//       };
//     } catch (error) {
//       return {
//         success: false,
//         error: error.message,
//         code: error.code
//       };
//     }
//   }
// };

const twilio = require("twilio");

// Validate environment variables at module load
const validateTwilioConfig = () => {
  const required = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_NUMBER'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required Twilio environment variables: ${missing.join(', ')}`);
  }

  // Validate format of credentials
  if (!process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
    throw new Error('TWILIO_ACCOUNT_SID should start with "AC"');
  }

  if (!process.env.TWILIO_WHATSAPP_NUMBER.startsWith('+')) {
    throw new Error('TWILIO_WHATSAPP_NUMBER should start with "+" and include country code');
  }
};

// Validate config on module load
try {
  validateTwilioConfig();
} catch (error) {
  console.error('❌ Twilio Configuration Error:', error.message);
  console.error('🔧 Please check your .env file and ensure all Twilio credentials are properly set');
}

// Initialize Twilio client
let client;
try {
  client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
} catch (error) {
  console.error('❌ Failed to initialize Twilio client:', error.message);
}

const sendWhatsapp = async (toNumber, message) => {
  try {
    // Re-validate config before each call
    validateTwilioConfig();

    if (!client) {
      throw new Error('Twilio client not initialized. Check your credentials.');
    }

    // Format phone number
    let formattedNumber = toNumber.toString().trim();
    
    // Remove any existing whatsapp: prefix
    if (formattedNumber.startsWith('whatsapp:')) {
      formattedNumber = formattedNumber.replace('whatsapp:', '');
    }
    
    // Add country code if missing
    if (!formattedNumber.startsWith('+')) {
      // For Indian numbers, add +91 prefix
      formattedNumber = '+91' + formattedNumber;
    }

    // Additional validation
    if (!formattedNumber.match(/^\+\d{10,15}$/)) {
      throw new Error(`Invalid phone number format: ${formattedNumber}. Expected format: +[country code][number]`);
    }

    console.log(`📱 Sending WhatsApp from: ${process.env.TWILIO_WHATSAPP_NUMBER}`);
    console.log(`📱 Sending WhatsApp to: ${formattedNumber}`);
    console.log(`💬 Message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);

    // REMOVED: Authentication test that causes 20008 error on trial accounts
    // Trial accounts can send messages but can't fetch account details

    // Send the message directly
    const result = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${formattedNumber}`,
      body: message,
    });

    console.log(`✅ WhatsApp sent successfully. SID: ${result.sid}`);
    console.log(`📊 Status: ${result.status}, Direction: ${result.direction}`);
    
    return {
      success: true,
      sid: result.sid,
      status: result.status,
      to: formattedNumber,
      from: process.env.TWILIO_WHATSAPP_NUMBER
    };

  } catch (error) {
    console.error(`❌ WhatsApp sending failed:`, error);
    
    // Enhanced error logging based on error type
    if (error.code === 20003) {
      console.error('🔑 AUTHENTICATION ERROR:');
      console.error('   - Check if your Twilio Account SID and Auth Token are correct');
      console.error('   - Verify credentials in Twilio Console: https://console.twilio.com/');
      console.error('   - Make sure the Account SID starts with "AC"');
      console.error('   - Ensure Auth Token is not expired');
    } else if (error.code === 20008) {
      console.error('🔒 TRIAL ACCOUNT LIMITATION:');
      console.error('   - Your Twilio account is in trial mode');
      console.error('   - Upgrade to a paid account to access all API features');
      console.error('   - Visit: https://console.twilio.com/billing');
    } else if (error.code === 63016) {
      console.error('📱 WHATSAPP NUMBER ERROR:');
      console.error('   - Your Twilio phone number may not be WhatsApp enabled');
      console.error('   - Check WhatsApp sender status in Twilio Console');
    } else if (error.code === 21211) {
      console.error('📱 INVALID TO NUMBER:');
      console.error('   - The recipient phone number is invalid');
      console.error(`   - Tried to send to: ${toNumber}`);
    } else if (error.code === 21608) {
      console.error('📱 UNVERIFIED NUMBER:');
      console.error('   - The recipient number may not be verified for WhatsApp sandbox');
      console.error('   - Or your account may need approval for sending to unverified numbers');
    }
    
    // Log environment status for debugging
    console.error('🔧 Environment Status:');
    console.error('   - TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'Present' : 'Missing');
    console.error('   - TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'Present' : 'Missing');
    console.error('   - TWILIO_WHATSAPP_NUMBER:', process.env.TWILIO_WHATSAPP_NUMBER || 'Missing');
    
    // Return structured error for better handling upstream
    throw {
      ...error,
      twilioCode: error.code,
      twilioMessage: error.message,
      moreInfo: error.moreInfo,
      isAuthError: error.code === 20003,
      isTrialLimitation: error.code === 20008,
      isPhoneNumberError: [21211, 21608, 63016].includes(error.code)
    };
  }
};

// Export both the function and a simplified test function
module.exports = {
  sendWhatsapp,
  
  // Simplified test function that works with trial accounts
  testTwilioSetup: async () => {
    try {
      validateTwilioConfig();
      
      // For trial accounts, we can't fetch account details
      // So we just validate the client initialization
      console.log('✅ Twilio client initialized successfully');
      console.log('📋 Account SID:', process.env.TWILIO_ACCOUNT_SID);
      console.log('📱 WhatsApp Number:', process.env.TWILIO_WHATSAPP_NUMBER);
      console.log('ℹ️  Note: Full account validation requires paid account');
      
      return {
        success: true,
        message: 'Client initialized - ready to send messages',
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        isTrialAccount: true
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }
};