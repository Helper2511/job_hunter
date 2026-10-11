import { serve } from "inngest/next";
import { functions, inngest } from "@/inngest";

export const { GET, POST, PUT } = serve({ client: inngest, functions });

// Career-page checks can take a while.
export const maxDuration = 300;
