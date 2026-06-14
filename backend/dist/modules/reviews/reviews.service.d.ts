export declare function createReview(data: {
    orderId: string;
    customerId: string;
    grillRating: number;
    boutiqueRating?: number;
    grillComment?: string;
    boutiqueComment?: string;
    photos?: string[];
}): Promise<{
    id: string;
    createdAt: Date;
    customerId: string;
    grillmasterId: string | null;
    boutiqueId: string | null;
    orderId: string;
    grillRating: number | null;
    boutiqueRating: number | null;
    grillComment: string | null;
    boutiqueComment: string | null;
    customerRating: number | null;
    customerComment: string | null;
    photos: string[];
}>;
export declare function createCustomerReview(data: {
    orderId: string;
    grillmasterUserId: string;
    customerRating: number;
    customerComment?: string;
}): Promise<{
    id: string;
    createdAt: Date;
    customerId: string;
    grillmasterId: string | null;
    boutiqueId: string | null;
    orderId: string;
    grillRating: number | null;
    boutiqueRating: number | null;
    grillComment: string | null;
    boutiqueComment: string | null;
    customerRating: number | null;
    customerComment: string | null;
    photos: string[];
}>;
export declare function listGrillmasterReviews(grillmasterId: string): Promise<({
    customer: {
        name: string;
    };
} & {
    id: string;
    createdAt: Date;
    customerId: string;
    grillmasterId: string | null;
    boutiqueId: string | null;
    orderId: string;
    grillRating: number | null;
    boutiqueRating: number | null;
    grillComment: string | null;
    boutiqueComment: string | null;
    customerRating: number | null;
    customerComment: string | null;
    photos: string[];
})[]>;
export declare function listBoutiqueReviews(boutiqueId: string): Promise<({
    customer: {
        name: string;
    };
} & {
    id: string;
    createdAt: Date;
    customerId: string;
    grillmasterId: string | null;
    boutiqueId: string | null;
    orderId: string;
    grillRating: number | null;
    boutiqueRating: number | null;
    grillComment: string | null;
    boutiqueComment: string | null;
    customerRating: number | null;
    customerComment: string | null;
    photos: string[];
})[]>;
//# sourceMappingURL=reviews.service.d.ts.map