const functions = require('firebase-functions');
const admin = require('firebase-admin');
// npm package to check if latlng point is inside polygon
const checkInside = require('point-in-polygon');
admin.initializeApp();

exports.checkLatLng = functions.database.ref('{userId}').onUpdate((snapshot, context) => {
    let latitude;
    let longitude;
    let tokenId;
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
        if(key==='zones'){
            data.forEach(zoneData =>{
                let zone=[];
                console.log("ZoneKey: "+zoneData.key.toString());
                for(let i=0; i<zoneData.val().length; i++){
                    let lat = zoneData.val()[i].latitude;
                    let lng = zoneData.val()[i].longitude ;
                    zone.push([lat, lng])
                }
                if(latitude && longitude && zone && tokenId){
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
 */
function checkLocation(latitude, longitude, zone, tokenId){
    console.log(latitude, longitude, zone);
    if(checkInside([latitude, longitude], zone)) {
        console.log("Inside zone");
        sendNotification(tokenId);
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
            body: "ALERT !!!\nUser has entered an unsafe area\nOpen to view current status"
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