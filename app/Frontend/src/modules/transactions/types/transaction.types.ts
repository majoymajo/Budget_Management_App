export interface TransactionItemResponse {
    transactionId: number;
    userId: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    description: string;
    date: string;
}

export interface TransactionModel {
    id: number;
    userId: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    description: string;
    date: Date;
}

export type TransactionFormData = Omit<TransactionModel, 'id' | 'userId'>;