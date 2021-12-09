// Add libraries here
import express, { static } from "express";
import Web3 from "web3";
import HDwalletprovider from "truffle-hdwallet-provider";
import { urlencoded, json } from "body-parser";
import session from "express-session";
const mongoStore=require("connect-mongo")(session);
import { connect } from 'mongoose';

import { createHmac, createDecipher } from "crypto";
const secret = "KVNwPVFLdv9HHg9MwEgt";


// Add routes here
import signup from "./controllers/signups";
import dashboards from "./controllers/dashboards";
import add_record from "./controllers/add_record";
import add_doctor from "./controllers/add_doctor";
import profile from "./controllers/profile";
import signup_doctor from "./controllers/signups_doctor";
import upfile from "./controllers/uploadMultipleFile";
import { findOne } from './controllers/user_model';
import { findOne as _findOne } from './controllers/doctor_model';
import doctor_patient from './controllers/doctor_patient';
import doctor_doc from './controllers/doctor_doc';
// Contract variables
import { acc_abi } from "./contracts/accounts";
import { acc_address } from "./contracts/accounts";
import { right_abi } from "./contracts/accounts";
import { right_address } from "./contracts/accounts";

//Mongo connection
connect('mongodb://medicyl:medicyl123@ds123444.mlab.com:23444/medicyl', {useNewUrlParser: true},
function(error){
    if (error){
        console.log("Error in connecting database: ",error);
    }else{
        console.log("Connected to the database");
    }
});


// Start
const app=express();

app.set('view engine','ejs');

app.use(session({
    secret:"secret",
    resave:true,
    saveUninitialized: true,
}));

app.use(static('./public'));
app.use(urlencoded({extended:true}));
app.use(json());

app.get('/',(req,res)=>{
    res.render("index",{message:null});
});


app.post("/",async (req,res)=>{
    var username=req.body.username;
    var password=req.body.password;

    //Hash password

    var salt= "sRALdWPM3jqJWqN97WW1";
    var hashpass = createHmac('sha256',secret).update(password).digest('hex');
    console.log("Hash: ",hashpass);

    // console.log(username);

    // Web3 provider setup
    const provider = new HDwalletprovider(
        process.env.PRIVATE_KEY,
        process.env.ROPSTEN_INFURA
    );
    
    const web3=new Web3(provider);

    if (web3.currentProvider !== 'undefined'){
        console.log("Provider is set");
    }
    
    const contract=new web3.eth.Contract(acc_abi,acc_address);

    

    const response_pass= await contract.methods.get_passhash(username).call();
    console.log(response_pass) 



    //Decryption of password
    var mykey1 = createDecipher('aes-128-cbc', salt);
    var mystr1 = mykey1.update(response_pass, 'hex', 'utf8');
    mystr1 += mykey1.final('utf8');

    console.log("Hashed password after decryption: ",mystr1); 

    if (hashpass.match(mystr1)){
        console.log("Password Verified");

        // Set call to contract
        const response= await contract.methods.get_secret(username).call();
        console.log("Get Call to contract")
        console.log("Response from contract: ",response);

        // // Decryption Code for private key 
        var mypkey1 = createDecipher('aes-128-cbc', salt);
        var mypstr1 = mypkey1.update(response, 'hex', 'utf8');
        mypstr1 += mypkey1.final('utf8');

        mypstr1.toString(16);

        console.log("Decryption of the private key: ",mypstr1);

        var typesss="patient";
        findOne({username:username},function(err,users){
            console.log(err,users)
            if (err){
                console.log("Not found in User");
        
            }else{
                console.log("SEARCH RESULTS");
                console.log(users)
                if (users != null){
                    req.session.usertype=users.usertype;
                    req.session.doctorlist=users.doctorlist;
                    console.log("doctor list",req.session.doctorlist);

                }
                 
            }
        });
            
            _findOne({username:username},function(err,doctors){
                if (err){
                    console.log("Not Found in Doctor");
                }else{
                    console.log("SEARCH Doctor RESULTS");
                    //console.log(doctors)
                    if (doctors != null){
                        req.session.usertype=doctors.usertype;
                        
                        console.log("Session UserType", req.session.usertype);

                    }
                }
            });

        req.session.username=username;
        req.session.secretKey=mypstr1;
        
        console.log("Session started");
        
        console.log("Session Out Username", req.session.username);
        
        return res.redirect("/dashboard");


    }else{
        res.render("index",{message:"Incorrect Password"});
    }
    
});





app.listen(3000,()=>{
    console.log("listening to PORT 3000");
});

// Register Apps

signup(app);
dashboards(app);
add_record(app);
add_doctor(app);
profile(app);
upfile(app);
signup_doctor(app);
doctor_patient(app);
doctor_doc(app);