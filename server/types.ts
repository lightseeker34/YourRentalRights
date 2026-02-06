import { User } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends Omit<import("@shared/schema").User, never> {}
  }
}
