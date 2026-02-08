package com.microservice.report.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.microservice.report.dto.ReportSummary;
import com.microservice.report.model.Report;
import com.microservice.report.service.ReportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ReportController.class)
class ReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ReportService reportService;

    private Report sampleReport;

    @BeforeEach
    void setUp() {
        sampleReport = Report.builder()
                .reportId(1L)
                .userId("user123")
                .period("2024-01")
                .totalIncome(new BigDecimal("5000.00"))
                .totalExpense(new BigDecimal("3000.00"))
                .balance(new BigDecimal("2000.00"))
                .build();
    }

    @Test
    void testGetReport() throws Exception {
        when(reportService.getReport("user123", "2024-01")).thenReturn(sampleReport);

        mockMvc.perform(get("/api/v1/reports/user123")
                        .param("period", "2024-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reportId").value(1))
                .andExpect(jsonPath("$.userId").value("user123"))
                .andExpect(jsonPath("$.period").value("2024-01"))
                .andExpect(jsonPath("$.totalIncome").value(5000.00))
                .andExpect(jsonPath("$.totalExpense").value(3000.00))
                .andExpect(jsonPath("$.balance").value(2000.00));

        verify(reportService, times(1)).getReport("user123", "2024-01");
    }

    @Test
    void testGetReportNotFound() throws Exception {
        when(reportService.getReport("user999", null)).thenReturn(null);

        mockMvc.perform(get("/api/v1/reports/user999"))
                .andExpect(status().isNotFound());

        verify(reportService, times(1)).getReport("user999", null);
    }

    @Test
    void testGetReportsByUser() throws Exception {
        Report report2 = Report.builder()
                .reportId(2L)
                .userId("user123")
                .period("2024-02")
                .totalIncome(new BigDecimal("6000.00"))
                .totalExpense(new BigDecimal("4000.00"))
                .balance(new BigDecimal("2000.00"))
                .build();

        List<Report> reports = Arrays.asList(sampleReport, report2);
        when(reportService.getReportsByUserId("user123")).thenReturn(reports);

        mockMvc.perform(get("/api/v1/reports/user123/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].period").value("2024-01"))
                .andExpect(jsonPath("$[1].period").value("2024-02"));

        verify(reportService, times(1)).getReportsByUserId("user123");
    }

    @Test
    void testGetReportSummary() throws Exception {
        ReportSummary summary = ReportSummary.builder()
                .userId("user123")
                .totalIncome(new BigDecimal("11000.00"))
                .totalExpense(new BigDecimal("7000.00"))
                .netBalance(new BigDecimal("4000.00"))
                .periodCount(2)
                .build();

        when(reportService.getReportsByPeriodRange("user123", "2024-01", "2024-02"))
                .thenReturn(summary);

        mockMvc.perform(get("/api/v1/reports/user123/summary")
                        .param("startPeriod", "2024-01")
                        .param("endPeriod", "2024-02"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value("user123"))
                .andExpect(jsonPath("$.totalIncome").value(11000.00))
                .andExpect(jsonPath("$.totalExpense").value(7000.00))
                .andExpect(jsonPath("$.netBalance").value(4000.00));

        verify(reportService, times(1))
                .getReportsByPeriodRange("user123", "2024-01", "2024-02");
    }
}
