require("dotenv").config();
const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const UserModel = require('./models/user');
const BookingModel = require('./models/booking');
const FeedbackModel = require('./models/feedback');
const PurchasePackageModel = require('./models/Packagepurshase');
const Form = require('./models/formmodel.js');
const Offer = require('./models/offer');
const twilio = require('twilio');
const fast2sms = require('fast-two-sms');
var nodemailer = require("nodemailer");
const axios = require('axios');

const path = require('path');

const app = express();

app.use(cors({
    origin: ["https://capable-medovik-acac7d.netlify.app","https://spiffy-lolly-be4eb1.netlify.app","http://localhost:5173"],
    methods: ["GET", "POST", "PUT"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Database Connected");
}).catch((e) => {
    console.error("Error in connecting db", e);
});

const { EMAIL_USER, EMAIL_PASS, EMAIL_SERVICE } = process.env;



let emailVerificationStore = {}; // This is for storing email verification tokens in memory. Use a database in production.

const transporter = nodemailer.createTransport({
  service: EMAIL_SERVICE,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

const FAST2SMS_API_KEY ="uQatedbOZDVplUNXMwL43Pj9JhirB02HzF7ysTWKEvg5nqof1IMoD1p9gxRPG6wZ5kO8L7AmY4CicU2I";
const otpStore = {}; // Ideally store in a database

// Endpoint to send OTP
app.post('/send-otp', async (req, res) => {
    const { mobilenumber } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP

    const options = {
        authorization: FAST2SMS_API_KEY,
        message: `Your OTP for mobile verification is ${otp}. Thanks, Fast2SMS.`,
        numbers: [mobilenumber]
    };

    try {
        const response = await fast2sms.sendMessage(options);
        console.log('OTP Sent:', response);
        if (response.return) {
            otpStore[mobilenumber] = otp;
            res.json({ success: true, message: 'OTP sent successfully' });
        } else {
            res.status(500).json({ success: false, message: 'Failed to send OTP' });
        }
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
});

// Endpoint to verify OTP
app.post('/verify-otp', (req, res) => {
    const { mobilenumber, otp } = req.body;

    if (otpStore[mobilenumber] && otpStore[mobilenumber] === otp) {
        delete otpStore[mobilenumber]; // Clear the OTP once verified
        res.json({ success: true, message: 'OTP verified successfully' });
    } else {
        res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
});

const emailOtpStore = {};


app.post('/send-email-otp', (req, res) => {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP

    const mailOptions = {
        from: EMAIL_USER,
        to: email,
        subject: 'Email Verification OTP',
        text: `Your OTP for email verification is: ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).json({ success: false, message: 'Failed to send OTP' });
        } else {
            emailOtpStore[email] = otp;
            console.log(emailOtpStore);
            res.json({ success: true, message: 'OTP sent successfully' });
        }
    });
});

app.post('/verify-email-otp', (req, res) => {
    const { email, emailOtp } = req.body;
    console.log(email);
    console.log(emailOtp);

    if (emailOtpStore[email] && emailOtpStore[email] === emailOtp) {
        delete emailOtpStore[email];
        res.json({ success: true, message: 'Email verified successfully' });
    } else {
        res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
});
// Send Verification Email
app.post('/send-verification-email', (req, res) => {
  const { email } = req.body;
  const token = Math.random().toString(36).substring(2);
  const verificationLink = `https://capable-medovik-acac7d.netlify.app/verify-email?token=${token}`;

  const mailOptions = {
    from: EMAIL_USER,
    to: email,
    subject: 'Email Verification',
    text: `Click this link to verify your email: ${verificationLink}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      res.status(500).json({ success: false, message: 'Failed to send verification email' });
    } else {
      emailVerificationStore[token] = email;
      res.json({ success: true, message: 'Verification email sent successfully' });
    }
  });
});

// Verify Email Token
app.get('/verify-email', (req, res) => {
  const { token } = req.query;

  if (emailVerificationStore[token]) {
    const email = emailVerificationStore[token];
    delete emailVerificationStore[token];
    res.json({ success: true, message: 'Email verified successfully', email });
  } else {
    res.status(400).json({ success: false, message: 'Invalid or expired token' });
  }
});




app.post('/register', async (req, res) => {
    const { firstname, lastname, mobilenumber, email, password } = req.body;
    try {
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: "User already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new UserModel({
            firstname,
            lastname,
            mobilenumber,
            email,
            password: hashedPassword,
            role: "user"
        });
        await newUser.save();
        res.json({ status: "Account created successfully" });
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "No record exists" });
        }
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ error: "The password is incorrect" });
        }
        const token = jwt.sign({ email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token);
        res.json({ status: "Success", name: user.email, role: user.role, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post('/validate-promocode', async (req, res) => {
    const { promocode } = req.body;
    try {
      const offer = await Offer.findOne({ code: promocode });
      if (offer) {
        res.json({ status: 'ok', discount: offer.discount });
      } else {
        res.json({ status: 'error', message: 'Invalid promo code' });
      }
    } catch (err) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  });
  
  // Booking endpoint
  app.post('/booking', async (req, res) => {
    console.log('Request received:', req.body);
    try {
      const { name, age, email, persons, city, startdate, enddate, mobile, totalamount, promocode } = req.body;
      
      // Validate promo code
      let discount = 0;
      if (promocode) {
        const offer = await Offer.findOne({ code: promocode });
        if (offer) {
          discount = offer.discount;
        } else {
          return res.status(400).json({ status: 'error', message: 'Invalid promo code' });
        }
      }
      const discountedAmount = totalamount;
      
      const newBooking = new BookingModel({ 
        name, 
        age, 
        email, 
        persons, 
        city, 
        startdate, 
        enddate, 
        mobile, 
        totalamount: discountedAmount, 
        promocode 
      });
      
      await newBooking.save();
      console.log('Data saved successfully');
      res.json({ status: 'ok' });
    } catch (err) {
      console.log(err);
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  });

app.get('/allusers', async (req, res) => {
    try {
        const allusers = await UserModel.find();
        res.json(allusers);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/allbookings', async (req, res) => {
    try {
        const allbookings = await BookingModel.find();
        res.json(allbookings);
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/allfeedback', async (req, res) => {
    try {
        const allfeedback = await FeedbackModel.find();
        res.json(allfeedback);
    } catch (error) {
        console.error("Error fetching feedback:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/packagaereq', async (req, res) => {
    try {
        const packagaereq = await PurchasePackageModel.find();
        res.json(packagaereq);
    } catch (error) {
        console.error("Error fetching package requests:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/userbooking', async (req, res) => {
    try {
        const { mail } = req.query;
        const userBookings = await BookingModel.find({ email: mail });
        res.json(userBookings);
    } catch (error) {
        console.error("Error fetching user bookings:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/user', async (req, res) => {
    try {
        const { email } = req.query;
        const userprofile = await UserModel.findOne({ email });
        res.json(userprofile);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



app.put('/user/update', async (req, res) => {
    const { email, firstname, lastname, mobilenumber } = req.body;

    const sanitizedEmail = email.trim();
    const sanitizedFirstname = firstname.trim();
    const sanitizedLastname = lastname.trim();
    const sanitizedMobilenumber = parseInt(mobilenumber, 10);

    if (!sanitizedEmail || !sanitizedFirstname || !sanitizedLastname || isNaN(sanitizedMobilenumber)) {
        return res.status(400).json({ error: "Invalid input data" });
    }

    try {
        const updatedUser = await UserModel.findOneAndUpdate(
            { email: sanitizedEmail },
            { firstname: sanitizedFirstname, lastname: sanitizedLastname, mobilenumber: sanitizedMobilenumber },
            { new: true } // Return the updated document
        );
        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(updatedUser);
    } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post('/feedback', async (req, res) => {
    try {
        const { name, email, feedback } = req.body;
        const newFeedback = new FeedbackModel({ name, email, feedback });
        await newFeedback.save();
        res.status(201).json(newFeedback);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


app.post('/submit-form', async (req, res) => {
    try {
        const formData = new Form(req.body);
        await formData.save();
        res.status(201).send({ message: 'Form submitted successfully' });
    } catch (error) {
        res.status(400).send({ error: 'Error submitting form' });
    }
});
app.get('/forms', async (req, res) => {
    try {
        const forms = await Form.find();
        res.status(200).send(forms);
    } catch (error) {
        res.status(400).send({ error: 'Error fetching forms' });
    }
});

app.post('/purchase-package', async (req, res) => {
    try {
        const { firstName, lastName, mobileNumber, email, numberOfAdults, numberOfChildren, packageType } = req.body;
        const newPurchasePackage = new PurchasePackageModel({
            firstName,
            lastName,
            mobileNumber,
            email,
            numberOfAdults,
            numberOfChildren,
            packageType
        });
        await newPurchasePackage.save();
        res.status(201).json(newPurchasePackage);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/forgotpassword', async (req, res) => {
    const { email } = req.body;
    try {
        const oldUser = await UserModel.findOne({ email });
        if (!oldUser) {
            return res.json({ status: 'user not exists' });
        }
        const secret = process.env.JWT_SECRET + oldUser.password;
        const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, { expiresIn: '5m' });
        const link = `https://capable-medovik-acac7d.netlify.app/resetpassword/${oldUser._id}/${token}`;
        console.log(link);
        
var transporter = nodemailer.createTransport({
    service: 'gmail',
    port: 465,
    secure: true,
    auth: {
      user: 'harisahsolo@gmail.com',
      pass: 'hotj bxpd eigb uvwm'
    },
    tls:{
        rejectUnauthorized: false
    }
  });
  
  var mailOptions = {
    from: 'harisahsolo@gmail.com',
    to: email,
    subject: 'Link for Reset your password',
    text: link
  };
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
        
        
        
        


    return res.json({ status:"Email sent successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
});


app.use(express.static(path.join(__dirname, 'frontend/build')));

app.get("*",(req,res)=>{
    res.sendFile(path.join(__dirname,"/frontend/build/index.html"))
    res.sendFile(path.join(__dirname,"/backend/build/index.html"))
})

    app.post("/resetpassword/:_id/:token", async (req, res) => {
        console.log("entering into reset password");
        const { _id, token } = req.params;
        const { password } = req.body;
        console.log(_id);
        console.log(token);

        try {
            const user = await UserModel.findById(_id);
            if (!user) {
                return res.status(404).send("User not found");
            }

            const secret = process.env.JWT_SECRET + user.password;

            jwt.verify(token, secret, async (err, decodedToken) => {
                if (err) {
                    console.error("JWT verification error:", err);
                    return res.status(401).send("Invalid or expired token. Please request a new password reset.");
                }

                const hashedPassword = await bcrypt.hash(password, 10);
                user.password = hashedPassword;
                await user.save();

                res.status(200).send("Password updated successfully");
            });
        } catch (error) {
            console.error("Error updating password:", error);
            res.status(500).send("Error updating password. Please try again later.");
        }
    });


app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build/index.html'));
  }); 
  
app.listen(process.env.PORT, () => {
    console.log("Server is connected", process.env.PORT);
});
