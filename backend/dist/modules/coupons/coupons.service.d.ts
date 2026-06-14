export declare function validateCoupon(code: string, orderValue: number): Promise<{
    valid: boolean;
    reason: string;
    coupon?: undefined;
    discountAmount?: undefined;
} | {
    valid: boolean;
    coupon: {
        id: string;
        createdAt: Date;
        code: string;
        discountType: string;
        discountValue: number;
        minOrderValue: number | null;
        maxUses: number | null;
        usedCount: number;
        validUntil: Date | null;
        active: boolean;
    };
    discountAmount: number;
    reason?: undefined;
}>;
export declare function listCoupons(): Promise<{
    id: string;
    createdAt: Date;
    code: string;
    discountType: string;
    discountValue: number;
    minOrderValue: number | null;
    maxUses: number | null;
    usedCount: number;
    validUntil: Date | null;
    active: boolean;
}[]>;
export declare function createCoupon(data: {
    code: string;
    discountType: string;
    discountValue: number;
    minOrderValue?: number;
    maxUses?: number;
    validUntil?: string;
}): Promise<{
    id: string;
    createdAt: Date;
    code: string;
    discountType: string;
    discountValue: number;
    minOrderValue: number | null;
    maxUses: number | null;
    usedCount: number;
    validUntil: Date | null;
    active: boolean;
}>;
export declare function toggleCoupon(id: string, active: boolean): Promise<{
    id: string;
    createdAt: Date;
    code: string;
    discountType: string;
    discountValue: number;
    minOrderValue: number | null;
    maxUses: number | null;
    usedCount: number;
    validUntil: Date | null;
    active: boolean;
}>;
//# sourceMappingURL=coupons.service.d.ts.map