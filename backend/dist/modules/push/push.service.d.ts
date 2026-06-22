import { Role } from '@prisma/client';
export declare function sendWhatsAppToAdmin(message: string): Promise<void>;
export declare function sendPushToRole(role: Role, title: string, body: string, url?: string): Promise<void>;
export declare function sendPushToUser(userId: string, title: string, body: string, url?: string): Promise<void>;
//# sourceMappingURL=push.service.d.ts.map