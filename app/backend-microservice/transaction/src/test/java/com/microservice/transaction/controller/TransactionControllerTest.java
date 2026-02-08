package com.microservice.transaction.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.microservice.transaction.infrastructure.TransactionMessageProducer;
import com.microservice.transaction.model.Transaction;
import com.microservice.transaction.model.TransactionType;
import com.microservice.transaction.service.TransactionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TransactionController.class)
class TransactionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TransactionService transactionService;

    @MockBean
    private TransactionMessageProducer transactionMessageProducer;

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
    void testCreateTransaction() throws Exception {
        when(transactionService.create(any(Transaction.class))).thenReturn(sampleTransaction);

        mockMvc.perform(post("/api/v1/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleTransaction)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.transactionId").value(1))
                .andExpect(jsonPath("$.userId").value("user123"))
                .andExpect(jsonPath("$.type").value("EXPENSE"))
                .andExpect(jsonPath("$.amount").value(100.00))
                .andExpect(jsonPath("$.category").value("Food"));

        verify(transactionService, times(1)).create(any(Transaction.class));
        verify(transactionMessageProducer, times(1)).sendCreated(any(Transaction.class));
    }

    @Test
    void testGetTransactionById() throws Exception {
        when(transactionService.getById(1)).thenReturn(sampleTransaction);

        mockMvc.perform(get("/api/v1/transactions/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.transactionId").value(1))
                .andExpect(jsonPath("$.userId").value("user123"))
                .andExpect(jsonPath("$.category").value("Food"));

        verify(transactionService, times(1)).getById(1);
    }

    @Test
    void testGetAllTransactions() throws Exception {
        Transaction transaction2 = Transaction.builder()
                .transactionId(2L)
                .userId("user123")
                .type(TransactionType.INCOME)
                .amount(new BigDecimal("500.00"))
                .category("Salary")
                .date(LocalDate.now())
                .description("Monthly salary")
                .build();

        List<Transaction> transactions = Arrays.asList(sampleTransaction, transaction2);
        when(transactionService.getAll()).thenReturn(transactions);

        mockMvc.perform(get("/api/v1/transactions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].transactionId").value(1))
                .andExpect(jsonPath("$[1].transactionId").value(2));

        verify(transactionService, times(1)).getAll();
    }
}
