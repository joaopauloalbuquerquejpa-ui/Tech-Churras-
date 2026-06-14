export declare function listPayouts(status?: string, weekStart?: string, type?: string): Promise<{
    recipientName: string;
    id: string;
    createdAt: Date;
    status: string;
    notes: string | null;
    paidAt: Date | null;
    orderId: string | null;
    pixKey: string | null;
    type: string;
    recipientId: string;
    amount: number;
    commission: number;
    grossAmount: number;
    weekStart: Date;
    weekEnd: Date;
}[]>;
export declare function getPayoutsSummary(): Promise<{
    weekStart: Date;
    weekEnd: Date;
    totalPending: number;
    totalPaid: number;
    totalCommission: number;
    count: {
        pending: number;
        paid: number;
        total: number;
    };
}>;
export declare function generatePayouts(): Promise<{
    created: number;
    skipped: number;
    message: string;
}>;
export declare function markPayoutPaid(payoutId: string): Promise<{
    id: string;
    createdAt: Date;
    status: string;
    notes: string | null;
    paidAt: Date | null;
    orderId: string | null;
    pixKey: string | null;
    type: string;
    recipientId: string;
    amount: number;
    commission: number;
    grossAmount: number;
    weekStart: Date;
    weekEnd: Date;
}>;
//# sourceMappingURL=payouts.service.d.ts.map