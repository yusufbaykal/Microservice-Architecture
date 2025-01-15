import mongoose, { Connection } from 'mongoose';

class Database {
    private static instance: Database | null = null;
    private mongooseConnection: Connection | null = null;

    private constructor() {
        this.mongooseConnection = null;
    }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
            console.log('Database instance created');
        }
        return Database.instance;
    }

    async connect(options: { MONGODB_URI: string }): Promise<void> {
        try {
            if (this.mongooseConnection) {
                console.log('Database already connected');
                return;
            }

            const db = await mongoose.connect(options.MONGODB_URI);
            this.mongooseConnection = db.connection;
            console.log('Database connection successful');
        } catch (err) {
            console.error('Database connection failed:', err);
            throw err;
        }
    }

    async disconnect(): Promise<void> {
        try {
            if (this.mongooseConnection) {
                await mongoose.disconnect();
                this.mongooseConnection = null;
                console.log('Database disconnected');
            }
        } catch (err) {
            console.error('Database disconnection failed:', err);
            throw err;
        }
    }

    getConnection(): Connection | null {
        return this.mongooseConnection;
    }
}

export default Database;