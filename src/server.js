import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { MongoClient  } from 'mongodb';
import path from 'path';

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
app.use(cors());
app.use(bodyParser.json());

// reusable function 
const withDB = async (operations, res) => {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', { useUnifiedTopology: true });
        const db = client.db('my-blog');
        console.log('operations function: ', operations);
        await operations(db);

        client.close();
    } catch(error){
        res.status(500).json({message: 'Error connecting to DB', error});
    }
}

app.get('/api/articles/:name', async (req, res) => {

    withDB(async (db) => {
            const articleName = req.params.name;

            // fetch the searched article
            const articleInfo = await db.collection('articles').findOne({ name: articleName });
            res.status(200).json(articleInfo);

        }, res);
    
});

app.post('/api/articles/:name/upvote', async (req, res) => {

    withDB(async (db) => {
        const articleName = req.params.name;
        const articleInfo = await db.collection('articles').findOne({ name: articleName });

        // update the article upvotes
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                upvotes: articleInfo.upvotes + 1,
            }
        });
        const updateArticleInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(updateArticleInfo);

    }, res);

});

app.post('/api/articles/:name/add-comment', async(req, res) => {
        const { username, text } = req.body;
        const articleName = req.params.name;

        withDB(async (db) => {
            // find the article name = articleName
            const articleInfo = await db.collection('articles').findOne({ name: articleName });
            // now update the article which matches the articleName
            await db.collection('articles').updateOne({ name: articleName }, {
                '$set': {
                    comments: articleInfo.comments.concat({ username, text }) 
                }
            });
            const updateArticleInfo = await db.collection('articles').findOne({ name: articleName });
            res.status(200).json(updateArticleInfo);

        }, res);

});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
});

app.listen('4000', () => console.log('Listening on port 4000'));

// alias mongod='brew services run mongodb-community'
// alias mongod-status='brew services list'
// alias mongod-stop='brew services stop mongodb-community'