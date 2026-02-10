package com.microservice.transaction.service;

import java.util.List;

import com.microservice.transaction.model.Transaction;

public interface TransactionService {
    Transaction create(Transaction transaction);
    Transaction getById(Long id);
    List<Transaction> getAll();
    List<Transaction> getByUserId(String userId);
}