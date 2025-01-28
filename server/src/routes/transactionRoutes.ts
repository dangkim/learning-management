import express from "express";
import {
  capturePaypalOrder,
  createPaypalOrderIntent,
  createTransaction,
  listTransactions,
} from "../controllers/transactionController";

const router = express.Router();

router.get("/", listTransactions);
router.post("/", createTransaction);
//router.post("/stripe/payment-intent", createPaypalOrderIntent);
router.post("/paypal/payment-intent", createPaypalOrderIntent);
router.post("/paypal/:orderID/capturePaypalOrder", capturePaypalOrder);

export default router;
