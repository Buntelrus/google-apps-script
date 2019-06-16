function getSecret(name) {
  const secrets = {
    autoResponder: 'your key here',
    firebase: 'your key here'
  }
  return secrets[name]
}
function computeHash(value) {
  const signatur = Utilities.computeHmacSha256Signature(value, getSecret())
  return Utilities.base64Encode(signatur)
}
function getFirebaseDB() {
  const firebaseUrl = 'https://auto-responder-database.firebaseio.com'
  return FirebaseApp.getDatabaseByUrl(firebaseUrl, getSecret('firebase'))
}
function getObjectValues(object) {
  const values = []
  for (var index in object) {
    values.push(object[index])
  }
  return values
}
