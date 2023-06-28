const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

const app = express();
const dbPath = path.join(__dirname, "database.db");

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({ filename: dbPath, driver: sqlite3.Database });
    await database.exec(
      "CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY, phone_number TEXT UNIQUE)"
    );

    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000/");
    });
  } catch (error) {
    console.log(`Database error: ${error}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.post("/api/customers/", async (req, res) => {
  const { phone_number } = req.body;

  // Validate input parameters
  if (!phone_number) {
    return res.status(400).json({ error: "Phone number is required." });
  }

  // Check for duplicates
  try {
    const existingCustomer = await database.get(
      "SELECT * FROM customers WHERE phone_number = ?",
      [phone_number]
    );

    if (existingCustomer) {
      return res.status(409).json({
        error: "Customer with the given phone number already exists.",
      });
    }

    // Insert the customer into the database
    await database.run("INSERT INTO customers (phone_number) VALUES (?)", [
      phone_number,
    ]);

    return res.status(201).json({ message: "Customer added successfully." });
  } catch (error) {
    console.log(`Database error: ${error}`);
    return res.status(500).json({ error: "Internal server error." });
  }
});
