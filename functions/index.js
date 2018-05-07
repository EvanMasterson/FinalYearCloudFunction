// Require firebase functions/auth
const functions = require('firebase-functions');
const admin = require('firebase-admin');
// npm package to check if latlng point is inside polygon
const checkInside = require('point-in-polygon');
/*
    Require Twilio service
    Firebase Flame or Blaze plan required to make calls to external api's
 */
const twilio = require('twilio');
// Set these credentials using cmd line with: firebase functions:config:set twilio.sid="CHANGE_ME" twilio.token="CHANGE_ME"
const accountSid = functions.config().twilio.sid;
const authToken = functions.config().twilio.token;
const client = new twilio(accountSid, authToken);

// Initialise app
admin.initializeApp();

/*
    Cloud function to listen for changes in users values
    On changing, triggers function to check if user location has entered zone or not
    Given sufficient tokenId and phone number, push notifications and twilio automated texts triggered
 */
exports.checkLatLng = functions.database.ref('{userId}').onUpdate((snapshot, context) => {
    let latitude;
    let longitude;
    let notifications;
    let tokenId;
    let phone;

    snapshot.after.forEach(data =>{
        let key = data.key.toString();
        let value = data.val().toString();

        if(key==='latitude'){
            latitude = value;
            console.log("Latitude: "+latitude);
        }
        if(key==='longitude'){
            longitude = value;
            console.log("Longitude: " + longitude);
        }
        if(key==='notifications'){
            notifications = value;
            console.log("Notifications: " + notifications);
        }
        if(key==='tokenId'){
            tokenId = value;
            console.log("TokenId: " + tokenId);
        }
        if(key==='phone'){
            phone = value;
            console.log("Phone: " + phone)
        }
        if(key==='zones'){
            data.forEach(zoneData =>{
                let zone=[];
                let colour;
                console.log("ZoneKey: "+zoneData.key.toString());
                for(let i=0; i<zoneData.val().length; i++){
                    if(i===zoneData.val().length-1){
                        colour = zoneData.val()[i].colour;
                    } else {
                        let lat = zoneData.val()[i].latitude;
                        let lng = zoneData.val()[i].longitude;
                        zone.push([lat, lng])
                    }
                }
                // If notification alerts are turned on then proceed
                if(notifications) {
                    if (latitude && longitude && zone && colour && tokenId && phone) {
                        // Notification & text
                        checkLocation(latitude, longitude, zone, colour, tokenId, phone);
                    } else if (latitude && longitude && zone && colour && tokenId) {
                        // Just Notification
                        checkLocation(latitude, longitude, zone, colour, tokenId);
                    }
                }
            });
        }
    });
    return true;
});

/*
    Function to check if current user location is inside a zone or not
    If it returns true, we send a notification to that user using their device tokenId
    If user has registered a phone number we also send a text message using twilio api
 */
function checkLocation(latitude, longitude, zone, colour, tokenId, phone){
    console.log(latitude, longitude, zone, colour);
    if(checkInside([latitude, longitude], zone)) {
        console.log("Inside zone");
        if(colour === "Green") {
            sendNotification(tokenId, colour);
        } else if(colour === "Yellow" || colour === "Red") {
            sendNotification(tokenId, colour);
            if (phone) {
                sendTextMessage(phone, colour);
            }
        }
    } else {
        console.log("Not in zone");
    }
}

// Function triggered by checkLocation to send notification to user
function sendNotification(tokenId, colour){
    let notificationPayload = {
        token: tokenId,
        notification: {
            title: "Geofence Monitor",
            body: "ALERT !!!\nUser has entered "+colour+" zone.\nOpen application for more info."
        },
        android: {
            notification: {
                sound: "default"
            }
        }
    };
    admin.messaging().send(notificationPayload).then((response) =>{
        console.log("Success sending: " + response);
    }).catch((error) =>{
        console.log("Error sending message: " + error);
    });
}

// Function triggered by checkLocation to send automated text to user with twilio api
function sendTextMessage(phone, colour){
    console.log(phone);
    client.messages.create({
        body: "Automated text ALERT !!!\nUser has entered "+colour+" zone.\nOpen application for more info.",
        to: phone,
        from: '+16308668643',
    }).then((message) => {
        console.log(message.sid);
    }).catch((error) => {
        console.log(error);
    });
}