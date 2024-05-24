const express = require("express");
const bodyParser=require("body-parser");
const { Pool } = require("pg");
const cors = require("cors"); // Import the cors middleware

const app = express();

// Parse JSON bodies
app.use(bodyParser.json());

// Parse JSON bodies (built-in middleware in Express)
app.use(express.json());

// app.use(bodyParser.urlencoded({extended:true}));

// PostgreSQL connection configuration
const pool = new Pool({
    connectionString: 'postgres://default:o46hasArYdTe@ep-sparkling-glade-a4raar92.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require'
});

// Test the database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error connecting to the database', err);
    } else {
        console.log('Connected to the database');
        console.log('Server time:', res.rows[0]);
    }
});

app.use(cors()); 

app.get("/",function(req,res){
    res.send("Hello please visit <a href='https://fruit-shop-three.vercel.app/'>my fruit shop billing website</a>");
});

// Function to get all fruits from the database
async function getAllFruits() {
    try {
        const client = await pool.connect();
        const queryText = 'SELECT * FROM fruits ORDER BY quantity DESC LIMIT 15';
        const { rows } = await client.query(queryText);
        client.release();
        return rows;
    } catch (error) {
        console.error('Error getting all fruits:', error);
        throw error;
    }
}

// API endpoint to get all fruits
app.get('/fruits', async (req, res) => {
    try {
        const fruits = await getAllFruits();
        res.json(fruits);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Function to get only the names of fruits from the database
async function getFruitNames() {
    try {
        const client = await pool.connect();
        const queryText = 'SELECT name FROM fruits';
        const { rows } = await client.query(queryText);
        client.release();
        // Extracting names from the result set and returning as an array
        return rows.map(row => row.name);
    } catch (error) {
        console.error('Error getting fruit names:', error);
        throw error;
    }
}

// API endpoint to get all fruit names
app.get('/fruits/names', async (req, res) => {
    try {
        const fruitNames = await getFruitNames();
        res.json(fruitNames);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Function to get the top 10 fruits with the minimum quantity from the database
async function getTop10FruitsByMinQuantity() {
    try {
        const client = await pool.connect();
        const queryText = 'SELECT * FROM fruits ORDER BY quantity ASC LIMIT 10';
        const { rows } = await client.query(queryText);
        client.release();
        return rows;
    } catch (error) {
        console.error('Error getting top 10 fruits by min quantity:', error);
        throw error;
    }
}

// Define a route for the /fruits/minimum-quantity endpoint
app.get('/fruits/minimum-quantity', async (req, res) => {
    try {
        // Call the function to get the top 10 fruits with the minimum quantity
        const top10Fruits = await getTop10FruitsByMinQuantity();
        // Return the top 10 fruits as a JSON response
        res.json(top10Fruits);
    } catch (error) {
        // Handle errors
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Function to get bill stock fruits from the database
async function getBillStockFruits() {
    try {
        const client = await pool.connect();
        const queryText = 'SELECT * FROM bill_stocks';
        const { rows } = await client.query(queryText);
        client.release();
        return rows;
    } catch (error) {
        console.error('Error getting bill stock fruits:', error);
        throw error;
    }
}

// API endpoint to get bill stock fruits
app.get('/fruits/bill-stocks', async (req, res) => {
    try {
        const billStockFruits = await getBillStockFruits();
        res.json(billStockFruits);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

async function getFruitById(id) {
    try {
        const client = await pool.connect();
        const queryText = 'SELECT * FROM fruits WHERE id = $1';
        const { rows } = await client.query(queryText, [id]);
        client.release();
        return rows[0]; // Return the first row (assuming id is unique)
    } catch (error) {
        console.error('Error getting fruit by id:', error);
        throw error;
    }
}

async function getFruitByName(name) {
    try {
        const client = await pool.connect();
        const queryText = 'SELECT * FROM fruits WHERE name = $1';
        const { rows } = await client.query(queryText, [name]);
        client.release();
        return rows[0]; // Return the first row (assuming id is unique)
    } catch (error) {
        console.error('Error getting fruit by name:', error);
        throw error;
    }
}

async function insertIntoBillStock(name, quantity) {
    try {
        const fruit = await getFruitByName(name);

        // Calculate selling price
        const sellingPrice = quantity * fruit.selling_price;

        // Calculate reduced quantity
        const reducedQuantity = fruit.quantity - quantity;

        // Check if reduced quantity is less than 0
        if (reducedQuantity < 0) {
            throw new Error('Insufficient stock.');
        }

        // Connect to the database
        const client = await pool.connect();

        // Start a transaction
        await client.query('BEGIN');

        try {
            // Update or insert record in selling_stocks table
            await updateOrInsertSellingStock(fruit.id, name, quantity, fruit.buying_price, fruit.selling_price);

            // Execute SQL query to update record in the fruits table
            const updateQuery = 'UPDATE fruits SET quantity = $1 WHERE id = $2';
            await client.query(updateQuery, [reducedQuantity, fruit.id]);

            // Insert values into bill_stock table
            const insertQuery = 'INSERT INTO bill_stocks (id, name, quantity, price, selling_price) VALUES ($1, $2, $3, $4, $5)';
            await client.query(insertQuery, [fruit.id, name, quantity, fruit.selling_price, sellingPrice]);

            // Commit the transaction
            await client.query('COMMIT');

            return { message: 'Values inserted into bill_stock table successfully' };
        } catch (error) {
            // Rollback the transaction if an error occurs
            await client.query('ROLLBACK');
            throw error;
        } finally {
            // Release the client back to the pool
            client.release();
        }
    } catch (error) {
        console.error('Error inserting values into bill_stock table:', error);
        throw error;
    }
}


// API endpoint to handle POST request for bill stock insertion
app.post('/fruits/bill-stock', async (req, res) => {
    try {

        // Extract values from request body
        const { name, quantity } = req.body;

        // Validate request body
        if (!name || !quantity) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Call the function to insert values into bill stock table
        const result = await insertIntoBillStock(name, quantity);

        // Send success response
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

async function getTotalBillAmount() {
    try {
        const client = await pool.connect();
        const queryText = 'SELECT SUM(selling_price) AS total_amount FROM bill_stocks';
        const { rows } = await client.query(queryText);
        client.release();
        
        // Check if there are no records
        if (rows.length === 0 || !rows[0].total_amount) {
            return 0; // Return 0 if there are no records or total_amount is null
        }
        
        // Extracting the total amount from the result
        const totalAmount = rows[0].total_amount;
        return totalAmount;
    } catch (error) {
        console.error('Error getting total bill amount:', error);
        throw error;
    }
}

app.get('/fruits/bill-amount', async (req, res) => {
    try {
        const totalAmount = await getTotalBillAmount();
        res.json({ totalAmount });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

async function updateFruit(name, quantity, buying_price, selling_price) {
    try {
        const fruit = await getFruitByName(name);

        const addedQuantity = parseInt(quantity) + fruit.quantity

        // Connect to the database
        const client = await pool.connect();

        // Execute SQL query to update record in the fruits table
        const queryText = `
            UPDATE fruits 
            SET name = $2, 
                quantity = $3, 
                buying_price = $4, 
                selling_price = $5 
            WHERE id = $1
        `;
        await client.query(queryText, [fruit.id, name, addedQuantity, buying_price, selling_price]);

        // Release the client back to the pool
        client.release();

        return { message: 'Record updated successfully' };
    } catch (error) {
        console.error('Error updating record in fruits table:', error);
        throw error;
    }
}

// POST API endpoint to update a record in the fruits table
app.post('/fruits/update-stock', async (req, res) => {
    try {
        // Extract data from request body
        const { id, name, quantity, buying_price, selling_price } = req.body;

        // Validate input data
        if (!name || !quantity || !buying_price || !selling_price) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Call the updateFruit function
        const result = await updateFruit( name, quantity, buying_price, selling_price);

        // Send success response
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

async function deleteAllBillStocks() {
    try {
        // Connect to the database
        const client = await pool.connect();

        // Execute SQL query to delete all records from the bill_stocks table
        const queryText = 'DELETE FROM bill_stocks';
        await client.query(queryText);

        // Release the client back to the pool
        client.release();

        return { message: 'All records deleted from bill_stocks table' };
    } catch (error) {
        console.error('Error deleting records from bill_stocks table:', error);
        throw error;
    }
}

// POST API endpoint to delete all records from the bill_stocks table
app.post('/fruits/bill-stocks/delete-all', async (req, res) => {
    try {
        // Call the deleteAllBillStocks function
        const result = await deleteAllBillStocks();

        // Send success response
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

async function updateOrInsertSellingStock(id, name, quantity, buying_price, selling_price) {
    try {
        // Calculate selling price
        const totalSellingPrice = quantity * selling_price;

        const totalBuyingPrice = quantity * buying_price;

        // Connect to the database
        const client = await pool.connect();

        // Start a transaction
        await client.query('BEGIN');

        try {
            // Check if the fruit already exists in selling_stocks table
            const existingRecord = await client.query('SELECT * FROM selling_stocks WHERE name = $1', [name]);
            
            if (existingRecord.rows.length > 0) {
                // If the fruit already exists, update the existing record
                const updateQuery = `
                    UPDATE selling_stocks 
                    SET quantity = quantity + $1, 
                        selling_price = selling_price + $2,
                        buying_price = buying_price + $3,
                        profit = profit + ($2 - $3)
                    WHERE name = $4
                `;
                await client.query(updateQuery, [quantity, totalSellingPrice, totalBuyingPrice, name]);
            } else {
                // If the fruit doesn't exist, insert a new record
                const insertQuery = `
                    INSERT INTO selling_stocks (id, name, quantity, buying_price, selling_price, profit) 
                    VALUES ($1, $2, $3, $4, $5, $6)
                `;
                await client.query(insertQuery, [id, name, quantity, totalBuyingPrice, totalSellingPrice, totalSellingPrice-totalBuyingPrice]);
            }

            // Commit the transaction
            await client.query('COMMIT');

            return { message: 'Record updated or inserted successfully in selling_stocks table' };
        } catch (error) {
            // Rollback the transaction if an error occurs
            await client.query('ROLLBACK');
            throw error;
        } finally {
            // Release the client back to the pool
            client.release();
        }
    } catch (error) {
        console.error('Error updating or inserting record in selling_stocks table:', error);
        throw error;
    }
}

async function getAllSellingStocks() {
    try {
        const client = await pool.connect();
        const queryText = 'SELECT * FROM selling_stocks ORDER BY profit DESC';
        const { rows } = await client.query(queryText);
        client.release();
        return rows;
    } catch (error) {
        console.error('Error getting all selling stocks:', error);
        throw error;
    }
}

// API endpoint to get all selling stocks
app.get('/fruits/selling-stocks', async (req, res) => {
    try {
        const sellingStocks = await getAllSellingStocks();
        res.json(sellingStocks);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(process.env.PORT,function(req,res){
    console.log("Server starting at port 8080");
});

app.use(cors({
    origin: 'http://localhost:3000'
}));
