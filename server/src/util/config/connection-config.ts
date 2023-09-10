import * as mysql from "mysql";
import * as nodemailer from "nodemailer";
import * as SMTPTransport from "nodemailer/lib/smtp-transport";
import {logger} from "../../main";

export function createDatabasePool(): Promise<mysql.Pool> {
    const pool = mysql.createPool(process.env.MYSQL_CONN_STRING);
    logger.info("MySQL Pool initialized");
    return new Promise((resolve, reject) => {
        pool.getConnection((err) => {
            if (err) {
                reject(err);
            } else {
                logger.info("Connected to MySQL database");
                resolve(pool);
            }
        });
    });
}

export function createSMTPTransport(): Promise<nodemailer.Transporter<SMTPTransport.SentMessageInfo>> {
    const smtpTransport = nodemailer.createTransport({
        host: "localhost",
        port: 1025,
        secure: false
    });
    logger.info(`SMTP Transport initialized`);
    return new Promise((resolve, reject) => {
        smtpTransport.verify((err) => {
            if (err) {
                reject(err);
            } else {
                logger.info("SMTP Connection verified");
                resolve(smtpTransport);
            }
        })
    })
}