const express = require("express");
const app = express();

require("dotenv").config();

const bodyParser = require("body-parser");
app.use(express.json());
bodyParser.urlencoded({ extended: true });

const bcrypt = require("bcrypt");
const saltRounds = 10;
const mongoose = require("mongoose");
mongoose.connect(process.env.DB_URL);

const cors = require("cors");
const corsOptions = {
  origin: "*",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions)); // Use this after the variable declaration


const nodemailer = require("nodemailer");

const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.CLIENT_ID, // ClientID
  process.env.CLIENT_SECRET, // Client Secret
  process.env.REDIRECT_URL // Redirect URL
);

oauth2Client.setCredentials({
  refresh_token:process.env.REFRESH_TOKEN,
});
const accessToken = oauth2Client.getAccessToken();

let generator = require('generate-password');




const PORT = process.env.PORT || 4000;


//User Schema
const userSchema = new mongoose.Schema({

    email: {
      type: String,
      required: true,
    },
    userName: {
        type: String,
        minlength: 2,
        maxlength: 20,
        required: true,
      },
   
    password: {
      type: String,
      required: true,
    },
  });
  
  const User = mongoose.model("User", userSchema);
        
  //SIGN UP 

app.post("/signup", async function (req, res) {
    try {
      console.log(req.body);
      const { email,userName, password } = req.body;

      //Checks If User Existed
      const userExisted = await User.findOne({ email });
  
      if (userExisted) {
        console.log("User Already Existed!!");
        res.status(409).send({ message: "User Already Existed!!" });
      } else {
        const salt = bcrypt.genSaltSync(saltRounds);
        const hash = bcrypt.hashSync(password, salt);
        const userData = new User({
         
          email,
          userName,
          password: hash,
        });
  
        userData.save(function (err) {
          if (err) {
            console.log(err);
            res.status(500).send({ message: "Registration Failed!" });
          } else {
            console.log("Registered Successfully!!");
         
            res.status(200).send({ message: "Registerd Successfully!" });
          }
        });
      }
    } catch (error) {
      console.log(error);
    }
  });


  //Login User

app.post("/signin", function (req, res) {
    try {
      const { email,userName, password } = req.body;
 let obj={};
      if(email){

        obj={email};

      }
      else{
        obj={userName};

      }
      

      User.findOne({ ...obj }, function (err, user) {
        if (err) {
          console.log(err);
        } else {
          //Checks user if Existed
          if (user) {
            //Checks Verified Account
              //Checks Password
              if (bcrypt.compareSync(password, user.password)) {
                res.status(200).send({ message: "Login Successfully!!" });
              } else {
                res.status(401).send({ message: "Unauthorized User!!" });
              }
          } else {
            res.status(404).send({ message: "User Not existed!!" });
          }
        }
      });
    } catch (error) {
      console.log(error);
    }
  });


// FORGOT PASSWORD

app.post("/forgotpassword",async function(req,res){
 
try{
    const { email,userName } = req.body;
    let obj={};
         if(email!==undefined){
   
           obj={email};
           console.log("dasad",obj)

        }
         else{
           obj={userName};
           console.log("dasad",obj)
   
         }

    // 
    
        
        User.findOne({ ...obj }, async function (err, user) {
            if (err) {
              console.log(err);
            } else {
              //Checks user if Existed
              if (user) {
    
    
                    //Generate New Password
    
                    let password = generator.generate({
                        length: 10,
                        numbers: true
                    });
    
                async function sendMail() {
                    try {
                      //Mail Config
                      const smtpTransport = nodemailer.createTransport({
                        service: "gmail",
                        auth: {
                          type: "OAuth2",
                          user: "prasannavenkatesh.dev@gmail.com",
                          clientId: process.env.CLIENT_ID,
                          clientSecret: process.env.CLIENT_SECRET,
                          refreshToken: process.env.REFRESH_TOKEN,
                          accessToken: accessToken,
                        },
                        tls: {
                          rejectUnauthorized: false,
                        },
                      });
    
                  
            
                      //Mail Options
                      const mailOptions = {
                        from: "prasannavenkatesh.dev@gmail.com",
            
                        to: email || user.email,
                        subject: "New Password Request",
                        generateTextFromHTML: true,
                        html: `Dear User, <br/>Your New Password for Ecom is <b>${password}</b>. Thank you. Secured by OAuth2.`,
                      };
            
                      //Sending Mail
                       smtpTransport.sendMail(mailOptions, (error, response) => {
                        error ? console.log(error) : console.log(response);
                        smtpTransport.close();
                      });
                    } catch (error) {
            
                      console.log(error);
                    }
                  }
                  sendMail();
    
                  const salt = bcrypt.genSaltSync(saltRounds);
                  const hash = bcrypt.hashSync(password, salt);
                //   const userData = new User({
                   
                //     email,
                    
                //     password: hash,
                //   });
            
                 User.updateOne({...obj},{
                    $set:{password:hash}
                },function (err) {
                    if (err) {
                      console.log(err);
                      res.status(500).send({ message: "Password Sent Failed!" });
                    } else {
                      console.log("Password Sent Successfully!!");
                   
                      res.status(200).send({ message: "Password Sent Successfully!" });
                    }
                  });
    
               
    
              } else {
                res.status(404).send({ message: "User Not existed!!" });
              }
            }
          });
    



}
catch (error) {
      console.log(error);
}





   



})



app.listen(PORT,()=>{
    console.log(`Server Started on port ${PORT}`)
})