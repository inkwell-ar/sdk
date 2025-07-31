import { CreatePostData, UpdatePostData, RoleManagementOptions } from '../types';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateCreatePostData(data: CreatePostData): void {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Data is required and must be an object');
  }

  if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
    throw new ValidationError('Field title is required and must be a non-empty string');
  }

  if (!data.description || typeof data.description !== 'string' || data.description.trim() === '') {
    throw new ValidationError('Field description is required and must be a non-empty string');
  }

  if (data.body !== undefined && typeof data.body !== 'string') {
    throw new ValidationError('Field body must be a string if provided');
  }

  if (!data.published_at || typeof data.published_at !== 'number') {
    throw new ValidationError('Field published_at is required and must be a number');
  }

  if (!data.last_update || typeof data.last_update !== 'number') {
    throw new ValidationError('Field last_update is required and must be a number');
  }

  if (data.labels !== undefined) {
    if (!Array.isArray(data.labels)) {
      throw new ValidationError('Field labels must be an array if provided');
    }
    for (const label of data.labels) {
      if (!label || typeof label !== 'string' || label.trim() === '') {
        throw new ValidationError('All labels must be non-empty strings');
      }
    }
  }

  if (!data.authors || !Array.isArray(data.authors) || data.authors.length === 0) {
    throw new ValidationError('Field authors is required, must be an array and should have at least 1 item');
  }

  for (const author of data.authors) {
    if (!author || typeof author !== 'string' || author.trim() === '') {
      throw new ValidationError('All authors must be non-empty strings');
    }
  }
}

export function validateUpdatePostData(data: UpdatePostData): void {
  validateCreatePostData(data);
}

export function validatePostId(id: number): void {
  if (typeof id !== 'number' || id <= 0) {
    throw new ValidationError('ID must be a positive number');
  }
}

export function validateRoleManagementOptions(options: RoleManagementOptions): void {
  if (!options || typeof options !== 'object') {
    throw new ValidationError('Options is required and must be an object');
  }

  if (!options.accounts || !Array.isArray(options.accounts)) {
    throw new ValidationError('Field accounts is required and must be an array');
  }

  if (options.accounts.length === 0) {
    throw new ValidationError('Field accounts must contain at least one account');
  }

  for (const account of options.accounts) {
    if (!account || typeof account !== 'string' || account.trim() === '') {
      throw new ValidationError('All accounts must be non-empty strings');
    }
  }
}

export function validateSDKConfig(config: any): void {
  if (!config || typeof config !== 'object') {
    throw new ValidationError('Config is required and must be an object');
  }

  if (!config.processId || typeof config.processId !== 'string') {
    throw new ValidationError('processId is required and must be a string');
  }
} 