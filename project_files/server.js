const express = require('express');
const app = express();

const json2html = require('json-to-html');

const {Datastore} = require('@google-cloud/datastore');

const bodyParser = require('body-parser');
const request = require('request');

const datastore = new Datastore();

const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const { requiresAuth } = require('express-openid-connect');

const BOAT = "Boat";
const USER = "User";

const router = express.Router();
const login = express.Router();

const CLIENT_ID = '';
const CLIENT_SECRET = '';
const DOMAIN = '';

app.use(bodyParser.json());

function fromDatastore(item){
    item.id = item[Datastore.KEY].id;
    return item;
}

let rand_str = size => [...Array(size)].map(()=> Math.floor(Math.random()* 16).toString(16)).join('');

// auth router attaches /login, /logout, and /callback routes to the baseURL
const { auth } = require('express-openid-connect');
const config = {
    authRequired: false,
    auth0Logout: true,
    baseURL: '',
    clientID: CLIENT_ID,
    issuerBaseURL: `https://${DOMAIN}/`,
    secret: rand_str(16)
  };

app.use(auth(config));

app.get('/', (req, res) => {
    //res.send(req.oidc.isAuthenticated() ? `Logged in\nUser Info: ${req.oidc.user}\n` : 'Logged out')
    if (req.oidc.isAuthenticated() == true){
        const nickName = JSON.stringify(req.oidc.user.nickname);
        const userName = JSON.stringify(req.oidc.user.name);
        const userEmail = JSON.stringify(req.oidc.user.email);
        const userID = JSON.stringify(req.oidc.user.sub);
        res.send(`Logged In \nNickname: ${nickName}\nUsername: ${userName}\nEmail: ${userEmail}\n OwnerID: ${userID} \n To Log Out place /logout at the end of the url and hit enter.`);
    }
    else{
        res.send("Logged Out \n To log in place /login at the end of the url and hit enter.");
    }
});

login.post('/', function(req, res){
    const username = req.body.username;
    const password = req.body.password;
    var options = { method: 'POST',
            url: `https://${DOMAIN}/oauth/token`,
            headers: { 'content-type': 'application/json' },
            body:
             { grant_type: 'password',
               username: username,
               password: password,
               client_id: CLIENT_ID,
               client_secret: CLIENT_SECRET },
            json: true };
    request(options, (error, response, body) => {
        if (error){
            res.status(500).send(error);
        } else {
            res.send(body);
        }
    });

});

/* ------------- End Controller Functions ------------- */

app.use('/', require('./index'));
app.use('/serverlogin', login);

// Listen to the App Engine-specified port, or 8000 otherwise
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});