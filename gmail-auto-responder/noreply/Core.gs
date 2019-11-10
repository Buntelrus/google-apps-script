function doGet(e) {
  if (e.parameter.source && e.parameter.label && e.parameter.noreply) {
    const sourceMailAddress = e.parameter.source
    const label = e.parameter.label
    const mailAddress = e.parameter.noreply
    if (e.parameter.key && e.parameter.key == decodeURIComponent(computeHash(sourceMailAddress + label + mailAddress))) {
      doNotReplyAgain(mailAddress, sourceMailAddress, label)
      const template = HtmlService.createHtmlOutputFromFile('index.html').asTemplate()
      template.parameters = {
        mailAddress: mailAddress,
        sourceMailAddress: sourceMailAddress,
        label: label
      }
      return template.evaluate()
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
function undo(mailAddress, sourceMailAddress, label) {
  const db = getFirebaseDB()
  sourceMailAddress = sourceMailAddress.replace('.', ',')
  const data = db.getData(sourceMailAddress + '/' + label)
  for (var index in data) {
    if (data[index] === mailAddress) {
      db.removeData(sourceMailAddress + '/' + label + '/' + index)
      break
    }
  }
}
