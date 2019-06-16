function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index.html')
}

function openSpreadsheet() {
  const propService = PropertiesService.getUserProperties()
  const spreadsheetId = propService.getProperty('id')
  var sheet
  try {
    sheet = SpreadsheetApp.openById(spreadsheetId)
  } catch (e) {}
  return sheet ? sheet.getSheets()[0] : undefined
}

function createSpreadsheet() {
  const sheet = SpreadsheetApp.create('Gmail Auto-Responder')
  PropertiesService.getUserProperties().setProperty('id', sheet.getId())
  // inni sheet
  var range = sheet.getSheets()[0].getRange('A1:B1')
  range.setFontWeight("bold")
  range.setValues([
    ['labelName', 'canned response']
  ])
  range = sheet.getSheets()[0].getRange('A2:B2')
  range.setValues([
    ['autoResponse', "this is an automated example reply. If you don't want get further auto reply's you can click [[this]] link."]
  ])
}

function getData() {
  const sheet = openSpreadsheet()
  if (!sheet) {
    throw new Error('No Spreadsheet available')
  }
  const range = sheet.getDataRange()
  const values = range.getValues()
  // remove headlines
  values.shift()
  return values
}

function saveData(data) {
  const sheet = openSpreadsheet()
  //A1 + data.length
  const range = sheet.getRange(2, 1, data.length, 2)
  range.setValues(data)
}

function projectHasTriggers() {
  return Boolean(ScriptApp.getProjectTriggers().length)
}

function createTimeDrivenTrigger() {
  // Trigger every 12 hours.
  ScriptApp.newTrigger('answerMails')
    .timeBased()
    .everyHours(12)
    .create()
}

function answerMails() {
  const data = getData()
  data.forEach(function(row) {
    const labelName = row[0]
    var reply = row[1]
    const label = GmailApp.getUserLabelByName(labelName)
    const threads = label.getThreads()
      // ignore no reply conversations
      .filter(function(gt) {
        return gt.getMessages().pop().getReplyTo().indexOf('noreply') === -1
      })
    if (threads) {
      // do the reply
      threads.forEach(function(thread) {
        const db = getFirebaseDB()
        const sourceMailAddress = Session.getEffectiveUser().getEmail()
        const regex = /<(.+)>/
        var mailAddress = thread.getMessages().pop().getFrom()
        if (mailAddress.match(regex)[1]) {
          mailAddress = mailAddress.match(regex)[1]
        }
        //firebase doesn't support dots in path
        const data = db.getData(sourceMailAddress.replace('.', ','))
        if (data && getObjectValues(data[labelName]).indexOf(mailAddress) !== -1) {
          //this user doesn't want further auto reply's
          return
        }
        const stopReplyUrl = 'https://script.google.com/macros/s/AKfycbwnOHksii-2MjPh3wSd3GL9kL3N3dGli9uc2zKoi9f23b_EyEci/exec' +
          '?source=' + sourceMailAddress +
          '&label=' + labelName +
          '&noreply=' + mailAddress +
          '&key=' + computeHash(sourceMailAddress + labelName + mailAddress)
        reply = reply.replace(/\[\[(.+)\]\]/, function(match, g1) {
          return '<a href="' + stopReplyUrl + '">' + g1 + '</a>'
        })
        //fix linebreaks
        .replace(/\n/g, '<br>')
        thread.reply('', {
          htmlBody: reply
        })
        thread.removeLabel(label)
      })
    }
  })
}
