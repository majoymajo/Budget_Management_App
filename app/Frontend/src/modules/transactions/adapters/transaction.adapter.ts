import type { 
    TransactionItemResponse, 
    TransactionModel, 
} from '../types/transaction.types';

export const transactionAdapter = (response: TransactionItemResponse): TransactionModel => {
    return {
        id: response.transactionId,
        userId: response.userId || '',
        amount: response.amount || 0,
        type: response.type || 'EXPENSE',
        category: response.category || '',
        description: response.description || '',
        date: response.date ? new Date(response.date) : new Date(),
    };
};

export const createTransactionAdapter = (data: TransactionModel): any => {
    return {
        transactionId: data.id, 
        userId: data.userId,
        amount: data.amount,
        type: data.type,
        category: data.category,
        description: data.description,
        date: data.date.toISOString().split('T')[0],
    };
};