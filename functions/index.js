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
    let tokenId;
    let phone;
    const userId = context.params.userId.toString();

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
                console.log("ZoneKey: "+zoneData.key.toString());
                for(let i=0; i<zoneData.val().length; i++){
                    let lat = zoneData.val()[i].latitude;
                    let lng = zoneData.val()[i].longitude ;
                    zone.push([lat, lng])
                }
                if(latitude && longitude && zone && tokenId && phone){
                   checkLocation(latitude, longitude, zone, tokenId, phone);
                   zone=[];
                } else if(latitude && longitude && zone && tokenId){
                    checkLocation(latitude, longitude, zone, tokenId);
                    zone=[];
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
function checkLocation(latitude, longitude, zone, tokenId, phone){
    console.log(latitude, longitude, zone);
    if(checkInside([latitude, longitude], zone)) {
        console.log("Inside zone");
        sendNotification(tokenId);
        if(phone){
            sendTextMessage(phone);
        }
    } else {
        console.log("Not in zone");
    }
}

// Function triggered by checkLocation to send notification to user
function sendNotification(tokenId){
    let notificationPayload = {
        token: tokenId,
        notification: {
            title: "Geofence Monitor",
            body: "ALERT !!!\nUser has entered an unsafe area.\nOpen to view current status."
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
function sendTextMessage(phone){
    console.log(phone);
    const client = new twilio(accountSid, authToken);
    client.messages.create({
        body: "Automated text ALERT !!!\nUser has entered an unsafe area.\nOpen application for more info.",
        to: phone,
        from: '+16308668643',
    }).then((message) => {
        console.log(message.sid);
    }).catch((error) => {
        console.log(error);
    });
}