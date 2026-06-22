export declare function emailOrderConfirmed(to: string, customerName: string, orderId: string, grillmasterName: string, eventDate: Date, eventAddress: string): Promise<void>;
export declare function emailNewOrderGrillmaster(to: string, grillmasterName: string, orderId: string, customerName: string, eventDate: Date, guestCount: number): Promise<void>;
export declare function emailOrderCompleted(to: string, customerName: string, orderId: string, grillmasterName: string): Promise<void>;
export declare function emailPartnerApproved(to: string, partnerName: string, partnerType: 'GRILLMASTER' | 'BOUTIQUE', dashUrl: string): Promise<void>;
export declare function emailWelcomeCustomer(to: string, customerName: string): Promise<void>;
//# sourceMappingURL=email.service.d.ts.map