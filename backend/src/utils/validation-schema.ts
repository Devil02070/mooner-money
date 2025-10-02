    import { z } from 'zod';

    export const chatSchema = z.object({
      content: z.string().min(1)
    });

    export const taskSchema = z.object({
      description: z.string().min(1),
      xp: z.number(),
      requirement: z.any(),
      repeatable: z.boolean(),
      max_repeat: z.number().optional()
    })
