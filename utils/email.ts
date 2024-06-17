import { User } from "@prisma/client";

import nodemailer, { TransportOptions } from "nodemailer";
import htmlToText from "html-to-text";
import { convert } from "html-to-text";
import pug from "pug";
import path from "path";
interface Email {
  to: string;
  firstName: string;
  url: string;
  from: string;
}

class Email {
  constructor(user: User, url: string) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Ibrahim Askar <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "2525"),
      secure: false,

      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async send(template: string, subject: string) {
    const html = pug.renderFile(
      path.join(process.cwd(), `views/emails/${template}.pug`),
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html),
    };
    console.log({
      html: convert(html),
    });
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await this.newTransport().sendMail(mailOptions);
        console.log("Email sent successfully");
        break;
      } catch (error: any) {
        console.error(`Attempt ${attempt} failed: ${error.message}`);
        if (attempt === 3) {
          throw error;
        }
        await new Promise((res) => setTimeout(res, 2000));
      }
    }
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to Edge");
  }

  async sendResetToken() {
    await this.send(
      "passwordReset",
      "Your password reset token (valid for only 10 minutes)"
    );
  }
}

export default Email;
