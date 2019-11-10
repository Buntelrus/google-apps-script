/**
 * sends reminders to all who not answered your mail withing x days.
 *
 */
function sendReminders() {
    /**
     *
     * @param from string returned by GmailMessage.getFrom()
     * @returns {string} the vanilla email address
     */
    function getVanillaMailAddress(from) {
        const regex = /<(.+)>/
        return from.match(regex)? from.match(regex)[1]: from
    }
    /**
     *
     * @param timestamp the substrate from 2 date objects
     * @returns {number} age in days
     */
    function getAgeInDays(timestamp) {
        return parseInt((new Date - timestamp) /1000/60/60/24)
    }
    /**
     * Create Draft email.
     *
     * @param  {String} userId User's email address. The special value 'me'
     * can be used to indicate the authenticated user.
     * @param  {String} email RFC 5322 formatted String.
     * @param  {String} threadId.
     */
    function createDraft(userId, email, threadId) {
        var base64EncodedEmail = Utilities.base64EncodeWebSafe(Utilities.newBlob(email).getBytes());
        return Gmail.Users.Drafts.create({
            message: {
                threadId: threadId,
                raw: base64EncodedEmail
            }
        }, userId)
    }
    /**
     *
     * @param headers object with key value pairs. The value can be an array
     * @returns {string}
     */
    function createHeaderString(headers) {
        var headerString = ''
        for (var headerName in headers) {
            var header = headers[headerName]
            var value
            if (Array.isArray(header)) {
                value = header.join(' ')
            } else {
                value = header
            }
            headerString += headerName + ': ' + value + "\n"
        }
        return headerString
    }
    const userMail = Session.getEffectiveUser().getEmail()
    const expectReplyWithinDays = 3
    const reply = "Dies ist eine freundliche automatische Erinnerung. Sie haben meine Email seit %d Tagen nicht beantwortet.\n\nMit freundlichen Grüßen\nJulian Bantel\n"
    const replyLabelName = 'expectReply'
    const replyLabel = GmailApp.getUserLabelByName(replyLabelName)
    const threads = replyLabel.getThreads()
    /**
     * threads that don't have a reply for at least x days
     * @type {GmailThread[]}
     */
    const replyThreads = threads.filter(function(threat) {
            const lastMessage = threat.getMessages().pop()
            const from = getVanillaMailAddress(lastMessage.getFrom())
            return from === userMail && getAgeInDays(lastMessage.getDate()) > expectReplyWithinDays
        })
    /**
     * threads that have received a reply
     * @type {GmailThread[]}
     */
    const replyiedThreads = threads.filter(function(threat) {
            const lastMessage = threat.getMessages().pop()
            const from = getVanillaMailAddress(lastMessage.getFrom())
            return from !== userMail
        })
    replyThreads.forEach(function(thread) {
        const messages = thread.getMessages()
        const headerReferences = []
        /**
         * @type GmailMessage last message that is not an auto replied message by this script
         */
        var lastMessage

        for (var i = messages.length - 1; i >= 0; i--) {
            var message = messages[i]
            if (!lastMessage && message.getBody().indexOf('Dies ist eine freundliche automatische Erinnerung') === -1) {
                lastMessage = message
            }
            headerReferences.push(message.getHeader('Message-ID'))
        }
        headerReferences.reverse()

        const template = getMailTemplate()

        const mail = Utilities.formatString(template,
            'Re: ' + lastMessage.getSubject(), //Subject
            lastMessage.getTo(), //to:
            '<' + userMail + '>', //from:
            new Date(), //date
            createHeaderString({
                'References': headerReferences,
                'In-Reply-To': lastMessage.getHeader('Message-ID')

            }), //headers
            Utilities.formatString(
                reply,
                getAgeInDays(lastMessage.getDate())
            ) //message body
        )
        console.log(mail)
        const draft = createDraft('me', mail, thread.getId())
        Gmail.Users.Drafts.send({
            'id': draft.id
        }, 'me')
    })
    replyiedThreads.forEach(function(thread) {
        thread.removeLabel(replyLabel)
    })
}