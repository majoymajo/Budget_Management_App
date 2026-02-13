package com.microservice.report.infrastructure;

import com.microservice.report.infrastructure.dto.TransactionMessage;
import com.microservice.report.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Slf4j
@RequiredArgsConstructor
@Service
public class ReportConsumer {
    private final ReportService reportService;

    @RabbitListener(queues = "${rabbitmq.queues.transaction-created}")
    public void consumeCreated(TransactionMessage transactionMessage) {
        log.info("Processing Created transaction ID: {}", transactionMessage.transactionId());
        reportService.updateReport(transactionMessage);
        log.info("Successfully created transaction ID: {}", transactionMessage.transactionId());
    }

    @RabbitListener(queues = "${rabbitmq.queues.transaction-updated}")
    public void consumeUpdated(TransactionMessage transactionMessage) {
        log.info("Processing Updated transaction ID: {}", transactionMessage.transactionId());
        reportService.updateReport(transactionMessage);
        log.info("Successfully updated transaction ID: {}", transactionMessage.transactionId());
    }
}
