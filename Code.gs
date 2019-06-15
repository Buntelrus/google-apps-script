function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index.html')
}
function openSpreadsheet() {
  const propService = PropertiesService.getUserProperties()
  const spreadsheetId = propService.getProperty('id')
  var sheet
  try {
    sheet = SpreadsheetApp.openById(spreadsheetId)
  } catch(e) {}
  return sheet ? sheet.getSheets()[0]: undefined
}
function createSpreadsheet() {
  const sheet = SpreadsheetApp.create('Gmail Auto-Responder')
  PropertiesService.getUserProperties().setProperty('id', sheet.getId())
  // inni sheet
  var range = sheet.getSheets()[0].getRange('A1:B1')
  range.setFontWeight("bold")
  range.setValues([['labelName', 'canned response']])
  range = sheet.getSheets()[0].getRange('A2:B2')
  range.setValues([['autoResponse', 'this is an automated example reply']])
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
    var label = row[0]
    const reply = row[1]
    label = GmailApp.getUserLabelByName(label)
    label.getThreads()
    // ignore no reply conversations
    .filter(function(gt) {
      return gt.getMessages().pop().getReplyTo().indexOf('noreply') === -1
    })
    // do the reply
    .forEach(function(thread) {
      thread.reply(reply)
      thread.removeLabel(label)
    })
  })
}
