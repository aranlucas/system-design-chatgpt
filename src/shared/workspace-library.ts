import { z } from "zod";

export const workspaceLibrarySchema = z.object({
  diagrams: z.array(z.object({ name: z.string(), diagram: z.string() })),
  nextCursor: z.string().nullable(),
  activeDiagram: z.string().optional(),
  activeName: z.string().optional(),
});
