package com.microservice.transaction.repository;

import com.microservice.transaction.model.Transaction;
import com.microservice.transaction.model.TransactionType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

@DataJpaTest
class TransactionRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private TransactionRepository transactionRepository;

    @Test
    void testSaveTransaction() {
        Transaction transaction = Transaction.builder()
                .transactionId(1L)
                .userId("user123")
                .type(TransactionType.EXPENSE)
                .amount(new BigDecimal("100.00"))
                .category("Food")
                .date(LocalDate.now())
                .description("Groceries")
                .build();

        Transaction saved = transactionRepository.save(transaction);

        assertThat(saved).isNotNull();
        assertThat(saved.getTransactionId()).isEqualTo(1L);
        assertThat(saved.getUserId()).isEqualTo("user123");
        assertThat(saved.getAmount()).isEqualByComparingTo(new BigDecimal("100.00"));
    }

    @Test
    void testFindById() {
        Transaction transaction = Transaction.builder()
                .transactionId(2L)
                .userId("user456")
                .type(TransactionType.INCOME)
                .amount(new BigDecimal("500.00"))
                .category("Salary")
                .date(LocalDate.now())
                .description("Monthly salary")
                .build();

        entityManager.persist(transaction);
        entityManager.flush();

        Optional<Transaction> found = transactionRepository.findById(2);

        assertThat(found).isPresent();
        assertThat(found.get().getTransactionId()).isEqualTo(2L);
        assertThat(found.get().getUserId()).isEqualTo("user456");
    }

    @Test
    void testFindByIdNotFound() {
        Optional<Transaction> found = transactionRepository.findById(999);
        assertThat(found).isEmpty();
    }

    @Test
    void testFindAll() {
        Transaction transaction1 = Transaction.builder()
                .transactionId(3L)
                .userId("user123")
                .type(TransactionType.EXPENSE)
                .amount(new BigDecimal("50.00"))
                .category("Transport")
                .date(LocalDate.now())
                .build();

        Transaction transaction2 = Transaction.builder()
                .transactionId(4L)
                .userId("user123")
                .type(TransactionType.INCOME)
                .amount(new BigDecimal("1000.00"))
                .category("Salary")
                .date(LocalDate.now())
                .build();

        entityManager.persist(transaction1);
        entityManager.persist(transaction2);
        entityManager.flush();

        List<Transaction> transactions = transactionRepository.findAll();

        assertThat(transactions).isNotEmpty();
        assertThat(transactions.size()).isGreaterThanOrEqualTo(2);
    }

    @Test
    void testTransactionPrePersist() {
        Transaction transaction = Transaction.builder()
                .transactionId(5L)
                .userId("user789")
                .type(TransactionType.EXPENSE)
                .amount(new BigDecimal("25.00"))
                .category("Entertainment")
                .date(LocalDate.now())
                .build();

        assertThat(transaction.getCreatedAt()).isNull();
        
        Transaction saved = transactionRepository.save(transaction);

        assertThat(saved.getCreatedAt()).isNotNull();
    }
}
