import {
  createList,
  addUsers,
  sendEmailToList,
  unsubscribeUser,
  //   sendEmail,
} from "../controllers/listController.js";
import { Router } from "express";
import multer from "multer";
const router = Router();

const upload = multer({ dest: "uploads/" });

router.post("/lists", createList);
router.post("/lists/:listId/users", upload.single("file"), addUsers);
router.post("/lists/:listId/send-email", sendEmailToList);
router.get("/lists/:listId/unsubscribe", unsubscribeUser);
// router.post("/send-email", sendEmail);

export default router;
