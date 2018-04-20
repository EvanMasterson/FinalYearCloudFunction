const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.checkLatLng = functions.database.ref('{userId}/watch').onUpdate((snapshot, context) => {
    let latitude;
    let longitude;
    const userId = context.params.userId.toString();

    snapshot.after.forEach(data =>{
        let key = data.key.toString();
        let value = data.val().toString();

        if(key==='latitude'){
            latitude = parseFloat(value);
            console.log("Latitude: "+latitude);
        }
        if(key==='longitude'){
            longitude = parseFloat(value);
            console.log("Longitude: " + longitude);
        }
    });
    return true;
});
