/// <reference types="vite/client" />

declare global {
  var mongo: {
    conn: { client: import('mongodb').MongoClient; db: import('mongodb').Db } | null;
    promise: Promise<{ client: import('mongodb').MongoClient; db: import('mongodb').Db }> | null;
  };
}

export {};
