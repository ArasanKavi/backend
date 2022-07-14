// var nodemailer = require("nodemailer");

// const mail = async function (mailOption) {
//     var transporter = nodemailer.createTransport({
//         host: "smtp.gmail.com",
//         port: 465,
//         auth: {
//             user: process.env.MAILER_USER,
//             pass: process.env.MAILER_PASSWORD
//         }
//     });
//     // let readFile = fs.readFileSync(path.join(__dirname, '../../emailTemplates/' + mailOption.template + '.html'), { encoding: 'utf-8' });
//     // let template = handlebars.compile(readFile)
//     var mailOptions = {
//         from: process.env.MAILER_USER,
//         subject: mailOption.subject,
//         to: mailOption.to,
//         html: mailOption.text
//     };

//     try {
//         // console.log(mailOptions);
//         var info = await transporter.sendMail(mailOptions);
//         console.log(info.response);
//         return { status: 200, response: info.response };
//     } catch (e) {
//         console.log(e);
//         return { error: e, status: 500 };
//     }
// };

// module.exports = {
//     sendMail: mail
// }