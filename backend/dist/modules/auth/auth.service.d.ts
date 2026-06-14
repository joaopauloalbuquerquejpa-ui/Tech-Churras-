import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    role: z.ZodDefault<z.ZodEnum<{
        CUSTOMER: "CUSTOMER";
        GRILLMASTER: "GRILLMASTER";
        BOUTIQUE: "BOUTIQUE";
    }>>;
    referralCode: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export declare function registerUser(data: RegisterInput): Promise<{
    name: string;
    id: string;
    email: string;
    role: import("@prisma/client").$Enums.Role;
    onboardingCompleted: boolean;
    createdAt: Date;
}>;
export declare function loginUser(data: LoginInput): Promise<{
    id: string;
    name: string;
    email: string;
    role: import("@prisma/client").$Enums.Role;
    onboardingCompleted: boolean;
}>;
export declare function markOnboardingCompleted(userId: string): Promise<{
    name: string;
    id: string;
    email: string;
    password: string;
    phone: string | null;
    role: import("@prisma/client").$Enums.Role;
    averageRating: number | null;
    points: number;
    onboardingCompleted: boolean;
    referredByBoutiqueId: string | null;
    firstOrderCouponUsed: boolean;
    createdAt: Date;
    updatedAt: Date;
}>;
//# sourceMappingURL=auth.service.d.ts.map