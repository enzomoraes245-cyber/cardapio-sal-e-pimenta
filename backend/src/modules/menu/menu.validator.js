import { z } from 'zod';
import { restaurantSlugSchema } from '../restaurants/restaurant.validator.js';

export const restaurantSlugParamsSchema = z.object({ slug: restaurantSlugSchema });
