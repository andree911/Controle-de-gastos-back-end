import { Router } from "express";
import verifyToken from "./auth.js";
import { db } from "./firebase.js";
import { formatDate, formatDateTime, normalizeDate } from "./dateFormatter.js";

const router = Router();

router.post("/transactions", verifyToken, async (req, res) => {

  const {
    description,
    value,
    currency,
    transactionType,
    type,
    date
  } = req.body;

  if (!description || !value || !type)
    return res.status(400).json({ error: "Invalid data" });

  const newTransaction = {
    userId: req.userId,
    createdAt: new Date()
  };

  if (description !== undefined)
    newTransaction.description = description;

  if (transactionType !== undefined)
    newTransaction.transactionType = transactionType;

  if (type !== undefined)
    newTransaction.type = type;

  newTransaction.date = date
    ? new Date(date)
    : new Date();

  newTransaction.money = {};

  if (currency !== undefined)
    newTransaction.money.currency = currency;

  if (value !== undefined)
    newTransaction.money.value = Number(value);

  const doc = await db
    .collection("transactions")
    .add(newTransaction);

  res.status(201).json({
    id: doc.id,
    ...newTransaction
  });
});

export default router;

router.get("/transactions", verifyToken, async (req, res) => {
  try {

    const snapshot = await db
      .collection("transactions")
      .where("userId", "==", req.userId)
      .orderBy("date", "desc")
      .get();

    const transactions = snapshot.docs.map(doc => {
    const data = doc.data();

    const dateObj = normalizeDate(data.date);
    const createdAtObj = normalizeDate(data.createdAt);

      return {
        uid: doc.id,
        ...data,
        date: dateObj.toISOString(),
        createdAt: createdAtObj.toISOString(),

        dateFormatted: formatDate(dateObj),
        createdAtFormatted: formatDateTime(createdAtObj)
        };
    });

    res.json(transactions);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar transações" });
  }
});

router.get("/transactions/:id", verifyToken, async (req, res) => {
  try {

    const doc = await db
      .collection("transactions")
      .doc(req.params.id)
      .get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Not found" });
    }

    const data = doc.data();

    if (data.userId !== req.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const dateObj = normalizeDate(data.date);
    const createdAtObj = normalizeDate(data.createdAt);

    res.json({
      uid: doc.id,
      ...data,
      date: dateObj.toISOString(),
      createdAt: createdAtObj.toISOString(),

      dateFormatted: formatDate(dateObj),
      createdAtFormatted: formatDateTime(createdAtObj)
    });

  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar transação" });
  }
});

router.put("/transactions/:id", verifyToken, async (req, res) => {

  const { id } = req.params;

  const ref = db.collection("transactions").doc(id);
  const doc = await ref.get();

  if (!doc.exists)
    return res.status(404).json({ error: "Not found" });

  const transaction = doc.data();

  const ownerId =
    transaction.userId || transaction.user?.uid;

  if (ownerId !== req.userId)
    return res.status(403).json({ error: "Forbidden" });

  const {
    description,
    value,
    currency,
    transactionType,
    type,
    date
  } = req.body;

  const updateData = {};

  if (description !== undefined)
    updateData.description = description;

  if (date !== undefined)
    updateData.date = new Date(date);

  if (transactionType !== undefined)
    updateData.transactionType = transactionType;

  if (type !== undefined)
    updateData.type = type;

  if (value !== undefined || currency !== undefined) {
    updateData.money = {};

    if (currency !== undefined)
      updateData.money.currency = currency;

    if (value !== undefined)
      updateData.money.value = Number(value);
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({
    error: "No fields provided to update"
  });
}

  await ref.update(updateData);

  res.json({ success: true });
});

router.delete("/transactions/:id", verifyToken, async (req, res) => {

  const { id } = req.params;

  if (!id) return res.status(400).json({ error: "UID da transação não informado" });

  const ref = db.collection("transactions").doc(id);
  const doc = await ref.get();

  if (!doc.exists)
    return res.status(404).json({ error: "Not found" });

  const transaction = doc.data();
  const ownerId = transaction.userId;

  if (ownerId !== req.userId) return res.status(403).json({ error: "Forbidden" });

  await ref.delete();

  res.json({ success: true });
});
