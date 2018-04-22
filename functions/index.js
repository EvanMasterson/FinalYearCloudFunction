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
                if(latitude && longitude && zone){
                   checkLocation(latitude, longitude, zone);
                   zone=[];
                }
            });
        }
    });
    return true;
});

function checkLocation(latitude, longitude, zone){
    // TODO check if lat lng is inside the zone
    console.log(latitude, longitude, zone);
}

function sendNotification(){
    // TODO send notification using tokenId to users device
}