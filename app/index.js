var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

var path = require('path');

const Picasa = require('picasa');

const picasa = new Picasa();

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/gmail-nodejs-quickstart.json
var SCOPES = ['https://picasaweb.google.com/data/'];
var TOKEN_DIR = path.join((process.env.HOME  ||
    process.env.USERPROFILE || process.env.HOMEPATH), '.credentials');
var TOKEN_PATH = path.join(TOKEN_DIR, 'gmail-nodejs-quickstart.json');

// Load client secrets from a local file.
fs.readFile(path.join(__dirname, 'client_secret.json'), function processClientSecrets(err, content) {
	if (err) {
		console.log('Error loading client secret file: ' + err);
		return;
	}
	// Authorize a client with the loaded credentials, then call the
	// Gmail API.
	authorize(JSON.parse(content), getPhotos);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
	var clientSecret = credentials.installed.client_secret;
	var clientId = credentials.installed.client_id;
	var redirectUrl = credentials.installed.redirect_uris[0];
	var auth = new googleAuth();
	var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

	// Check if we have previously stored a token.
	fs.readFile(TOKEN_PATH, function(err, token) {
		if (err) {
			getNewToken(oauth2Client, callback);
		} else {
			var token = JSON.parse(token);
			console.log('Read token: ', token);
			
			var expire = new Date(token.expiry_date);

			if(expire <= new Date())
				refreshToken(token.refresh_token, oauth2Client, callback)
			else
				callback(token.access_token);
		}
	});
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
	var authUrl = oauth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: SCOPES
	});
	console.log('Authorize this app by visiting this url: ', authUrl);
	var rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	rl.question('Enter the code from that page here: ', function(code) {
		rl.close();
		oauth2Client.getToken(code, function(err, token) {
		if (err) {
			console.log('Error while trying to retrieve access token', err);
			return;
		}
		
		console.log('token: ', token);
		storeToken(token);
	
			callback(token.access_token);
		});
	});
}

function refreshToken(refresh_token, oauth2Client, callback) {

	oauth2Client.credentials = { "refresh_token": refresh_token };

	oauth2Client.refreshAccessToken((err, token) => {
		if (err) {
		  console.log('Error while trying to retrieve access token', err);
		  return;
		}
	  
		console.log('token: ', token);
		storeToken(token);
		  
		callback(token.access_token);
	});
  }

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
	try {
		fs.mkdirSync(TOKEN_DIR);
	} catch (err) {
		if (err.code != 'EEXIST') {
		throw err;
		}
	}
	fs.writeFile(TOKEN_PATH, JSON.stringify(token));
	console.log('Token stored to ' + TOKEN_PATH);
}

//https://developers.google.com/picasa-web/docs/2.0/reference

function getPhotos(accessToken) {
    
	console.log('accessToken: ', accessToken);
	
    picasa.getPhotos(accessToken, {}, (err, photos) => {
         if (err) {
            console.log('The API returned an error: ' + err, err);
            return;
        }
			
		try {
			console.log('photos: ', photos)

			showPhotos(photos);
		}
		catch(err) {
			console.error('getPhotosError: ', err);
		}
    })
}

function showPhotos(photos) {
	var slides = document.getElementsByClassName('slides')[0];
	slides.innerHTML = "";

	photos.sort(function() {
		return .5 - Math.random();
	})
	.forEach(photo => {
		showPhoto(slides, photo);
	}, this);

	w3.slideshow(".slide", 5000);
}

function showPhoto(slides, photo) {
	var image = document.createElement('img');
	image.src = photo.content.src;
	image.className = 'slide';
	slides.appendChild(image);
}