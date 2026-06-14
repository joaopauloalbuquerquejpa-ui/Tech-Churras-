export declare function createPreference(orderId: string, customerId: string): Promise<{
    checkout_url: string | undefined;
    preferenceId: string | undefined;
    amount: number;
}>;
export declare function handleMPWebhook(payload: any): Promise<{
    received: boolean;
}>;
//# sourceMappingURL=payments.service.d.ts.map