const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

require('dotenv').config();

const port = process.env.PORT || 5000;
const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.y5cda.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    const database = client.db('hero-rider');
    const usersCollection = database.collection('users');

    // users post and get from database
    app
      .post('/users', async (req, res) => {
        const user = req.body;
        const newUser = await usersCollection.insertOne(user);
        res.json(newUser);
      })
      .get('/users', async (req, res) => {
        const users = await usersCollection.find({}).toArray();
        // filtering out admin from user api
        const adminFilter = users.filter(
          (user) => user.email !== 'admin@admin.com'
        );
        // apply filters
        const { email, phone, fullName } = req.query;
        let userFilter = [...adminFilter];
        if (email) {
          userFilter = userFilter.filter((user) => user.email.includes(email));
          console.log(userFilter);
        }
        if (phone) {
          userFilter = userFilter.filter((user) => user.phone.includes(phone));
        }
        if (fullName) {
          userFilter = userFilter.filter((user) =>
            user.fullName.includes(fullName)
          );
        }
        res.send(userFilter);
      });

    // find admin
    app.get('/users/:email', async (req, res) => {
      const { email } = req.params;
      const query = { email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === 'admin') {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });
  } finally {
    // await client.close();
  }
}

run();

app.get('/', (req, res) => {
  res.send('Initial server setup is done for Hero Rider');
});

app.listen(port, () => {
  console.log('Serer is running at: ', port);
});
