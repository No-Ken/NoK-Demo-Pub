import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const app = initializeApp({
  credential: process.env.GOOGLE_SERVICE_ACCOUNT_KEY 
    ? cert(JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)) 
    : undefined, // Will use Application Default Credentials
  projectId: process.env.GOOGLE_PROJECT_ID
});

// Initialize Firestore
export const db = getFirestore(app);

/**
 * Generic function to save data to a Firestore collection
 * @param collection The collection name
 * @param id Optional document ID
 * @param data The data to save
 * @returns The document ID
 */
export async function saveToFirestore<T>(
  collection: string, 
  data: T, 
  id?: string
): Promise<string> {
  if (id) {
    await db.collection(collection).doc(id).set(data, { merge: true });
    return id;
  } else {
    const doc = await db.collection(collection).add(data);
    return doc.id;
  }
}

/**
 * Get a document from Firestore
 * @param collection The collection name
 * @param id The document ID
 * @returns The document data or null if not found
 */
export async function getFromFirestore<T>(
  collection: string, 
  id: string
): Promise<T | null> {
  const doc = await db.collection(collection).doc(id).get();
  if (!doc.exists) {
    return null;
  }
  return doc.data() as T;
}

/**
 * Query documents from Firestore
 * @param collection The collection name
 * @param field The field to query
 * @param operator The operator (==, >, <, etc.)
 * @param value The value to compare
 * @returns Array of matching documents
 */
export async function queryFirestore<T>(
  collection: string,
  field: string,
  operator: FirebaseFirestore.WhereFilterOp,
  value: any
): Promise<T[]> {
  const snapshot = await db.collection(collection)
    .where(field, operator, value)
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as T[];
}
