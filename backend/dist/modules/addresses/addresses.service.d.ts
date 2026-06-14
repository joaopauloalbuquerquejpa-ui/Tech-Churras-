export declare function listAddresses(userId: string): Promise<{
    number: string;
    id: string;
    createdAt: Date;
    userId: string;
    city: string;
    state: string;
    label: string;
    street: string;
    complement: string | null;
    neighborhood: string;
    zipCode: string;
    isDefault: boolean;
}[]>;
export declare function createAddress(userId: string, data: {
    label: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    isDefault?: boolean;
}): Promise<{
    number: string;
    id: string;
    createdAt: Date;
    userId: string;
    city: string;
    state: string;
    label: string;
    street: string;
    complement: string | null;
    neighborhood: string;
    zipCode: string;
    isDefault: boolean;
}>;
export declare function updateAddress(id: string, userId: string, data: {
    label?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
}): Promise<{
    number: string;
    id: string;
    createdAt: Date;
    userId: string;
    city: string;
    state: string;
    label: string;
    street: string;
    complement: string | null;
    neighborhood: string;
    zipCode: string;
    isDefault: boolean;
}>;
export declare function deleteAddress(id: string, userId: string): Promise<void>;
export declare function setDefaultAddress(id: string, userId: string): Promise<{
    number: string;
    id: string;
    createdAt: Date;
    userId: string;
    city: string;
    state: string;
    label: string;
    street: string;
    complement: string | null;
    neighborhood: string;
    zipCode: string;
    isDefault: boolean;
}>;
//# sourceMappingURL=addresses.service.d.ts.map