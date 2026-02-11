package com.microservice.transaction.service.impl;

import java.util.List;

import com.microservice.transaction.dto.TransactionMapper;
import com.microservice.transaction.dto.TransactionRequest;
import com.microservice.transaction.dto.TransactionResponse;
import com.microservice.transaction.event.TransactionCreatedEvent;
import com.microservice.transaction.exception.EntityNotFoundException;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import com.microservice.transaction.model.Transaction;
import com.microservice.transaction.repository.TransactionRepository;
import com.microservice.transaction.service.TransactionService;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class TransactionServiceImpl implements TransactionService {
    private final TransactionRepository transactionRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public TransactionResponse create(TransactionRequest dto) {
        Transaction entity = TransactionMapper.toRequest(dto);
        Transaction saved = transactionRepository.save(entity);
        eventPublisher.publishEvent(new TransactionCreatedEvent(this, saved));
        return TransactionMapper.toResponse(saved);
    }

    @Override
    public TransactionResponse getById(Long id) {
        Transaction found = transactionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Transaction not found"));
        return TransactionMapper.toResponse(found);
    }

    @Override
    public List<TransactionResponse> getAll() {
        return TransactionMapper.toResponseDTOList(transactionRepository.findAll());
    }

    @Override
    public List<TransactionResponse> getByUserId(String userId) {
        return TransactionMapper.toResponseDTOList(transactionRepository.findByUserId(userId));
    }

}
