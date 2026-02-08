package com.microservice.transaction.service;

import com.microservice.transaction.exception.EntityNotFoundException;
import com.microservice.transaction.model.Transaction;
import com.microservice.transaction.model.TransactionType;
import com.microservice.transaction.repository.TransactionRepository;
import com.microservice.transaction.service.impl.TransactionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private TransactionServiceImpl transactionService;

    private Transaction sampleTransaction;

    @BeforeEach
    void setUp() {
        sampleTransaction = Transaction.builder()
                .transactionId(1L)
                .userId("user123")
                .type(TransactionType.EXPENSE)
                .amount(new BigDecimal("100.00"))
                .category("Food")
                .date(LocalDate.now())
                .description("Groceries")
                .build();
    }

    @Test
    void testCreateTransaction() {
        when(transactionRepository.save(any(Transaction.class))).thenReturn(sampleTransaction);

        Transaction created = transactionService.create(sampleTransaction);

        assertThat(created).isNotNull();
        assertThat(created.getTransactionId()).isEqualTo(1L);
        assertThat(created.getUserId()).isEqualTo("user123");
        assertThat(created.getAmount()).isEqualByComparingTo(new BigDecimal("100.00"));
        verify(transactionRepository, times(1)).save(any(Transaction.class));
    }

    @Test
    void testGetByIdSuccess() {
        when(transactionRepository.findById(1)).thenReturn(Optional.of(sampleTransaction));

        Transaction found = transactionService.getById(1);

        assertThat(found).isNotNull();
        assertThat(found.getTransactionId()).isEqualTo(1L);
        assertThat(found.getUserId()).isEqualTo("user123");
        verify(transactionRepository, times(1)).findById(1);
    }

    @Test
    void testGetByIdNotFound() {
        when(transactionRepository.findById(999)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> transactionService.getById(999))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Transaction not found");

        verify(transactionRepository, times(1)).findById(999);
    }

    @Test
    void testGetAllTransactions() {
        Transaction transaction2 = Transaction.builder()
                .transactionId(2L)
                .userId("user123")
                .type(TransactionType.INCOME)
                .amount(new BigDecimal("500.00"))
                .category("Salary")
                .date(LocalDate.now())
                .build();

        List<Transaction> transactions = Arrays.asList(sampleTransaction, transaction2);
        when(transactionRepository.findAll()).thenReturn(transactions);

        List<Transaction> result = transactionService.getAll();

        assertThat(result).isNotNull();
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getTransactionId()).isEqualTo(1L);
        assertThat(result.get(1).getTransactionId()).isEqualTo(2L);
        verify(transactionRepository, times(1)).findAll();
    }

    @Test
    void testGetAllTransactionsEmpty() {
        when(transactionRepository.findAll()).thenReturn(Arrays.asList());

        List<Transaction> result = transactionService.getAll();

        assertThat(result).isNotNull();
        assertThat(result).isEmpty();
        verify(transactionRepository, times(1)).findAll();
    }
}
