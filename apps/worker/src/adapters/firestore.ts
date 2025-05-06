import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldPath } from 'firebase-admin/firestore';

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
  return { id: doc.id, ...doc.data() } as T;
}

/**
 * Query documents from Firestore
 * @param collection The collection name
 * @param field The field to query
 * @param operator The operator (==, >, <, etc.)
 * @param value The value to compare
 * @param orderByField Optional field to order by
 * @param orderDirection Optional order direction ('asc' or 'desc')
 * @param limit Optional result limit
 * @returns Array of matching documents
 */
export async function queryFirestore<T>(
  collection: string,
  field: string,
  operator: FirebaseFirestore.WhereFilterOp,
  value: any,
  orderByField?: string,
  orderDirection?: 'asc' | 'desc',
  limit?: number
): Promise<T[]> {
  let query = db.collection(collection).where(field, operator, value);
  
  if (orderByField) {
    query = query.orderBy(orderByField, orderDirection || 'asc');
  }
  
  if (limit) {
    query = query.limit(limit);
  }
  
  const snapshot = await query.get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as T[];
}

/**
 * Delete a document from Firestore
 * @param collection The collection name
 * @param id The document ID
 * @returns Success status
 */
export async function deleteFromFirestore(
  collection: string, 
  id: string
): Promise<boolean> {
  try {
    await db.collection(collection).doc(id).delete();
    return true;
  } catch (error) {
    console.error(`Error deleting document ${id} from ${collection}:`, error);
    return false;
  }
}

/**
 * Batch write multiple documents to Firestore
 * @param operations Array of operations (create, update, delete)
 * @returns Success status
 */
export async function batchWriteToFirestore(
  operations: Array<{
    type: 'create' | 'update' | 'delete';
    collection: string;
    id: string;
    data?: any;
  }>
): Promise<boolean> {
  const batch = db.batch();
  
  operations.forEach(op => {
    const docRef = db.collection(op.collection).doc(op.id);
    
    switch (op.type) {
      case 'create':
        batch.create(docRef, op.data);
        break;
      case 'update':
        batch.update(docRef, op.data);
        break;
      case 'delete':
        batch.delete(docRef);
        break;
    }
  });
  
  try {
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error executing batch write:', error);
    return false;
  }
}

/**
 * Run a transaction in Firestore
 * @param updateFunction The transaction function
 * @returns Result of the transaction
 */
export async function runTransaction<T>(
  updateFunction: (transaction: FirebaseFirestore.Transaction) => Promise<T>
): Promise<T> {
  return db.runTransaction(updateFunction);
}
