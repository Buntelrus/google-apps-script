function doGet(e) {
  if (e.parameter.source && e.parameter.label && e.parameter.noreply) {
    const sourceMailAddress = e.parameter.source
    const label = e.parameter.label
    const mailAddress = e.parameter.noreply
    if (e.parameter.key && e.parameter.key == computeHash(sourceMailAddress + label + mailAddress)) {
      doNotReplyAgain(mailAddress, sourceMailAddress, label)
      return ContentService.createTextOutput("You'll not recieve further auto reply's!")
    }
    return ContentService.createTextOutput('Sorry! You are not allowed to do this.')
  } else {
    return ContentService.createTextOutput('Uhh were do you got this link from o.O?')
  }
}
function doNotReplyAgain(mailAddress, sourceMailAddress, label) {
  const db = getFirebaseDB()
  //firebase doesn't support dots in path
  sourceMailAddress = sourceMailAddress.replace('.', ',')
  var data = db.getData(sourceMailAddress)
  if (!data || !data[label] || getObjectValues(data[label]).indexOf(mailAddress) === -1) {
    //finally adding noreply address to db
    db.pushData(sourceMailAddress + '/' + label, mailAddress)
  }
}
