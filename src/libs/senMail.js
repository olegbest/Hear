const mailer = require("nodemailer");

let smtpTransport = mailer.createTransport({
    service: "Gmail",
    auth: {
        user: "HearHeroService@gmail.com",
        pass: "Qwerty147852"
    }
});

function sendMail(firstName, email, token, url) {

    let mail = {
        from: "Hear Hero Service",
        to: email,
        subject: "Password Reset",
        html: "<h4>Hi " + firstName + "</h4>" +
            "<p>Just to let you know, we’ve had a request to change your password. To do this, just follow the link below.</p>" +
            "<b><a href='" + url + "/#/reset?id=" + token + "' style=\"width: 217px;height: 45px;font-size:16px;font-weight:bold;letter-spacing:0px;line-height:100%;text-align:center;text-decoration:none;color:#FFFFFF;background:#00008b;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;border-radius:20px;display:block;box-sizing: border-box; padding-top: 13px;\">Reset your password</a></b>"
    };
    smtpTransport.sendMail(mail, function (error, response) {
        if (error) {
            console.log(error);
        } else {
            console.log("Message sent: " + response.message);
        }

        smtpTransport.close();

    });

}

module.exports.sendMail = sendMail;