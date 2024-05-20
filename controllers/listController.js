import { listModel, userModel, customPropertyModel } from "../index.js";
import csv from "csv-parser";
import { createReadStream, unlinkSync } from "fs";
import path from "path";
import multer from "multer";
import nodemailer from "nodemailer";

// Setup multer for CSV upload
const upload = multer({ dest: "uploads/" });

export const createList = async (req, res) => {
  const { title, ...customProperties } = req.body;
  console.log(customProperties);
  let customProps = [];
  if (customProperties != {}) {
    customProps = await customPropertyModel.insertMany(customProperties.cp1);
  }
  const list = new listModel({
    title,
    customProperties: customProps.map((cp) => cp._id),
  });
  await list.save();
  res.status(201).send(list);
  res.status(201);
};

export const addUsers = async (req, res) => {
  const listId = req.params.listId;
  const list = await listModel.findById(listId).populate("customProperties");
  if (!list) return res.status(404).send("List not found");
  console.log(list);
  const filePath = req.file.path;
  const users = [];
  const errors = [];
  console.log(req.body.file);
  let rowCount = 0;
  createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => {
      rowCount++;
      const user = {
        name: row.name,
        email: row.email,
        list: listId,
        properties: {},
      };
      list.customProperties.forEach((prop) => {
        user.properties[prop.title] = row[prop.title] || prop.fallbackValue;
      });
      users.push(user);
    })
    .on("end", async () => {
      try {
        // await userModel.insertMany(users, { ordered: false });
        res.status(201).send(["Users added successfully", users]);
      } catch (error) {
        errors.push(error);
        const userCount = await userModel.countDocuments({ list: listId });
        res.status(500).send({
          error: errors,
          userAdded: users.length,
          usersRemaining: rowCount - users.length,
          totalUsersInList: userCount,
        });
      } finally {
        unlinkSync(filePath);
      }
    });
};

export const sendEmailToList = async (req, res) => {
  const listId = req.params.listId;
  const { subject, body } = req.body;

  const list = await listModel.findById(listId);
  if (!list) return res.status(404).send("List not found");

  const users = await userModel.find({ list: listId, unsubscribed: false });

  // Setup nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  for (const user of users) {
    const emailBody = replacePlaceholders(body, user);
    const unsubscribeLink = `${req.protocol}://${req.get(
      "host"
    )}/api/lists/${listId}/unsubscribe?email=${encodeURIComponent(user.email)}`;
    const finalEmailBody = `${emailBody}\n\nUnsubscribe: ${unsubscribeLink}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: subject,
      text: finalEmailBody,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error(`Failed to send email to ${user.email}: ${error.message}`);
    }
  }

  res.status(200).send("Emails sent successfully");
};

export const unsubscribeUser = async (req, res) => {
  const { listId } = req.params;
  const { email } = req.query;

  try {
    const user = await userModel.findOne({ list: listId, email: email });
    if (!user) return res.status(404).send("User not found");

    user.unsubscribed = true;
    await user.save();

    res.status(200).send("User unsubscribed successfully");
  } catch (error) {
    res.status(500).send(error.message);
  }
};
