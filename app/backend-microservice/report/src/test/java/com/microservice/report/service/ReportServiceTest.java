package com.microservice.report.service;

import com.microservice.report.dto.ReportSummary;
import com.microservice.report.exception.ReportNotFoundException;
import com.microservice.report.infrastructure.dto.TransactionMessage;
import com.microservice.report.infrastructure.dto.TransactionType;
import com.microservice.report.model.Report;
import com.microservice.report.repository.ReportRepository;
import com.microservice.report.service.impl.ReportServiceImpl;
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
class ReportServiceTest {

    @Mock
    private ReportRepository reportRepository;

    @InjectMocks
    private ReportServiceImpl reportService;

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
    void testUpdateReportWithIncome() {
        TransactionMessage message = TransactionMessage.builder()
                .userId("user123")
                .type(TransactionType.INCOME)
                .amount(new BigDecimal("1000.00"))
                .date(LocalDate.of(2024, 1, 15))
                .build();

        when(reportRepository.findByUserIdAndPeriod("user123", "2024-01"))
                .thenReturn(Optional.of(sampleReport));
        when(reportRepository.save(any(Report.class))).thenReturn(sampleReport);

        reportService.updateReport(message);

        verify(reportRepository, times(1)).findByUserIdAndPeriod("user123", "2024-01");
        verify(reportRepository, times(1)).save(any(Report.class));
    }

    @Test
    void testUpdateReportWithExpense() {
        TransactionMessage message = TransactionMessage.builder()
                .userId("user123")
                .type(TransactionType.EXPENSE)
                .amount(new BigDecimal("500.00"))
                .date(LocalDate.of(2024, 1, 20))
                .build();

        when(reportRepository.findByUserIdAndPeriod("user123", "2024-01"))
                .thenReturn(Optional.of(sampleReport));
        when(reportRepository.save(any(Report.class))).thenReturn(sampleReport);

        reportService.updateReport(message);

        verify(reportRepository, times(1)).findByUserIdAndPeriod("user123", "2024-01");
        verify(reportRepository, times(1)).save(any(Report.class));
    }

    @Test
    void testUpdateReportCreatesNewReport() {
        TransactionMessage message = TransactionMessage.builder()
                .userId("user456")
                .type(TransactionType.INCOME)
                .amount(new BigDecimal("2000.00"))
                .date(LocalDate.of(2024, 2, 10))
                .build();

        Report newReport = Report.builder()
                .userId("user456")
                .period("2024-02")
                .totalIncome(BigDecimal.ZERO)
                .totalExpense(BigDecimal.ZERO)
                .balance(BigDecimal.ZERO)
                .build();

        when(reportRepository.findByUserIdAndPeriod("user456", "2024-02"))
                .thenReturn(Optional.empty());
        when(reportRepository.save(any(Report.class))).thenReturn(newReport);

        reportService.updateReport(message);

        verify(reportRepository, times(2)).save(any(Report.class));
    }

    @Test
    void testGetReportSuccess() {
        when(reportRepository.findByUserIdAndPeriod("user123", "2024-01"))
                .thenReturn(Optional.of(sampleReport));

        Report found = reportService.getReport("user123", "2024-01");

        assertThat(found).isNotNull();
        assertThat(found.getUserId()).isEqualTo("user123");
        assertThat(found.getPeriod()).isEqualTo("2024-01");
        verify(reportRepository, times(1)).findByUserIdAndPeriod("user123", "2024-01");
    }

    @Test
    void testGetReportNotFound() {
        when(reportRepository.findByUserIdAndPeriod("user999", "2024-01"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> reportService.getReport("user999", "2024-01"))
                .isInstanceOf(ReportNotFoundException.class);

        verify(reportRepository, times(1)).findByUserIdAndPeriod("user999", "2024-01");
    }

    @Test
    void testGetReportsByUserId() {
        Report report2 = Report.builder()
                .reportId(2L)
                .userId("user123")
                .period("2024-02")
                .totalIncome(new BigDecimal("6000.00"))
                .totalExpense(new BigDecimal("4000.00"))
                .balance(new BigDecimal("2000.00"))
                .build();

        List<Report> reports = Arrays.asList(sampleReport, report2);
        when(reportRepository.findByUserId("user123")).thenReturn(reports);

        List<Report> result = reportService.getReportsByUserId("user123");

        assertThat(result).isNotNull();
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getPeriod()).isEqualTo("2024-01");
        assertThat(result.get(1).getPeriod()).isEqualTo("2024-02");
        verify(reportRepository, times(1)).findByUserId("user123");
    }

    @Test
    void testGetReportsByPeriodRange() {
        Report report2 = Report.builder()
                .reportId(2L)
                .userId("user123")
                .period("2024-02")
                .totalIncome(new BigDecimal("6000.00"))
                .totalExpense(new BigDecimal("4000.00"))
                .balance(new BigDecimal("2000.00"))
                .build();

        List<Report> reports = Arrays.asList(sampleReport, report2);
        when(reportRepository.findByUserIdAndPeriodBetweenOrderByPeriodAsc(
                "user123", "2024-01", "2024-02"
        )).thenReturn(reports);

        ReportSummary summary = reportService.getReportsByPeriodRange(
                "user123", "2024-01", "2024-02"
        );

        assertThat(summary).isNotNull();
        assertThat(summary.getUserId()).isEqualTo("user123");
        assertThat(summary.getTotalIncome()).isEqualByComparingTo(new BigDecimal("11000.00"));
        assertThat(summary.getTotalExpense()).isEqualByComparingTo(new BigDecimal("7000.00"));
        assertThat(summary.getBalance()).isEqualByComparingTo(new BigDecimal("4000.00"));
        verify(reportRepository, times(1))
                .findByUserIdAndPeriodBetweenOrderByPeriodAsc("user123", "2024-01", "2024-02");
    }
}
