// i am using mongo db here

import mongoose from 'mongoose'
import { GridFSBucket } from 'mongodb';


export let gridfsBucket; // let - will let us reuse the instnce across another file

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`Mongoose is ready : ${conn.connection.host}`);

        const db = mongoose.connection.db;
        gridfsBucket = new GridFSBucket(db, {
            bucketName: 'uploads'
        });

        console.log("GridFS Bucket is initialized and ready.");
    }
    catch (error) {
        //screwed, the database refuses to connect
        console.log("mongo is not in the mood to connect :( ");
        console.error(error);
        process.exit(1);
    }

}