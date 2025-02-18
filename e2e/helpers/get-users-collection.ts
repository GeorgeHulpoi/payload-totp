import { MongoClient } from 'mongodb'

type Args = {
	mongoUri: string
}

export async function getUsersCollection({ mongoUri }: Args) {
	const client = new MongoClient(mongoUri)
	await client.connect()
	const db = client.db('test')
	const collection = db.collection('users')

	return { collection, client }
}
