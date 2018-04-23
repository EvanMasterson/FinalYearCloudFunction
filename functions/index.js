const functions = require('firebase-functions');
const admin = require('firebase-admin');
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
                    zone.push({"latitude": lat, "longitude": lng})
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

function checkLocation(latitude, longitude, zone, tokenId){
    // TODO check if lat lng is inside the zone
    console.log(latitude, longitude, zone);
    // If location is inside zone we will send notification
    sendNotification(tokenId);
}

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