import * as mongoose from 'mongoose';
import * as config from '../config'

const connectionInstance  = mongoose.createConnection(config.MONGO_CONNECTION_STRING, {useNewUrlParser: true, useUnifiedTopology: true});

connectionInstance.on('error', (err) => {
    if (err) {
        throw err;
    }
});

connectionInstance.once('open', () => {
    console.log(`MongoDb connected successfully, date is = ${new Date()}`);
});

const logDebug = true;

mongoose.set('debug', logDebug);

export {connectionInstance};