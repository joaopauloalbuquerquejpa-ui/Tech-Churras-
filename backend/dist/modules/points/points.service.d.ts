export declare function getPointsBalance(userId: string): Promise<{
    points: number;
    valueInReais: number;
}>;
export declare function redeemPoints(userId: string): Promise<{
    couponCode: string;
    pointsUsed: number;
    discountValue: number;
}>;
export declare function listRedemptions(userId: string): Promise<any>;
//# sourceMappingURL=points.service.d.ts.map