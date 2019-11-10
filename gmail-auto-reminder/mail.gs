function getMailTemplate() {
    return "" +
    "MIME-Version: 1.0" + "\n" +
    "Subject: %s" + "\n" +
    "To: %s" + "\n" +
    "Cc:" + "\n" +
    "Bcc:" + "\n" +
    "From: %s" + "\n" +
    "Date: %s" + "\n" +
    "Content-Type: text/plain; charset=\"UTF-8\"" + "\n" +
    "Content-Transfer-Encoding: quoted-printable" + "\n" +
    "%s" + "\n" +
    "\n" +
    "%s"
}