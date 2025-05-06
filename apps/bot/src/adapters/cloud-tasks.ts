import { CloudTasksClient } from '@google-cloud/tasks';
import { v4 as uuidv4 } from 'uuid';

// Initialize Cloud Tasks client
const tasksClient = new CloudTasksClient();

const projectId = process.env.GOOGLE_PROJECT_ID || '';
const location = process.env.GOOGLE_CLOUD_REGION || 'asia-northeast1';
const queueName = process.env.TASK_QUEUE_NAME || 'task-processing-queue';

/**
 * Create a task to process a message with AI
 * @param message The message to process
 * @param userId The LINE user ID
 * @returns The created task name
 */
export async function createAIProcessingTask(
  message: string,
  userId: string
): Promise<string> {
  const parent = tasksClient.queuePath(projectId, location, queueName);
  
  // Construct the request body
  const task = {
    name: `projects/${projectId}/locations/${location}/queues/${queueName}/tasks/${uuidv4()}`,
    httpRequest: {
      httpMethod: 'POST',
      url: process.env.WORKER_ENDPOINT || 'https://worker-service-url.a.run.app/process',
      body: Buffer.from(JSON.stringify({
        message,
        userId,
        timestamp: new Date().toISOString()
      })).toString('base64'),
      headers: {
        'Content-Type': 'application/json',
      },
    },
  };

  // Send create task request
  const [response] = await tasksClient.createTask({ parent, task });
  
  return response.name;
}

/**
 * Create a scheduled task
 * @param payload The payload to send
 * @param scheduledTime When to execute the task
 * @returns The created task name
 */
export async function createScheduledTask(
  payload: Record<string, any>,
  scheduledTime: Date
): Promise<string> {
  const parent = tasksClient.queuePath(projectId, location, queueName);
  
  // Construct the request body
  const task = {
    name: `projects/${projectId}/locations/${location}/queues/${queueName}/tasks/${uuidv4()}`,
    httpRequest: {
      httpMethod: 'POST',
      url: process.env.WORKER_ENDPOINT || 'https://worker-service-url.a.run.app/process',
      body: Buffer.from(JSON.stringify(payload)).toString('base64'),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    scheduleTime: {
      seconds: scheduledTime.getTime() / 1000,
    },
  };

  // Send create task request
  const [response] = await tasksClient.createTask({ parent, task });
  
  return response.name;
}
