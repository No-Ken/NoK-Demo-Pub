import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import AuthService from '../services/auth.service';
import { HttpError, ValidationError, BadRequestError } from '../errors/httpErrors';

const firebaseTokenInputSchema = z.object({
  lineAccessToken: z.string().min(10, { message: 'LINE Access Token is required.' }),
});

const firebaseTokenResponseSchema = z.object({
  firebaseToken: z.string(),
});

const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default class AuthController {
  private service = new AuthService();

  createFirebaseToken = asyncHandler(async (req: Request, res: Response) => {
    let validatedBody;
    try {
      validatedBody = firebaseTokenInputSchema.parse(req.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Invalid input: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw new BadRequestError('Invalid request body.');
    }

    const firebaseToken = await this.service.createFirebaseCustomToken(validatedBody.lineAccessToken);

    const responseData = firebaseTokenResponseSchema.parse({ firebaseToken });
    res.status(200).json(responseData);
  });
} 